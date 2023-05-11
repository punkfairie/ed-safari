import { Tail as TailType } from 'tail'
import type { autoScan, completeFsdJump, detailedScan, journalEntry, planetScan } from '../@types/journalLines'
import { Body } from '../models/Body'
import { System } from '../models/System'

const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const { globSync } = require('glob')
const os = require('os')
const lineReader = require('reverse-line-reader')
const chokidar = require('chokidar')
const Tail = require('tail').Tail
import { maxBy, findIndex, find } from 'lodash'

// Set log() to console.log() so whenever I get around to setting up a log file, I don't have to
// search and replace all the console.log()'s.
const log = console.log.bind(console)

export class JournalInterface extends EventEmitter {
    journalDir: null|string
    journalPattern: string
    currentJournal: string|undefined
    location: System


    constructor(isPackaged: boolean) {
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
        log(`New journal file found, now watching ${path.basename(this.currentJournal)}.`)

        // LineReader seems to be async, so start async processes here.
        this.location = new System('Unknown')

        log('JournalInterface initialized. Attempting to find current location.')
        this.getCurrentLocation()
    }

    /* -------------------------------------------------------------------- getLatestJournal ---- */

    // https://stackoverflow.com/questions/15696218/get-the-most-recent-file-in-a-directory-node-js
    getLatestJournal(): string|undefined {
        const journals = globSync(this.journalPattern)

        return maxBy(journals, file => {
            return fs.statSync(file).mtime
        })
    }

    /* ------------------------------------------------------------------ getCurrentLocation ---- */

    // Get current location on setup, so if app is restarted, user can pick up where they left off
    // Rather than waiting til they jump to the next system to use the program again.
    getCurrentLocation(): void {
        lineReader.eachLine(this.currentJournal, (raw: string, last: boolean) => {            
            if (raw) { // skip blank line at end of file
                const line = JSON.parse(raw)

                if (line.event === 'FSDJump') {
                    this.location = new System(line.StarSystem)
                    log(`Current location set to ${this.location.name}.`)
                    this.emit('ENTERED_NEW_SYSTEM')
                    return false
                } else if (last) {
                    log('Unable to find last hyperspace jump. Searching for last known location.')
                    return false
                }
            }
        }).then(() => {
            lineReader.eachLine(this.currentJournal, (raw: string, last: boolean) => {
                if (raw) {
                    const line = JSON.parse(raw)

                    if (line.event === 'Location') {
                        this.location = new System(line.StarSystem)
                        log(`Current location set to ${this.location.name}.`)
                        this.emit('ENTERED_NEW_SYSTEM')
                        return false
                    } else if (last) {
                        log('WARNING: Unable to find last known location.')
                        return false
                    }
                }
            }).then(() => {
                if (this.location.name !== 'Unknown') {
                    log('Attempting to find scanned bodies in current system.')
                    this.getScannedBodies()
                }
            })
        })
    }

    /* -------------------------------------------------------------------- getScannedBodies ---- */

    // Look for all scanned bodies before last FSDJump, for same reasons as getCurrentLocation().
    getScannedBodies(): void {
        let detailedScanLine: detailedScan|null = null

        lineReader.eachLine(this.currentJournal, (raw: string, last: boolean) => {
            
            if (raw) { // Skip blank line at end of file.
                const line: journalEntry = JSON.parse(raw)

                // Check if previous line was ScanType = Detailed, and handle that.
                if (detailedScanLine !== null) {
                    if (line.event === 'SAAScanComplete') {
                        // This was a DSS, so add to list with DSS flag set to true.
                        this.location.bodies.push(new Body(detailedScanLine, true))
                    } else {
                        // Else, check that the body hasn't already been added (by a DSS scan line).
                        let dupChecker = {'BodyName': detailedScanLine.BodyName, 'BodyID': detailedScanLine.BodyID}
                        let r = find(this.location.bodies, dupChecker)

                        if (r === undefined) {
                            // Body was not already logged, so add to list.
                            this.location.bodies.push(new Body(detailedScanLine))
                        }
                    }

                    // Finally, clear the variable.
                    detailedScanLine = null
                }

                // Now move on to evaluating the current line.
                if (line.event === 'Scan' && 'ScanType' in line) {
                    // If ScanType = Detailed and body is not a star, save the line so we can check 
                    // the one immediately above for event = SAAScanComplete, which indicates this 
                    // was a DSS.
                    if (line.ScanType === 'Detailed' && !('StarType' in line)) {
                        detailedScanLine = (line as detailedScan)

                    } else if ('StarType' in line) { // Save stars to bodies list.
                        this.location.bodies.push(new Body((line as autoScan|detailedScan)))

                    } else if (line.ScanType === 'AutoScan') { // Save auto/discovery scan bodies.
                        // Check if planet, and then do the duplicate check (otherwise it's an
                        // astroid, as we've already accounted for stars).
                        if ('PlanetClass' in line) {
                            let dupChecker = {'BodyName': (line as planetScan<'AutoScan'>).BodyName, 'BodyID': (line as planetScan<'AutoScan'>).BodyID}
                            let r = find(this.location.bodies, dupChecker)

                            if (r === undefined) {
                                this.location.bodies.push(new Body((line as autoScan)))
                            }

                        } else { // Asteroids.
                            this.location.bodies.push(new Body((line as autoScan)))
                        }
                    }
                } else if (line.event === 'FSDJump') {
                    // Stop evaluating once we reach the beginning of current system entries.
                    return false
                }
            }
        }).then(() => {
            log('Scanned bodies found.')
            this.emit('INIT_COMPLETE')
        })
    }

    /* ---------------------------------------------------------------------- watchDirectory ---- */

    // Set up journal directory watcher to catch new journal files as the game seems to sometimes
    // make more than one journal per day.
    // Also for instances where UTC day switches over mid-play session.
    watchDirectory(): void {
        const watcher = chokidar.watch(this.journalPattern, {usePolling: true, persistent: true})
        
        watcher.on('add', () => this.currentJournal = this.getLatestJournal())

        log('Watching journal folder for changes...')
    }

    /* ----------------------------------------------------------------------- parseScanLine ---- */

    // Parse and handle scan lines.
    parseScanLine(line: autoScan|detailedScan, DSS: boolean = false) {
        const dupChecker = {'BodyName': line.BodyName, 'BodyID': line.BodyID}
        let body: Body|null = null

        // If it's a DSS scan, then we should have already added the body to the list. But we'll
        // check to make sure.
        if (DSS) {
            // Using findIndex() rather than find() so we can edit the body if found.
            // @ts-ignore since it doesn't understand dupChecker is a valid predicate.
            let bodyIndex: number = findIndex(this.location.bodies, dupChecker)

            if (bodyIndex > -1) { // Body was found in list, so simply toggle the DSS flag.
                body = (this.location.bodies[bodyIndex] as Body)
                body.DSSDone = true
            } else { // Body was missed on initial journal scan, so add it to the list.
                body = new Body(line, true)
                this.location.bodies.push(body)
            }
            
        }  else { // Otherwise it's an FSS or auto scan, and needs to be added to the list.
            // Probably overkill, but do a duplicate check just in case.
            let r = find(this.location.bodies, dupChecker)
            
            if (r === undefined) {
                body = new Body(line)
                this.location.bodies.push(body)
            }
        }

        log(`Scan detected. Body: ${line.BodyName}.`)
        this.emit('BODY_SCANNED', body, DSS)
    }

    /* ------------------------------------------------------------------------- getNavRoute ---- */

    getNavRoute() {

    }

    /* --------------------------------------------------------------------------- parseLine ---- */

    // Parse and handle journal lines.
    parseLine(raw: string) {
        const line: journalEntry = JSON.parse(raw)
        let DSSFlag: boolean = false

        switch (line.event) {
            // CMDR jumped to new system, so update current location.
            case 'FSDJump': {
                this.location = new System((line as completeFsdJump).StarSystem)
                log(`FSD Jump detected, current location updated to ${this.location.name}.`)
                this.emit('ENTERED_NEW_SYSTEM')
                break
            }

            // CMDR completed DSS scan, so set flag for when next line processes and we want to
            // figure out what kind of scan occurred.
            case 'SAAScanComplete': {
                DSSFlag = true
                break
            }

            // A scan occurred, so let's hand that info off to the appropriate function and then
            // reset the DSS flag.
            case 'Scan': {
                this.parseScanLine((line as autoScan|detailedScan), DSSFlag)
                DSSFlag = false
                break
            }

            case 'NavRoute': {
                this.getNavRoute()
                break
            }
        }
    }

    /* ------------------------------------------------------------------------ watchJournal ---- */

    // Watch the journal for changes.
    watchJournal(): void {
        const tail: TailType = new Tail(this.currentJournal, {useWatchFile: true})

        log(`Watching ${path.basename(this.currentJournal)}...`)

        tail.on('line', data => data ? this.parseLine(data) : undefined)
        tail.on('error', err => log(`Tail error in JournalInterface.watchJournal(): ${err}`))
    }
}