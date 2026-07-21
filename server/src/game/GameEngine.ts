import { Server } from 'socket.io';
import { Room } from '../rooms/Room';
import { GamePhase, Assignment, Chain, ChainEntry } from '../types';
import { ServerTimer } from '../utils/timer';
import { ClassicMode } from './modes/Classic';
import { ScoreAttackMode } from './modes/ScoreAttack';
import { AnimationMode } from './modes/Animation';
import { IcebreakerMode } from './modes/Icebreaker';
import { KnockoutMode } from './modes/Knockout';
import { SandwichMode } from './modes/Sandwich';
import { BaseMode } from './modes/BaseMode';

export class GameEngine {
  private io: Server;
  private room: Room;
  private phase: GamePhase = 'lobby';
  private timer: ServerTimer | null = null;
  private submissions: Map<string, { content: string; type: string }> = new Map();
  private votes: Map<string, string[]> = new Map();
  private chains: Map<string, Chain> = new Map();
  private roundNumber = 0;
  private mode: BaseMode;

  constructor(io: Server, room: Room) {
    this.io = io;
    this.room = room;
    switch (room.settings.mode) {
      case 'score-attack': this.mode = new ScoreAttackMode(this); break;
      case 'animation':    this.mode = new AnimationMode(this); break;
      case 'icebreaker':   this.mode = new IcebreakerMode(this); break;
      case 'knockout':     this.mode = new KnockoutMode(this); break;
      case 'sandwich':     this.mode = new SandwichMode(this); break;
      default:             this.mode = new ClassicMode(this);
    }
  }

  getRoom(): Room { return this.room; }
  getPhase(): GamePhase { return this.phase; }
  getChains(): Map<string, Chain> { return this.chains; }
  getSubmissions(): Map<string, { content: string; type: string }> { return this.submissions; }
  getRoundNumber(): number { return this.roundNumber; }

  start(): void {
    this.initChains();
    this.mode.start();
  }

  private initChains(): void {
    const players = this.room.getPlayers();
    players.forEach((p) => {
      this.chains.set(p.id, { id: p.id, entries: [] });
    });
  }

  transitionTo(phase: GamePhase, assignments: Map<string, Assignment>, timeLimit: number): void {
    this.phase = phase;
    this.submissions.clear();
    this.stopTimer();

    const players = this.room.getPlayers();
    players.forEach((player) => {
      const assignment = assignments.get(player.id);
      if (assignment) {
        this.io.to(player.id).emit('game:phase', { phase, assignment, timeLimit });
      }
    });

    if (timeLimit > 0) {
      this.timer = new ServerTimer(timeLimit, (secondsLeft) => {
        this.io.to(this.room.code).emit('game:tick', { secondsLeft });
      }, () => {
        this.mode.onTimerExpired(phase);
      });
      this.timer.start();
    }
  }

  handleSubmit(playerId: string, content: string, type: string): void {
    this.submissions.set(playerId, { content, type });
    const players = this.room.getPlayers();
    if (this.submissions.size >= players.length) {
      this.stopTimer();
      this.mode.onAllSubmitted(this.phase);
    }
  }

  handleVote(voterId: string, targetId: string): void {
    const existing = this.votes.get(targetId) || [];
    if (!existing.includes(voterId)) {
      existing.push(voterId);
      this.votes.set(targetId, existing);
    }
    const players = this.room.getPlayers();
    const totalVotes = Array.from(this.votes.values()).reduce((sum, v) => sum + v.length, 0);
    if (totalVotes >= players.length) {
      this.mode.onAllVoted(this.votes);
    }
  }

  addToChain(chainId: string, entry: ChainEntry): void {
    const chain = this.chains.get(chainId);
    if (chain) chain.entries.push(entry);
  }

  incrementRound(): void { this.roundNumber++; }

  revealChains(): void {
    const chains = Array.from(this.chains.values());
    this.io.to(this.room.code).emit('game:reveal', { chains });
  }

  updateScores(scores: Record<string, number>): void {
    const players = this.room.getPlayers();
    players.forEach((p) => {
      if (scores[p.id]) p.score += scores[p.id];
    });
    const scoreMap: Record<string, number> = {};
    players.forEach((p) => { scoreMap[p.id] = p.score; });
    this.io.to(this.room.code).emit('score:update', { scores: scoreMap });
  }

  private stopTimer(): void {
    if (this.timer) {
      this.timer.stop();
      this.timer = null;
    }
  }

  resetVotes(): void {
    this.votes.clear();
  }
}
