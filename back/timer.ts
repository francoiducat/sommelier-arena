/**
 * Manages the per-question countdown timer.
 *
 * Encapsulates the setInterval lifecycle so GameSession only needs to call
 * start/pause/resume/clear and read remainingMs.
 */
export class TimerManager {
  private activeTimer: ReturnType<typeof setInterval> | null = null;
  remainingMs = 0;

  /**
   * Start a fresh countdown from totalSeconds.
   * onTick is called every 1 s with the updated remainingMs.
   * onExpiry is called when the timer reaches 0.
   */
  start(
    totalSeconds: number,
    onTick: (ms: number) => void,
    onExpiry: () => void,
  ): void {
    this.clear();
    this.remainingMs = totalSeconds * 1000;
    this.activeTimer = setInterval(() => {
      this.remainingMs = Math.max(0, this.remainingMs - 1000);
      onTick(this.remainingMs);
      if (this.remainingMs <= 0) {
        this.clear();
        onExpiry();
      }
    }, 1000);
  }

  /** Pause: cancel the interval and return the remaining ms. */
  pause(): number {
    this.clear();
    return this.remainingMs;
  }

  /** Resume from a previously paused state. */
  resume(
    fromMs: number,
    onTick: (ms: number) => void,
    onExpiry: () => void,
  ): void {
    this.remainingMs = fromMs;
    this.clear();
    this.activeTimer = setInterval(() => {
      this.remainingMs = Math.max(0, this.remainingMs - 1000);
      onTick(this.remainingMs);
      if (this.remainingMs <= 0) {
        this.clear();
        onExpiry();
      }
    }, 1000);
  }

  /** Cancel any running interval. */
  clear(): void {
    if (this.activeTimer !== null) {
      clearInterval(this.activeTimer);
      this.activeTimer = null;
    }
  }
}
