import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RumbleService } from '../../services/rumble.service';

@Component({
  selector: 'app-simulation',
  imports: [FormsModule],
  templateUrl: './simulation.html',
  styleUrl: './simulation.scss',
})
export class Simulation implements OnDestroy {
  private readonly rumble = inject(RumbleService);

  readonly state = computed(() => this.rumble.state()!);
  readonly isAutoPlaying = signal(false);

  private _speed = 1000;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  get speed(): number { return this._speed; }
  set speed(value: number) {
    this._speed = Number(value);
    if (this.intervalId) {
      this.stopAutoPlay();
      this.startAutoPlay();
    }
  }

  readonly progressPercent = computed(() => {
    const s = this.state();
    return (s.currentRound / s.totalRounds) * 100;
  });

  readonly reversedEvents = computed(() => [...this.state().events].reverse());

  readonly nextEliminationChance = computed(() => {
    const s = this.state();
    const ringLen = s.ring.length;
    const queueLen = s.queue.length;
    if (ringLen < 2) return 0;
    if (queueLen === 0) return 100;
    const total = ringLen + queueLen;
    return Math.max(10, Math.min(90, 20 + (ringLen / total) * 60));
  });

  private readonly colorPalette = [
    '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16',
  ];

  constructor() {
    effect(() => {
      if (this.state().isComplete) this.stopAutoPlay();
    });
  }

  getColor(id: number): string {
    return this.colorPalette[(id - 1) % this.colorPalette.length];
  }

  nextCycle(): void {
    this.rumble.nextCycle();
  }

  toggleAutoPlay(): void {
    this.isAutoPlaying() ? this.stopAutoPlay() : this.startAutoPlay();
  }

  reset(): void {
    this.stopAutoPlay();
    this.rumble.reset();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  private startAutoPlay(): void {
    this.isAutoPlaying.set(true);
    this.intervalId = setInterval(() => this.rumble.nextCycle(), this._speed);
  }

  private stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isAutoPlaying.set(false);
  }
}
