import { BaseMode } from './BaseMode';
import { GamePhase, Assignment } from '../../types';

export class ScoreAttackMode extends BaseMode {
  private currentPrompt = '';
  private drawingRound = 0;

  start(): void {
    this.startWritePhase();
  }

  private startWritePhase(): void {
    const players = this.engine.getRoom().getPlayers();
    const assignments = new Map<string, Assignment>();
    players.forEach((p) => {
      assignments.set(p.id, { type: 'write', chainId: p.id, roundNumber: 0 });
    });
    this.engine.transitionTo('write', assignments, this.engine.getRoom().settings.writeTime);
  }

  private startDrawPhase(): void {
    const players = this.engine.getRoom().getPlayers();
    const assignments = new Map<string, Assignment>();
    players.forEach((p) => {
      assignments.set(p.id, {
        type: 'draw',
        content: this.currentPrompt,
        chainId: p.id,
        roundNumber: this.drawingRound,
      });
    });
    this.engine.transitionTo('draw', assignments, this.engine.getRoom().settings.drawTime);
  }

  private startVotePhase(): void {
    const players = this.engine.getRoom().getPlayers();
    const submissions = this.engine.getSubmissions();
    const assignments = new Map<string, Assignment>();

    players.forEach((p) => {
      const drawings = Array.from(submissions.entries())
        .filter(([id]) => id !== p.id)
        .map(([id, s]) => ({ playerId: id, content: s.content }));
      assignments.set(p.id, {
        type: 'vote',
        content: JSON.stringify(drawings),
        chainId: p.id,
        roundNumber: this.drawingRound,
      });
    });
    this.engine.transitionTo('vote', assignments, 30);
  }

  onAllSubmitted(phase: GamePhase): void {
    const submissions = this.engine.getSubmissions();
    if (phase === 'write') {
      const entries = Array.from(submissions.values());
      this.currentPrompt = entries[Math.floor(Math.random() * entries.length)]?.content || 'Draw anything!';
      this.drawingRound++;
      this.startDrawPhase();
    } else if (phase === 'draw') {
      this.startVotePhase();
    } else if (phase === 'vote') {
      this.engine.revealChains();
    }
  }

  onAllVoted(votes: Map<string, string[]>): void {
    const scores: Record<string, number> = {};
    votes.forEach((voters, targetId) => {
      scores[targetId] = voters.length * 100;
    });
    this.engine.updateScores(scores);
    this.engine.revealChains();
  }

  onTimerExpired(phase: GamePhase): void {
    this.onAllSubmitted(phase);
  }
}
