export class Body {
    constructor() {}

    isAsteroid() {
        return this.BodyName.includes('Belt')
    }

    isPlanet() {
        return !!this.PlanetClass
    }

    isStar() {
        return !!this.StarType
    }

    simpleName() {
        return this.BodyName.replace(this.StarSystem, '')
    }

    distance() {
        return Intl.NumberFormat().format(Math.round(this.DistanceFromArrivalLS))
    }
}