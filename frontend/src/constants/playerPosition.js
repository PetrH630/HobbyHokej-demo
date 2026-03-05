// src/constants/playerPosition.js

export const PlayerPosition = {
    GOALIE: "GOALIE",
    DEFENSE_LEFT: "DEFENSE_LEFT",
    DEFENSE_RIGHT: "DEFENSE_RIGHT",
    CENTER: "CENTER",
    WING_LEFT: "WING_LEFT",
    WING_RIGHT: "WING_RIGHT",
    DEFENSE: "DEFENSE",
    FORWARD: "FORWARD",
    ANY: "ANY",
};

export const PLAYER_POSITION_OPTIONS = [
    { value: PlayerPosition.GOALIE, label: "Brankář" },
    { value: PlayerPosition.DEFENSE_LEFT, label: "Levý obránce" },
    { value: PlayerPosition.DEFENSE_RIGHT, label: "Pravý obránce" },
    { value: PlayerPosition.CENTER, label: "Centr" },
    { value: PlayerPosition.WING_LEFT, label: "Levé křídlo" },
    { value: PlayerPosition.WING_RIGHT, label: "Pravé křídlo" },
    { value: PlayerPosition.DEFENSE, label: "Obránce" },
    { value: PlayerPosition.FORWARD, label: "Útočník" },
    { value: PlayerPosition.ANY, label: "Hráč i Brankář" },
];

/**
 * Vrátí label podle enum hodnoty.
 */
export const getPlayerPositionLabel = (value) => {
    const found = PLAYER_POSITION_OPTIONS.find(
        (opt) => opt.value === value
    );
    return found ? found.label : value || "-";
};