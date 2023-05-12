import type { valuableBody } from "../@types/edsmResponses"
import type { asteroidScan, autoScan, detailedScan, planetScan, starScan } from "../@types/journalLines"

export interface Body extends starScan<'AutoScan'|'DetailedScan'>, asteroidScan<'AutoScan'|'DetailedScan'>, planetScan<'AutoScan'|'DetailedScan'> {}
export class Body {
    DSSDone: boolean

    constructor(journalLine: autoScan|detailedScan|valuableBody|null = null, DSS: boolean = false) {
        this.DSSDone = DSS

        if (journalLine !== null) {
            Object.assign(this, journalLine)
        }
    }

    /* -------------------------------------------------------------------------- isAsteroid ---- */

    isAsteroid(): boolean {
        return this.BodyName.includes('Belt')
    }

    /* ---------------------------------------------------------------------------- isPlanet ---- */

    isPlanet(): boolean {
        return !!this.PlanetClass
    }

    /* ------------------------------------------------------------------------------ isStar ---- */

    isStar(): boolean {
        return !!this.StarType
    }

    /* ---------------------------------------------------------------------------- nameIcon ---- */

    nameIcon(): string|null {
        let nameIcon: string|null = null

        if (this.isAsteroid()) {
            nameIcon = 'asteroid-4'
        } else if (this.isStar()) {
            nameIcon = 'star'
        } else if (this.isPlanet()) {
            nameIcon = 'jupiter-3'
        }

        return nameIcon
    }

    /* -------------------------------------------------------------------------- simpleName ---- */

    simpleName(): string {
        return this.BodyName.replace(this.StarSystem, '')
    }

    /* ---------------------------------------------------------------------------- typeIcon ---- */

    typeIcon(): string|null {
        let typeIcon: string|null = null

        if (this.isStar() || this.isAsteroid()) {
            typeIcon = this.nameIcon()
        } else {
            const planetClass: string = this.PlanetClass.toLowerCase()

            if (planetClass.includes('metal')) {
                typeIcon = 'ingot'
            } else if (planetClass.includes('icy')) {
                typeIcon = 'snowflake'
            } else if (planetClass.includes('earth')) {
                typeIcon = 'earth'
            } else if (planetClass.includes('gas giant')) {
                typeIcon = 'jupiter-1'
            } else if (planetClass.includes('rock')) {
                typeIcon = 'asteroid-3'
            } else if (planetClass.includes('water') || planetClass.includes('ammonia')) {
                typeIcon = 'water-drops'
            }
        }

        return typeIcon
    }
}