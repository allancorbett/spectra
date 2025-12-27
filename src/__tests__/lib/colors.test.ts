import { indexToColor, calculateDistance, getRandomTarget, generateGameCode } from '@/lib/colors';

describe('colors.ts', () => {
  describe('indexToColor', () => {
    it('returns valid OKLCH color string format', () => {
      const color = indexToColor(0, 0);
      expect(color).toMatch(/^oklch\(\d+\.?\d* \d+\.?\d* \d+\.?\d*\)$/);
    });

    it('returns correct color for first cell (0, 0)', () => {
      const color = indexToColor(0, 0, 24, 20);
      // Hue = 0, Chroma = 0.13, Lightness = 0.65
      expect(color).toBe('oklch(0.65 0.13 0)');
    });

    it('returns correct color for last hue index', () => {
      const color = indexToColor(23, 0, 24, 20);
      // Hue = (23/24) * 360 = 345
      expect(color).toBe('oklch(0.65 0.13 345)');
    });

    it('returns correct color for max chroma index', () => {
      const color = indexToColor(0, 19, 24, 20);
      // Chroma = 0.13 + (19/19) * 0.12 = 0.25
      expect(color).toBe('oklch(0.65 0.25 0)');
    });

    it('works with simple complexity dimensions', () => {
      const color = indexToColor(6, 5, 12, 10);
      // Hue = (6/12) * 360 = 180
      // Chroma = 0.13 + (5/9) * 0.12 ≈ 0.1967
      expect(color).toMatch(/^oklch\(0\.65 0\.19\d* 180\)$/);
    });

    it('works with complex complexity dimensions', () => {
      const color = indexToColor(18, 14, 36, 28);
      // Hue = (18/36) * 360 = 180
      // Chroma = 0.13 + (14/27) * 0.12
      expect(color).toMatch(/^oklch\(0\.65 0\.19\d* 180\)$/);
    });

    it('uses default parameters when not specified', () => {
      const color = indexToColor(12, 10);
      // Default: hueSegments=24, chromaLevels=20
      // Hue = (12/24) * 360 = 180
      // Chroma = 0.13 + (10/19) * 0.12
      expect(color).toMatch(/^oklch\(0\.65 0\.19\d* 180\)$/);
    });
  });

  describe('calculateDistance', () => {
    it('returns 0 for perfect match', () => {
      const distance = calculateDistance(5, 5, 5, 5, 24, 20);
      expect(distance).toBe(0);
    });

    it('returns 100 for maximum distance', () => {
      // Opposite hue (12 = half of 24) and max chroma difference
      const distance = calculateDistance(0, 0, 12, 19, 24, 20);
      expect(distance).toBe(100);
    });

    it('handles hue wrapping correctly (0 to 23 should be close)', () => {
      const distance = calculateDistance(0, 10, 23, 10, 24, 20);
      // Should be 1 step apart, not 23
      expect(distance).toBeLessThan(10);
    });

    it('handles hue wrapping correctly (23 to 0 should be close)', () => {
      const distance = calculateDistance(23, 10, 0, 10, 24, 20);
      expect(distance).toBeLessThan(10);
    });

    it('is symmetric (A to B equals B to A)', () => {
      const distAB = calculateDistance(5, 8, 15, 12, 24, 20);
      const distBA = calculateDistance(15, 12, 5, 8, 24, 20);
      expect(distAB).toBe(distBA);
    });

    it('returns approximately 50 for half hue distance', () => {
      // Half of max hue distance (6 steps in 24 = 1/4 of circle)
      // With same chroma
      const distance = calculateDistance(0, 10, 6, 10, 24, 20);
      expect(distance).toBeGreaterThan(30);
      expect(distance).toBeLessThan(50);
    });

    it('returns approximately 50 for half chroma distance', () => {
      // Same hue, half chroma distance
      const distance = calculateDistance(5, 0, 5, 10, 24, 20);
      expect(distance).toBeGreaterThan(30);
      expect(distance).toBeLessThan(50);
    });

    it('works with simple complexity', () => {
      const distance = calculateDistance(0, 0, 6, 9, 12, 10);
      expect(distance).toBe(100);
    });

    it('works with complex complexity', () => {
      const distance = calculateDistance(0, 0, 18, 27, 36, 28);
      expect(distance).toBe(100);
    });

    it('returns integer between 0 and 100', () => {
      for (let i = 0; i < 20; i++) {
        const h1 = Math.floor(Math.random() * 24);
        const s1 = Math.floor(Math.random() * 20);
        const h2 = Math.floor(Math.random() * 24);
        const s2 = Math.floor(Math.random() * 20);
        const distance = calculateDistance(h1, s1, h2, s2, 24, 20);
        expect(Number.isInteger(distance)).toBe(true);
        expect(distance).toBeGreaterThanOrEqual(0);
        expect(distance).toBeLessThanOrEqual(100);
      }
    });

    it('uses default parameters when not specified', () => {
      const distance = calculateDistance(0, 0, 12, 19);
      expect(distance).toBe(100);
    });
  });

  describe('getRandomTarget', () => {
    it('returns object with hue and saturation', () => {
      const target = getRandomTarget();
      expect(target).toHaveProperty('hue');
      expect(target).toHaveProperty('saturation');
    });

    it('returns integers', () => {
      const target = getRandomTarget();
      expect(Number.isInteger(target.hue)).toBe(true);
      expect(Number.isInteger(target.saturation)).toBe(true);
    });

    it('returns values in range for simple complexity', () => {
      for (let i = 0; i < 50; i++) {
        const target = getRandomTarget('simple');
        expect(target.hue).toBeGreaterThanOrEqual(0);
        expect(target.hue).toBeLessThan(12);
        expect(target.saturation).toBeGreaterThanOrEqual(0);
        expect(target.saturation).toBeLessThan(10);
      }
    });

    it('returns values in range for normal complexity', () => {
      for (let i = 0; i < 50; i++) {
        const target = getRandomTarget('normal');
        expect(target.hue).toBeGreaterThanOrEqual(0);
        expect(target.hue).toBeLessThan(24);
        expect(target.saturation).toBeGreaterThanOrEqual(0);
        expect(target.saturation).toBeLessThan(20);
      }
    });

    it('returns values in range for complex complexity', () => {
      for (let i = 0; i < 50; i++) {
        const target = getRandomTarget('complex');
        expect(target.hue).toBeGreaterThanOrEqual(0);
        expect(target.hue).toBeLessThan(36);
        expect(target.saturation).toBeGreaterThanOrEqual(0);
        expect(target.saturation).toBeLessThan(28);
      }
    });

    it('uses normal complexity by default', () => {
      for (let i = 0; i < 50; i++) {
        const target = getRandomTarget();
        expect(target.hue).toBeGreaterThanOrEqual(0);
        expect(target.hue).toBeLessThan(24);
        expect(target.saturation).toBeGreaterThanOrEqual(0);
        expect(target.saturation).toBeLessThan(20);
      }
    });
  });

  describe('generateGameCode', () => {
    it('returns exactly 6 characters', () => {
      const code = generateGameCode();
      expect(code).toHaveLength(6);
    });

    it('returns only uppercase letters and allowed numbers', () => {
      const code = generateGameCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    });

    it('excludes confusing characters (I, O, 0, 1)', () => {
      // Generate many codes and check none contain excluded chars
      for (let i = 0; i < 100; i++) {
        const code = generateGameCode();
        expect(code).not.toMatch(/[IO01]/);
      }
    });

    it('generates different codes on multiple calls', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateGameCode());
      }
      // Should have high uniqueness (at least 90 unique codes out of 100)
      expect(codes.size).toBeGreaterThan(90);
    });
  });
});
