interface journalEntry<eventType = string> {
    timestamp: string,
    event: eventType,
}

export interface discoveryHonk extends journalEntry<'FSSDiscoveryScan'> {
    Progress: number,
    BodyCount: number,
    NonBodyCount: number,
    SystemName: string,
    SystemAddress: number,
}

export interface completedSystemFSSScan extends journalEntry<'FSSAllBodiesFound'> {
    event: 'FSSAllBodiesFound',
    SystemName: string,
    SystemAddress: number,
    Count: number,
}

export interface dssIndicator extends journalEntry<'SAAScanComplete'> {
    BodyName: string,
    SystemAddress: number,
    BodyID: number,
    ProbesUsed: number,
    EfficiencyTarget: number,
}

interface bodyParent {
    [index: string]: number,
}

interface bodyAtmosphere {
    Name: string,
    Percent: number,
}

interface bodyMaterials {
    Name: string,
    Percent: number,
}

interface bodyRings {
    Name: string,
    RingClass: string,
    MassMT: number,
    InnerRad: number,
    OuterRad: number,
}

export interface starScan<scanType> extends journalEntry<'Scan'> {
    ScanType: scanType,
    BodyName: string,
    BodyID: number,
    Parents: bodyParent[],
    StarSystem: string,
    SystemAddress: number,
    DistanceFromArrivalLS: number,
    StarType: string,
    Subclass: number,
    StellarMass: number,
    Radius: number,
    AbsoluteMagnitude: number,
    Age_MY: number,
    SurfaceTemperature: number,
    Luminosity: string,
    SemiMajorAxis: number,
    Eccentricity: number,
    OrbitalInclination: number,
    Periapsis: number,
    OrbitalPeriod: number,
    AscendingNode: number,
    MeanAnomaly: number,
    RotationPeriod: number,
    AxialTilt: number,
    WasDiscovered: boolean,
    WasMapped: false,
}

export interface asteroidScan<scanType> extends journalEntry<'Scan'> {
    ScanType: scanType,
    BodyName: string,
    BodyID: number,
    Parents: bodyParent[],
    StarSystem: string,
    SystemAddress: number,
    DistanceFromArrivalLS: number,
    WasDiscovered: boolean,
    WasMapped: false,
}

export interface planetScan<scanType> extends journalEntry<'Scan'> {
    ScanType: scanType,
    BodyName: string,
    BodyID: number,
    Parents: bodyParent[],
    StarSystem: string,
    SystemAddress: number,
    DistanceFromArrivalLS: number,
    TidalLock: boolean,
    TerraformState: string,
    PlanetClass: string,
    Atmosphere: string,
    AtmosphereType: string,
    AtmosphereComposition?: bodyAtmosphere[]
    Volcanism: string,
    MassEM: number,
    Radius: number,
    SurfaceGravity: number,
    SurfaceTemperature: number,
    SurfacePressure: number,
    Landable: boolean,
    Materials: bodyMaterials[],
    Composition: {
        Ice: number,
        Rock: number,
        Metal: number,
    },
    SemiMajorAxis: number,
    Eccentricity: number,
    OrbitalInclination: number,
    Periapsis: number,
    OrbitalPeriod: number,
    AscendingNode: number,
    MeanAnomaly: number,
    RotationPeriod: number,
    AxialTilt: number,
    Rings?: bodyRings[],
    ReserveLevel?: string,
    WasDiscovered: boolean,
    WasMapped: boolean,
}

export type autoScan = starScan<'AutoScan'> & asteroidScan<'AutoScan'> & planetScan<'AutoScan'>
export type discoveryScan = starScan<'Detailed'> & asteroidScan<'Detailed'> & planetScan<'Detailed'>
export type fssScan = starScan<'Detailed'> & asteroidScan<'Detailed'> & planetScan<'Detailed'>
export type dssScan = starScan<'Detailed'> & asteroidScan<'Detailed'> & planetScan<'Detailed'>

export interface startFsdJump extends journalEntry<'StartJump'> {
    JumpType: 'Hyperspace',
    StarSystem: string,
    SystemAddress: number,
    StarClass: string,
}

interface faction {
    Name: string,
    FactionState: string,
    Government: string,
    Influence: number,
    Allegiance: string,
    Happiness: string,
    Happiness_Localized: string,
    MyReputation: number,
    RecoveringStates?: {State: string, Trend: number}[],
    ActiveStates?: {State: string}[],
}

export interface completeFsdJump extends journalEntry<'FSDJump'> {
    Taxi: boolean,
    Multicrew: boolean,
    StarSystem: string,
    SystemAddress: number,
    StarPos: [number, number, number],
    SystemAllegiance: string,
    SystemEconomy: string,
    SystemEconomy_Localised: string,
    SystemSecondEconomy: string,
    SystemSecondEconomy_Localised: string,
    SystemGovernment: string,
    SystemGovernment_Localised: string,
    SystemSecurity: string,
    SystemSecurity_Localised: string,
    Population: number,
    Body: string,
    BodyID: number,
    BodyType: string,
    JumpDist: number,
    FuelUsed: number,
    FuelLevel: number,
    Factions: faction[],
    SystemFaction: {Name: string},
}