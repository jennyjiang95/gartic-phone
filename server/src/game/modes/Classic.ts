import { BaseMode } from './BaseMode';
import { GamePhase, Assignment } from '../../types';

export class ClassicMode extends BaseMode {
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

  private startDrawPhase(): void {
    const players = this.engine.getRoom().getPlayers();
    const submissions = this.engine.getSubmissions();
    const round = this.engine.getRoundNumber();

    players.forEach((p) => {
      const sub = submissions.get(p.id);
      if (sub) {
        this.engine.addToChain(p.id, {
          type: 'prompt',
          content: sub.content,
          authorId: p.id,
          authorName: p.name,
        });
      }
    });

    const assignments = new Map<string, Assignment>();
    players.forEach((p, idx) => {
      const sourceIdx = (idx - round + players.length) % players.length;
      const sourcePlayer = players[sourceIdx];
      const chain = this.engine.getChains().get(sourcePlayer.id);
      const lastEntry = chain?.entries[chain.entries.length - 1];

      assignments.set(p.id, {
        type: 'draw',
        content: lastEntry?.content,
        chainId: sourcePlayer.id,
        roundNumber: round,
      });
    });

    this.engine.transitionTo('draw', assignments, this.engine.getRoom().settings.drawTime);
  }

  private startGuessPhase(): void {
    const players = this.engine.getRoom().getPlayers();
    const submissions = this.engine.getSubmissions();
    const round = this.engine.getRoundNumber();

    players.forEach((p, idx) => {
      const sourceIdx = (idx - round + players.length) % players.length;
      const sourcePlayer = players[sourceIdx];
      const sub = submissions.get(p.id);
      if (sub) {
        this.engine.addToChain(sourcePlayer.id, {
          type: 'drawing',
          content: sub.content,
          authorId: p.id,
          authorName: p.name,
        });
      }
    });

    const assignments = new Map<string, Assignment>();
    players.forEach((p, idx) => {
      const sourceIdx = (idx - round + players.length) % players.length;
      const sourcePlayer = players[sourceIdx];
      const chain = this.engine.getChains().get(sourcePlayer.id);
      const lastEntry = chain?.entries[chain.entries.length - 1];

      assignments.set(p.id, {
        type: 'guess',
        content: lastEntry?.content,
        chainId: sourcePlayer.id,
        roundNumber: round,
      });
    });

    this.engine.transitionTo('guess', assignments, this.engine.getRoom().settings.writeTime);
  }

  onAllSubmitted(phase: GamePhase): void {
    const players = this.engine.getRoom().getPlayers();
    const submissions = this.engine.getSubmissions();
    const round = this.engine.getRoundNumber();

    if (phase === 'write') {
      this.engine.incrementRound();
      this.startDrawPhase();
    } else if (phase === 'draw') {
      this.startGuessPhase();
    } else if (phase === 'guess') {
      players.forEach((p, idx) => {
        const sourceIdx = (idx - round + players.length) % players.length;
        const sourcePlayer = players[sourceIdx];
        const sub = submissions.get(p.id);
        if (sub) {
          this.engine.addToChain(sourcePlayer.id, {
            type: 'guess',
            content: sub.content,
            authorId: p.id,
            authorName: p.name,
          });
        }
      });

      const maxRounds = this.engine.getRoom().settings.rounds;
      if (round < maxRounds) {
        this.engine.incrementRound();
        this.startDrawPhase();
      } else {
        this.engine.revealChains();
      }
    }
  }

  onTimerExpired(phase: GamePhase): void {
    const players = this.engine.getRoom().getPlayers();
    const submissions = this.engine.getSubmissions();
    players.forEach((p) => {
      if (!submissions.has(p.id)) {
        const type = phase === 'draw' ? 'drawing' : phase === 'guess' ? 'guess' : 'prompt';
        this.engine.handleSubmit(p.id, '', type);
      }
    });
  }
}
