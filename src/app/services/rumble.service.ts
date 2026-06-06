import { Injectable, signal } from '@angular/core';
import { CycleEvent, Contestant, SimulationState } from '../models/rumble.models';

@Injectable({ providedIn: 'root' })
export class RumbleService {
  private readonly _state = signal<SimulationState | null>(null);
  readonly state = this._state.asReadonly();

  init(n: number): void {
    const all = this.generateContestants(n);
    const shuffled = this.shuffle([...all]);
    const ring = shuffled.slice(0, 2);
    const queue = shuffled.slice(2);

    const events: CycleEvent[] = ring.map((c, i) => ({
      round: i + 1,
      type: 'initial',
      contestant: c,
      eliminationChance: 0,
      roll: 0,
    }));

    this._state.set({ queue, ring, eliminated: [], currentRound: 2, totalRounds: n, events, isComplete: false });
  }

  nextCycle(): void {
    const s = this._state();
    if (!s || s.isComplete) return;

    const { queue, ring, eliminated, currentRound, totalRounds, events } = s;

    const elimChance = this.calcEliminationChance(ring.length, queue.length);
    const roll = Math.random() * 100;

    const newRing = [...ring];
    const newQueue = [...queue];
    const newEliminated = [...eliminated];
    let event: CycleEvent;
    let newRound = currentRound;

    if (roll < elimChance || newQueue.length === 0) {
      const idx = Math.floor(Math.random() * newRing.length);
      const [c] = newRing.splice(idx, 1);
      newEliminated.push(c);
      event = { round: newRound, type: 'eliminate', contestant: c, eliminationChance: elimChance, roll };
    } else {
      newRound = currentRound + 1;
      const idx = Math.floor(Math.random() * newQueue.length);
      const [c] = newQueue.splice(idx, 1);
      newRing.push(c);
      event = { round: newRound, type: 'enter', contestant: c, eliminationChance: elimChance, roll };
    }

    this._state.set({
      queue: newQueue,
      ring: newRing,
      eliminated: newEliminated,
      currentRound: newRound,
      totalRounds,
      events: [...events, event],
      isComplete: newRing.length === 1 && newQueue.length === 0,
    });
  }

  reset(): void {
    this._state.set(null);
  }

  // Probability of elimination happening this cycle.
  // Proportion of ring to total maps linearly to range [20, 80],
  // then a random noise of [-10, 10] is added, clamped to [10, 90].
  private calcEliminationChance(ringLen: number, queueLen: number): number {
    if (ringLen < 2) return 0;
    if (queueLen === 0) return 100;

    const total = ringLen + queueLen;
    const base = 20 + (ringLen / total) * 60;
    const noise = Math.random() * 20 - 10;
    return Math.max(10, Math.min(90, base + noise));
  }

  private generateContestants(n: number): Contestant[] {
    return Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      name: '#' + (Math.floor(Math.random() * 900) + 100),
      entryOrder: i + 1,
    }));
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
