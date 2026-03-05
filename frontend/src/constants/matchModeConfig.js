// src/constants/matchModeConfig.js

/**
 * Konfigurace herních systémů podle backend enumu MatchMode.
 *
 * Musí zůstat 1:1 s Java enumem:
 *  - název klíče = název enumu v backendu
 *  - skatersPerTeam, goalieIncluded = stejné parametry jako v Java konstruktoru
 *
 * Navíc:
 *  - label: text pro select / zobrazení
 */
export const MATCH_MODE_CONFIG = {
    THREE_ON_THREE_NO_GOALIE: {
        skatersPerTeam: 3,
        goalieIncluded: false,
        label: "3 na 3",
    },
    THREE_ON_THREE_WITH_GOALIE: {
        skatersPerTeam: 3,
        goalieIncluded: true,
        label: "3 na 3 + gólmani",
    },
    FOUR_ON_FOUR_NO_GOALIE: {
        skatersPerTeam: 4,
        goalieIncluded: false,
        label: "4 na 4",
    },
    FOUR_ON_FOUR_WITH_GOALIE: {
        skatersPerTeam: 4,
        goalieIncluded: true,
        label: "4 na 4 + gólmani",
    },
    FIVE_ON_FIVE_NO_GOALIE: {
        skatersPerTeam: 5,
        goalieIncluded: false,
        label: "5 na 5",
    },
    FIVE_ON_FIVE_WITH_GOALIE: {
        skatersPerTeam: 5,
        goalieIncluded: true,
        label: "5 na 5 + gólmani",
    },
    SIX_ON_SIX_NO_GOALIE: {
        skatersPerTeam: 6,
        goalieIncluded: false,
        label: "6 na 6",
    },
};

/**
 * Výpočet počtu hráčů na jeden tým dle logiky backendu:
 *
 * getPlayersPerTeam():
 *   - hráči v poli mají střídání (2x)
 *   - brankář se nestřídá (max 1 na tým)
 *
 * playersPerTeam = skatersPerTeam * 2 + (goalieIncluded ? 1 : 0)
 */
export const calculatePlayersPerTeam = (modeKey) => {
    if (!modeKey || !MATCH_MODE_CONFIG[modeKey]) return null;

    const { skatersPerTeam, goalieIncluded } = MATCH_MODE_CONFIG[modeKey];

    return skatersPerTeam * 2 + (goalieIncluded ? 1 : 0);
};

/**
 * Výpočet celkové kapacity zápasu (maxPlayers pro oba týmy).
 *
 * getPlayersPerTeam() * 2
 */
export const calculateMaxPlayers = (modeKey) => {
    const playersPerTeam = calculatePlayersPerTeam(modeKey);
    if (playersPerTeam == null) return "";

    return playersPerTeam * 2;
};

/**
 * Pomocná struktura pro selecty (value + label).
 */
export const MATCH_MODE_OPTIONS = Object.entries(MATCH_MODE_CONFIG).map(
    ([value, cfg]) => ({
        value,
        label: cfg.label,
    })
);