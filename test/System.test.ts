// noinspection DuplicatedCode

import { expect, jest, it, beforeEach } from '@jest/globals';
import { FSDJump, Location } from '@kayahr/ed-journal';
import { Body } from '../src/models/Body';
import { CMDR } from '../src/models/CMDR';
import { EDSM } from '../src/models/EDSM';
import { ExtendedNavRouteSystem, System } from '../src/models/System';
import { mockEdsmResponses, mockObjects } from './mockData';

const appRoot = require('app-root-path');

describe('System', () => {
  beforeEach(() => {
    jest.spyOn(EDSM, 'getSystemValue').mockResolvedValue(undefined);
  });

  describe('constructor()', () => {
    it('should create new system from NavRoute', () => {
      const data = mockObjects.navRouteSystem as ExtendedNavRouteSystem;

      const system = new System(data);

      expect(system.name).toBe(data.StarSystem);
      expect(system.SystemAddress).toBe(data.SystemAddress);
      expect(system.StarClass).toBe(data.StarClass);
      expect(Array.isArray(system.bodies)).toBe(true);
    });

    it('should create new system from FsdJump', () => {
      const data   = mockObjects.FSDJumpSystem as FSDJump;
      const system = new System(data);

      expect(system.name).toBe(data.StarSystem);
      expect(system.SystemAddress).toBe(data.SystemAddress);
      expect(system.StarClass).toBeUndefined();
      expect(Array.isArray(system.bodies)).toBe(true);
    });

    it('should create new system from location', () => {
      const data   = mockObjects.LocationSystem as Location;
      const system = new System(data);

      expect(system.name).toBe(data.StarSystem);
      expect(system.SystemAddress).toBe(data.SystemAddress);
      expect(system.StarClass).toBeUndefined();
      expect(Array.isArray(system.bodies)).toBe(true);
    });
  });

  describe('System Appraisal', () => {
    it('should get system value', (done) => {
      const edsmData = mockEdsmResponses.systemValue;
      jest.spyOn(EDSM, 'getSystemValue').mockResolvedValue(edsmData);

      const data   = mockObjects.navRouteSystem as ExtendedNavRouteSystem;
      const system = new System(data);

      EDSM.connect().on('SYSTEM_APPRAISED', () => {
        expect(system.estimatedValue).toBe(edsmData.estimatedValue);
        done();
      });
    });
  });

  describe('sortBodies()', () => {
    it('should set bodies to Body[] with the same amount of elements', (done) => {
      const cmdr = new CMDR(`${appRoot}/test_journals/ScannedBodies`);

      cmdr.on('BUILD_BODY_LIST', () => {
        const before = cmdr.location.bodies;
        cmdr.location.sortBodies();
        expect(cmdr.location.bodies.length).toBe(before.length);
        expect(Array.isArray(cmdr.location.bodies)).toBe(true);
        expect(cmdr.location.bodies[0]).toBeInstanceOf(Body);
        cmdr.shutdown();
        done();
      });
    });
  });
});
