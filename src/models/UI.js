export class UI {
    constructor() {}

    /* -------------------------------------------------------------------------- buildRings ---- */

    static #buildRings(body) {
        const rings = $('<span>')
        const seperator = $('<span>').text(' ) ')
        rings.appendChild(seperator)

        body.Rings.forEach((ring) => {
            const ringClass = ring.RingClass.replace('eRingClass_', '')
            let icon = null

            switch (ringClass) {
                case 'MetalRich': {
                    icon = 'gold-bars'
                    break
                }

                case 'Metalic':
                case 'Metallic': {
                    icon = 'ingot'
                    break
                }

                case 'Icy': {
                    icon = 'snowflake'
                    break
                }

                case 'Rocky': {
                    icon = 'asteroid-3'
                    break
                }
            }

            if (icon !== null) {
                rings.appendChild($('<i>').addClass(`flaticon-${icon}`))
                rings.appendChild(seperator)
            }
        })

        return rings
    }

    /* ----------------------------------------------------------------------- createBodyRow ---- */

    static createBodyRow(body) {
        const chartedStyle = body.WasDiscovered && !body.DSSDone ? 'charted' : 'uncharted'
        const row = $('<div>').addClass('row ms-1 me-1')
        row.attr('id', body.bodyID)

        // spacer
        row.appendChild($('<div>').addClass('col-1 system'))

        // name
        const name = $('<div>').addClass(`col-2 text-start system ${chartedStyle}`)
        name.appendChild($('<i>')).addClass(`flaticon-${body.nameIcon()}`)
        name.appendChild($('<span>')).text(body.simpleName())
        row.appendChild(name)

        // type icon
        const type = $('<div>').addClass(`col pe-0 me-0 system ${chartedStyle}`)
        type.appendChild($('<i>').addClass(`flaticon-${body.typeIcon()}`))
        // rings
        if (body.Rings !== undefined) {
            type.appendChild(UI.#buildRings(body))
        }
        // type
        const typeName = body.PlanetClass || body.starType || ''
        type.appendChild($('<span>').text(typeName))
        row.appendChild(type)

        // distance
        const distance = $('<div>').addClass(`col-auto ps-2 ms-0 system ${chartedStyle}`)
        distance.text(body.distance())
        row.appendChild(distance)

        // info
        const info = $('<div>').addClass(`col-1 system ${chartedStyle}`)
        // terraformable
        const terraform = $('<i>').addClass('flaticon-cooling-tower opacity-0')
        if (body.isPlanet && body.TerraformState) {
            terraform.removeClass('opacity-0')
        }
        info.appendChild(terraform)
        // was mapped
        const mapped = $('<i>').addClass('flaticon-flag-outline-on-a-pole-with-stars-around opacity-0')
        if (body.isPlanet() && !body.WasMapped) {
            mapped.removeClass('opacity-0')
        }
        info.appendChild(mapped)
        row.appendChild(info)

        // mapped value
        // TODO APPRAISAL DATA
        const value = $('<div>').addClass(`col-2 text-end system ${chartedStyle}`)
        row.appendChild(value)

        return row
    }

    /* --------------------------------------------------------------------- createSystemRow ---- */

    static createSystemRow(system) {
        const row = $('<div>').addClass('row ms-1 me-1')
        row.attr('id', system.SystemAddress)
        // TODO APPRAISAL DATA
        const chartedStyle = 'charted'

        // name
        const name = $('<div>').addClass(`col system ${chartedStyle}`)
        name.appendChild($('<i>').addClass('flaticon-solar-system'))
        name.appendChild($('<span>').text(` ${system.name}`))
        row.appendChild(name)

        // mapped value
        // TODO APPRAISAL DATA
        const value = $('<div>').addClass(`col-2 text-end system ${chartedStyle}`)
        row.appendChild(value)

        return row
    }
}