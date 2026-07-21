import { BaseMode } from './BaseMode';
import { GamePhase, Assignment } from '../../types';

export class KnockoutMode extends BaseMode {
  start(): void {
    this.startWritePhase();
  }

  private startWritePhase(): void {
    const players = this.engine.getRoom().getPlayers();
    const assignments = new Map<string, Assignment>();
    players.forEach((p) => {
      assignments.set(p.id, {
        type: 'write',
        chainId: p.id,
        roundNumber: this.engine.getRoundNumber(),
      });
    });
    this.engine.transitionTo('write', assignments, this.engine.getRoom().settings.writeTime);
  }

  onAllSubmitted(_phase: GamePhase): void {
    this.engine.revealChains();
  }

  onAllVoted(votes: Map<string, string[]>): void {
    let maxVotes = 0;
    let eliminated = '';
    votes.forEach((voters, targetId) => {
      if (voters.length > maxVotes) {
        maxVotes = voters.length;
        eliminated = targetId;
      }
    });
    if (!eliminated) {
      const players = this.engine.getRoom().getPlayers();
      eliminated = players[Math.floor(Math.random() * players.length)].id;
    }
    this.engine.getRoom().removePlayer(eliminated);
    if (this.engine.getRoom().getPlayerCount() <= 2) {
      this.engine.revealChains();
    } else {
      this.engine.incrementRound();
      this.startWritePhase();
    }
  }

  onTimerExpired(phase: GamePhase): void {
    this.onAllSubmitted(phase);
  }
}
