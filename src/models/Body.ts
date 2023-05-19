import type { SAAScanComplete, Scan } from '@kayahr/ed-journal';
import type { valuableBody } from '../@types/edsmResponses';

import { BodyCodes } from '../data/BodyCodes';

export interface Body extends Scan {}

export class Body {
  DSSDone: boolean;
  mappedValue: number;

  constructor(
      journalLine: Scan | SAAScanComplete | valuableBody | null = null,
      DSS: boolean                                              = false,
  ) {
    this.DSSDone = DSS;

    if (journalLine !== null) {
      Object.assign(this, journalLine);
    }

    this.mappedValue = this.#getValue();
  }

  /* ---------------------------------------------------------------------------- isAsteroid ---- */

  isAsteroid(): boolean {
    return this.BodyName?.includes('Belt');
  }

  /* ------------------------------------------------------------------------------ isPlanet ---- */

  isPlanet(): boolean {
    return !!this.PlanetClass;
  }

  /* -------------------------------------------------------------------------------- isStar ---- */

  isStar(): boolean {
    return !!this.StarType;
  }

  /* ------------------------------------------------------------------------------ nameIcon ---- */

  nameIcon(): string {
    let nameIcon: string = '';

    if (this.isAsteroid()) {
      nameIcon = 'asteroid-4';
    } else if (this.isStar()) {
      nameIcon = 'star';
    } else if (this.isPlanet()) {
      nameIcon = 'jupiter-3';
    }

    return nameIcon;
  }

  /* ---------------------------------------------------------------------------- simpleName ---- */

  simpleName(): string {
    let name: string = this.BodyName;

    if (typeof this.StarSystem === 'string') name = this.BodyName.replace(this.StarSystem, '');

    if (name === '') name = 'Star';

    return name;
  }

  /* ------------------------------------------------------------------------------ typeIcon ---- */

  typeIcon(): string {
    let typeIcon: string = '';

    if (this.isStar() || this.isAsteroid()) {
      typeIcon = this.nameIcon();
    } else {
      const planetClass: string | undefined = this.PlanetClass?.toLowerCase();

      if (planetClass?.includes('metal')) {
        typeIcon = 'ingot';
      } else if (planetClass?.includes('icy')) {
        typeIcon = 'snowflake';
      } else if (planetClass?.includes('earth')) {
        typeIcon = 'earth';
      } else if (planetClass?.includes('gas giant')) {
        typeIcon = 'jupiter-1';
      } else if (planetClass?.includes('rock')) {
        typeIcon = 'asteroid-3';
      } else if (planetClass?.includes('water') || planetClass?.includes('ammonia')) {
        typeIcon = 'water-drops';
      }
    }

    return typeIcon;
  }

  /* ------------------------------------------------------------------------------ getValue ---- */

  // https://forums.frontier.co.uk/threads/exploration-value-formulae.232000/
  // https://github.com/EDSM-NET/Component/blob/master/Body/Value.php

  #getValue(): number {
    const bodyType = this.#getNumericalBodyType();
    const mass     = this.MassEM !== undefined ? this.MassEM : 1;

    let terraformState = this.#getNumericalTerraformState();

    if (this.isStar()) {
      return this.#appraiseStar(bodyType, mass);

    } else if (this.isPlanet() || this.isAsteroid()) {
      return this.#appraisePlanet(bodyType, mass, terraformState);

    } else {
      return 0;
    }
  }

  /* ----------------------------------------------------------------- #getNumericalBodyType ---- */

  #getNumericalBodyType(): number | undefined {
    let code: number | undefined;

    if (this.isStar()) {
      // Typescript feels so stupid sometimes.
      code = BodyCodes.starTypes[this.StarType as keyof typeof BodyCodes.starTypes];
    } else if (this.isPlanet()) {
      code = BodyCodes.planetTypes[this.PlanetClass as keyof typeof BodyCodes.planetTypes];
    }

    return code;
  }

  /* ----------------------------------------------------------- #getNumericalTerraformState ---- */

  #getNumericalTerraformState(): number | undefined {
    let terraformState: number | undefined;

    if ('TerraformState' in this) {
      terraformState =
          BodyCodes.terraformStates[this.TerraformState as keyof typeof BodyCodes.terraformStates];
    }
    return terraformState;
  }

  /* ------------------------------------------------------------------------- #appraiseStar ---- */

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
        value = 33.5678;
      }
    }

    return Math.round(value + (mass * value / 66.25));
  }

  /* ----------------------------------------------------------------------- #appraisePlanet ---- */

  #appraisePlanet(
      bodyType: number | undefined,
      mass: number,
      terraformState: number | undefined,
  ): number {
    let value: number          = this.#calculatePlanetBaseValue(bodyType);
    let terraformBonus: number = this.#calculateTerraformBonus(bodyType, terraformState);
    let mapMultiplier: number  = this.#calculateMapMultiplier();

    // Final calculation.
    const q = 0.56591828;
    value += terraformBonus;

    let finalValue = Math.max((value + (value * Math.pow(mass, 0.2) * q)) * mapMultiplier, 500);

    // First discovery bonus.
    if (!this.WasDiscovered) {
      finalValue *= 2.6;
    }

    return Math.round(finalValue);
  }

  /* ------------------------------------------------------------- #calculatePlanetBaseValue ---- */

  #calculatePlanetBaseValue(bodyType: number | undefined): number {
    let value: number = 300;

    if (bodyType) {
      if (BodyCodes.metalRich.includes(bodyType)) {
        value = 21790;
      } else if (BodyCodes.ammonia.includes(bodyType)) {
        value = 96932;
      } else if (BodyCodes.classIGiant.includes(bodyType)) {
        value = 1656;
      } else if (
          BodyCodes.highMetalContent.includes(bodyType)
          || BodyCodes.classIIGiant.includes(bodyType)
      ) {
        value = 9654;
      } else if (BodyCodes.earthLike.includes(bodyType) || BodyCodes.water.includes(bodyType)) {
        value = 64831;
      }
    }

    return value;
  }

  /* -------------------------------------------------------------- #calculateTerraformBonus ---- */

  #calculateTerraformBonus(
      bodyType: number | undefined,
      terraformState: number | undefined,
  ): number {
    let bonus: number = 0;

    if (terraformState && terraformState > 0) {
      bonus = 93328;
    }

    if (bodyType && (terraformState && terraformState > 0)) {
      if (BodyCodes.metalRich.includes(bodyType)) {
        bonus = 65631;
      } else if (
          BodyCodes.highMetalContent.includes(bodyType)
          || BodyCodes.classIIGiant.includes(bodyType)
      ) {
        bonus = 100677;
      } else if (BodyCodes.water.includes(bodyType)) {
        bonus = 116295;
      }
    } else if (bodyType && BodyCodes.earthLike.includes(bodyType)) {
      bonus = 116295;
    }

    return bonus;
  }

  /* --------------------------------------------------------------- #calculateMapMultiplier ---- */

  #calculateMapMultiplier(): number {
    let multiplier: number = 3.3333333333;

    if (!this.WasDiscovered && !this.WasMapped) {
      multiplier = 3.699622554;

    } else if (this.WasDiscovered && !this.WasMapped) {
      multiplier = 8.0956;
    }

    // Efficiency bonus.
    multiplier *= 1.25;
    return multiplier;
  }
}
