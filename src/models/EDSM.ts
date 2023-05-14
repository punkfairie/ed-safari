import type { systemEstimatedValue } from '../@types/edsmResponses';

const EventEmitter = require('node:events');

import { Log } from './Log';
import { System } from './System';

export class EDSM extends EventEmitter {
    static #instance: EDSM;

    private constructor() {
        super();
    }

    static connect(): EDSM {
        if (!EDSM.#instance) {
            EDSM.#instance = new EDSM();
        }

        return EDSM.#instance;
    }

    /* ---------------------------------------------------------------------------- #request ---- */

    // Submit a request to EDSM and return the response as an object
    static async #request(url: string, options: {[x: string]: string}): Promise<object|undefined> {
        let data: object|undefined = undefined;

        try {
            const response = await fetch(url + '?' + new URLSearchParams(options));

            if (!response.ok) {
                throw new Error(`Network error - ${response}`);
            }

            data = await response.json();
        } catch (err) {
            Log.write(`ERROR - EDSM.request(): ${err}`);
        }

        return data;
    }

    /* ---------------------------------------------------------------------- getSystemValue ---- */

    static async getSystemValue(system: System): Promise<systemEstimatedValue|undefined> {
        const url = 'https://www.edsm.net/api-system-v1/estimated-value';
        const response = await EDSM.#request(url, {systemName: system.name});
        return (response as systemEstimatedValue);
    }
}