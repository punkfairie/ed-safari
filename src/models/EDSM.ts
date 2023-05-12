import fetch from 'electron-fetch'
import { Log } from './Log'

class EDSM {
    private constructor() {}

    static async request(url: string, options: {[x: string]: string}): Promise<object|undefined> {
        let data: object|undefined = undefined

        try {
            const response = await fetch(url + '?' + new URLSearchParams(options))

            if (!response.ok) {
                throw new Error(`Network error - ${response}`)
            }

            data = await response.json()
        } catch (err) {
            Log.write(`ERROR - EDSM.request(): ${err}`)
        }

        return data
    }
}