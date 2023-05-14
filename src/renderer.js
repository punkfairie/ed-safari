import 'bootstrap/dist/css/bootstrap.css';
import './assets/index.css';
import './icons/flaticon.css';

import './assets/ldom.min';

const { app, ipcRenderer } = require('electron');
import { EliteMatrix } from 'elite-matrix';

import { Safari } from './models/Safari';
import { Settings } from './models/Settings';
import { UI } from './models/UI';
import { Body } from './models/Body';
import { EDSM } from './models/EDSM';

// Grab app.isPackaged from main process
let isPackaged = false;
window.process.argv.forEach((item) => {
    if (item.includes('EDS-ENV')) {
        isPackaged = (item.split('=').pop() === 'true');
    }
})

/* ------------------------------------------------------------------------------- app setup ---- */

const safari = Safari.start(isPackaged);
const settings = Settings.get(isPackaged);
const journal = safari.journal;
const edsm = EDSM.connect();

if (!journal) {
    // TODO handle error
}

safari.watchJournalDir();
journal.watch();

/* ------------------------------------------------------------------------------ set colors ---- */

settings.on('CUSTOM_COLORS_SET', () => {
    UI.setColors(settings.matrix);
});

/* -------------------------------------------------------------------- close window handler ---- */

$('#closeBtn').on('click', () => {
    ipcRenderer.send('CLOSE_WINDOW');
});

/* ----------------------------------------------------------------- settings button handler ---- */

$('#settingsBtn').on('click', () => {
    ipcRenderer.send('LOAD_SETTINGS');
});

/* ------------------------------------------------------------------------- build body list ---- */

journal.once('BUILD_BODY_LIST', () => {
    if (journal.location?.bodies?.length > 0) {
        journal.location.sortBodies();

        journal.location.bodies.forEach((body) => {
            const row = UI.createBodyRow(body);

            $('#scans').appendChild(row);
        });
    }
});

/* ----------------------------------------------------------------- started hyperspace jump ---- */

journal.on('ENTERING_WITCH_SPACE', () => UI.enterWitchSpace());

/* ---------------------------------------------------------------------- entered new system ---- */

journal.on('ENTERED_NEW_SYSTEM', () => {
    UI.setCurrentSystem(journal.location);

    $('#navRoute').children().filter(`#${CSS.escape(journal.location.SystemAddress)}`).remove();

    // verify that the internal navRoute matches the UI navRoute, and rebuild it if not
    if ($('#navRoute').children().length !== journal.navRoute.length) {
        journal.emit('SET_NAV_ROUTE');
    }
});

/* ---------------------------------------------------------------------- body scan detected ---- */

journal.on('BODY_SCANNED', (body, DSS) => {
    journal.location.sortBodies();

    // If this is a DSS scan, it's very likely that the body already exists in our list so we just
    // need to remove the highlighting if applicable
    if (DSS) {
        const bodyRow = $(`#${body.BodyID}`);

        if (bodyRow.length > 0) { // check just in case body was missed in earlier scans
            bodyRow.removeClass('highlighted uncharted').addClass('charted');
        } else {
            const row = UI.createBodyRow(body);
            $('#scans').appendChild(row);
        }

    } else { // else it's an FSS/auto scan and won't be in the list yet
        const row = UI.createBodyRow(body);
        $('#scans').appendChild(row);
    }
});

/* --------------------------------------------------------------------------- nav route set ---- */

journal.on('SET_NAV_ROUTE', () => {
    // clear previous nav route, if any
    $('#navRoute').children().remove();

    if (journal.navRoute.length > 0) {
        journal.navRoute.forEach((system) => {
            // duplicate check
            // CSS.escape is needed since CSS technically doesn't allow numeric IDs
            const systemRow = $(`#${CSS.escape(system.SystemAddress)}`);

            if (systemRow.length === 0) {
                const row = UI.createSystemRow(system);
                $('#navRoute').appendChild(row);
            }
        });
    }
});

/* ------------------------------------------------------------------------ system value set ---- */

edsm.on('SYSTEM_APPRAISED', (system) => {
    const systemRow = $(`#${CSS.escape(system.SystemAddress)}`);

    if (systemRow.length > 0) {
        UI.setValue(systemRow, system.estimatedValueMapped);
    }
});