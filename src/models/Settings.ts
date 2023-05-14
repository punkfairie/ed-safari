import { EliteMatrix } from "elite-matrix";
const EventEmitter = require('node:events');
const fs = require('node:fs/promises');
const { statSync, writeFileSync, readFileSync } = require('node:fs');
const ini = require('ini');
const os = require('node:os');
const path = require('node:path');
const { setTimeout } = require('node:timers/promises');
const xmlJS = require('xml-js');

import { Log } from "./Log";

interface settingsFile {
    minValue: number,
    maxDistance: number,
    matrixFile: string,
}

export class Settings extends EventEmitter {
    static #instance: Settings;

    #file: string;
    #writing: boolean;

    minValue: number;
    maxDistance: number;

    #matrixFile: null|string;
    matrix?: EliteMatrix;

    private constructor(isPackaged: boolean) {
        super();

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
                    matrixFile: '',
                });

                writeFileSync(this.#file, contents);
            }
        }

        // Initial reading of settings file done in sync for same reasons as above.
        const contents: settingsFile = JSON.parse(readFileSync(this.#file, { encoding: 'utf8' }));
        this.minValue = contents.minValue;
        this.maxDistance = contents.maxDistance;
        this.#matrixFile = contents.matrixFile;
        this.#writing = false;

        if (this.#matrixFile) {
            this.#setMatrix();
        }
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

                // Update Settings props.
                await this.#read();

                return true;
            } catch (err) {
                Log.write(err);
                return false;
            }
        } else {
            return false;
        }
    }

    /* ------------------------------------------------------------------------------- #read ---- */

    async #read(): Promise<boolean> {
        try {
            const file: string = await fs.readFile(this.#file, { encoding: 'utf8' });
            const contents: settingsFile = JSON.parse(file);

            this.minValue = contents.minValue;
            this.maxDistance = contents.maxDistance;
            this.#matrixFile = contents.matrixFile;

            if (this.#matrixFile) {
                await this.#setMatrix();
                Log.write('Custom colors set!');
            }

            return true;
        } catch (err) {
            Log.write(err);
            return false;
        }
    }

    /* -------------------------------------------------------------------------- #setMatrix ---- */

    async #setMatrix(): Promise<void> {
        const file: string = await fs.readFile(this.#matrixFile, { encoding: 'utf8' });

        let matrixRed: [number, number, number];
        let matrixGreen: [number, number, number];
        let matrixBlue: [number, number, number];

        if (path.basename(this.#matrixFile) === 'GraphicsConfiguration.xml') {
            const options = {
                trim: true,
                ignoreDeclaration: true,
                ignoreAttributes: true,
                compact: true,
                textKey: '$'
            };
            const contents = xmlJS.xml2js(file, options);

            let matrix = [
                contents.GraphicsConfig.GUIColour.Default.MatrixRed.$,
                contents.GraphicsConfig.GUIColour.Default.MatrixGreen.$,
                contents.GraphicsConfig.GUIColour.Default.MatrixBlue.$,
            ];

            matrix = matrix.map(v => v.replace(/\s/g, '').split(','));

            matrixRed = matrix[0].length === 3 ? matrix[0] : [1,0,0];
            matrixGreen = matrix[1].length === 3 ? matrix[1] : [0,1,0];
            matrixBlue = matrix[2].length === 3 ? matrix[2] : [0,0,1];

            this.matrix = new EliteMatrix(matrixRed, matrixGreen, matrixBlue);

        } else if (path.basename(this.#matrixFile) === 'XML-Profile.ini') {
            const contents = (ini.parse(file)).constants;

            matrixRed = [contents.x150, contents.y150, contents.z150];
            matrixGreen = [contents.x151, contents.y151, contents.z151];
            matrixBlue = [contents.x152, contents.y152, contents.z152];

            this.matrix = new EliteMatrix(matrixRed, matrixGreen, matrixBlue);
        }

        this.emit('CUSTOM_COLORS_SET');
    }
}