const EventEmitter = require('events')
const { app } = require('electron')
const fs = require('fs')
const path = require('path')
const max = require('lodash/max')
const { globSync } = require('glob')
const os = require('os')
const lineReader = require('reverse-line-reader')
const chokidar = require('chokidar')
const Tail = require('tail').Tail

// set log() to console.log() so whenever I get around to setting up a log file, I don't have to
// search and replace all the console.log()'s
const log = console.log.bind(console)

export class JournalInterface extends EventEmitter {
    constructor() {
        super()

        this.journalDir = null
        if (!app.isPackaged) { // account for WSL during development
            this.journalDir = "/mnt/c/Users/marle/Saved\ Games/Frontier\ Developments/Elite\ Dangerous/"
        } else if (os.platform() === 'win32') { // windows
            this.journalDir = os.homedir() + '\\Saved Games\\Frontier Developments\\Elite Dangerous'
        } else if (os.platform() === 'linux') { // linux
            this.journalDir = os.homedir() + '/.local/share/Steam/steamapps/compatdata/359320/pfx/drive_c/users/steamuser/Saved Games/Frontier Developments/Elite Dangerous/'
        } else {
            log(`ERROR: Journal files not found. OS: ${os.platform()}.`)
        }

        this.journalPattern = this.journalDir + "Journal.*.log"

        this.currentJournal = this.getLatestJournal()

        // lineReader seems to be async, so start async processes here
        this.currentLocation = null
        this.currentSystemBodies = null

        log('JournalInterface initialized. Attempting to find current location.')
        this.getCurrentLocation()
        .then(() => {
            log('Attempting to find scanned bodies in current system.')
            this.getScannedBodies()
        })

    }

    // https://stackoverflow.com/questions/15696218/get-the-most-recent-file-in-a-directory-node-js
    getLatestJournal() {
        const journals = globSync(this.journalPattern)

        return max(journals, file => {
            const fullPath = path.join(this.journalDir, file)
            return fs.statSync(fullPath).mtime
        })

        log(`New journal file found, now watching ${path.basename(this.currentJournal)}.`)
    }

    // get current location on setup, so if app is restarted, user can pick up where they left off
    // rather than waiting til they jump to the next system to use the program again
    async getCurrentLocation() {
        lineReader.eachLine(this.currentJournal, (raw, last) => {            
            if (raw) { // skip blank line at end of file
                const line = JSON.parse(raw)

                if (line.event === 'FSDJump') {
                    this.currentLocation = line.StarSystem
                    return false
                } else if (last) {
                    log('Warning: unable to find last hyperspace jump. Current location unknown.')
                    return false
                }
            }
        }).then(() => {
            this.emit('FSDJump')
            log(`Current location set to ${this.currentLocation}.`)
        })
    }

    // look for all scanned bodies before last FSDJump, for same reasons as getCurrentLocation()
    // if ScanType = Detailed, look at line immediately above for event = SAAScanComplete?
    async getScannedBodies() {
        const detailedScanLine = null

        lineReader.eachLine(this.currentJournal, (raw, last) => {
            if (raw) { // skip blank line at end of file
                const line = JSON.parse(raw)

                if (line.event === 'Scan') {
                    if (line.ScanType === 'Detailed') {
                        detailedScanLine = line
                    }
                }
            }
        })
    }

    // set up journal directory watcher to catch new journal files as the game seems to sometimes
    // make more than one journal per day
    // also for instances where UTC day switches over mid-play session
    watchDirectory() {
        const watcher = chokidar.watch(this.journalPattern, {usePolling: true, persistent: true})
        
        watcher.on('add', newFile => this.currentJournal = this.getLatestJournal())

        log('Watching journal folder for changes...')
    }

    // parse and handle journal lines
    parseLine(raw) {
        const line = JSON.parse(raw)
        
        if (line.event === 'FSDJump') {
            this.currentLocation = line.StarSystem
            this.emit('FSDJump')
        }
    }

    // watch the journal for changes
    watchJournal() {
        const tail = new Tail(this.currentJournal, {useWatchFile: true})

        log(`Watching ${path.basename(this.currentJournal)}...`)

        tail.on('line', data => this.parseLine(data))
        tail.on('error', err => console.log(err))
    }
}