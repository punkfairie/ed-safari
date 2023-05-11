import type { autoScan, detailedScan } from "../@types/journalLines"

export class Body {
    DSSDone: boolean
    
    constructor(journalLine: autoScan|detailedScan|null = null, DSS: boolean = false) {
        this.DSSDone = DSS

        if (journalLine !== null) {
            Object.assign(this, journalLine)
        }
    }

    /* -------------------------------------------------------------------------- isAsteroid ---- */

    isAsteroid() {
        return this.BodyName.includes('Belt')
    }

    /* ---------------------------------------------------------------------------- isPlanet ---- */

    isPlanet() {
        return !!this.PlanetClass
    }

    /* ------------------------------------------------------------------------------ isStar ---- */

    isStar() {
        return !!this.StarType
    }

    /* ---------------------------------------------------------------------------- nameIcon ---- */

    nameIcon() {
        let nameIcon = null

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

    simpleName() {
        return this.BodyName.replace(this.StarSystem, '')
    }

    /* ---------------------------------------------------------------------------- typeIcon ---- */

    typeIcon() {
        let typeIcon = null

        if (this.isStar() || this.isAsteroid()) {
            typeIcon = this.nameIcon()
        } else {
            const planetClass = this.PlanetClass.toLowerCase()

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

    /* ---------------------------------------------------------------------------- distance ---- */

    distance() {
        return Intl.NumberFormat().format(Math.round(this.DistanceFromArrivalLS))
    }
}