# Spectra - Comprehensive Test Plan

## Overview

This document outlines the testing strategy for Spectra, covering unit tests, component tests, integration tests, and end-to-end tests.

## 1. Unit Tests - Utility Functions

### 1.1 `src/lib/colors.ts`

#### `indexToColor(hueIndex, chromaIndex, hueSegments, chromaLevels)`

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Valid default parameters | `(0, 0)` | Valid OKLCH string `oklch(0.65 0.13 0)` |
| Max hue index | `(23, 0, 24, 20)` | Hue near 360° |
| Max chroma index | `(0, 19, 24, 20)` | Chroma = 0.25 |
| Simple complexity | `(5, 5, 12, 10)` | Correct hue/chroma mapping |
| Complex complexity | `(20, 20, 36, 28)` | Correct hue/chroma mapping |
| Edge: first cell | `(0, 0, 24, 20)` | Hue = 0°, Chroma = 0.13 |
| Edge: last cell | `(23, 19, 24, 20)` | Hue near 360°, Chroma = 0.25 |

#### `calculateDistance(targetHue, targetSat, guessHue, guessSat, hueSegments, chromaLevels)`

| Test Case | Input | Expected |
|-----------|-------|----------|
| Perfect match | `(5, 5, 5, 5, 24, 20)` | 0 |
| Same hue, different chroma | `(5, 0, 5, 19, 24, 20)` | ~50 |
| Different hue, same chroma | `(0, 5, 12, 5, 24, 20)` | ~50 |
| Maximum distance | `(0, 0, 12, 19, 24, 20)` | 100 |
| Hue wrapping (0 to 23) | `(0, 5, 23, 5, 24, 20)` | Small distance (wraps) |
| Hue wrapping (23 to 0) | `(23, 5, 0, 5, 24, 20)` | Small distance (wraps) |
| Symmetry test | A→B vs B→A | Equal distances |
| Simple complexity | `(3, 3, 6, 6, 12, 10)` | Correct calculation |
| Complex complexity | `(18, 14, 0, 0, 36, 28)` | Correct calculation |

#### `getRandomTarget(complexity)`

| Test Case | Expected |
|-----------|----------|
| Returns object with hue and saturation | `{ hue: number, saturation: number }` |
| Simple: hue in range [0, 11] | Valid range |
| Simple: saturation in range [0, 9] | Valid range |
| Normal: hue in range [0, 23] | Valid range |
| Normal: saturation in range [0, 19] | Valid range |
| Complex: hue in range [0, 35] | Valid range |
| Complex: saturation in range [0, 27] | Valid range |
| Values are integers | No decimals |
| Statistical distribution (100 calls) | Reasonably distributed |

#### `generateGameCode()`

| Test Case | Expected |
|-----------|----------|
| Length is 6 characters | `code.length === 6` |
| Only uppercase letters | `/^[A-Z]+$/` |
| Excludes confusing chars (I, O) | No I or O in output |
| Uniqueness (1000 calls) | High uniqueness rate |

### 1.2 `src/lib/types.ts`

#### `getGridDimensions(complexity)`

| Test Case | Input | Expected |
|-----------|-------|----------|
| Simple | `'simple'` | `{ hue: 12, chroma: 10 }` |
| Normal | `'normal'` | `{ hue: 24, chroma: 20 }` |
| Complex | `'complex'` | `{ hue: 36, chroma: 28 }` |

---

## 2. Unit Tests - Game Store

### 2.1 `src/lib/gameStore.ts`

#### `createGame(hostPlayerId)`

| Test Case | Expected |
|-----------|----------|
| Returns valid Game object | All required fields present |
| State is 'lobby' | `game.state === 'lobby'` |
| hostId matches input | `game.hostId === hostPlayerId` |
| Players array empty | `game.players.length === 0` |
| Settings match defaults | mode='together', complexity='normal', timerEnabled=true |
| Game code is 6 chars | Valid format |
| roundNumber is 0 | Initial state |
| clueGiverId is null | Not set until start |

#### `joinGame(gameId, playerId, name)`

**Success Cases:**

| Test Case | Expected |
|-----------|----------|
| First player joins | Player added with colorIndex=0 |
| Second player joins | colorIndex=1 |
| 12th player joins | colorIndex=11 |
| 13th player joins | colorIndex=0 (wraps) |
| Player data correct | id, name, totalScore=0, isConnected=true |
| Timestamps set | joinedAt and lastSeen populated |
| Returns updated game | Game object with new player |

**Validation Failures:**

| Test Case | Expected Error |
|-----------|----------------|
| Game doesn't exist | "Game not found" |
| Game already started | "Game has already started" |
| Game full (24 players) | "Game is full" |
| Empty name | "Name is required" |
| Whitespace-only name | "Name is required" |
| Name > 16 chars | "Name too long" |
| Duplicate name (case-insensitive) | "Name already taken" |

#### `startGame(gameId, playerId)`

**Success Cases:**

| Test Case | Expected |
|-----------|----------|
| Host starts with 2 players | State → 'clue-1' |
| clueGiverId set to host | `game.clueGiverId === hostId` |
| roundNumber becomes 1 | `game.roundNumber === 1` |
| Target color generated | targetHue and targetSaturation set |
| phaseEndTime set (timer on) | Future timestamp |
| phaseEndTime null (timer off) | No timer |

**Failures:**

| Test Case | Expected Error |
|-----------|----------------|
| Non-host tries to start | "Only host can start" |
| Less than 2 players | "Need at least 2 players" |
| Game already started | "Game already started" |

#### `advancePhase(gameId, playerId)`

| Current State | Next State | Additional Effects |
|---------------|------------|-------------------|
| clue-1 | guess-1 | phaseEndTime updated |
| guess-1 | clue-2 | phaseEndTime updated |
| clue-2 | guess-2 | phaseEndTime updated |
| guess-2 | reveal | Scores calculated, guesses get distance |
| reveal | leaderboard | Clue-giver rotates |
| leaderboard | clue-1 | New round, new target |

**Validation:**

| Test Case | Expected |
|-----------|----------|
| Only clue-giver can advance from clue phases | Error for non-clue-giver |
| Only clue-giver can advance from reveal | Error for non-clue-giver |
| Cannot advance from 'finished' | Error |

#### `submitGuess(gameId, playerId, hue, saturation, lockIn)`

**Success Cases:**

| Test Case | Expected |
|-----------|----------|
| New guess created | Guess added to game.guesses |
| Update existing guess | Guess updated (not duplicated) |
| Lock in guess | lockedIn=true, cannot update after |
| All guessers locked → auto-advance | Phase transitions |

**Validation:**

| Test Case | Expected Error |
|-----------|----------------|
| Clue-giver tries to guess | "Clue-giver cannot guess" |
| Invalid phase (not guess-1/guess-2) | "Not in guessing phase" |
| Hue out of range | "Invalid hue" |
| Saturation out of range | "Invalid saturation" |
| Non-integer values | "Invalid coordinates" |
| Already locked in | "Already locked in" |

#### `submitClue(gameId, playerId, clue)`

**Success Cases:**

| Test Case | Expected |
|-----------|----------|
| Valid 1-word clue in clue-1 | currentClue set |
| Valid 2-word clue in clue-2 | currentClue set |

**Validation:**

| Test Case | Expected Error |
|-----------|----------------|
| Non-clue-giver submits | "Only clue-giver can submit" |
| Together mode | "Clue submission only for remote mode" |
| 2 words in clue-1 | "Clue must be exactly 1 word" |
| 1 word in clue-2 | "Clue must be exactly 2 words" |
| 3 words in clue-2 | "Clue must be exactly 2 words" |
| Empty clue | "Clue is required" |

#### `calculateRoundScores(game)` (internal)

| Test Case | Expected |
|-----------|----------|
| Perfect guess (distance=0) | 0 points |
| Worst guess | 100 points |
| No guess submitted | 100 points |
| Best of two guesses used | Lower distance counts |
| Clue-giver gets average (3+ players) | Average of all guesser scores |
| Clue-giver excluded (2 players) | No score for clue-giver |
| Scores sorted ascending | Lowest distance first |
| Player totalScore updated | Accumulated correctly |

#### `updateSettings(gameId, playerId, settings)`

| Test Case | Expected |
|-----------|----------|
| Host updates mode | Setting changed |
| Host updates complexity | Setting changed |
| Host updates timerEnabled | Setting changed |
| Partial update | Only specified fields change |

**Validation:**

| Test Case | Expected Error |
|-----------|----------------|
| Non-host updates | "Only host can update" |
| Not in lobby | "Can only update in lobby" |

#### `endGame(gameId, playerId)`

| Test Case | Expected |
|-----------|----------|
| Clue-giver ends from leaderboard | State → 'finished' |

**Validation:**

| Test Case | Expected Error |
|-----------|----------------|
| Non-clue-giver tries | "Only clue-giver can end" |
| Wrong state | "Can only end from leaderboard" |

#### `playAgain(gameId, playerId)`

| Test Case | Expected |
|-----------|----------|
| Resets to lobby | State → 'lobby' |
| Clears scores | All totalScore = 0 |
| Clears guesses | guesses = [] |
| Clears roundScores | roundScores = [] |
| Resets roundNumber | roundNumber = 0 |

---

## 3. Component Tests

### 3.1 `ColorGrid.tsx`

| Test Case | Expected |
|-----------|----------|
| Renders 120 cells for simple | 12 × 10 grid |
| Renders 480 cells for normal | 24 × 20 grid |
| Renders 1008 cells for complex | 36 × 28 grid |
| Cell click triggers onCellClick | Called with (hue, saturation) |
| Disabled prevents clicks | onCellClick not called |
| Target cell highlighted | White ring visible |
| Selected cell shows checkmark | SVG checkmark rendered |
| Guess markers show initials | Player initial in circle |
| Best guess has gold ring | Gold border visible |

### 3.2 `ColorWheel.tsx`

| Test Case | Expected |
|-----------|----------|
| SVG renders at specified size | width/height match |
| Correct sectors for complexity | Matches hue segments |
| Correct rings for complexity | Matches chroma levels |
| Target marker positioned correctly | At (targetHue, targetSaturation) |
| Guess markers positioned correctly | At (guess.hue, guess.saturation) |
| Click calls onCellClick | Correct coordinates |
| Disabled prevents interaction | No click handler |

### 3.3 Game View Components

#### `JoinView.tsx`

| Test Case | Expected |
|-----------|----------|
| Shows game code | Displayed prominently |
| Name input accepts text | Value updates |
| Join button disabled when empty | Disabled state |
| Join button calls onJoin | With trimmed name |
| Error message displays | When join fails |
| Player count shown | "X player(s) waiting" |

#### `LobbyView.tsx`

| Test Case | Expected |
|-----------|----------|
| Host sees QR code | QRCodeSVG rendered |
| Host sees game code | Clickable to copy |
| Host sees settings | GameSettings component |
| Host sees start button | Enabled when 2+ players |
| Non-host sees waiting message | Text displayed |
| Player list shows all players | PlayerList component |

#### `GuessingView.tsx`

| Test Case | Expected |
|-----------|----------|
| Shows ColorGrid | Grid rendered |
| Shows previous guess in guess-2 | Marker visible |
| Preview swatch updates | Matches selection |
| Lock In button works | Calls onLockIn |
| Timer bar shows progress | Width percentage |
| Locked-in count updates | "X/Y players" |

#### `RevealView.tsx`

| Test Case | Expected |
|-----------|----------|
| Target swatch displayed | Large color block |
| ColorWheel shows all guesses | Markers for each guess |
| Best guesses highlighted | Gold ring |
| ScoreList shows rankings | Ordered by distance |

#### `ClueGiverView.tsx`

| Test Case | Expected |
|-----------|----------|
| Target color visible | Large swatch |
| Clue input in remote mode | Text field present |
| Word count validation | Error on wrong count |
| "Clue Given" button | Advances phase |
| Round scores in reveal | ScoreList visible |
| Leaderboard shows totals | All players ranked |

---

## 4. API Tests

### 4.1 `POST /api/game`

#### Action Validation

| Test Case | Expected |
|-----------|----------|
| Missing action | 400 error |
| Invalid action | 400 error |
| Valid actions accepted | 200 success |

#### Create Action

| Test Case | Expected |
|-----------|----------|
| Creates new game | Returns game object |
| Generates playerId | playerId in response |

#### Join Action

| Test Case | Expected |
|-----------|----------|
| Valid join | Player added, game returned |
| Missing name | 400 error |
| Missing gameId | 400 error |

#### Guess Action

| Test Case | Expected |
|-----------|----------|
| Valid guess | Guess recorded |
| Missing hue/saturation | 400 error |
| Invalid coordinates | 400 error |

### 4.2 `GET /api/game`

| Test Case | Expected |
|-----------|----------|
| Valid gameId | 200 with game |
| Missing gameId | 400 error |
| Invalid gameId | 404 not found |
| Auto-advances expired phase | Updated game state |

---

## 5. Integration Tests

### 5.1 Complete Game Flow (2 Players)

```
1. Player A creates game
2. Player B joins
3. Player A starts game
4. Round 1:
   - A gives clue (state: clue-1)
   - A advances (state: guess-1)
   - B guesses and locks in
   - A advances (state: clue-2)
   - A gives second clue
   - A advances (state: guess-2)
   - B guesses and locks in
   - (state: reveal) - scores calculated
   - A advances (state: leaderboard)
5. A starts next round (clue-giver rotates to B)
6. After all rounds, A ends game
7. Final standings displayed
```

### 5.2 Timer-Based Auto-Advance

```
1. Create game with timerEnabled=true
2. Start game
3. Wait 30 seconds in clue-1
4. Verify auto-advance to guess-1
5. Wait 30 seconds without locking in
6. Verify guesses auto-locked
7. Verify advance to clue-2
```

### 5.3 Remote Mode Clue Validation

```
1. Create game with mode='remote'
2. Start game
3. In clue-1:
   - Submit "hello world" → Error (2 words)
   - Submit "hello" → Success
4. In clue-2:
   - Submit "hello" → Error (1 word)
   - Submit "hello world" → Success
```

### 5.4 Complexity Variations

```
For each complexity (simple, normal, complex):
1. Create game with complexity
2. Verify ColorGrid renders correct size
3. Verify target coordinates in valid range
4. Verify distance calculations use correct dimensions
5. Verify ColorWheel matches complexity
```

### 5.5 Player Disconnect/Reconnect

```
1. Create game, 3 players join
2. Start game
3. Player B disconnects (leaves)
4. Player B reconnects with same playerId
5. Verify B's previous guesses preserved
6. Verify B can continue playing
```

---

## 6. End-to-End Tests

### 6.1 Full Game (4 Players, 4 Rounds)

```
1. Host creates game
2. 3 players join via game code
3. Host configures: normal complexity, timer on, together mode
4. Host starts
5. Each player takes turn as clue-giver
6. All rounds complete
7. Final leaderboard shown
8. Winner has lowest score
9. Play Again resets correctly
```

### 6.2 Edge Cases

| Scenario | Verification |
|----------|--------------|
| 24 players (max) | All can join and play |
| 2 players (min) | Clue-giver excluded from scoring |
| All same guesses | Tie-breaking works |
| No guesses submitted | 100 points assigned |
| Host leaves in lobby | New host assigned |
| Game idle 24 hours | Game expires (TTL) |

---

## 7. Test Implementation

### Recommended Stack

- **Unit Tests**: Jest
- **Component Tests**: React Testing Library + Jest
- **API Tests**: Supertest + Jest
- **E2E Tests**: Playwright

### File Structure

```
tests/
├── unit/
│   ├── colors.test.ts
│   ├── types.test.ts
│   └── gameStore.test.ts
├── components/
│   ├── ColorGrid.test.tsx
│   ├── ColorWheel.test.tsx
│   └── game/
│       ├── JoinView.test.tsx
│       ├── LobbyView.test.tsx
│       ├── GuessingView.test.tsx
│       ├── RevealView.test.tsx
│       └── ClueGiverView.test.tsx
├── api/
│   └── game.test.ts
├── integration/
│   ├── gameFlow.test.ts
│   └── timerBehavior.test.ts
└── e2e/
    ├── fullGame.spec.ts
    └── edgeCases.spec.ts
```

### Coverage Targets

| Category | Target |
|----------|--------|
| colors.ts | 100% |
| types.ts | 100% |
| gameStore.ts | 95% |
| Components | 85% |
| API routes | 95% |
| Overall | 90% |

---

## 8. Priority Matrix

| Priority | Tests | Rationale |
|----------|-------|-----------|
| P0 (Critical) | calculateDistance, score calculation, state transitions | Core game logic |
| P1 (High) | submitGuess, joinGame, advancePhase, API validation | Game flow |
| P2 (Medium) | Component rendering, settings, clue validation | User experience |
| P3 (Low) | Edge cases, styling, animations | Polish |

---

## 9. Test Data Fixtures

### Sample Games

```typescript
const fixtures = {
  emptyLobby: { state: 'lobby', players: [], ... },
  twoPlayerLobby: { state: 'lobby', players: [host, guest], ... },
  inProgressGame: { state: 'guess-1', roundNumber: 1, ... },
  revealPhase: { state: 'reveal', roundScores: [...], ... },
  finishedGame: { state: 'finished', ... },
};
```

### Sample Players

```typescript
const players = {
  host: { id: 'host-id', name: 'Alice', colorIndex: 0, totalScore: 0 },
  guest1: { id: 'guest-1', name: 'Bob', colorIndex: 1, totalScore: 0 },
  guest2: { id: 'guest-2', name: 'Carol', colorIndex: 2, totalScore: 0 },
};
```

### Sample Guesses

```typescript
const guesses = {
  perfect: { hue: 5, saturation: 5, distance: 0 },
  close: { hue: 6, saturation: 5, distance: 4 },
  far: { hue: 17, saturation: 15, distance: 75 },
};
```
