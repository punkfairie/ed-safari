import 'bootstrap/dist/css/bootstrap.css';
import './assets/index.css';

import './assets/ldom.min';

const { ipcRenderer } = require('electron');

import { Settings } from './models/Settings';

const settings = Settings.get();

/* -------------------------------------------------------------------- close window handler ---- */

$('#closeBtn').on('click', () => {
    ipcRenderer.send('CLOSE_WINDOW')
})

/* ---------------------------------------------------------------- load main window handler ---- */

$('.backBtn').on('click', () => {
    ipcRenderer.send('LOAD_MAIN')
})

/* ------------------------------------------------------------------- insert current values ---- */

$('#minValue').attr('value', settings.minValue);
$('#maxDistance').attr('value', settings.maxDistance);