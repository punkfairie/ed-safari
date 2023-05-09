export class Body {
    constructor() {}

    isAsteroid() {
        return this.BodyName.includes('Belt')
    }

    simpleName() {
        return this.BodyName.replace(this.StarSystem, '')
    }
}