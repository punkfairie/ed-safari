import type { Tail as TailType } from 'tail'
import type { autoScan, completeFsdJump, detailedScan, journalEntry, navRoute, planetScan } from "../@types/journalLines"

const EventEmitter = require('node:events')
import * as _ from 'lodash-es'
const path = require('node:path')
const { readFile } = require('node:fs/promises')
const reverseLineReader = require('reverse-line-reader')
const Tail = require('tail').Tail

import { System } from "./System"
import { Log } from "./Log"
import { Body } from "./Body"


export class Journal extends EventEmitter {
    #path: string
    testing: string
    location: System
    navRoute: System[]

    constructor(journalPath: string) {
        super()

        this.#path = journalPath
        this.location = new System()
        this.navRoute = []

        // Start ReverseLineReader chain here.
        Log.write(`Journal initialized. Attempting to find current location.`)
        this.#getLastFsdJump()
        // -> IF no FSD Jump: this.#getLastLocation()
        // --> this.#getScannedBodies()

        this.testing = this.#path
    }

    /* --------------------------------------------------------------------- #getLastFsdJump ---- */

    // Get current location on setup, so if app is restarted, user can pick up where they left off
    // Rather than waiting til they jump to the next system to use the program again.
    #getLastFsdJump(): void {
        reverseLineReader.eachLine(this.#path, (raw: string) => {
            if (raw) { //skip blank line at end of file
                const line: journalEntry = JSON.parse(raw)

                if (line.event === 'FSDJump') {
                    this.location = new System((line as completeFsdJump))
                    Log.write(`Current location set to ${this.location.name}.`)
                    this.emit('ENTERED_NEW_SYSTEM')
                    return false
                }
            }
        }).then(() => {
            if (this.location.name === 'Unknown') {
                Log.write('Unable to find last hyperspace jump. Searching for last known location.')
                this.#getLastLocation()
            } else {
                Log.write('Attempting to find scanned bodies in current system.')
                this.#getScannedBodies()
            }
        })
    }

    /* -------------------------------------------------------------------- #getLastLocation ---- */

    // If no FSDJump found, search for a location entry as this is populated when journal is created.
    #getLastLocation(): void {
        reverseLineReader.eachLine(this.#path, (raw: string, last: boolean) => {
            // Extra check just to be sure.
            if (this.location.name !== 'Unknown') {
                return false
            }

            if (raw) {
                const line: journalEntry = JSON.parse(raw)

                if (line.event === 'Location') {
                    this.location = new System((line as completeFsdJump))
                    Log.write(`Current location set to ${this.location.name}.`)
                    this.emit('ENTERED_NEW_SYSTEM')
                    return false

                } else if (last) {
                    Log.write('WARNING: Unable to find last known location.')
                    return false
                }
            }
        }).then(() => {
            if (this.location.name !== 'Unknown') {
                Log.write('Attempting to find scanned bodies in current system.')
                this.#getScannedBodies()
            }
        })
    }

    /* ------------------------------------------------------------------- #getScannedBodies ---- */

    // Look for all scanned bodies before last FSDJump, for same reasons as getting location.
    #getScannedBodies(): void {
        let dssLine: detailedScan|null = null

        reverseLineReader.eachLine(this.#path, (raw: string) => {
            if (raw) {
                const line: journalEntry = JSON.parse(raw)

                // Check if previous line was ScanType = Detailed, and handle that.
                if (dssLine) {
                    if (line.event === 'SAAScanComplete') {
                        // This was a DSS, so add to list with DSS flag set to true.
                        this.location.bodies.push(new Body(dssLine, true))
                    } else {
                        // Else, check that the body hasn't already been added (by a DSS scan line).
                        const dupChecker = {'BodyName': dssLine.BodyName, 'BodyID': dssLine.BodyID}
                        const r = _.find(this.location.bodies, dupChecker)

                        if (r === undefined) {
                            // Body was not already logged, so add to list.
                            this.location.bodies.push(new Body(dssLine))
                        }
                    }

                    // Finally, clear the variable.
                    dssLine = null
                }

                // Now move on to evaluating the current line.
                if (line.event === 'Scan' && 'ScanType' in line) {
                    // If ScanType = Detailed and body is not a star, save the line so we can check 
                    // the one immediately above for event = SAAScanComplete, which indicates this 
                    // was a DSS.
                    if (line.ScanType === 'Detailed' && !('StarType' in line)) {
                        dssLine = (line as detailedScan)

                    } else if ('StarType' in line) { // Save stars to bodies list.
                        this.location.bodies.push(new Body((line as autoScan|detailedScan)))

                    } else if (line.ScanType === 'AutoScan') { // Save auto/discovery scan bodies.
                        // Check if planet, and then do the duplicate check (otherwise it's an
                        // astroid, as we've already accounted for stars).
                        if ('PlanetClass' in line) {
                            const dupChecker = {
                                'BodyName': (line as planetScan<'AutoScan'>).BodyName,
                                'BodyID': (line as planetScan<'AutoScan'>).BodyID,
                            }
                            const r = _.find(this.location.bodies, dupChecker)

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
            if (this.location.bodies.length > 0) {
                Log.write('No scanned bodies found in current system.')
                this.emit('BUILD_BODY_LIST')
            } else {
                Log.write('Scanned bodies found.')
            }

            Log.write('Checking for nav route.')
            this.#getNavRoute()
        })
    }

    /* ------------------------------------------------------------------------ #getNavRoute ---- */

    async #getNavRoute(): Promise<void> {
        this.navRoute = [] // Clear previous route, to catch overwritten routes.
        let routeFile: string|null = null

        try {
            const filePath: string = path.dirname(this.#path) + '/NavRoute.json'
            routeFile = await readFile(filePath, {encoding: 'utf8'})
        } catch (err) {
            Log.write(`Error reading nav route file: ${err.message}.`)
        }

        if (routeFile) {
            const route: navRoute = JSON.parse(routeFile)

            // system -> skip
            // CURRENT -> push = true; skip
            // system -> push
            let push: boolean = false
            route.Route.forEach((system) => {
                if (!push && system.SystemAddress === this.location.SystemAddress) {
                    push = true
                }

                if (push && system.SystemAddress !== this.location.SystemAddress) {
                    this.navRoute.push(new System(system))
                }
            })

            if (this.navRoute.length > 0) {
                Log.write('Nav route set.')
            } else {
                Log.write('No nav route found.')
            }

            // Call this no matter what, so that cleared routes are properly dealt with.
            this.emit('SET_NAV_ROUTE')
        }
    }

    /* ----------------------------------------------------------------------------- watch() ---- */

    // Watch the journal for changes.
    watch(): void {
        const tail: TailType = new Tail(this.#path, {useWatchFile: true})

        Log.write(`Watching ${path.basename(this.#path)}...`)

        tail.on('line', (data) => data ? this.#parseLine(data) : undefined)
        tail.on('error', (err) => Log.write(`Tail error in Journal.watch(): ${err}`))
    }

    /* ------------------------------------------------------------------------ #parseLine() ---- */

    // Parse and handle journal lines.
    #parseLine(raw: string) {
        const line: journalEntry = JSON.parse(raw)
        let dssFlag: boolean = false

        switch (line.event) {
            // Hyperspace jump started (3.. 2.. 1..)
            case 'StartJump': {
                if ('JumpType' in line && line.JumpType === 'Hyperspace') {
                    this.emit('ENTERING_WITCH_SPACE')
                }
                break
            }

            // CMDR jumped to new system, so update current location.
            case 'FSDJump': {
                this.#handleFsdJump((line as completeFsdJump))
                break
            }

            // CMDR completed DSS scan, so set flag for when next line processes and we want to
            // figure out what kind of scan occurred.
            case 'SAAScanComplete': {
                dssFlag = true
                break
            }

            // A scan occurred, so let's hand that info off to the appropriate function and then
            // reset the DSS flag.
            case 'Scan': {
                this.#handleScanLine((line as autoScan|detailedScan), dssFlag)
                dssFlag = false
                break
            }

            // CMDR set a new nav route.
            case 'NavRoute': {
                this.#getNavRoute()
                break
            }

            // CMDR cleared the nav route.
            case 'NavRouteClear': {
                this.navRoute = []
                Log.write('Nav route cleared.')
                this.emit('SET_NAV_ROUTE')
                break
            }
        }
    }

    /* ---------------------------------------------------------------------- #handleFsdJump ---- */

    #handleFsdJump(line: completeFsdJump): void {
        this.location = new System(line)
        Log.write(`FSD Jump detected, current location updated to ${this.location.name}.`)

        if (this.navRoute.length > 0) {
            _.remove(this.navRoute, (system) => {
                return system.SystemAddress === this.location.SystemAddress
            })
        }

        this.emit('ENTERED_NEW_SYSTEM')
    }

    /* --------------------------------------------------------------------- #handleScanLine ---- */

    #handleScanLine(line: autoScan|detailedScan, DSS: boolean = false) {
        const dupChecker = {'BodyName': line.BodyName, 'BodyID': line.BodyID}
        let body: Body|null = null

        // If it's a DSS scan, then we should have already added the body to the list. But we'll
        // check to make sure.
        if (DSS) {
            // Using findIndex() rather than find() so we can edit the body if found.
            const bodyIndex: number = _.findIndex(this.location.bodies, dupChecker)

            if (bodyIndex > -1) { // Body was found in list, so simply toggle the DSS flag.
                this.location.bodies[bodyIndex].DSSDone = true

            } else { // Body was missed on initial journal scan, so add it to the list.
                body = new Body(line, true)
                this.location.bodies.push(body)
            }

        } else { // Otherwise it's an FSS or auto scan, and needs to be added to the list.
            // Probably overkill, but do a duplicate check just in case.
            const r = _.find(this.location.bodies, dupChecker)

            if (r === undefined) {
                body = new Body(line)
                this.location.bodies.push(body)
            }
        }

        Log.write(`Scan detected. Body: ${line.BodyName}.`)
        this.emit('BODY_SCANNED', body, DSS)
    }
}