import { FSDJump, Journal, JournalEvent, Scan } from '@kayahr/ed-journal';
import * as _ from 'lodash-es';
import { Body } from './Body';
import { Log } from './Log';
import { System } from './System';

const EventEmitter      = require('events');
const fs                = require('fs');
const { globSync }      = require('glob');
const path              = require('path');
const reverseLineReader = require('reverse-line-reader');

export class CMDR extends EventEmitter {
  location: System;
  #journal?: Journal;
  navRoute: System[];

  constructor(journalPattern: string) {
    super();

    this.location = new System();
    this.navRoute = [];

    const latestJournal: string|undefined = this.#getLatestJournal(journalPattern);

    if (latestJournal) {
      Log.write(`Attempting to find current location.`);
      this.#getLastLocation(latestJournal).then(() => {

        if (this.location.name !== 'Unknown') {
          Log.write('Attempting to find scanned bodies in current system.');
          this.#getScannedBodies(latestJournal).then(async () => {
            if (this.location.bodies.length > 0) {
              Log.write('Scanned bodies found.');
              this.emit('BUILD_BODY_LIST');
            } else {
              Log.write('No scanned bodies found in current system.');
            }

            this.#journal = await Journal.open({ position: 'end' });
            Log.write('Checking for nav route.');
            await this.#setNavRoute();
            await this.#journal.close();
          });
        }
      });
    }
  }

  /* --------------------------------------------------------------------- #getLatestJournal ---- */

  #getLatestJournal(journalPattern: string): string|undefined {
    const journals = globSync(journalPattern, { windowsPathsNoEscape: true });

    const journalPath: string|undefined = _.maxBy(journals, file => fs.statSync(file).mtime);

    if (journalPath) {
      Log.write(`New journal file found, now watching ${path.basename(journalPath)}.`);
    } else {
      Log.write('ERROR: Unable to find latest journal.');
    }

    return journalPath;
  }

  /* ---------------------------------------------------------------------- #getLastLocation ---- */

  #getLastLocation(latestJournal: string): any {
    return reverseLineReader.eachLine(latestJournal, (raw: string, last: boolean) => {
      if (raw) {
        const line = JSON.parse(raw);

        if (line.event === 'FSDJump' || line.event === 'Location') {
          this.location = new System(line);
          Log.write(`Current location set to ${this.location.name}.`);
          this.emit('ENTERED_NEW_SYSTEM');
          return false;
        } else if (last) {
          Log.write('WARNING: Unable to find last known location.');
          return false;
        }
      }
    });
  }

  /* --------------------------------------------------------------------- #getScannedBodies ---- */

  #getScannedBodies(latestJournal: string): any {
    let dssLine: Scan|null = null;

    return reverseLineReader.eachLine(latestJournal, (raw: string) => {
      if (raw) {
        const line: JournalEvent = JSON.parse(raw);

        if (dssLine) {
          if (line.event === 'SAAScanComplete') {
            this.location.bodies.push(new Body(dssLine, true));
          } else {
            const dupChecker = { 'BodyName': dssLine.BodyName, 'BodyID': dssLine.BodyID };
            const duplicate  = _.find(this.location.bodies, dupChecker);

            if (duplicate === undefined) {
              this.location.bodies.push(new Body(dssLine));
            }
          }

          dssLine = null;
        }

        if (line.event === 'Scan' && 'ScanType' in line) {
          if (line.ScanType === 'Detailed' && !('StarType' in line)) {
            dssLine = line as Scan;

          } else if ('StarType' in line) {
            this.location.bodies.push(new Body(line as Scan));

          } else if (line.ScanType == 'AutoScan') {
            if ('PlanetClass' in line) {
              const dupChecker = {
                'BodyName': (line as Scan).BodyName,
                'BodyID':   (line as Scan).BodyID,
              };
              const duplicate  = _.find(this.location.bodies, dupChecker);

              if (duplicate === undefined) {
                this.location.bodies.push(new Body(line as Scan));
              }

            } else { // Asteroid.
              this.location.bodies.push(new Body(line as Scan));
            }
          }
        } else if (line.event === 'FSDJump' || line.event === 'Location') {
          return false;
        }
      }
    });
  }

  /* -------------------------------------------------------------------------- #getNavRoute ---- */

  async #setNavRoute(): Promise<void> {
    this.navRoute = [];
    const route   = await this.#journal?.readNavRoute();

    if (route) {
      let push: boolean = false;
      route.Route.forEach((system) => {
        if (!push && system.SystemAddress === this.location.SystemAddress) {
          push = true;
        }

        if (push && system.SystemAddress !== this.location.SystemAddress) {
          this.navRoute?.push(new System(system));
        }
      });

      if (this.navRoute.length > 0) {
        Log.write('Nav route set.');
      } else {
        Log.write('No nav route found.');
      }

      this.emit('SET_NAV_ROUTE');
    }
  }

  /* --------------------------------------------------------------------------------- track ---- */

  async track() {
    this.#journal = await Journal.open({ watch: true, position: 'end' });

    let dssFlag: boolean = false;
    for await (const event of this.#journal) {
      switch (event.event) {
        case 'StartJump': {
          if (event.JumpType === 'Hyperspace') this.emit('ENTERING_WITCH_SPACE');
          break;
        }

        case 'FSDJump': {
          this.#hasJumped(event);
          break;
        }

        case 'SAAScanComplete': {
          dssFlag = true;
          break;
        }

        case 'Scan': {
          this.#hasScanned(event, dssFlag);
          dssFlag = false;
          break;
        }

        case 'NavRoute': {
          await this.#setNavRoute();
          break;
        }

        case 'NavRouteClear': {
          this.navRoute = [];
          Log.write('Nav route cleared.');
          this.emit('SET_NAV_ROUTE');
          break;
        }
      }
    }
  }

  /* ---------------------------------------------------------------------------- #hasJumped ---- */

  #hasJumped(event: FSDJump) {
    this.location = new System(event);
    Log.write(`FSD Jump detected, current location updated to ${this.location.name}.`);

    if (this.navRoute.length > 0) {
      _.remove(this.navRoute, (system) => system.SystemAddress === this.location.SystemAddress);
    }

    this.emit('ENTERED_NEW_SYSTEM');
  }

  /* --------------------------------------------------------------------------- #hasScanned ---- */

  #hasScanned(event: Scan, isDss: boolean) {
    const dupChecker    = { 'BodyName': event.BodyName, 'BodyID': event.BodyID };
    let body: Body|null = null;

    if (isDss) {
      const bodyIndex = _.findIndex(this.location.bodies, dupChecker);

      if (bodyIndex > -1) {
        this.location.bodies[bodyIndex].DSSDone = true;
      } else {
        body = new Body(event, true);
        this.location.bodies.push(body);
      }

    } else {
      const duplicate = _.find(this.location.bodies, dupChecker);

      if (!duplicate) {
        body = new Body(event);
        this.location.bodies.push(body);
      }
    }

    Log.write(`Scan detected. Body: ${event.BodyName}.`);
    this.emit('BODY_SCANNED', body, isDss);
  }

  /* ------------------------------------------------------------------------------ shutdown ---- */

  shutdown(): void {
    this.#journal?.close();
  }
}
