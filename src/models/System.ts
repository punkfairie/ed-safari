import { Body } from "./Body"

export class System {
    name: string
    starClass: string|null
    bodies: Body[]

    constructor(StarSystem: string, StarClass: string|null = null) {
        // In future, this is where we preform EDSM lookup

        this.name = StarSystem
        this.starClass = StarClass
        this.bodies = []
    }
}