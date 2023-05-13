const fs = require('node:fs/promises')
const { statSync, writeFileSync, readFileSync } = require('node:fs')
const os = require('node:os')
const path = require('node:path')

interface settingsFile {
    minValue: number,
    maxDistance: number,
}

export class Settings {
    static #instance: Settings;

    #file: string;

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
    }

    static get(isPackaged: boolean = false): Settings {
        if (!Settings.#instance) {
            Settings.#instance = new Settings(isPackaged);
        }

        return Settings.#instance;
    }
}