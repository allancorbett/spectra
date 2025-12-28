import {
  PLAYER_COLORS,
  HUE_SEGMENTS,
  CHROMA_LEVELS,
  PHASE_DURATION,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_NAME_LENGTH,
} from '@/lib/types';

describe('types.ts', () => {
  describe('PLAYER_COLORS', () => {
    it('has 12 colors', () => {
      expect(PLAYER_COLORS).toHaveLength(12);
    });

    it('all colors are valid hex codes', () => {
      for (const color of PLAYER_COLORS) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('all colors are unique', () => {
      const uniqueColors = new Set(PLAYER_COLORS);
      expect(uniqueColors.size).toBe(PLAYER_COLORS.length);
    });
  });

  describe('game constants', () => {
    it('HUE_SEGMENTS is 24', () => {
      expect(HUE_SEGMENTS).toBe(24);
    });

    it('CHROMA_LEVELS is 20', () => {
      expect(CHROMA_LEVELS).toBe(20);
    });

    it('grid has 480 total colors', () => {
      expect(HUE_SEGMENTS * CHROMA_LEVELS).toBe(480);
    });

    it('PHASE_DURATION is 30 seconds', () => {
      expect(PHASE_DURATION).toBe(30000);
    });

    it('MIN_PLAYERS is 2', () => {
      expect(MIN_PLAYERS).toBe(2);
    });

    it('MAX_PLAYERS is 24', () => {
      expect(MAX_PLAYERS).toBe(24);
    });

    it('MAX_NAME_LENGTH is 16', () => {
      expect(MAX_NAME_LENGTH).toBe(16);
    });
  });
});
