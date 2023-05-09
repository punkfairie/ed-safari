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

import './index.css'
import './icons/flaticon.css'

const { app } = require('electron')
import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { JournalInterface } from './interfaces/JournalInterface'

// Grab app.isPackaged from main process
let isPackaged = false
window.process.argv.forEach((item) => {
    if (item.includes('EDS-ENV')) {
        isPackaged = (item.split('=').pop() === 'true')
    }
})

createApp({
    setup() {
        const journal = new JournalInterface(isPackaged)

        // TODO: show warning to user
        if (journal.journalDir === null) {
            return
        }

        journal.watchDirectory()
        journal.watchJournal()

        const currentLocation = ref('Unknown')
        const currentSystemBodies = ref([])

        journal.on('FSDJump', () => currentLocation.value = journal.currentLocation)
        journal.on('SCANNED_BODIES_FOUND', () => currentSystemBodies.value = journal.currentLocation.bodies)


        return {
            currentLocation,
            currentSystemBodies,
        }
    }
}).mount('#app')
