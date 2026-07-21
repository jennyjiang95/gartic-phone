import { BaseMode } from './BaseMode';
import { GamePhase, Assignment } from '../../types';

const QUESTIONS = [
  'What is your most embarrassing moment?',
  'What is your hidden talent?',
  'What would you do with a million dollars?',
  'What is your dream job?',
  'What is your guilty pleasure?',
  'What is the strangest thing you have ever eaten?',
  'What is your superpower?',
  'What is your biggest fear?',
  'What is your most unpopular opinion?',
  'If you could live anywhere in the world, where would it be?',
  'What is the weirdest dream you have ever had?',
  'What skill do you wish you had?',
  'What is your most used app on your phone?',
  'If you were a cartoon character, who would you be?',
  'What is your go-to karaoke song?',
];

export class IcebreakerMode extends BaseMode {
  private question = '';

  start(): void {
    this.question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const players = this.engine.getRoom().getPlayers();
    const assignments = new Map<string, Assignment>();
    players.forEach((p) => {
      assignments.set(p.id, {
        type: 'write',
        content: this.question,
        chainId: p.id,
        roundNumber: 0,
      });
    });
    this.engine.transitionTo('write', assignments, this.engine.getRoom().settings.writeTime);
  }

  onAllSubmitted(_phase: GamePhase): void {
    this.engine.revealChains();
  }

  onTimerExpired(phase: GamePhase): void {
    this.onAllSubmitted(phase);
  }
}
