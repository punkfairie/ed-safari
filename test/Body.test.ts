import { expect } from '@jest/globals';
import { Scan } from '@kayahr/ed-journal';
import { Body } from '../src/models/Body';
import { mockObjects } from './mockData';

describe('Body', () => {
  const star     = mockObjects.star as Scan;
  const asteroid = mockObjects.asteroid as Scan;
  const planet   = mockObjects.planet as Scan;

  const bodyStar     = new Body(star);
  const bodyAsteroid = new Body(asteroid);
  const bodyPlanet   = new Body(planet);

  describe('constructor()', () => {
    it('should create Body', () => {
      expect(bodyPlanet).toMatchObject(planet as any);
    });

    it('should appraise body', () => {
      expect(bodyPlanet.mappedValue).toBeDefined();
      expect(typeof bodyPlanet.mappedValue).toBe('number');
    });
  });

  describe('isAsteroid()', () => {
    it('should return boolean', () => {
      expect(typeof bodyPlanet.isAsteroid()).toBe('boolean');
    });

    it('should return true for asteroids', () => {
      expect(bodyAsteroid.isAsteroid()).toBe(true);
    });

    it('should return false for non-asteroids', () => {
      expect(bodyStar.isAsteroid()).toBe(false);

      expect(bodyPlanet.isAsteroid()).toBe(false);
    });
  });

  describe('isPlanet()', () => {
    it('should return boolean', () => {
      expect(typeof bodyPlanet.isPlanet()).toBe('boolean');
    });

    it('should return true for planets', () => {
      expect(bodyPlanet.isPlanet()).toBe(true);
    });

    it('should return false for non-planets', () => {
      expect(bodyStar.isPlanet()).toBe(false);

      expect(bodyAsteroid.isPlanet()).toBe(false);
    });
  });

  describe('isStar()', () => {
    it('should return boolean', () => {
      expect(typeof bodyPlanet.isStar()).toBe('boolean');
    });

    it('should return true for stars', () => {
      expect(bodyStar.isStar()).toBe(true);
    });

    it('should return false for non-stars', () => {
      expect(bodyPlanet.isStar()).toBe(false);

      expect(bodyAsteroid.isStar()).toBe(false);
    });
  });

  describe('nameIcon()', () => {
    it('should return string', () => {
      expect(typeof bodyPlanet.nameIcon()).toBe('string');
    });

    const tests = [
      { body: bodyStar, expects: 'star', title: 'star' },
      { body: bodyAsteroid, expects: 'asteroid-4', title: 'asteroid' },
      { body: bodyPlanet, expects: 'jupiter-3', title: 'planet' },
    ];

    it.each(tests)('should return $expects for $title', ({ body, expects }) => {
      expect(body.nameIcon()).toBe(expects);
    });
  });

  describe('simpleName()', () => {
    it('should return string', () => {
      expect(typeof bodyPlanet.simpleName()).toBe('string');
    });

    it('should return Star for lonely stars', () => {
      const bodyCopy    = bodyStar;
      bodyCopy.BodyName = 'LHS 119';
      expect(bodyCopy.simpleName()).toBe('Star');
    });
  });

  describe('typeIcon()', () => {
    it('should return string', () => {
      expect(typeof bodyPlanet.typeIcon()).toBe('string');
    });

    const tests = [
      { body: bodyStar, expects: 'star', title: 'star' },
      { body: bodyAsteroid, expects: 'asteroid-4', title: 'asteroid' },
      { body: bodyPlanet, expects: 'ingot', title: 'Metal rich body' },
      { body: bodyPlanet, expects: 'ingot', title: 'High metal content body' },
      { body: bodyPlanet, expects: 'snowflake', title: 'Icy body' },
      { body: bodyPlanet, expects: 'earth', title: 'Earthlike body' },
      { body: bodyPlanet, expects: 'jupiter-1', title: 'Gas giant with water based life' },
      { body: bodyPlanet, expects: 'jupiter-1', title: 'Gas giant with ammonia based life' },
      { body: bodyPlanet, expects: 'jupiter-1', title: 'Sudarsky class I gas giant' },
      { body: bodyPlanet, expects: 'jupiter-1', title: 'Sudarsky class II gas giant' },
      { body: bodyPlanet, expects: 'jupiter-1', title: 'Sudarsky class III gas giant' },
      { body: bodyPlanet, expects: 'jupiter-1', title: 'Sudarsky class IV gas giant' },
      { body: bodyPlanet, expects: 'jupiter-1', title: 'Sudarsky class V gas giant' },
      { body: bodyPlanet, expects: 'jupiter-1', title: 'Helium rich gas giant' },
      { body: bodyPlanet, expects: 'jupiter-1', title: ' Helium gas giant' },
      { body: bodyPlanet, expects: 'asteroid-3', title: 'Rocky body' },
      { body: bodyPlanet, expects: 'asteroid-3', title: 'Rocky ice world' },
      { body: bodyPlanet, expects: 'water-drops', title: 'Water world' },
      { body: bodyPlanet, expects: 'water-drops', title: 'Ammonia world' },
      { body: bodyPlanet, expects: 'water-drops', title: 'Water giant' },
      { body: bodyPlanet, expects: 'water-drops', title: 'Water giant with life' },
    ];

    it.each(tests)('should return $expects for $title', ({ body, expects, title }) => {
      const copy = body;
      if (title !== 'star' && title !== 'asteroid') copy.PlanetClass = title;
      expect(copy.typeIcon()).toBe(expects);
    });
  });

  // TODO: body appraisal tests
});
