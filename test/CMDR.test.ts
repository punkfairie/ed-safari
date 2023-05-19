import { it, afterEach, describe } from '@jest/globals';
import { Body } from '../src/models/Body';
import { CMDR } from '../src/models/CMDR';
import { Safari } from '../src/models/Safari';
import { System } from '../src/models/System';
import { mockJournalEvents } from './mockData';

const appRoot = require('app-root-path');
const fs      = require('fs');

describe('CMDR', () => {
  let cmdr: CMDR;

  afterEach(() => {
    cmdr.shutdown();
    Safari.start().shutdown();
  });

  afterAll(() => {
    Safari.start().shutdown();
  });

  describe('constructor()', () => {

    it('should create new CMDR', () => {
      cmdr = Safari.start(false).CMDR;
      expect(cmdr).toBeInstanceOf(CMDR);
    });

    it('should set location to a System', () => {
      cmdr = Safari.start(false).CMDR;
      expect(cmdr.location).toBeInstanceOf(System);
    });

    it('should set navRoute to an array', () => {
      cmdr = Safari.start(false).CMDR;
      expect(Array.isArray(cmdr.navRoute)).toBe(true);
    });

    it('should get last FSDJump', (done) => {
      expect.assertions(1);

      cmdr = new CMDR(`${appRoot}/test_journals/FSDJump/Journal.*.log`);
      cmdr.on('ENTERED_NEW_SYSTEM', () => {
        try {
          expect(cmdr.location.name).not.toBe('Unknown');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should get Location if no FSDJump was found', (done) => {
      expect.assertions(1);

      cmdr = new CMDR(`${appRoot}/test_journals/Location/Journal.*.log`);
      cmdr.on('ENTERED_NEW_SYSTEM', () => {
        try {
          expect(cmdr.location.name).not.toBe('Unknown');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should get scanned bodies', (done) => {
      expect.assertions(2);

      cmdr = new CMDR(`${appRoot}/test_journals/ScannedBodies/Journal.*.log`);
      cmdr.on('BUILD_BODY_LIST', () => {
        try {
          expect(cmdr.location.bodies.length).toBeGreaterThan(0);
          expect(cmdr.location.bodies[0]).toBeInstanceOf(Body);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should get nav route', (done) => {
      expect.assertions(2);

      cmdr = new CMDR(`${appRoot}/test_journals/NavRoute/Journal.*.log`);
      cmdr.on('SET_NAV_ROUTE', () => {
        try {
          expect(cmdr.navRoute.length).toBeGreaterThan(0);
          expect(cmdr.navRoute[0]).toBeInstanceOf(System);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("should not get nav route when there isn't one", (done) => {
      expect.assertions(1);

      cmdr = new CMDR(`${appRoot}/test_journals/NoNavRoute/Journal.*.log`);
      cmdr.on('SET_NAV_ROUTE', () => {
        try {
          expect(cmdr.navRoute.length).toBe(0);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  describe('Journal Events', () => {
    const journalFolder = `${appRoot}/test_journals/Events`;
    const journal       = 'Journal.2023-04-25T145710.01.log';

    const testValues = [
      { eventType: 'StartJump', emit: 'ENTERING_WITCH_SPACE' },
      {
        eventType: 'FSDJump',
        emit:      'ENTERED_NEW_SYSTEM',
        prop:      'cmdr.location.name',
        value:     'LHS 119',
      },
      {
        eventType: 'Scan',
        emit:      'BODY_SCANNED',
        prop:      'cmdr.location.bodies[cmdr.location.bodies.length - 1].BodyID',
        value:     45,
      },
      { eventType: 'NavRoute', emit: 'SET_NAV_ROUTE' },
      { eventType: 'NavRouteClear', emit: 'SET_NAV_ROUTE' },
    ];

    it.each(testValues)('should detect $eventType', ({ eventType, emit, prop, value }, done) => {
      if (prop && value) expect.assertions(1);

      cmdr = new CMDR(`${journalFolder}/${eventType}`);
      cmdr.on('SET_NAV_ROUTE', () => {
        cmdr.track();

        fs.writeFile(
            `${journalFolder}/${eventType}/${journal}`,
            mockJournalEvents[eventType],
            { flag: 'a' },
            () => {
              cmdr.on(emit, () => {
                if (prop && value) {
                  expect(eval(prop)).toBe(value);
                }

                done();
              });
            },
        );
      });
    });
  });

  describe('shutdown()', () => {
    it('should shutdown', () => {
      cmdr = Safari.start().CMDR;
      expect(() => {
        cmdr.shutdown();
      }).not.toThrow();
    });
  });
});
