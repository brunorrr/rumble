export interface Contestant {
  id: number;
  name: string;
  entryOrder: number;
  moral: number;
}

export type EventType = 'initial' | 'enter' | 'eliminate';

export interface CycleEvent {
  round: number;
  type: EventType;
  contestant: Contestant;
  eliminationChance: number;
  roll: number;
}

export interface SimulationState {
  queue: Contestant[];
  ring: Contestant[];
  eliminated: Contestant[];
  currentRound: number;
  totalRounds: number;
  events: CycleEvent[];
  isComplete: boolean;
}
