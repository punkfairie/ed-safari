import { Log } from './Log';
import { CMDR } from './CMDR';

const EventEmitter = require('events');
const os           = require('os');
const path         = require('path');

export class Safari extends EventEmitter {
  static #instance?: Safari;
  readonly #journalDir?: string;
  readonly #journalPattern?: string;
  CMDR?: CMDR;

  private constructor(isPackaged: boolean = true) {
    super();

    this.#journalDir = this.#getJournalDir(isPackaged);

    if (this.#journalDir) {
      this.#journalPattern = path.join(this.#journalDir, 'Journal.*.log');
      this.CMDR            = new CMDR(this.#journalPattern as string);
    }

    Log.write(`Safari initialized.`);
  }

  /* --------------------------------------------------------------------------------- start ---- */

  static start(isPackaged: boolean = true): Safari {
    if (!Safari.#instance) {
      Safari.#instance = new Safari(isPackaged);
    }

    return Safari.#instance;
  }

  /* ------------------------------------------------------------------------ #getJournalDir ---- */

  #getJournalDir(isPackaged: boolean): string|undefined {
    let dir: string|undefined;

    if (!isPackaged && os.platform() === 'linux') {
      dir = require('app-root-path').resolve('/test_journals');

    } else if (os.platform() === 'win32') {
      dir = path.join(
          os.homedir(),
          'Saved Games',
          'Frontier Developments',
          'Elite Dangerous',
      );

    } else if (os.platform() === 'linux') { // Linux
      dir = path.join(
          os.homedir(),
          '.local',
          'share',
          'Steam',
          'steamapps',
          'compatdata',
          '359320',
          'pfx',
          'drive_c',
          'steamuser',
          'Saved Games',
          'Frontier Developments',
          'Elite Dangerous',
      );

    } else {
      Log.write(`ERROR: Journal files not found. OS: ${os.platform()}.`);
    }

    return dir;
  }

  /* ------------------------------------------------------------------------------ shutdown ---- */

  shutdown(): void {
    this.CMDR?.shutdown();
    Safari.#instance = undefined;
  }
}
