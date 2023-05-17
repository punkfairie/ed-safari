import {expect, it} from '@jest/globals';
import {Body} from '../src/models/Body';
import {Safari} from '../src/models/Safari';
import {Journal} from '../src/models/Journal';
import {System} from '../src/models/System';
import {writeFileSync} from 'node:fs';

const appRoot = require('app-root-path');

const journalFolder = `${appRoot}/test_journals`;

describe('Journal', () => {
  describe('constructor()', () => {
    it('should create new Journal', () => {
      const journal = Safari.start(false, true).journal;
      expect(journal).toBeInstanceOf(Journal);
    });

    it('should set location to a System', () => {
      const journal = Safari.start(false, true).journal;
      expect(journal.location).toBeInstanceOf(System);
    });

    it('should set navRoute to an array', () => {
      const journal = Safari.start(false, true).journal;
      expect(Array.isArray(journal.navRoute)).toBe(true);
    });

    it('should get last FSDJump', (done) => {
      const journal = new Journal(`${journalFolder}/hasFSDJump.log`);
      journal.on('ENTERED_NEW_SYSTEM', () => {
        try {
          expect(journal.location.name).not.toBe('Unknown');
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('should get Location if no FSDJump was found', (done) => {
      const journal = new Journal(`${journalFolder}/noFSDJump.log`);
      journal.on('ENTERED_NEW_SYSTEM', () => {
        try {
          expect(journal.location.name).not.toBe('Unknown');
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('should get scanned bodies', (done) => {
      const journal = new Journal(`${journalFolder}/hasScannedBodies.log`);
      journal.on('BUILD_BODY_LIST', () => {
        try {
          expect(journal.location.bodies.length).toBeGreaterThan(0);
          expect(journal.location.bodies[0]).toBeInstanceOf(Body);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('API', () => {
    it('should get nav route', (done) => {
      const journal = new Journal(`${journalFolder}/NavRoute/Journal.log`);
      journal.on('SET_NAV_ROUTE', () => {
        try {
          expect(journal.navRoute.length).toBeGreaterThan(0);
          expect(journal.navRoute[0]).toBeInstanceOf(System);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it("should not get nav route when there isn't one", (done) => {
      const journal = new Journal(`${journalFolder}/NoNavRoute/Journal.log`);
      journal.on('SET_NAV_ROUTE', () => {
        try {
          expect(journal.navRoute.length).toBe(0);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    describe('Journal events', () => {
      it('should detect start of hyperspace jump', (done) => {
        const path = `${journalFolder}/Events/StartJump/Journal.log`;
        const journal = new Journal(path);

        journal.on('SET_NAV_ROUTE', () => {
          journal.watch();

          const data = '{ "timestamp":"2023-05-08T19:11:12Z", "event":"StartJump", "JumpType":"Hyperspace", "StarSystem":"LHS 6427", "SystemAddress":22660650116513, "StarClass":"M" }\n';
          writeFileSync(path, data, {flag: 'a'});

          journal.on('ENTERING_WITCH_SPACE', () => {
            journal.shutdown();
            done();
          });
        });
      }, 6000);

      it('should detect FSDJump', (done) => {
        const path = `${journalFolder}/Events/FSDJump/Journal.log`;
        const journal = new Journal(path);

        journal.on('SET_NAV_ROUTE', () => {
          journal.watch();

          const data = '{ "timestamp":"2023-05-08T19:13:52Z", "event":"FSDJump", "Taxi":false, "Multicrew":false, "StarSystem":"LHS 119", "SystemAddress":18262603605409, "StarPos":[-30.15625,-21.87500,-17.25000], "SystemAllegiance":"", "SystemEconomy":"$economy_None;", "SystemEconomy_Localised":"None", "SystemSecondEconomy":"$economy_None;", "SystemSecondEconomy_Localised":"None", "SystemGovernment":"$government_None;", "SystemGovernment_Localised":"None", "SystemSecurity":"$GAlAXY_MAP_INFO_state_anarchy;", "SystemSecurity_Localised":"Anarchy", "Population":0, "Body":"LHS 119 A", "BodyID":1, "BodyType":"Star", "JumpDist":8.575, "FuelUsed":0.982384, "FuelLevel":127.017616 }\n';
          writeFileSync(path, data, {flag: 'a'});

          journal.on('ENTERED_NEW_SYSTEM', () => {
            journal.shutdown();
            done();
          });
        });
      }, 6000);

      it('should detect Scan', (done) => {
        const path = `${journalFolder}/Events/Scan/Journal.log`;
        const journal = new Journal(path);

        journal.on('SET_NAV_ROUTE', () => {
          journal.watch();

          const data = '{ "timestamp":"2023-05-08T20:38:19Z", "event":"Scan", "ScanType":"AutoScan", "BodyName":"Aten B A Belt Cluster 2", "BodyID":45, "Parents":[ {"Ring":43}, {"Star":2}, {"Null":0} ], "StarSystem":"Aten", "SystemAddress":16063580284321, "DistanceFromArrivalLS":79972.251687, "WasDiscovered":true, "WasMapped":false }\n';
          writeFileSync(path, data, {flag: 'a'});

          journal.on('BODY_SCANNED', () => {
            journal.shutdown();
            done();
          })
        });
      }, 6000);

      it('should detect NavRoute', (done) => {
        const path = `${journalFolder}/Events/NavRoute/Journal.log`;
        const journal = new Journal(path);

        journal.on('SET_NAV_ROUTE', () => {
          journal.watch();

          const data = '{ "timestamp":"2023-05-09T23:12:00Z", "event":"NavRoute" }\n';
          writeFileSync(path, data, {flag: 'a'});

          journal.on('SET_NAV_ROUTE', () => {
            journal.shutdown();
            done();
          });
        });
      }, 6000);

      it('should detect NavRouteClear', (done) => {
        const path = `${journalFolder}/Events/NavRouteClear/Journal.log`;
        const journal = new Journal(path);

        journal.on('SET_NAV_ROUTE', () => {
          journal.watch();

          const data = '{ "timestamp":"2023-04-15T04:09:39Z", "event":"NavRouteClear" }\n';
          writeFileSync(path, data, {flag: 'a'});

          journal.on('SET_NAV_ROUTE', () => {
            journal.shutdown();
            done();
          });
        });
      }, 6000);
    });
  });

  describe('shutdown()', () => {
    it('should shutdown', () => {
      const journal = Safari.start(false, true).journal;
      expect(() => {
        journal.shutdown();
      }).not.toThrow();
    });
  });
});
