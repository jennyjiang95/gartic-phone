import { GameEngine } from '../GameEngine';
import { GamePhase } from '../../types';

export abstract class BaseMode {
  protected engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  abstract start(): void;
  abstract onAllSubmitted(phase: GamePhase): void;
  abstract onTimerExpired(phase: GamePhase): void;
  onAllVoted(_votes: Map<string, string[]>): void {}
}
