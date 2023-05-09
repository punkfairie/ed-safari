import { Body } from './Body'
import { System } from './System'

const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const max = require('lodash/max')
const { globSync } = require('glob')
const os = require('os')
const lineReader = require('reverse-line-reader')
const chokidar = require('chokidar')
const Tail = require('tail').Tail
const find = require('lodash/find')

// Set log() to console.log() so whenever I get around to setting up a log file, I don't have to
// search and replace all the console.log()'s.
const log = console.log.bind(console)

export class JournalInterface extends EventEmitter {
    constructor(isPackaged) {
        super()

        this.journalDir = null
        if (!isPackaged) { // Account for WSL during development
            this.journalDir = "/mnt/c/Users/marle/Saved\ Games/Frontier\ Developments/Elite\ Dangerous/"
        } else if (os.platform() === 'win32') { // Windows
            this.journalDir = os.homedir() + '\\Saved Games\\Frontier Developments\\Elite Dangerous'
        } else if (os.platform() === 'linux') { // Linux
            this.journalDir = os.homedir() + '/.local/share/Steam/steamapps/compatdata/359320/pfx/drive_c/users/steamuser/Saved Games/Frontier Developments/Elite Dangerous/'
        } else {
            log(`ERROR: Journal files not found. OS: ${os.platform()}.`)
        }

        this.journalPattern = this.journalDir + "Journal.*.log"

        this.currentJournal = this.getLatestJournal()

        // LineReader seems to be async, so start async processes here.
        this.currentLocation = null

        log('JournalInterface initialized. Attempting to find current location.')
        this.getCurrentLocation()
        .then(() => {
            log('Attempting to find scanned bodies in current system.')
            this.getScannedBodies()
            .then(() => {
                log('Scanned bodies found.')
                this.emit('SCANNED_BODIES_FOUND')
            })
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

    // Get current location on setup, so if app is restarted, user can pick up where they left off
    // Rather than waiting til they jump to the next system to use the program again.
    async getCurrentLocation() {
        return lineReader.eachLine(this.currentJournal, (raw, last) => {            
            if (raw) { // skip blank line at end of file
                const line = JSON.parse(raw)

                if (line.event === 'FSDJump') {
                    this.currentLocation = new System(line.StarSystem)
                    log(`Current location set to ${this.currentLocation.name}.`)
                    this.emit('FSDJump')
                    return false
                } else if (last) {
                    log('Warning: unable to find last hyperspace jump. Current location unknown.')
                    return false
                }
            }
        })
    }

    // Look for all scanned bodies before last FSDJump, for same reasons as getCurrentLocation().
    async getScannedBodies() {
        let detailedScanLine = null

        return lineReader.eachLine(this.currentJournal, (raw, last) => {
            
            if (raw) { // Skip blank line at end of file.
                const line = JSON.parse(raw)

                // Check if previous line was ScanType = Detailed, and handle that.
                if (detailedScanLine !== null) {
                    if (line.event === 'SAAScanComplete') {
                        // This was a DSS, so set the DSS flag to true and add to list.
                        detailedScanLine.DSSDone = true
                        this.currentLocation.bodies.push(Object.assign(new Body, detailedScanLine))
                    } else {
                        // Else, check that the body hasn't already been added (by a DSS scan line).
                        let r = find(this.currentLocation.bodies, ['BodyID', detailedScanLine.BodyID])

                        if (r === undefined) {
                            // Set DSS flag if body was not already logged, then add to list.
                            detailedScanLine.DSSDone = false
                            this.currentLocation.bodies.push(Object.assign(new Body, detailedScanLine))
                        }
                    }

                    // Finally, clear the variable.
                    detailedScanLine = null
                }

                // Now move on to evaluating the current line.
                if (line.event === 'Scan') {
                    // If ScanType = Detailed and body is not a star, save the line so we can check 
                    // the one immediately above for event = SAAScanComplete, which indicates this 
                    // was a DSS.
                    if (line.ScanType === 'Detailed' && line.StarType === undefined) {
                        detailedScanLine = line

                    } else if (line.StarType !== undefined) { // Save stars to bodies list.
                        this.currentLocation.bodies.push(Object.assign(new Body, line))

                    } else if (line.ScanType === 'AutoScan') { // Save auto/discovery scan bodies.
                        // Check if planet, and then do the duplicate check (otherwise it's an
                        // astroid, as we've already accounted for stars).
                        if (line.PlanetClass !== undefined) {
                            let r = find(this.currentLocation.bodies, ['BodyID', line.BodyID])

                            if (r === undefined) {
                                line.DSSDone = false
                                this.currentLocation.bodies.push(Object.assign(new Body, line))
                            }

                        } else { // Asteroids.
                            this.currentLocation.bodies.push(Object.assign(new Body, line))
                        }
                    }
                } else if (line.event === 'FSDJump') {
                    // Stop evaluating once we reach the beginning of current system entries.
                    return false
                }
            }
        })
    }

    // Set up journal directory watcher to catch new journal files as the game seems to sometimes
    // make more than one journal per day.
    // Also for instances where UTC day switches over mid-play session.
    watchDirectory() {
        const watcher = chokidar.watch(this.journalPattern, {usePolling: true, persistent: true})
        
        watcher.on('add', newFile => this.currentJournal = this.getLatestJournal())

        log('Watching journal folder for changes...')
    }

    // Parse and handle journal lines.
    parseLine(raw) {
        const line = JSON.parse(raw)
        
        if (line.event === 'FSDJump') {
            this.currentLocation = new System(line.StarSystem)
            this.emit('FSDJump')
        }
    }

    // Watch the journal for changes.
    watchJournal() {
        const tail = new Tail(this.currentJournal, {useWatchFile: true})

        log(`Watching ${path.basename(this.currentJournal)}...`)

        tail.on('line', data => this.parseLine(data))
        tail.on('error', err => console.log(err))
    }
}