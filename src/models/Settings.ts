const fs = require('node:fs/promises');
const { statSync, writeFileSync, readFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

import { Log } from "./Log";

interface settingsFile {
    minValue: number,
    maxDistance: number,
}

export class Settings {
    static #instance: Settings;

    #file: string;
    #writing: boolean;

    minValue: number;
    maxDistance: number;

    private constructor(isPackaged: boolean) {
        if (!isPackaged && os.platform() === 'linux') {
            this.#file = '/mnt/c/Users/marle/ed-safari-settings.json';
        } else {
            this.#file = path.join(os.homedir(), 'ed-safari-settings.json');
        }

        // Check if settings file exists, and create it if not. Using sync since it's such a small
        // file, and this information is neccesary to build the UI.
        try {
            statSync(this.#file);
        } catch (err) {
            if (err.code === 'ENOENT') {
                const contents: string = JSON.stringify({
                    minValue: 500000,
                    maxDistance: 10000,
                });

                writeFileSync(this.#file, contents);
            }
        }

        // Initial reading of settings file done in sync for same reasons as above.
        const contents: settingsFile = JSON.parse(readFileSync(this.#file, { encoding: 'utf8' }));
        this.minValue = contents.minValue;
        this.maxDistance = contents.maxDistance;

        this.#writing = false;
    }

    static get(isPackaged: boolean = false): Settings {
        if (!Settings.#instance) {
            Settings.#instance = new Settings(isPackaged);
        }

        return Settings.#instance;
    }

    /* -------------------------------------------------------------------------------- save ---- */

    async save(settings: settingsFile): Promise<boolean> {
        if (!this.#writing) {
            try {
                Log.write('Attempting to save changed settings...');

                // So we don't try to write again before this one finishes.
                this.#writing = true;
                await fs.writeFile(this.#file, JSON.stringify(settings));
                this.#writing = false;

                Log.write('Settings saved!');
                return true;
            } catch (err) {
                Log.write(err);
                return false;
            }
        } else {
            return false;
        }
    }
}