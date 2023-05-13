export class Settings {
    static #instance: Settings;

    minValue: number;
    maxDistance: number;

    private constructor() {
        this.minValue = 500000;
        this.maxDistance = 10000;
    }

    static get(): Settings {
        if (!Settings.#instance) {
            Settings.#instance = new Settings();
        }

        return Settings.#instance;
    }
}