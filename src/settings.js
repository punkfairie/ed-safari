import 'bootstrap/dist/css/bootstrap.css'
import './assets/index.css'

import './assets/ldom.min'

const { ipcRenderer } = require('electron')

/* -------------------------------------------------------------------- close window handler ---- */

$('#closeBtn').on('click', () => {
    ipcRenderer.send('CLOSE_WINDOW')
})

/* ---------------------------------------------------------------- load main window handler ---- */

$('.backBtn').on('click', () => {
    ipcRenderer.send('LOAD_MAIN')
})