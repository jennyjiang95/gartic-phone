export class ServerTimer {
  private secondsLeft: number;
  private interval: NodeJS.Timeout | null = null;
  private onTick: (secondsLeft: number) => void;
  private onExpired: () => void;

  constructor(seconds: number, onTick: (secondsLeft: number) => void, onExpired: () => void) {
    this.secondsLeft = seconds;
    this.onTick = onTick;
    this.onExpired = onExpired;
  }

  start(): void {
    this.interval = setInterval(() => {
      this.secondsLeft--;
      this.onTick(this.secondsLeft);
      if (this.secondsLeft <= 0) {
        this.stop();
        this.onExpired();
      }
    }, 1000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
