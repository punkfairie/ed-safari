import { Body } from "./Body"

export class System {
    name: string
    bodies: Body[]

    constructor(StarSystem: string) {
        // In future, this is where we preform EDSM lookup

        this.name = StarSystem
        this.bodies = []
    }
}