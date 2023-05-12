const chokidar = require('chokidar')
const fs = require('node:fs')
const { globSync } = require('glob')
import * as _ from 'lodash-es'
const os = require('node:os')
const path = require('node:path')

import { Journal } from "./Journal"
import { Log } from "./Log"

export class Safari {
    #journalDir?: string
    #journalPattern?: string
    journal?: Journal

    constructor(isPackaged: boolean) {
        if (!isPackaged) { // Account for WSL during development
            this.#journalDir = "/mnt/c/Users/marle/Saved\ Games/Frontier\ Developments/Elite\ Dangerous/"
        } else if (os.platform() === 'win32') { // Windows
            this.#journalDir = os.homedir() + '\\Saved Games\\Frontier Developments\\Elite Dangerous'
        } else if (os.platform() === 'linux') { // Linux
            this.#journalDir = os.homedir() + '/.local/share/Steam/steamapps/compatdata/359320/pfx/drive_c/users/steamuser/Saved Games/Frontier Developments/Elite Dangerous/'
        } else {
            Log.write(`ERROR: Journal files not found. OS: ${os.platform()}.`)
        }

        if (this.#journalDir) {
            this.#journalPattern = this.#journalDir + "Journal.*.log"
            this.journal = this.#getLatestJournal()
        }
    }

    /* ------------------------------------------------------------------- #getLatestJournal ---- */

    // https://stackoverflow.com/questions/15696218/get-the-most-recent-file-in-a-directory-node-js
    #getLatestJournal(): Journal|undefined {
        const journals = globSync(this.#journalPattern)
        const journalPath: string|undefined = _.maxBy(journals, file => fs.statSync(file).mtime)

        if (journalPath) {
            Log.write(`New journal file found, now watching ${path.basename(journalPath)}.`)
            return new Journal(journalPath)
        } else {
            Log.write('ERROR: Unable to find latest journal.')
            return undefined
        }
    }

    /* --------------------------------------------------------------------- watchJournalDir ---- */

    watchJournalDir(): void {
        const options = {usePolling: true, persistent: true, ignoreInitial: true}
        const watcher = chokidar.watch(this.#journalPattern, options)
        
        watcher.on('ready', () => Log.write('Watching journal folder for changes...'))
        watcher.on('add', () => this.journal = this.#getLatestJournal())
    }
}