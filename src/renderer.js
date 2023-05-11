/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import 'bootstrap/dist/css/bootstrap.css'
import './assets/index.css'
import './icons/flaticon.css'

const { app } = require('electron')
import { JournalInterface } from './interfaces/JournalInterface'
import { UI } from './models/UI'
import { Body } from './models/Body'
import { sep } from 'path'

// Grab app.isPackaged from main process
let isPackaged = false
window.process.argv.forEach((item) => {
    if (item.includes('EDS-ENV')) {
        isPackaged = (item.split('=').pop() === 'true')
    }
})

/* ------------------------------------------------------------------------------- app setup ---- */

const journal = new JournalInterface(isPackaged)

if (journal.journalDir === null) {
    // handle error
}

journal.watchDirectory()
journal.watchJournal()

const test = {name: 'Test', ID: 'TestID'}

/* --------------------------------------------------------------------------- init complete ---- */

journal.once('INIT_COMPLETE', () => {
    if (journal.location.name !== 'Unknown') {
        $('#currentSystem')
            .addClass('charted')
            .removeClass('highlighted text-center')

        $('#currentSystemName').text(journal.location.name)

        $('#currentSystemIcon').removeClass('hidden')
    }

    if (journal.location?.bodies?.length > 0) {
        journal.location.bodies.forEach((body) => {
            const row = UI.createBodyRow(body)
            // TODO APPRAISAL DATA
            $('#lowValueScans').appendChild(row)
        })
    }
})

/* ---------------------------------------------------------------------- entered new system ---- */

journal.on('ENTERED_NEW_SYSTEM', () => {
    $('#highValueScans').children().remove()
    $('#lowValueScans').children().remove()

    $('#currentSystemName').text(journal.location.name)
})

/* ---------------------------------------------------------------------- body scan detected ---- */

journal.on('BODY_SCANNED', (body, DSS) => {
    // If this is a DSS scan, it's very likely that the body already exists in our list so we just
    // need to remove the highlighting if applicable
    if (DSS) {
        const bodyRow = $(`#${body.BodyID}`)

        if (bodyRow.length > 0) { // check just in case body was missed in earlier scans
            bodyRow.removeClass('highlighted uncharted').addClass('charted')
        } else {
            const row = UI.createBodyRow(body)
            // TODO APPRAISAL DATA
            $('#lowValueScans').appendChild(row)
        }

    } else { // else it's an FSS/auto scan and won't be in the list yet
        const row = UI.createBodyRow(body)
        // TODO APPRAISAL DATA
        $('#lowValueScans').appendChild(row)
    }
})

/* --------------------------------------------------------------------------- nav route set ---- */

journal.on('SET_NAV_ROUTE', () => {
    // clear previous nav route, if any
    $('#navRoute').children().remove()

    if (journal.navRoute.length > 1) {
        journal.navRoute.forEach((system) => {
            // duplicate check
            // CSS.escape is needed since CSS technically doesn't allow numeric IDs
            const systemRow = $(`#${CSS.escape(system.SystemAddress)}`)

            if (systemRow.length === 0) {
                const row = UI.createSystemRow(system)
                $('#navRoute').appendChild(row)
            }
        })
    }
})