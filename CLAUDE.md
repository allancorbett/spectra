# Spectra - Color Guessing Party Game

## Overview

Spectra is a browser-based multiplayer party game where one player describes a color using words (no color names allowed), and other players try to locate that color on a color wheel. Built with Next.js, TypeScript, and Tailwind CSS, designed to be hosted on Vercel.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
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
│   └── ColorWheel.tsx       # SVG color wheel component
└── lib/
    ├── types.ts             # TypeScript types and constants
    ├── colors.ts            # Color utilities and scoring
    ├── gameStore.ts         # Game state management (Redis + memory fallback)
    └── useGame.ts           # React hook for game state
```

## Key Components

### ColorWheel
SVG-based polar grid with 36 hue segments × 8 saturation rings (288 cells). Supports:
- Target highlighting
- Player guess markers with initials
- Selection states
- Click/tap interactions

### Game Store
Game state management with Redis:
- Automatic fallback to in-memory store for local development
- Game creation/joining
- Phase transitions
- Guess submission
- Score calculation (Euclidean distance)
- Auto-expiry of games (24 hours TTL)

### useGame Hook
Client-side state management with:
- Polling for real-time updates
- localStorage player ID persistence
- API action wrappers

## Game Flow

1. **Lobby**: Host creates game, players join via code/QR
2. **Clue 1**: Clue-giver gives ONE word (30s timer)
3. **Guess 1**: Players tap to guess (30s timer)
4. **Clue 2**: Clue-giver gives TWO words (30s timer)
5. **Guess 2**: Players tap second guess (30s timer)
6. **Reveal**: Show target, calculate scores
7. **Leaderboard**: Show cumulative scores, next clue-giver

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
- Scoring: 0-100 points per round (lower is better)
- Best of two guesses counts
- No color names allowed in clues (honor system)
- Clue-giver rotates to lowest scorer each round

## API Endpoints

### POST /api/game
Actions:
- `create` - Create new game
- `join` - Join existing game
- `leave` - Leave game
- `start` - Start game (host only)
- `advance` - Advance phase (clue-giver only)
- `guess` - Submit/update guess
- `end` - End game
- `playAgain` - Reset for new game
- `poll` - Get current game state

### GET /api/game?gameId=XXX
Fetch game state by ID
