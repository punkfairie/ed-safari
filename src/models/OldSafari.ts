const chokidar     = require('chokidar');
const fs           = require('node:fs');
const { globSync } = require('glob');
const os           = require('node:os');
const path         = require('node:path');

import { Journal } from './Journal';
import { Log } from './Log';
import * as _ from 'lodash-es';

export class Safari {
  static #instance: Safari;

  readonly #journalDir?: string;
  readonly #journalPattern?: string;
  journal?: Journal;

  #watcher?: any;

  private constructor(isPackaged: boolean = false) {
    if (!isPackaged && os.platform() === 'linux') {
      this.#journalDir = require('app-root-path').resolve('/test_journals');

    } else if (os.platform() === 'win32') { // Windows
      this.#journalDir = path.join(
          os.homedir(),
          'Saved Games',
          'Frontier Developments',
          'Elite Dangerous',
      );

    } else if (os.platform() === 'linux') { // Linux
      this.#journalDir = path.join(
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

    if (this.#journalDir) {
      this.#journalPattern = path.join(this.#journalDir, 'Journal.*.log');
      this.journal         = this.#getLatestJournal();
    }
  }

  static start(isPackaged: boolean = false): Safari {
    if (!Safari.#instance) {
      Safari.#instance = new Safari(isPackaged);
    }

    return Safari.#instance;
  }

  /* ------------------------------------------------------------------- #getLatestJournal ---- */

  // https://stackoverflow.com/questions/15696218/get-the-most-recent-file-in-a-directory-node-js
  #getLatestJournal(): Journal|undefined {
    // @ts-ignore
    const journals                      = globSync(
        this.#journalPattern,
        { windowsPathsNoEscape: true },
    );
    const journalPath: string|undefined = _.maxBy(journals, file => fs.statSync(file).mtime);

    if (journalPath) {
      Log.write(`New journal file found, now watching ${path.basename(journalPath)}.`);
      return new Journal(journalPath);
    } else {
      Log.write('ERROR: Unable to find latest journal.');
      return;
    }
  }

  /* --------------------------------------------------------------------- watchJournalDir ---- */

  watchJournalDir(): void {
    const options = { usePolling: true, persistent: true, ignoreInitial: true };
    // @ts-ignore
    this.#watcher = chokidar.watch(this.#journalPattern, options);

    this.#watcher.on('ready', () => Log.write('Watching journal folder for changes...'));
    this.#watcher.on('add', () => this.journal = this.#getLatestJournal());
  }

  /* ---------------------------------------------------------------------------- shutdown ---- */

  async shutdown(): Promise<void> {
    this.journal?.shutdown();
    await this.#watcher?.close();
  }
}
