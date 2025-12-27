# Spectra

A color guessing party game for 2-24 players. One player describes a color using words (no color names allowed!), and everyone else tries to find it.

## How to Play

1. **Create or join** a game using a 4-letter code
2. **Host configures** play mode, color complexity, and timer settings
3. **Take turns** as the clue-giver describing a randomly selected color
4. **Guess** by tapping the color grid - you get two chances per round
5. **Score** based on how close your guess is to the target (lower is better)
6. **Win** by having the lowest total score after everyone has given clues

## Game Modes

- **Together**: Play in the same room with spoken clues
- **Remote**: Play online with typed clues (word count enforced)

## Features

- Real-time multiplayer via QR code or game link
- Three difficulty levels (120, 480, or 1008 colors)
- Optional 30-second timer
- OKLCH color space for perceptually uniform scoring
- Mobile-friendly design

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Deployment

Deploy to Vercel with a Redis database for persistent game state:

```bash
vercel
```

Set `REDIS_URL` environment variable for production. Without it, an in-memory store is used (fine for local development).

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Redis (ioredis)
