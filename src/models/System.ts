import type { completeFsdJump, location, navRouteSystem } from "../@types/journalLines"
import { Body } from "./Body"

export class System {
    name: string
    SystemAddress?: number
    StarClass?: string
    bodies: Body[]

    constructor(line: navRouteSystem|completeFsdJump|location|string) {
        // In future, this is where we preform EDSM lookup

        if (typeof line === 'string') {
            this.name = line
        } else {
            this.name = line.StarSystem
            this.SystemAddress = line.SystemAddress

            if ('StarClass' in line) {
                this.StarClass = line.StarClass
            }
        }

        this.bodies = []
    }
}