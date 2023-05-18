import type { JournalEvent, Scan } from '@kayahr/ed-journal';
import { Journal as EDJournal } from '@kayahr/ed-journal';
import { Body } from './Body';
import { Log } from './Log';
import { System } from './System';
import * as _ from 'lodash-es';

const EventEmitter      = require('events');
const reverseLineReader = require('reverse-line-reader');

export class Journal extends EventEmitter {
  readonly #path: string;
  location: System;
  navRoute: System[];
  #journal?: EDJournal;

  constructor(journalPath: string) {
    super();

    this.#path    = journalPath;
    this.location = new System();
    this.navRoute = [];

    this.#init();
  }

  /* --------------------------------------------------------------------------------- #init ---- */

  #init(): void {
    Log.write(`Journal initialized. Attempting to find current location.`);

    this.#getLastLocation().then(() => {
      if (this.location.name !== 'Unknown') {
        Log.write('Attempting to find scanned bodies in current system.');
        this.#getScannedBodies().then(async () => {

          if (this.location.bodies.length > 0) {
            Log.write('Scanned bodies found.');
            this.emit('BUILD_BODY_LIST');
          } else {
            Log.write('No scanned bodies found in current system.');
          }

          this.#journal = await EDJournal.open({ watch: true, position: 'end' });
          Log.write('Checking for nav route.');
          await this.#getNavRoute();
        });
      }
    });
  }

  /* ---------------------------------------------------------------------- #getLastLocation ---- */

  #getLastLocation(): any {
    return reverseLineReader.eachLine(this.#path, (raw: string, last: boolean) => {
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

  #getScannedBodies(): any {
    let dssLine: Scan|null = null;

    return reverseLineReader.eachLine(this.#path, (raw: string) => {
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

  async #getNavRoute(): Promise<void> {
    this.navRoute = [];

  }
}
