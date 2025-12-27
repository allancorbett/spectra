# Spectra - Complete Game Specification

## Overview

Colour Clues is a browser-based party game for 2-24 players. One player describes a colour using words (without saying colour names), and other players try to locate that exact spot on a colour wheel. Closest guesses win. The game is played in person with players using their own devices - clues are spoken aloud, not typed.

-----

## Core Concepts

### The Colour Wheel

- **Structure:** Polar grid with 36 hue segments × 8 saturation rings = 288 discrete selectable cells
- **Hue:** 36 segments at 10° each, rotating around the wheel
- **Saturation:** 8 rings from desaturated (centre) to fully saturated (edge)
- **Lightness:** Fixed at 50% for all cells (no blacks, whites, or muddy tones)
- **Interaction:** Players tap cells to select them, not freeform colour picking

### Players

- **Minimum:** 2 players
- **Maximum:** 24 players
- **No accounts required:** Players enter a display name to join
- **Identification:** Each player is assigned a unique ID stored in localStorage for reconnection, plus a visual identifier (colour + initials) for display on the wheel

### Clue-Giver

- The player who gives clues for the current round
- First round: the host (game creator)
- Subsequent rounds: the player with the lowest score from the previous round
- Ties broken randomly

-----

## Game Flow

### 1. Game Creation

1. Host visits the home page
1. Host taps “Create Game”
1. Game is created with a unique ID
1. Host is redirected to the lobby with a shareable URL and QR code

### 2. Joining

1. Players receive the game URL (shared via QR code, message, or spoken aloud)
1. Players visit the URL
1. Players enter their display name (must be unique within the game, max 16 characters)
1. Players are assigned a unique ID (stored in localStorage) and visual identifier
1. Players enter the lobby and see other joined players in real-time

### 3. Starting the Game

1. Host sees all joined players in the lobby
1. When ready (minimum 2 players), host taps “Start Game”
1. Game is locked - no new players can join
1. All players are transitioned to the game view
1. Host becomes the first clue-giver

### 4. Round Structure

Each round consists of 6 phases:

#### Phase 1: First Clue (30 seconds)

- **Clue-giver sees:** The colour wheel with one cell highlighted as the target, plus a large swatch of the target colour
- **Clue-giver does:** Speaks ONE word aloud to describe the colour (no colour names allowed - honour system)
- **Clue-giver taps:** “Clue Given” button to advance
- **Guessers see:** Waiting screen with “Listen for the clue!” message
- **Timer:** 30 seconds, but clue-giver can advance early

#### Phase 2: First Guess (30 seconds)

- **Guessers see:** The colour wheel (tappable)
- **Guessers do:** Tap a cell to place their first marker, then tap “Lock In” to confirm
- **Clue-giver sees:** The wheel with player markers appearing in real-time, plus status showing how many players have locked in
- **Timer behaviour:**
  - 30 seconds maximum
  - If all guessers lock in early, phase advances immediately
  - If timer expires, any placed-but-not-locked-in guesses are automatically locked
  - Players who haven’t tapped at all receive no guess for this phase

#### Phase 3: Second Clue (30 seconds)

- **Clue-giver sees:** The target cell (same as before), plus all first-guess markers from players
- **Clue-giver does:** Speaks TWO words aloud to further describe the colour
- **Clue-giver taps:** “Clue Given” button to advance
- **Guessers see:** Waiting screen, their first guess marker remains visible

#### Phase 4: Second Guess (30 seconds)

- **Guessers see:** The colour wheel with their first guess marker visible
- **Guessers do:** Tap a cell to place their second marker (visually distinct from first), then tap “Lock In”
- **Clue-giver sees:** Both sets of markers appearing in real-time
- **Timer behaviour:** Same as first guess phase

#### Phase 5: Reveal

- **Everyone sees:**
  - The colour wheel with the target cell prominently highlighted
  - All player guesses (both markers per player) with name labels
  - Each player’s better guess indicated
  - Target colour as a large swatch
  - Round scores: each player’s distance and points gained, ranked by performance
  - The closest guesser highlighted
- **Next clue-giver sees:** “Next Round” button
- **Clue-giver determined:** Player with lowest score this round (ties broken randomly)

#### Phase 6: Leaderboard

- **Everyone sees:**
  - Cumulative scores ranked lowest first (lowest is best)
  - Each player’s total points
  - The next clue-giver indicated
- **Current clue-giver sees:** “Start Next Round” and “End Game” buttons

### 5. Subsequent Rounds

- New clue-giver taps “Start Next Round”
- A new random target cell is selected
- Round structure repeats from Phase 1

### 6. Ending the Game

- Current clue-giver can tap “End Game” at any time from the leaderboard
- All players see the Game Over screen with final standings
- Options presented: “Play Again” (same players, reset scores) or “New Game” (return to home)

-----

## Scoring

### Distance Calculation

- **Method:** Euclidean distance in hue-saturation space
- **Hue distance:** Calculated as shortest arc (wrapping at 360°), then scaled relative to the wheel
- **Saturation distance:** Linear difference between rings
- **Combined:** √(hue_distance² + saturation_distance²), scaled to 0-100
- **Best guess wins:** Each player’s closer guess of their two markers is used for scoring

### Points

- **Range:** 0-100 per round (lower is better)
- **Adjacent cell:** Approximately 1-3 points
- **Opposite side of wheel:** Approximately 100 points
- **Cumulative:** Points are added to running total across rounds
- **Winner:** Lowest total score when game ends

-----

## Reconnection

### How It Works

- Each player’s unique ID is stored in localStorage
- If a player’s browser refreshes or closes, they can revisit the game URL
- If their localStorage ID matches a player in that game, they rejoin seamlessly
- They are placed into whatever phase the game is currently in

### Clue-Giver Disconnection

- If the clue-giver disconnects mid-round and doesn’t reconnect within a reasonable time:
  - The current round is abandoned
  - A new clue-giver is selected (next lowest cumulative score)
  - A new round begins with a fresh target colour

-----

## Player States

A player can be in one of these states:

|State         |Description                            |
|--------------|---------------------------------------|
|`connected`   |Active in the game, responding normally|
|`disconnected`|Browser closed/refreshed, may reconnect|

-----

## Game States

The game progresses through these states:

|State        |Description                                   |
|-------------|----------------------------------------------|
|`lobby`      |Accepting players, waiting for host to start  |
|`clue-1`     |Clue-giver giving first clue (30s)            |
|`guess-1`    |Guessers placing first marker (30s)           |
|`clue-2`     |Clue-giver giving second clue (30s)           |
|`guess-2`    |Guessers placing second marker (30s)          |
|`reveal`     |Showing target and all guesses                |
|`leaderboard`|Showing cumulative scores, awaiting next round|
|`finished`   |Game over, showing final results              |

-----

## Views

### 1. Home Page

**Route:** `/`

**Purpose:** Entry point for creating or joining games

**Elements:**

- Game title and logo
- “Create Game” button
- “Enter Game Code” text field with “Join” button
- “How to Play” expandable section explaining the rules

-----

### 2. Join Page

**Route:** `/{gameId}` (when game exists, is in lobby state, and user is not already a player)

**Purpose:** Player enters their name to join

**Elements:**

- Game code displayed for confirmation
- “Your Name” text field (max 16 characters)
- “Join Game” button
- Validation errors: name required, name already taken, game full (24 players)

-----

### 3. Host Lobby

**Route:** `/{gameId}` (when user is the host and game is in lobby state)

**Purpose:** Host waits for players and starts the game

**Elements:**

- Game URL displayed prominently (tap to copy)
- QR code encoding the game URL
- Live-updating list of joined players (host marked, self highlighted)
- Player count: “X/24 players”
- “Start Game” button (enabled when 2+ players)
- “Cancel Game” button (with confirmation)

-----

### 4. Player Lobby

**Route:** `/{gameId}` (when user is a non-host player and game is in lobby state)

**Purpose:** Player waits for host to start

**Elements:**

- “Waiting for host to start the game…” message
- Live-updating list of joined players (host marked, self highlighted)
- “Leave Game” button

-----

### 5. Clue-Giver View

**Route:** `/{gameId}` (when user is the current clue-giver and game is in an active round state)

**Purpose:** Clue-giver sees the target and manages the round

**Elements vary by phase:**

**During clue-1 and clue-2:**

- Colour wheel with target cell highlighted (pulsing/glowing)
- Large swatch showing the target colour
- Phase instruction: “Say ONE word” or “Say TWO words”
- 30-second countdown timer
- “Clue Given” button

**During guess-1 and guess-2:**

- Colour wheel showing target cell (still visible to clue-giver)
- Player markers appearing in real-time as guesses are placed
- Lock-in status: “X/Y players locked in”
- 30-second countdown timer
- Phase auto-advances when all locked in or timer expires

**After guess-2:**

- “Reveal Colour” button

-----

### 6. Guesser View

**Route:** `/{gameId}` (when user is a guesser and game is in an active round state)

**Purpose:** Players place their guesses

**Elements vary by phase:**

**During clue-1 and clue-2:**

- “Listen for the clue!” message
- Waiting indicator
- Any previously placed markers visible (during clue-2)

**During guess-1 and guess-2:**

- Colour wheel (all cells tappable)
- Phase indicator: “Place your first guess” or “Place your second guess”
- 30-second countdown timer
- Currently selected cell highlighted
- “Lock In” button (enabled after tapping a cell)
- First guess marker visible during guess-2 phase (so player can see where they already guessed)
- After locking in: “Waiting for other players…” message (guess cannot be changed)

-----

### 7. Reveal View

**Route:** `/{gameId}` (when game is in reveal state)

**Purpose:** Show the target and all guesses

**Elements:**

- Colour wheel showing:
  - Target cell with prominent highlight (glow, star, “TARGET” label)
  - All player markers with name labels
  - Both guesses per player visible, better guess emphasised
- Large swatch of target colour
- Round results panel:
  - Players ranked by distance this round
  - Each player’s distance score shown
  - Closest guesser highlighted
- “Next Round” button (visible only to the round winner / next clue-giver)

-----

### 8. Leaderboard View

**Route:** `/{gameId}` (when game is in leaderboard state, or accessible as overlay during game)

**Purpose:** Show cumulative standings

**Elements:**

- Players ranked by total score (lowest first)
- Each player’s cumulative score
- Next clue-giver indicated
- “Start Next Round” button (visible to current clue-giver only)
- “End Game” button (visible to current clue-giver only)

-----

### 9. Game Over View

**Route:** `/{gameId}` (when game is in finished state)

**Purpose:** Final results and options to continue

**Elements:**

- Final leaderboard with winner celebration
- Winner highlighted at top
- All players’ final scores
- “Play Again” button - resets scores, same players return to lobby, original host regains host status
- “New Game” button - returns to home page
- “Leave” button - returns to home page

-----

### 10. Game Unavailable Page

**Route:** `/{gameId}` (when game doesn’t exist OR game is in progress and user is not a player)

**Purpose:** Friendly message for invalid access

**Elements:**

- If game in progress: “This game has already started - you’ll have to catch the next one!”
- If game doesn’t exist: “Game not found - check your link and try again”
- “Create Your Own Game” button linking to home page

-----

## Data Model

### Game

|Field             |Type     |Description                                                                                |
|------------------|---------|-------------------------------------------------------------------------------------------|
|`id`              |string   |Unique game identifier (used in URL)                                                       |
|`state`           |enum     |Current game state (lobby, clue-1, guess-1, clue-2, guess-2, reveal, leaderboard, finished)|
|`hostId`          |string   |Player ID of the game creator                                                              |
|`clueGiverId`     |string   |Player ID of current round’s clue-giver                                                    |
|`roundNumber`     |integer  |Current round (starts at 1)                                                                |
|`targetHue`       |integer  |Target cell hue index (0-35)                                                               |
|`targetSaturation`|integer  |Target cell saturation index (0-7)                                                         |
|`createdAt`       |timestamp|When game was created                                                                      |
|`lockedAt`        |timestamp|When game was started/locked (null if in lobby)                                            |

### Player

|Field        |Type     |Description                                      |
|-------------|---------|-------------------------------------------------|
|`id`         |string   |Unique player identifier (stored in localStorage)|
|`gameId`     |string   |Game this player belongs to                      |
|`name`       |string   |Display name (max 16 characters)                 |
|`colourIndex`|integer  |Assigned visual colour for markers               |
|`totalScore` |integer  |Cumulative score across all rounds               |
|`isConnected`|boolean  |Currently connected to the game                  |
|`joinedAt`   |timestamp|When player joined                               |

### Guess (per round)

|Field        |Type   |Description                                    |
|-------------|-------|-----------------------------------------------|
|`playerId`   |string |Player who made this guess                     |
|`roundNumber`|integer|Which round this guess belongs to              |
|`guessNumber`|integer|1 or 2                                         |
|`hue`        |integer|Guessed cell hue index (0-35)                  |
|`saturation` |integer|Guessed cell saturation index (0-7)            |
|`lockedIn`   |boolean|Whether player confirmed this guess            |
|`distance`   |float  |Calculated distance from target (set at reveal)|

-----

## Timers

|Phase  |Duration  |Early Advance               |
|-------|----------|----------------------------|
|clue-1 |30 seconds|Clue-giver taps “Clue Given”|
|guess-1|30 seconds|All guessers lock in        |
|clue-2 |30 seconds|Clue-giver taps “Clue Given”|
|guess-2|30 seconds|All guessers lock in        |

Timers are synchronised across all clients via the server.

-----

## Banned Words

No formal enforcement - clue-givers must avoid colour names on the honour system. The spirit of the rule: don’t use words that directly name colours (red, blue, green, orange, pink, purple, yellow, cyan, magenta, brown, grey/gray, black, white, etc.) or obvious synonyms (scarlet, crimson, azure, violet, etc.).

Creative descriptions encouraged: “tomato”, “ocean”, “sunrise”, “jealousy”, “royal”, etc.

-----

## Edge Cases

### Player joins then leaves during lobby

- Player is removed from the player list
- Their name becomes available again
- No impact on other players

### All guessers disconnect during a guess phase

- Timer continues
- If no guesses are placed, those players receive no score for that guess
- Round continues normally

### Clue-giver disconnects during their clue phase

- Brief grace period for reconnection
- If they don’t return: round is abandoned, new clue-giver selected, new round begins

### Player has no guesses for a round (timed out without tapping)

- They receive maximum points (100) for that round

### Only 2 players and one is clue-giver

- The single guesser plays alone
- Game still functions normally

### “Play Again” pressed

- All player scores reset to 0
- All players return to lobby
- Original host regains host status
- Game returns to lobby state
- New players can join again (game is unlocked)

-----

## Technical Requirements

### Real-time Communication

- Required for: player list updates, game state transitions, live guess markers, timer synchronisation
- Suggested: WebSockets or real-time database (Supabase Realtime, Firebase, Ably, Pusher)

### Client Storage

- localStorage for player ID (reconnection support)

### Mobile-First Design

- Primary target: mobile browsers
- Must also work on desktop
- Touch-friendly tap targets (wheel cells ~26px minimum at outer edge)
- Responsive layout adapting to screen size

### Browser Support

- Modern browsers: Chrome, Safari, Firefox, Edge
- iOS Safari and Android Chrome specifically

-----

## Future Considerations (Not in Initial Build)

- Sound effects and haptic feedback
- Spectator mode for late joiners
- Custom game settings (timer duration, round count, score-to-win)
- Player avatars/emoji selection
- Chat or reactions
- Colour blindness accessibility mode
- Statistics and history tracking

-----

## Summary Table

|Aspect                      |Specification                             |
|----------------------------|------------------------------------------|
|Players                     |2-24                                      |
|Colour wheel                |36 hue × 8 saturation = 288 cells         |
|Lightness                   |Fixed at 50%                              |
|Timer per phase             |30 seconds                                |
|Guesses per player per round|2 (best one counts)                       |
|Scoring                     |Euclidean distance, 0-100, lower is better|
|Win condition               |Lowest cumulative score when game ends    |
|Round control               |Current clue-giver                        |
|Reconnection                |localStorage player ID                    |
|Accounts required           |No                                        |

-----

*Document version: 1.0*
*Last updated: December 2024*
