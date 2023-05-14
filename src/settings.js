import 'bootstrap/dist/css/bootstrap.css';
import './assets/index.css';

import './assets/ldom.min';

const { ipcRenderer } = require('electron');
const { setTimeout } = require('node:timers/promises');
const { basename } = require('node:path');

import { Safari } from './models/Safari';
import { Settings } from './models/Settings';
import { UI } from './models/UI';

const safari = Safari.start();
const settings = Settings.get();

if (settings.matrix) {
    UI.setColors(settings.matrix);
}

/* ------------------------------------------------------------------------------ set colors ---- */

settings.on('CUSTOM_COLORS_SET', () => {
    UI.setColors(settings.matrix);
});

/* -------------------------------------------------------------------- close window handler ---- */

$('#closeBtn').on('click', () => {
    safari.shutdown();
    ipcRenderer.send('CLOSE_WINDOW');
})

/* ---------------------------------------------------------------- load main window handler ---- */

$('.backBtn').on('click', () => {
    ipcRenderer.send('LOAD_MAIN');
})

/* ------------------------------------------------------------------- insert current values ---- */

$('#minValue').attr('value', settings.minValue);
$('#maxDistance').attr('value', settings.maxDistance);

/* ---------------------------------------------------------------------- select matrix file ---- */

$('#matrixBtn').on('click', async function () {
    const filePath = await ipcRenderer.invoke('SELECT_MATRIX_FILE');
    $('#matrixFile').attr('value', filePath);
});

/* ---------------------------------------------------------------------------- process form ---- */

$('form').on('submit', async function (event) {
    event.preventDefault();
    $('.form-error').remove();
    // TODO disable submit button.

    // Retrieve and normalize data.
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    data.minValue = parseInt(data.minValue.replace(/\D/g, ''));
    data.maxDistance = parseInt(data.maxDistance.replace(/\D/g, ''));

    // Check for any errors.
    let errors = false;
    if (isNaN(data.minValue)) {
        UI.addFormError('#minValue', 'Please enter a number!');
        errors = true;
    }

    if (isNaN(data.maxDistance)) {
        UI.addFormError('#maxDistance', 'Please enter a number!');
        errors = true;
    }

    const fileName = basename(data.matrixFile);
    if (fileName !== 'XML-Profile.ini' || fileName !== 'GraphicsConfiguration.xml') {
        UI.addFormError('#matrixFile', 'Invalid file.');
    }

    // TODO re-enable submit button if errors.

    // If no errors, save.
    if (!errors) {
        // TODO show some sort of saving thing?

        let tries = 0;
        do {
            let result = await settings.save(data);

            if (!result) {
                await setTimeout(3000);
                tries++;
            } else {
                break;
            }
        } while (tries < 3);

        // Redirect to main window.
        ipcRenderer.send('LOAD_MAIN');
    }

});