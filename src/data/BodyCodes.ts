export const BodyCodes = {
    // https://github.com/EDSM-NET/Alias/blob/master/Body/Star/Type.php
    starTypes: {
        // Main sequence
        'O': 1,

        'B': 2,
        'B_BlueSuperGiant': 201,

        'A': 3,
        'A_BlueWhiteSuperGiant': 301,

        'F': 4,
        'F_WhiteSuperGiant': 401,

        'G': 5,
        'G_WhiteSuperGiant': 5001,

        'K': 6,
        'K_OrangeGiant': 601,

        'M': 7,
        'M_RedGiant': 701,
        'M_RedSuperGiant': 702,

        'L': 8,
        'T': 9,
        'Y': 10,

        // Proto stars
        'TTS': 11,
        'AeBe': 12,

        // Wolf-Rayet
        'W': 21,
        'WN': 22,
        'WNC': 23,
        'WC': 24,
        'WO': 25,

        // Carbon stars
        'CS': 31,
        'C': 32,
        'CN': 33,
        'CJ': 34,
        'CH': 35,
        'CHd': 36,

        'MS': 41,
        'S': 42,

        // White dwarfs
        'D': 51,
        'DA': 501,
        'DAB': 502,
        'DAO': 503,
        'DAZ': 504,
        'DAV': 505,
        'DB': 506,
        'DBZ': 507,
        'DBV': 508,
        'DO': 509,
        'DOV': 510,
        'DQ': 511,
        'DC': 512,
        'DCV': 513,
        'DX': 514,

        'N': 91,
        'H': 92,
        'SuperMassiveBlackHole': 93,

        'X': 94,

        'RoguePlanet': 111,
        'Nebula': 112,
        'StellarRemnantNebula': 113,
    },

    // https://github.com/EDSM-NET/Alias/blob/master/Body/Planet/Type.php
    planetTypes: {
        'Metal-rich body': 1,
        'Metal rich body': 1,

        'High metal content world': 2,
        'High metal content body': 2,

        'Rocky body': 11,

        'Rocky Ice world': 12,
        'Rocky ice body': 12,

        'Icy body': 21,

        'Earth-like world': 31,
        'Earthlike body': 31,

        'Water world': 41,

        'Water giant': 42,
        'Water giant with life': 43,

        'Ammonia world': 51,

        'Gas giant with water-based life': 61,
        'Gas giant with water based life': 61,

        'Gas giant with ammonia-based life': 62,
        'Gas giant with ammonia based life': 62,

        'Class I gas giant': 71,
        'Class II gas giant': 72,
        'Class III gas giant': 73,
        'Class IV gas giant': 74,
        'Class V gas giant': 75,

        'Sudarsky class I gas giant': 71,
        'Sudarsky class II gas giant': 72,
        'Sudarsky class III gas giant': 73,
        'Sudarsky class IV gas giant': 74,
        'Sudarsky class V gas giant': 75,

        'Helium-rich gas giant': 81,
        'Helium rich gas giant': 81,
        'Helium gas giant': 82,
    },

    // https://github.com/EDSM-NET/Alias/blob/master/Body/Planet/TerraformState.php
    terraformStates: {
        'Not terraformable': 0,

        'Candidate for terraforming': 1,
        'Terraformable': 1,

        'Terraforming completed': 2,
        'Terraformed': 2,

        'Being terraformed': 3,
        'Terraforming': 3,
    },

    // Star categories
    whiteDwarf: [51, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514],
    neutronStar: [91],
    blackHole: [92],
    superMassiveBlackHole: [93],

    // Planet categories
    metalRich: [1],
    ammonia: [51],
    classIGiant: [71],
    highMetalContent: [2],
    classIIGiant: [72],
    earthLike: [31],
    water: [41],
}