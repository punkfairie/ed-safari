import type {valuableBody} from '../@types/edsmResponses';
import type {
  asteroidScan,
  autoScan,
  detailedScan,
  planetScan,
  starScan,
} from '../@types/journalLines';

import {BodyCodes} from '../data/BodyCodes';

export interface Body extends starScan<'AutoScan' | 'DetailedScan'>, asteroidScan<'AutoScan' | 'DetailedScan'>, planetScan<'AutoScan' | 'DetailedScan'> {}

export class Body {
  DSSDone: boolean;
  mappedValue: number;

  constructor(
      journalLine: autoScan | detailedScan | valuableBody | null = null,
      DSS: boolean = false,
  ) {
    this.DSSDone = DSS;

    if (journalLine !== null) {
      Object.assign(this, journalLine);
    }

    this.mappedValue = this.#getValue();
  }

  /* -------------------------------------------------------------------------- isAsteroid ---- */

  isAsteroid(): boolean {
    return this.BodyName?.includes('Belt');
  }

  /* ---------------------------------------------------------------------------- isPlanet ---- */

  isPlanet(): boolean {
    return !!this.PlanetClass;
  }

  /* ------------------------------------------------------------------------------ isStar ---- */

  isStar(): boolean {
    return !!this.StarType;
  }

  /* ---------------------------------------------------------------------------- nameIcon ---- */

  nameIcon(): string | null {
    let nameIcon: string | null = null;

    if (this.isAsteroid()) {
      nameIcon = 'asteroid-4';
    } else if (this.isStar()) {
      nameIcon = 'star';
    } else if (this.isPlanet()) {
      nameIcon = 'jupiter-3';
    }

    return nameIcon;
  }

  /* -------------------------------------------------------------------------- simpleName ---- */

  simpleName(): string {
    return this.BodyName.replace(this.StarSystem, '');
  }

  /* ---------------------------------------------------------------------------- typeIcon ---- */

  typeIcon(): string | null {
    let typeIcon: string | null = null;

    if (this.isStar() || this.isAsteroid()) {
      typeIcon = this.nameIcon();
    } else {
      const planetClass: string = this.PlanetClass.toLowerCase();

      if (planetClass.includes('metal')) {
        typeIcon = 'ingot';
      } else if (planetClass.includes('icy')) {
        typeIcon = 'snowflake';
      } else if (planetClass.includes('earth')) {
        typeIcon = 'earth';
      } else if (planetClass.includes('gas giant')) {
        typeIcon = 'jupiter-1';
      } else if (planetClass.includes('rock')) {
        typeIcon = 'asteroid-3';
      } else if (planetClass.includes('water') || planetClass.includes('ammonia')) {
        typeIcon = 'water-drops';
      }
    }

    return typeIcon;
  }

  /* ---------------------------------------------------------------------------- getValue ---- */

  // https://forums.frontier.co.uk/threads/exploration-value-formulae.232000/
  // https://github.com/EDSM-NET/Component/blob/master/Body/Value.php

  #getValue(): number {
    let bodyType: number | undefined = undefined; // Asteroids.

    if (this.isStar()) {
      // Typescript feels so stupid sometimes.
      bodyType = BodyCodes.starTypes[this.StarType as keyof typeof BodyCodes.starTypes];
    } else if (this.isPlanet()) {
      bodyType = BodyCodes.planetTypes[this.PlanetClass as keyof typeof BodyCodes.planetTypes];
    }

    // Asteroids don't have mass.
    const mass = (
                     'MassEM' in this
                 ) ? this.MassEM : 1;

    let terraformState: number | undefined = undefined; // Asteroids & Stars.

    if ('TerraformState' in this) {
      terraformState =
          BodyCodes.terraformStates[this.TerraformState as keyof typeof BodyCodes.terraformStates];
    }

    const firstDiscover = !this.WasDiscovered;
    const firstMap = !this.WasMapped;

    if (this.isStar()) {
      return this.#appraiseStar(bodyType, mass);

    } else if (this.isPlanet() || this.isAsteroid()) {
      // Asteroids are treated as planets for the purpose of value calculation.
      return this.#appraisePlanet(bodyType, mass, terraformState, firstDiscover, firstMap);

    } else {
      return 0;
    }
  }

  /* ----------------------------------------------------------------------- #appraiseStar ---- */

  #appraiseStar(bodyType: number | undefined, mass: number): number {
    let value: number = 1200;

    if (bodyType) {
      if (BodyCodes.whiteDwarf.includes(bodyType)) {
        value = 14057;

      } else if (
          BodyCodes.neutronStar.includes(bodyType)
          || BodyCodes.blackHole.includes(bodyType)
      ) {
        value = 22628;

      } else if (BodyCodes.superMassiveBlackHole.includes(bodyType)) {
        value = 33.5678; // Not confirmed in game.
      }
    }

    return Math.round(value + (
        mass * value / 66.25
    ));
  }

  /* --------------------------------------------------------------------- #appraisePlanet ---- */

  #appraisePlanet(
      bodyType: number | undefined,
      mass: number,
      terraformState: number | undefined,
      firstDiscover: boolean,
      firstMap: boolean,
  ): number {

    // Base value & terraform bonus calculation.
    let value: number = 300;
    let terraformBonus: number = 0;

    // Base terraform bonus.
    if (terraformState && terraformState > 0) {
      terraformBonus = 93328;
    }

    if (bodyType) {
      // Metal-rich body.
      if (BodyCodes.metalRich.includes(bodyType)) {
        value = 21790;

        if (terraformState && terraformState > 0) {
          terraformBonus = 65631;
        }

        // Ammonia world.
      } else if (BodyCodes.ammonia.includes(bodyType)) {
        value = 96932;

        // Class I gas giant.
      } else if (BodyCodes.classIGiant.includes(bodyType)) {
        value = 1656;

        // High metal content & Class II gas giant.
      } else if (
          BodyCodes.highMetalContent.includes(bodyType)
          || BodyCodes.classIIGiant.includes(bodyType)
      ) {
        value = 9654;

        if (terraformState && terraformState > 0) {
          terraformBonus = 100677;
        }

        // Earth-like world & water world.
      } else if (
          BodyCodes.earthLike.includes(bodyType)
          || BodyCodes.water.includes(bodyType)
      ) {
        value = 64831;

        if (terraformState && terraformState > 0) {
          terraformBonus = 116295;
        }

        // Earth-like always gets a bonus.
        if (BodyCodes.earthLike.includes(bodyType)) {
          terraformBonus = 116295;
        }
      }
    }

    // Mapping multiplier.
    let mapMultiplier: number = 3.3333333333;

    if (firstDiscover && firstMap) {
      mapMultiplier = 3.699622554;

    } else if (!firstDiscover && firstMap) {
      mapMultiplier = 8.0956;
    }

    // Efficiency bonus.
    mapMultiplier *= 1.25;

    // Final calculation.
    const q = 0.56591828;
    value += terraformBonus;

    let finalValue = Math.max((
                                  value + (
                                            value * Math.pow(mass, 0.2) * q
                                        )
                              ) * mapMultiplier, 500);

    // First discovery bonus.
    if (firstDiscover) {
      finalValue *= 2.6;
    }

    return Math.round(finalValue);
  }
}
