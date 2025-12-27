import {
  getGridDimensions,
  COMPLEXITY_DIMENSIONS,
  DEFAULT_SETTINGS,
  PLAYER_COLORS,
  HUE_SEGMENTS,
  CHROMA_LEVELS,
  PHASE_DURATION,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_NAME_LENGTH,
} from '@/lib/types';

describe('types.ts', () => {
  describe('getGridDimensions', () => {
    it('returns correct dimensions for simple complexity', () => {
      const dims = getGridDimensions('simple');
      expect(dims).toEqual({ hue: 12, chroma: 10 });
    });

    it('returns correct dimensions for normal complexity', () => {
      const dims = getGridDimensions('normal');
      expect(dims).toEqual({ hue: 24, chroma: 20 });
    });

    it('returns correct dimensions for complex complexity', () => {
      const dims = getGridDimensions('complex');
      expect(dims).toEqual({ hue: 36, chroma: 28 });
    });

    it('simple has 120 total colors', () => {
      const dims = getGridDimensions('simple');
      expect(dims.hue * dims.chroma).toBe(120);
    });

    it('normal has 480 total colors', () => {
      const dims = getGridDimensions('normal');
      expect(dims.hue * dims.chroma).toBe(480);
    });

    it('complex has 1008 total colors', () => {
      const dims = getGridDimensions('complex');
      expect(dims.hue * dims.chroma).toBe(1008);
    });
  });

  describe('COMPLEXITY_DIMENSIONS', () => {
    it('has all complexity levels defined', () => {
      expect(COMPLEXITY_DIMENSIONS).toHaveProperty('simple');
      expect(COMPLEXITY_DIMENSIONS).toHaveProperty('normal');
      expect(COMPLEXITY_DIMENSIONS).toHaveProperty('complex');
    });

    it('matches getGridDimensions output', () => {
      expect(COMPLEXITY_DIMENSIONS.simple).toEqual(getGridDimensions('simple'));
      expect(COMPLEXITY_DIMENSIONS.normal).toEqual(getGridDimensions('normal'));
      expect(COMPLEXITY_DIMENSIONS.complex).toEqual(getGridDimensions('complex'));
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('has correct default values', () => {
      expect(DEFAULT_SETTINGS).toEqual({
        mode: 'together',
        complexity: 'normal',
        timerEnabled: true,
      });
    });

    it('mode is together by default', () => {
      expect(DEFAULT_SETTINGS.mode).toBe('together');
    });

    it('complexity is normal by default', () => {
      expect(DEFAULT_SETTINGS.complexity).toBe('normal');
    });

    it('timer is enabled by default', () => {
      expect(DEFAULT_SETTINGS.timerEnabled).toBe(true);
    });
  });

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
    it('HUE_SEGMENTS defaults to 24 (normal complexity)', () => {
      expect(HUE_SEGMENTS).toBe(24);
    });

    it('CHROMA_LEVELS defaults to 20 (normal complexity)', () => {
      expect(CHROMA_LEVELS).toBe(20);
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
