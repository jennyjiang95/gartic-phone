import { BaseMode } from './BaseMode';
import { GamePhase, Assignment } from '../../types';

export class AnimationMode extends BaseMode {
  start(): void {
    const players = this.engine.getRoom().getPlayers();
    const assignments = new Map<string, Assignment>();
    players.forEach((p) => {
      assignments.set(p.id, { type: 'draw', chainId: p.id, roundNumber: 0 });
    });
    this.engine.transitionTo('draw', assignments, this.engine.getRoom().settings.drawTime);
  }

  onAllSubmitted(_phase: GamePhase): void {
    const players = this.engine.getRoom().getPlayers();
    const submissions = this.engine.getSubmissions();

    players.forEach((p) => {
      const sub = submissions.get(p.id);
      if (sub) {
        this.engine.addToChain(p.id, {
          type: 'drawing',
          content: sub.content,
          authorId: p.id,
          authorName: p.name,
        });
      }
    });

    const maxRounds = this.engine.getRoom().settings.rounds;
    if (this.engine.getRoundNumber() < maxRounds - 1) {
      this.engine.incrementRound();
      const newRound = this.engine.getRoundNumber();
      const assignments = new Map<string, Assignment>();
      players.forEach((p, idx) => {
        const sourceIdx = (idx - newRound + players.length) % players.length;
        const sourcePlayer = players[sourceIdx];
        const chain = this.engine.getChains().get(sourcePlayer.id);
        const lastEntry = chain?.entries[chain.entries.length - 1];
        assignments.set(p.id, {
          type: 'draw',
          content: lastEntry?.content,
          chainId: sourcePlayer.id,
          roundNumber: newRound,
        });
      });
      this.engine.transitionTo('draw', assignments, this.engine.getRoom().settings.drawTime);
    } else {
      this.engine.revealChains();
    }
  }

  onTimerExpired(phase: GamePhase): void {
    this.onAllSubmitted(phase);
  }
}
