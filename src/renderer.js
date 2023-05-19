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
});

/* ------------------------------------------------------------------------------- app setup ---- */

const safari   = Safari.start(isPackaged);
const settings = Settings.get();
const cmdr     = safari.CMDR;
const edsm     = EDSM.connect();

if (!cmdr) {
  // TODO handle error
}

cmdr.track();

/* ------------------------------------------------------------------------------ set colors ---- */

settings.on('CUSTOM_COLORS_SET', () => {
  UI.setColors(settings.matrix);
});

/* -------------------------------------------------------------------- close window handler ---- */

$('#closeBtn').on('click', () => {
  safari.shutdown();
  ipcRenderer.send('CLOSE_WINDOW');
});

/* ----------------------------------------------------------------- settings button handler ---- */

$('#settingsBtn').on('click', () => {
  ipcRenderer.send('LOAD_SETTINGS');
});

/* ------------------------------------------------------------------------- build body list ---- */

cmdr.once('BUILD_BODY_LIST', () => {
  if (cmdr.location?.bodies?.length > 0) {
    cmdr.location.sortBodies();

    cmdr.location.bodies.forEach((body) => {
      const row = UI.createBodyRow(body);

      $('#scans').appendChild(row);
    });
  }
});

/* ----------------------------------------------------------------- started hyperspace jump ---- */

cmdr.on('ENTERING_WITCH_SPACE', () => UI.enterWitchSpace());

/* ---------------------------------------------------------------------- entered new system ---- */

cmdr.on('ENTERED_NEW_SYSTEM', () => {
  UI.setCurrentSystem(cmdr.location);

  $('#navRoute').children().filter(`#${CSS.escape(cmdr.location.SystemAddress)}`).remove();

  // verify that the internal navRoute matches the UI navRoute, and rebuild it if not
  if ($('#navRoute').children().length !== cmdr.navRoute.length) {
    cmdr.emit('SET_NAV_ROUTE');
  }
});

/* ---------------------------------------------------------------------- body scan detected ---- */

cmdr.on('BODY_SCANNED', (body, DSS) => {
  cmdr.location.sortBodies();

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

cmdr.on('SET_NAV_ROUTE', () => {
  // clear previous nav route, if any
  $('#navRoute').children().remove();

  if (cmdr.navRoute.length > 0) {
    cmdr.navRoute.forEach((system) => {
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
