// noinspection DuplicatedCode

import {expect, jest, it, beforeEach} from '@jest/globals';
import {completeFsdJump, location, navRouteSystem} from '../src/@types/journalLines';
import {Body} from '../src/models/Body';
import {EDSM} from '../src/models/EDSM';
import {Journal} from '../src/models/Journal';
import {System} from '../src/models/System';

const appRoot = require('app-root-path');

describe('EDSM', () => {
  beforeEach(() => {
    const getSystemValueMock =
        jest.spyOn(EDSM, 'getSystemValue')
            .mockResolvedValue(undefined);
  });

  describe('constructor()', () => {
    it('should create new system from NavRoute', () => {
      const data: navRouteSystem = {
        'StarSystem':    'LHS 3447',
        'SystemAddress': 5306465653474,
        'StarPos':       [-43.18750, -5.28125, 56.15625],
        'StarClass':     'M',
      };
      const system = new System(data);

      expect(system.name).toBe(data.StarSystem);
      expect(system.SystemAddress).toBe(data.SystemAddress);
      expect(system.StarClass).toBe(data.StarClass);
      expect(Array.isArray(system.bodies)).toBe(true);
    });

    it('should create new system from completeFsdJump', () => {
      const data: completeFsdJump = {
        'timestamp':                     '2023-05-08T19:13:52Z',
        'event':                         'FSDJump',
        'Taxi':                          false,
        'Multicrew':                     false,
        'StarSystem':                    'LHS 119',
        'SystemAddress':                 18262603605409,
        'StarPos':                       [-30.15625, -21.87500, -17.25000],
        'SystemAllegiance':              '',
        'SystemEconomy':                 '$economy_None;',
        'SystemEconomy_Localised':       'None',
        'SystemSecondEconomy':           '$economy_None;',
        'SystemSecondEconomy_Localised': 'None',
        'SystemGovernment':              '$government_None;',
        'SystemGovernment_Localised':    'None',
        'SystemSecurity':                '$GAlAXY_MAP_INFO_state_anarchy;',
        'SystemSecurity_Localised':      'Anarchy',
        'Population':                    0,
        'Body':                          'LHS 119 A',
        'BodyID':                        1,
        'BodyType':                      'Star',
        'JumpDist':                      8.575,
        'FuelUsed':                      0.982384,
        'FuelLevel':                     127.017616,
      };
      const system = new System(data);

      expect(system.name).toBe(data.StarSystem);
      expect(system.SystemAddress).toBe(data.SystemAddress);
      expect(system.StarClass).toBeUndefined();
      expect(Array.isArray(system.bodies)).toBe(true);
    });

    it('should create new system from location', () => {
      const data: location = {
        'timestamp':                     '2023-05-09T20:30:31Z',
        'event':                         'Location',
        'Docked':                        false,
        'Taxi':                          false,
        'Multicrew':                     false,
        'StarSystem':                    'LP 292-66',
        'SystemAddress':                 2869172315553,
        'StarPos':                       [-47.15625, -35.53125, -21.18750],
        'SystemAllegiance':              'Federation',
        'SystemEconomy':                 '$economy_Refinery;',
        'SystemEconomy_Localised':       'Refinery',
        'SystemSecondEconomy':           '$economy_HighTech;',
        'SystemSecondEconomy_Localised': 'High Tech',
        'SystemGovernment':              '$government_Corporate;',
        'SystemGovernment_Localised':    'Corporate',
        'SystemSecurity':                '$SYSTEM_SECURITY_medium;',
        'SystemSecurity_Localised':      'Medium Security',
        'Population':                    320135,
        'Body':                          'LP 292-66 A',
        'BodyID':                        4,
        'BodyType':                      'Star',
        'Factions':                      [
          {
            'Name':                'Workers of LP 292-66 for Equality',
            'FactionState':        'None',
            'Government':          'Democracy',
            'Influence':           0.056943,
            'Allegiance':          'Federation',
            'Happiness':           '$Faction_HappinessBand2;',
            'Happiness_Localised': 'Happy',
            'MyReputation':        0.000000,
          },
        ],
        'SystemFaction':                 {'Name': 'LFT 42 Silver Energy Co'},
      };
      const system = new System(data);

      expect(system.name).toBe(data.StarSystem);
      expect(system.SystemAddress).toBe(data.SystemAddress);
      expect(system.StarClass).toBeUndefined();
      expect(Array.isArray(system.bodies)).toBe(true);
    });
  });

  describe('System Appraisal', () => {
    it('should get system value', (done) => {
      const edsmData = {
        'id':                   13153,
        'id64':                 5306465653474,
        'name':                 'LHS 3447',
        'url':                  'https:\/\/www.edsm.net\/en\/system\/bodies\/id\/13153\/name\/LHS+3447',
        'estimatedValue':       353968,
        'estimatedValueMapped': 1164029,
        'valuableBodies':       [
          {
            'bodyId':   3195879,
            'bodyName': 'LHS 3447 A 5',
            'distance': 92282,
            'valueMax': 879114,
          },
        ],
      };
      const getSystemValueMock =
          jest.spyOn(EDSM, 'getSystemValue')
              .mockResolvedValue(edsmData);

      const data: navRouteSystem = {
        'StarSystem':    'LHS 3447',
        'SystemAddress': 5306465653474,
        'StarPos':       [-43.18750, -5.28125, 56.15625],
        'StarClass':     'M',
      };
      const system = new System(data);

      EDSM.connect().on('SYSTEM_APPRAISED', () => {
        expect(system.estimatedValue).toBe(edsmData.estimatedValue);
        done();
      });
    });
  });

  describe('sortBodies()', () => {
    it('should set bodies to Body[] with the same amount of elements', (done) => {
      const journal = new Journal(`${appRoot}/test_journals/hasScannedBodies.log`);
      journal.on('BUILD_BODY_LIST', () => {
        const before = journal.location.bodies;
        journal.location.sortBodies();
        expect(journal.location.bodies.length).toBe(before.length);
        expect(Array.isArray(journal.location.bodies)).toBe(true);
        expect(journal.location.bodies[0]).toBeInstanceOf(Body);
        done();
      });
    });
  });
});
