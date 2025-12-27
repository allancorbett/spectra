# Spectra - Color Guessing Party Game

## Overview

Spectra is a browser-based multiplayer party game where one player describes a color using words (no color names allowed), and other players try to locate that color on a color grid. Built with Next.js, TypeScript, and Tailwind CSS, designed to be hosted on Vercel.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Color Space**: OKLCH (perceptually uniform)
- **Real-time**: Polling-based updates (1 second interval)
- **State**: Redis (via ioredis) with in-memory fallback for local dev
- **QR Codes**: qrcode.react for game sharing

## Project Structure

```
src/
├── app/
│   ├── api/game/route.ts    # Game API endpoint
│   ├── [gameId]/page.tsx    # Dynamic game page (all game views)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/
│   ├── ColorGrid.tsx        # Rectangular grid for guessing
│   └── ColorWheel.tsx       # Polar wheel for reveal screens
└── lib/
    ├── types.ts             # TypeScript types and constants
    ├── colors.ts            # Color utilities and scoring
    ├── gameStore.ts         # Game state management (Redis + memory fallback)
    └── useGame.ts           # React hook for game state
```

## Key Components

### ColorGrid
Rectangular grid used during guessing phases. Dimensions vary by complexity:
- **Simple**: 12 hues × 10 chroma levels = 120 colors
- **Normal**: 24 hues × 20 chroma levels = 480 colors
- **Complex**: 36 hues × 28 chroma levels = 1008 colors

Supports:
- Cell selection and click/tap interactions
- Player guess markers with initials
- First guess visibility during second guess phase

### ColorWheel
SVG-based polar grid used for reveal screens. Dimensions match the game's complexity setting. Supports:
- Target highlighting with animation
- All player guess markers with initials
- Best guess highlighting (gold ring)
- Complexity-based dynamic sizing

### Game Store
Game state management with Redis:
- Automatic fallback to in-memory store for local development
- Game creation/joining with settings
- Phase transitions with optional timer
- Guess submission and clue submission (remote mode)
- Score calculation (Euclidean distance in OKLCH space)
- Auto-expiry of games (24 hours TTL)

### useGame Hook
Client-side state management with:
- Polling for real-time updates
- localStorage player ID persistence
- API action wrappers for all game actions

## Game Settings

Host configures these in the lobby before starting:

### Play Mode
- **Together**: Players are in the same room. Clue-giver speaks clues aloud.
- **Remote**: Players are remote. Clue-giver types clues with word count validation (1 word for round 1, 2 words for round 2).

### Color Complexity
- **Simple**: 120 colors (12×10 grid) - easier to find colors
- **Normal**: 480 colors (24×20 grid) - balanced difficulty
- **Complex**: 1008 colors (36×28 grid) - challenging precision

### Timer
- **Enabled**: 30 seconds per phase (clue-giving and guessing)
- **Disabled**: No time limit, clue-giver advances manually

## Game Flow

1. **Lobby**: Host creates game, configures settings, players join via code/QR
2. **Clue 1**: Clue-giver gives ONE word clue (typed in remote mode)
3. **Guess 1**: Players tap the color grid to place first guess
4. **Clue 2**: Clue-giver gives TWO word clue
5. **Guess 2**: Players tap to place second guess (first guess visible)
6. **Reveal**: Show target on color wheel, display all guesses, calculate scores
7. **Leaderboard**: Show cumulative scores, next clue-giver rotates

## Development

```bash
npm run dev      # Start development server (uses in-memory store)
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Deployment

### 1. Set up Redis
Use any Redis provider (Redis Cloud, Upstash, etc.) and get your connection URL.

### 2. Add environment variable
In your Vercel project settings, add:
```
REDIS_URL=redis://username:password@host:port
```

### 3. Deploy
```bash
vercel
```

### Local Development with Redis (optional)
Create a `.env.local` file:
```
REDIS_URL=redis://username:password@host:port
```

Without `REDIS_URL` configured, the game automatically uses an in-memory store which works fine for local development.

## Game Rules

- 2-24 players
- **Guesser scoring**: 0-100 points per round based on Euclidean distance in OKLCH color space (lower is better)
- Best of two guesses counts for guessers
- **Clue-giver scoring**: Gets the average score of all guessers (skipped with only 2 players)
- Clue-giver rotates sequentially through all players (by join order)
- No color names allowed in clues (honor system)
- Lowest total score after all rounds wins

## API Endpoints

### POST /api/game
Actions:
- `create` - Create new game
- `join` - Join existing game
- `leave` - Leave game
- `start` - Start game (host only)
- `advance` - Advance phase (clue-giver only)
- `guess` - Submit/update guess
- `submitClue` - Submit typed clue (remote mode only)
- `updateSettings` - Update game settings (host only, lobby only)
- `end` - End game
- `playAgain` - Reset for new game
- `poll` - Get current game state

### GET /api/game?gameId=XXX
Fetch game state by ID
