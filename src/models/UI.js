export class UI {
    constructor() {}

    /* ----------------------------------------------------------------------- #formatNumber ---- */

    static #formatNumber(number) {
        return Intl.NumberFormat().format(Math.round(number))
    }

    /* --------------------------------------------------------------------- enterWitchSpace ---- */

    static enterWitchSpace() {
        $('#highValueScans').children().remove()
        $('#lowValueScans').children().remove()

        $('#currentSystem').removeClass('charted').addClass('highlighted text-center')
        $('#currentSystemIcon').addClass('hidden')

        $('#currentSystemName').text('> > > Hyperspace < < <')
    }

    /* -------------------------------------------------------------------- setCurrentSystem ---- */

    static setCurrentSystem(system) {
        $('#highValueScans').children().remove()
        $('#lowValueScans').children().remove()
        $('#currentSystem').children().remove()

        let row

        if (system.name === 'Unknown') {
            row = $('<div>').addClass('row ms-1 me-1')
            const child = $('<div>').addClass('col system highlighted text-center')
            child.text(system.name)
            row.appendChild(child)
        } else {
            row = UI.createSystemRow(system)
        }

        $('#currentSystem').appendChild(row)
    }

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
        type.appendChild($('<span>').text(` ${typeName}`))
        row.appendChild(type)

        // distance
        const distance = $('<div>').addClass(`col-auto ps-2 ms-0 system ${chartedStyle}`)
        distance.text(UI.#formatNumber(body.DistanceFromArrivalLS))
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
        const value = $('<div>').addClass(`col-2 text-end system ${chartedStyle}`)
        value.text(UI.#formatNumber(body.mappedValue))
        row.appendChild(value)

        return row
    }

    /* --------------------------------------------------------------------- createSystemRow ---- */

    static createSystemRow(system) {
        const row = $('<div>').addClass('row ms-1 me-1')
        row.attr('id', system.SystemAddress)
        // This is probably still the default 'true' value, but check in case the fetch() was quick.
        const chartedStyle = system.charted ? 'charted' : 'uncharted'

        // name
        const name = $('<div>').addClass(`col system ${chartedStyle}`)
        name.appendChild($('<i>').addClass('flaticon-solar-system'))
        name.appendChild($('<span>').text(` ${system.name}`))
        row.appendChild(name)

        // mapped value
        // Check if EDSM has responded yet, otherwise value will be filled in later.
        const value = $('<div>').addClass(`col-2 text-end system ${chartedStyle} value`)
        if ('estimatedValueMapped' in system) {
            value.text(UI.#formatNumber(system.estimatedValueMapped))
        }
        row.appendChild(value)

        return row
    }

    /* ---------------------------------------------------------------------------- setValue ---- */

    static setValue(row, value) {
        row.children().filter('.value').text(UI.#formatNumber(value))
    }
}