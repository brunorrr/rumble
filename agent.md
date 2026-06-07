# Rumble — Agent Context

## What this project is

A Royal Rumble simulator built with Angular 21. The user configures a number of contestants (4–30), then watches them enter and get eliminated from a ring round by round until one winner remains.

## Tech stack

- **Angular 21** (standalone components, signals, `@if` / `@for` control flow)
- **SCSS** for all styling
- **FormsModule** for the contestant count input and speed selector
- **Yarn** as package manager
- `ng serve` / `ng build` / `ng test` are the standard scripts

## File structure

```
src/
├── styles.scss                        # Global reset + html/body base styles
├── app/
│   ├── app.ts                         # Root component (inline template, styleUrl → app.scss)
│   ├── app.scss                       # Root component styles (moved from inline + from app.html <style> block)
│   ├── app.html                       # Angular scaffold placeholder (not used by app.ts)
│   ├── app.routes.ts                  # Router (empty routes)
│   ├── app.config.ts                  # provideRouter + provideBrowserGlobalErrorListeners
│   ├── models/
│   │   └── rumble.models.ts           # Interfaces: Contestant, CycleEvent, SimulationState, EventType
│   ├── services/
│   │   └── rumble.service.ts          # All game logic as a signal-based service
│   └── components/
│       ├── setup/
│       │   └── setup.ts              # Setup screen (inline template + inline styles)
│       └── simulation/
│           ├── simulation.ts         # Simulation component
│           ├── simulation.html       # Simulation template
│           └── simulation.scss       # Simulation styles
```

## Game rules (important — clarified during this session)

### Contestants and rounds

- The user picks `n` contestants (e.g. 10).
- **Round** = a player entering the ring. There are exactly `n` rounds total.
- The first 2 players are placed into the ring at the start (rounds 1 and 2, `type: 'initial'`).
- Rounds 3–n: the remaining `n - 2` players join one at a time.

### Cycles

A **cycle** is any single action — either an entry or an elimination. For `n` contestants:

- `n` entry cycles (including the 2 initial placements)
- `n - 1` elimination cycles (all but the winner are eliminated)
- **Total cycles = 2n − 1** (e.g. 19 for n=10)

### Eliminations happen between rounds

Each non-initial cycle is resolved by a random roll against the current elimination chance. If the roll hits, someone in the ring is eliminated (round counter does not increment). If it misses, the next player from the queue enters (round counter increments).

Once the queue is empty, every subsequent cycle is a guaranteed elimination (100% chance) until only 1 remains.

### Win condition

A player wins when **both** conditions are true:
- `ring.length === 1`
- `queue.length === 0`

Being alone in the ring while the queue still has players does **not** end the game — a new player enters next cycle.

### Elimination chance formula

```
if ring.length < 2  → 0%
if queue.length === 0 → 100%
otherwise:
  base = 40 + (ring.length / (ring.length + queue.length)) * 40
  noise = random [-10, 10]
  chance = clamp(base + noise, 30, 90)
```

The UI shows a deterministic preview (base without noise) as a gradient bar below the arena.

## Moral system

Each `Contestant` has a `moral: number` field, initialised to `0`.

### Per-cycle update (ring players only)

Every cycle, before the elimination/entry decision, all players currently in the ring have their moral ticked:

```
loss  = random 1 or 2 (50/50)
bonus = 2 with 40% probability, else 0
moral = moral - loss + bonus
```

### Effect on elimination

When an elimination is triggered, the victim is **not** chosen at random. Instead, an inverse softmax is applied over ring players' moral values:

```
p_i = exp(-moral_i) / Σ exp(-moral_j)
```

Lower moral → higher elimination probability. The winner is sampled from this distribution. A numerical stability shift (`max` subtraction before `exp`) is applied internally.

## State model (`SimulationState`)

| field | description |
|---|---|
| `queue` | Players not yet in the ring |
| `ring` | Players currently in the ring |
| `eliminated` | Players who have been eliminated |
| `currentRound` | Count of entries so far (starts at 2, only increments on entry) |
| `totalRounds` | Equal to `n` (total contestants) |
| `events` | Log of every cycle (`CycleEvent[]`) |
| `isComplete` | `ring.length === 1 && queue.length === 0` |

`Contestant` fields: `id`, `name`, `entryOrder`, `moral`.

`CycleEvent` fields: `round`, `type` (`initial` | `enter` | `eliminate`), `contestant`, `eliminationChance`, `roll`.

## What was done in this session

### 1. SCSS refactor — move inline styles to files

- **`app.ts`**: removed `styles: [':host { display: block; }']`, added `styleUrl: './app.scss'`.
- **`app.scss`**: populated with the `:host { display: block }` rule, then also moved the large `<style>` block that was inside `app.html` (Angular scaffold boilerplate) into this file as proper SCSS with nesting.
- **`app.html`**: `<style>` block removed; HTML content unchanged.

### 2. Next-round elimination chance bar

Added a visual bar below the `.arena` grid in the simulation view showing the deterministic elimination chance (0–100%) for the upcoming cycle.

- **`simulation.ts`**: added `nextEliminationChance` computed signal using the base formula (no noise).
- **`simulation.html`**: added `.next-odds` block between `.arena` and the result banner, hidden when `isComplete`.
- **`simulation.scss`**: added styles for `.next-odds`, `.next-odds-label`, `.next-odds-track`, `.next-odds-fill` (green → amber → red gradient), `.next-odds-value`.

### 4. Moral system + weighted elimination

- **`rumble.models.ts`**: added `moral: number` to `Contestant`.
- **`rumble.service.ts`**:
  - `generateContestants` initialises `moral: 0`.
  - `tickMoral(c)`: subtracts 1 or 2 randomly, adds 2 with 40% probability.
  - `pickByInverseSoftmax(ring)`: samples the victim using `softmax(-moral)` — lowest moral = highest elimination chance.
  - `nextCycle`: ring players are ticked via `tickMoral` before the elimination/entry decision; elimination uses `pickByInverseSoftmax` instead of a uniform random pick.
- **`simulation.html`**: ring chips now display `c.moral` via a `chip-moral` span.
- **`simulation.scss`**: `.chip-moral` styled in the player's color, small font, semi-bold. `.elim-chip` had `text-decoration: line-through` removed (eliminated players shown without strikethrough).

### 3. Game logic fix — correct round counting and win condition

**Before:** `currentRound` incremented every cycle; game ended at `currentRound >= totalRounds`.

**After (correct):**

- `init()`: initial events use `round: 1` and `round: 2`; `currentRound` starts at `2`.
- `nextCycle()`: `currentRound` only increments when a player **enters** (not on eliminations).
- `isComplete`: changed from `currentRound >= totalRounds` → `ring.length === 1 && queue.length === 0`.
- Queue-empty guard: `|| newQueue.length === 0` in the elimination branch ensures cycles keep resolving as eliminations once all players have entered.
