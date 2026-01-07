import { indexToColor, calculateDistance, getRandomTarget, generateGameCode } from '@/lib/colors';
import { HUE_SEGMENTS, CHROMA_LEVELS } from '@/lib/types';

describe('colors.ts', () => {
  describe('indexToColor', () => {
    it('returns valid OKLCH color string format', () => {
      const color = indexToColor(0, 0);
      expect(color).toMatch(/^oklch\(\d+\.?\d* \d+\.?\d* \d+\.?\d*\)$/);
    });

    it('returns correct color for first cell (0, 0)', () => {
      const color = indexToColor(0, 0);
      // Hue = 0, Chroma = 0.13, Lightness = 0.65
      expect(color).toBe('oklch(0.65 0.13 0)');
    });

    it('returns correct color for last hue index', () => {
      const color = indexToColor(HUE_SEGMENTS - 1, 0);
      // Hue = ((HUE_SEGMENTS-1)/HUE_SEGMENTS) * 360
      const expectedHue = ((HUE_SEGMENTS - 1) / HUE_SEGMENTS) * 360;
      expect(color).toBe(`oklch(0.65 0.13 ${expectedHue})`);
    });

    it('returns correct color for max chroma index', () => {
      const color = indexToColor(0, CHROMA_LEVELS - 1);
      // Chroma = 0.13 + 1 * 0.12 = 0.25
      expect(color).toBe('oklch(0.65 0.25 0)');
    });

    it('returns color in middle of range', () => {
      const midHue = Math.floor(HUE_SEGMENTS / 2);
      const color = indexToColor(midHue, 0);
      // Hue = 180 (half of 360)
      expect(color).toBe('oklch(0.65 0.13 180)');
    });

    it('accepts custom grid dimensions', () => {
      const color = indexToColor(6, 5, 12, 10);
      // Hue = (6/12) * 360 = 180
      // Chroma = 0.13 + (5/9) * 0.12
      expect(color).toMatch(/^oklch\(0\.65 \d+\.?\d* 180\)$/);
    });
  });

  describe('calculateDistance', () => {
    it('returns 0 for perfect match', () => {
      const distance = calculateDistance(5, 5, 5, 5);
      expect(distance).toBe(0);
    });

    it('returns 100 for maximum distance', () => {
      // Opposite hue (half of HUE_SEGMENTS) and max chroma difference
      const distance = calculateDistance(0, 0, HUE_SEGMENTS / 2, CHROMA_LEVELS - 1);
      expect(distance).toBe(100);
    });

    it('handles hue wrapping correctly (0 to last should be close)', () => {
      const distance = calculateDistance(0, 10, HUE_SEGMENTS - 1, 10);
      // Should be 1 step apart, not HUE_SEGMENTS-1
      expect(distance).toBeLessThan(10);
    });

    it('handles hue wrapping correctly (last to 0 should be close)', () => {
      const distance = calculateDistance(HUE_SEGMENTS - 1, 10, 0, 10);
      expect(distance).toBeLessThan(10);
    });

    it('is symmetric (A to B equals B to A)', () => {
      const distAB = calculateDistance(5, 4, 15, 8);
      const distBA = calculateDistance(15, 8, 5, 4);
      expect(distAB).toBe(distBA);
    });

    it('returns approximately 50 for half hue distance', () => {
      // Quarter of the circle (HUE_SEGMENTS / 4)
      const distance = calculateDistance(0, 10, HUE_SEGMENTS / 4, 10);
      expect(distance).toBeGreaterThan(30);
      expect(distance).toBeLessThan(60);
    });

    it('returns integer between 0 and 100', () => {
      for (let i = 0; i < 20; i++) {
        const h1 = Math.floor(Math.random() * HUE_SEGMENTS);
        const s1 = Math.floor(Math.random() * CHROMA_LEVELS);
        const h2 = Math.floor(Math.random() * HUE_SEGMENTS);
        const s2 = Math.floor(Math.random() * CHROMA_LEVELS);
        const distance = calculateDistance(h1, s1, h2, s2);
        expect(Number.isInteger(distance)).toBe(true);
        expect(distance).toBeGreaterThanOrEqual(0);
        expect(distance).toBeLessThanOrEqual(100);
      }
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

    it('returns values in valid range for normal complexity', () => {
      for (let i = 0; i < 50; i++) {
        const target = getRandomTarget('normal');
        expect(target.hue).toBeGreaterThanOrEqual(0);
        expect(target.hue).toBeLessThan(24); // normal = 24 hue segments
        expect(target.saturation).toBeGreaterThanOrEqual(0);
        expect(target.saturation).toBeLessThan(20); // normal = 20 chroma levels
      }
    });

    it('returns values in valid range for simple complexity', () => {
      for (let i = 0; i < 20; i++) {
        const target = getRandomTarget('simple');
        expect(target.hue).toBeGreaterThanOrEqual(0);
        expect(target.hue).toBeLessThan(12); // simple = 12 hue segments
        expect(target.saturation).toBeGreaterThanOrEqual(0);
        expect(target.saturation).toBeLessThan(10); // simple = 10 chroma levels
      }
    });

    it('returns values in valid range for complex complexity', () => {
      for (let i = 0; i < 20; i++) {
        const target = getRandomTarget('complex');
        expect(target.hue).toBeGreaterThanOrEqual(0);
        expect(target.hue).toBeLessThan(36); // complex = 36 hue segments
        expect(target.saturation).toBeGreaterThanOrEqual(0);
        expect(target.saturation).toBeLessThan(28); // complex = 28 chroma levels
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
