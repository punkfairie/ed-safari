import {expect} from '@jest/globals';
import type {autoScan} from '../src/@types/journalLines';
import {Body} from '../src/models/Body';

describe('Body', () => {
  const star: autoScan = {
    'timestamp':             '2023-05-08T19:13:58Z',
    'event':                 'Scan',
    'ScanType':              'AutoScan',
    'BodyName':              'LHS 119 A',
    'BodyID':                1,
    'Parents':               [{'Null': 0}],
    'StarSystem':            'LHS 119',
    'SystemAddress':         18262603605409,
    'DistanceFromArrivalLS': 0.000000,
    'StarType':              'M',
    'Subclass':              4,
    'StellarMass':           0.214844,
    'Radius':                267243648.000000,
    'AbsoluteMagnitude':     11.148788,
    'Age_MY':                11724,
    'SurfaceTemperature':    2175.000000,
    'Luminosity':            'V',
    'SemiMajorAxis':         3448964357376.098633,
    'Eccentricity':          0.010115,
    'OrbitalInclination':    -105.666674,
    'Periapsis':             272.289207,
    'OrbitalPeriod':         18957803249.359131,
    'AscendingNode':         -65.823206,
    'MeanAnomaly':           326.300292,
    'RotationPeriod':        131207.524554,
    'AxialTilt':             0.000000,
    'WasDiscovered':         true,
    'WasMapped':             false,
  };
  const asteroid: autoScan = {
    'timestamp':             '2023-05-08T20:34:25Z',
    'event':                 'Scan',
    'ScanType':              'AutoScan',
    'BodyName':              'Aten A A Belt Cluster 8',
    'BodyID':                11,
    'Parents':               [{'Ring': 3}, {'Star': 1}, {'Null': 0}],
    'StarSystem':            'Aten',
    'SystemAddress':         16063580284321,
    'DistanceFromArrivalLS': 4.171922,
    'WasDiscovered':         true,
    'WasMapped':             false,
  };
  const planet: autoScan = {
    'timestamp':             '2023-05-04T19:15:34Z',
    'event':                 'Scan',
    'ScanType':              'AutoScan',
    'BodyName':              'Col 285 Sector SL-B b14-5 A 2',
    'BodyID':                13,
    'Parents':               [{'Star': 1}, {'Null': 0}],
    'StarSystem':            'Col 285 Sector SL-B b14-5',
    'SystemAddress':         11662043981201,
    'DistanceFromArrivalLS': 14.736108,
    'TidalLock':             true,
    'TerraformState':        '',
    'PlanetClass':           'High metal content body',
    'Atmosphere':            '',
    'AtmosphereType':        'None',
    'Volcanism':             '',
    'MassEM':                0.134842,
    'Radius':                3279249.500000,
    'SurfaceGravity':        4.997877,
    'SurfaceTemperature':    478.828308,
    'SurfacePressure':       0.000000,
    'Landable':              true,
    'Materials':             [
      {'Name': 'iron', 'Percent': 21.042704},
      {'Name': 'nickel', 'Percent': 15.915817},
      {'Name': 'sulphur', 'Percent': 15.119031},
      {'Name': 'carbon', 'Percent': 12.713538},
      {'Name': 'chromium', 'Percent': 9.463602},
      {'Name': 'manganese', 'Percent': 8.690421},
      {'Name': 'phosphorus', 'Percent': 8.139426},
      {'Name': 'vanadium', 'Percent': 5.167356},
      {'Name': 'niobium', 'Percent': 1.438156},
      {'Name': 'tin', 'Percent': 1.371430},
      {'Name': 'antimony', 'Percent': 0.938514},
    ],
    'Composition':           {'Ice': 0.000000, 'Rock': 0.675801, 'Metal': 0.324199},
    'SemiMajorAxis':         4417732596.397400,
    'Eccentricity':          0.000022,
    'OrbitalInclination':    0.000008,
    'Periapsis':             115.738785,
    'OrbitalPeriod':         272940.599918,
    'AscendingNode':         -62.515181,
    'MeanAnomaly':           244.149914,
    'RotationPeriod':        273121.869415,
    'AxialTilt':             0.183773,
    'WasDiscovered':         true,
    'WasMapped':             false,
  };

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
