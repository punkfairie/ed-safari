import type { completeFsdJump, location, navRouteSystem } from "../@types/journalLines"
import { Body } from "./Body"
import { EDSM } from "./EDSM"

export class System {
    name: string
    SystemAddress?: number
    StarClass?: string
    charted: boolean
    bodies: Body[]

    // ESDM data
    estimatedValue?: number
    estimatedValueMapped?: number
    valuableBodies?: Body[]

    constructor(line?: navRouteSystem|completeFsdJump|location) {
        // In future, this is where we preform EDSM lookup

        if (!line) {
            this.name = 'Unknown'
        } else {
            this.name = line.StarSystem
            this.SystemAddress = line.SystemAddress

            if ('StarClass' in line) {
                this.StarClass = line.StarClass
            }

        }

        // Set this to true initially, since it likely is and the system is technically inserted
        // into the UI before it's appraised.
        this.charted = true
        this.bodies = []

        if (this.name !== 'Unknown') {
            this.#getValue()
        }
    }

    /* --------------------------------------------------------------------------- #getValue ---- */

    async #getValue() {
        // display estimatedValueMapped
        const data = await EDSM.getSystemValue(this)

        if (data) {
            this.estimatedValue = data.estimatedValue
            this.estimatedValueMapped = data.estimatedValueMapped

            // If EDSM doesn't have an estimate, then it's likely undiscovered.
            this.charted = this.estimatedValue > 0

            // Save valuable bodies in system, if any.
            if (data.valuableBodies.length > 0) {
                this.valuableBodies = []

                data.valuableBodies.forEach((body) => {
                    this.valuableBodies?.push(new Body(body))
                })
            }

            // Let the UI know it needs to update.
            EDSM.connect().emit('SYSTEM_APPRAISED', this)
        }
    }
}