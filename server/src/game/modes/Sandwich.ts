import { BaseMode } from './BaseMode';
import { GamePhase, Assignment } from '../../types';

export class SandwichMode extends BaseMode {
  start(): void {
    const players = this.engine.getRoom().getPlayers();
    const assignments = new Map<string, Assignment>();
    players.forEach((p) => {
      assignments.set(p.id, { type: 'draw', chainId: p.id, roundNumber: 0 });
    });
    this.engine.transitionTo('draw', assignments, this.engine.getRoom().settings.drawTime);
  }

  onAllSubmitted(phase: GamePhase): void {
    const players = this.engine.getRoom().getPlayers();
    const submissions = this.engine.getSubmissions();
    const round = this.engine.getRoundNumber();

    players.forEach((p, idx) => {
      const sub = submissions.get(p.id);
      if (sub) {
        const entryType = phase === 'draw' ? 'drawing' : 'guess';
        this.engine.addToChain(p.id, {
          type: entryType,
          content: sub.content,
          authorId: p.id,
          authorName: p.name,
        });
      }
    });

    const nextPhase: GamePhase = phase === 'draw' ? 'guess' : 'draw';
    const maxRounds = this.engine.getRoom().settings.rounds;

    if (round >= maxRounds) {
      this.engine.revealChains();
      return;
    }

    this.engine.incrementRound();
    const newRound = this.engine.getRoundNumber();
    const assignments = new Map<string, Assignment>();

    players.forEach((p, idx) => {
      const sourceIdx = (idx - newRound + players.length) % players.length;
      const sourcePlayer = players[sourceIdx];
      const chain = this.engine.getChains().get(sourcePlayer.id);
      const lastEntry = chain?.entries[chain.entries.length - 1];
      assignments.set(p.id, {
        type: nextPhase === 'draw' ? 'draw' : 'guess',
        content: lastEntry?.content,
        chainId: sourcePlayer.id,
        roundNumber: newRound,
      });
    });

    this.engine.transitionTo(
      nextPhase,
      assignments,
      nextPhase === 'draw'
        ? this.engine.getRoom().settings.drawTime
        : this.engine.getRoom().settings.writeTime,
    );
  }

  onTimerExpired(phase: GamePhase): void {
    this.onAllSubmitted(phase);
  }
}
