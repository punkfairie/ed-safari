const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const max = require('lodash/max')
const { globSync } = require('glob')
const os = require('os')
const lineReader = require('reverse-line-reader')
const chokidar = require('chokidar')
const Tail = require('tail').Tail

export class JournalInterface extends EventEmitter {
    constructor() {
        super()

        // this.journalDir = os.homedir() + 'Saved Games\\Frontier Developments\\Elite Dangerous'
        this.journalDir = "/mnt/c/Users/marle/Saved\ Games/Frontier\ Developments/Elite\ Dangerous/"
        this.journalPattern = this.journalDir + "Journal.*.log"

        this.current = this.getLatestJournal()

        this.currentLocation = null

        console.log('JournalInterface initialized. Attempting to find current location.')
        this.getCurrentLocation()
    }

    async getCurrentLocation() {
        lineReader.eachLine(this.current, (raw, last) => {            
            if (raw) {
                const line = JSON.parse(raw)

                if (line.event === 'FSDJump') {
                    this.currentLocation = line.StarSystem
                    return false
                } else if (last) {
                    console.log('Error: unable to find last hyperspace jump. Current location unknown.')
                    return false
                }
            }
        }).then(() => {
            this.emit('FSDJump')
            console.log(`Current location set to ${this.currentLocation}.`)
        })
    }

    // https://stackoverflow.com/questions/15696218/get-the-most-recent-file-in-a-directory-node-js
    getLatestJournal() {
        const journals = globSync(this.journalPattern)

        return max(journals, file => {
            const fullPath = path.join(this.journalDir, file)
            return fs.statSync(fullPath).mtime
        })

        console.log('New journal file found, now watching ' + path.basename(this.current))
    }

    watchDirectory() {
        const watcher = chokidar.watch(this.journalPattern, {usePolling: true, persistent: true})
        
        watcher.on('add', newFile => this.current = this.getLatestJournal())

        console.log('Watching journal folder for changes...')
    }

    parseLine(raw) {
        const line = JSON.parse(raw)
        
        if (line.event === 'FSDJump') {
            this.currentLocation = line.StarSystem
            this.emit('FSDJump')
        }
    }

    watch() {
        const tail = new Tail(this.current, {useWatchFile: true})

        console.log(`Watching ${path.basename(this.current)}...`)

        tail.on('line', data => this.parseLine(data))
        tail.on('error', err => console.log(err))
    }
}