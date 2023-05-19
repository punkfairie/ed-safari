import { expect } from '@jest/globals';
import { Scan } from '@kayahr/ed-journal';
import { Body } from '../src/models/Body';
import { mockObjects } from './mockData';

describe('Body', () => {
  const star     = mockObjects.star as Scan;
  const asteroid = mockObjects.asteroid as Scan;
  const planet   = mockObjects.planet as Scan;

  const body = new Body(planet);

  describe('constructor()', () => {
    it('should create Body', () => {
      expect(body).toMatchObject(planet as any);
    });

    it('should appraise body', () => {
      expect(body.mappedValue).toBeDefined();
      expect(typeof body.mappedValue).toBe('number');
    });
  });

  describe('isAsteroid()', () => {
    it('should return boolean', () => {
      expect(typeof body.isAsteroid()).toBe('boolean');
    });

    it('should return true for asteroids', () => {
      const asteroidBody = new Body(asteroid);
      expect(asteroidBody.isAsteroid()).toBe(true);
    });

    it('should return false for non-asteroids', () => {
      const starBody = new Body(star);
      expect(starBody.isAsteroid()).toBe(false);

      const planetBody = new Body(planet);
      expect(planetBody.isAsteroid()).toBe(false);
    });
  });

  describe('isPlanet()', () => {
    it('should return boolean', () => {
      expect(typeof body.isPlanet()).toBe('boolean');
    });

    it('should return true for planets', () => {
      const planetBody = new Body(planet);
      expect(planetBody.isPlanet()).toBe(true);
    });

    it('should return false for non-planets', () => {
      const starBody = new Body(star);
      expect(starBody.isPlanet()).toBe(false);

      const asteroidBody = new Body(asteroid);
      expect(asteroidBody.isPlanet()).toBe(false);
    });
  });

  describe('isStar()', () => {
    it('should return boolean', () => {
      expect(typeof body.isStar()).toBe('boolean');
    });

    it('should return true for stars', () => {
      const starBody = new Body(star);
      expect(starBody.isStar()).toBe(true);
    });

    it('should return false for non-stars', () => {
      const planetBody = new Body(planet);
      expect(planetBody.isStar()).toBe(false);

      const asteroidBody = new Body(asteroid);
      expect(asteroidBody.isStar()).toBe(false);
    });
  });

  describe('nameIcon()', () => {
    it('should return string', () => {
      expect(typeof body.nameIcon()).toBe('string');
    });
  });

  describe('simpleName()', () => {
    it('should return string', () => {
      expect(typeof body.simpleName()).toBe('string');
    });
  });

  describe('typeIcon()', () => {
    it('should return string', () => {
      expect(typeof body.typeIcon()).toBe('string');
    });
  });
});
