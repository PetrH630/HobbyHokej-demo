// utils/matchPositionUtils.js 
import { PlayerPosition } from "../constants/playerPosition";

/**
 * Vypočítá kapacitu jednotlivých pozic pro jeden tým
 * podle seznamu pozic na ledě a počtu hráčů na tým.
 *
 * - Pořadí pozic je dáno `icePositions` (z getIcePositionsForMode).
 * - Pokud seznam obsahuje GOALIE, dostane 1 místo (pokud je kapacita > 0).
 * - Zbytek kapacity se rozdělí cyklicky podle `icePositions` bez GOALIE.
 *
 * @param {PlayerPosition[]} icePositions Pozice pro daný herní systém (z getIcePositionsForMode).
 * @param {number} slotsPerTeam Počet hráčů, kteří mohou být v jednom týmu (maxPlayers / 2).
 * @returns {Record<string, number>} Mapa pozice -> kapacita (kolik hráčů může být na této pozici v jednom týmu).
 */
/**
 * matchPositionUtils
 *
 * Pomocné funkce pro práci s pozicemi v zápase (mapování pozic, validace rozestavení, výběr volných míst).
 * Používá se v registrech a v přehledech obsazenosti pozic.
 */
export const buildPositionCapacityForMode = (icePositions, slotsPerTeam) => {
    const capacity = {};

    if (!Array.isArray(icePositions) || icePositions.length === 0) {
        return capacity;
    }

    const totalSlots = Math.max(0, slotsPerTeam || 0);
    if (totalSlots === 0) {
        return capacity;
    }

    const hasGoalie = icePositions.includes(PlayerPosition.GOALIE);
    let remainingSlots = totalSlots;

    // 1) Brankář – pokud systém obsahuje GOALIE, dáme mu 1 slot
    if (hasGoalie && remainingSlots > 0) {
        capacity[PlayerPosition.GOALIE] = 1;
        remainingSlots -= 1;
    }

    // 2) Bruslaři – všechny ostatní pozice v pořadí, jak vrací getIcePositionsForMode
    const skaterOrder = icePositions.filter(
        (pos) => pos !== PlayerPosition.GOALIE
    );

    if (skaterOrder.length === 0 || remainingSlots <= 0) {
        return capacity;
    }

    // 3) Dokud máme sloty, točíme skaterOrder dokola
    let idx = 0;
    while (remainingSlots > 0) {
        const pos = skaterOrder[idx % skaterOrder.length];
        capacity[pos] = (capacity[pos] || 0) + 1;
        remainingSlots -= 1;
        idx += 1;
    }

    return capacity;
};

/**
 * Pomocná funkce: vrátí pozice na ledě pro daný matchMode.
 * (Můžeš klidně přesunout z PlayerPositionModal sem a importovat,
 * pokud tu ještě není – držím se stejné logiky jako v komponentě.)
 */
export const getIcePositionsForMode = (modeKey) => {
    switch (modeKey) {
        case "THREE_ON_THREE_NO_GOALIE":
            return [
                PlayerPosition.DEFENSE,
                PlayerPosition.WING_LEFT,
                PlayerPosition.WING_RIGHT,
            ];
        case "THREE_ON_THREE_WITH_GOALIE":
            return [
                PlayerPosition.GOALIE,
                PlayerPosition.DEFENSE,
                PlayerPosition.WING_LEFT,
                PlayerPosition.WING_RIGHT,
            ];
        case "FOUR_ON_FOUR_NO_GOALIE":
            return [
                PlayerPosition.DEFENSE_LEFT,
                PlayerPosition.DEFENSE_RIGHT,
                PlayerPosition.WING_LEFT,
                PlayerPosition.WING_RIGHT,
            ];
        case "FOUR_ON_FOUR_WITH_GOALIE":
            return [
                PlayerPosition.GOALIE,
                PlayerPosition.DEFENSE_LEFT,
                PlayerPosition.DEFENSE_RIGHT,
                PlayerPosition.WING_LEFT,
                PlayerPosition.WING_RIGHT,
            ];
        case "FIVE_ON_FIVE_NO_GOALIE":
            return [
                PlayerPosition.DEFENSE_LEFT,
                PlayerPosition.DEFENSE_RIGHT,
                PlayerPosition.WING_LEFT,
                PlayerPosition.CENTER,
                PlayerPosition.WING_RIGHT,
            ];
        case "FIVE_ON_FIVE_WITH_GOALIE":
            return [
                PlayerPosition.GOALIE,
                PlayerPosition.DEFENSE_LEFT,
                PlayerPosition.DEFENSE_RIGHT,
                PlayerPosition.WING_LEFT,
                PlayerPosition.CENTER,
                PlayerPosition.WING_RIGHT,
            ];
        case "SIX_ON_SIX_NO_GOALIE":
            return [
                PlayerPosition.DEFENSE_LEFT,
                PlayerPosition.DEFENSE_RIGHT,
                PlayerPosition.DEFENSE,
                PlayerPosition.WING_LEFT,
                PlayerPosition.CENTER,
                PlayerPosition.WING_RIGHT,
            ];
        default:
            return [
                PlayerPosition.GOALIE,
                PlayerPosition.DEFENSE_LEFT,
                PlayerPosition.DEFENSE_RIGHT,
                PlayerPosition.WING_LEFT,
                PlayerPosition.CENTER,
                PlayerPosition.WING_RIGHT,
            ];
    }
};

/**
 * Zjistí obsazenost pozic pro jeden tým v rámci zápasu.
 *
 * Využívá:
 * - match.maxPlayers → pro výpočet slotsPerTeam (= maxPlayers / 2),
 * - getIcePositionsForMode(match.matchMode) - pořadí pozic,
 * - buildPositionCapacityForMode - kapacitu na jednotlivých pozicích,
 * - match.registrations - kolik hráčů už je na daných pozicích.
 *
 * Vrací:
 * - capacityByPosition: kapacita na pozici,
 * - occupiedCounts: kolik hráčů je na pozici,
 * - freeSlotsByPosition: kolik míst na pozici zbývá,
 * - fullPositions: pozice, kde freeSlots === 0 a kapacita > 0,
 * - totalFreeSlots: součet freeSlots přes všechny pozice,
 * - onlyGoalieLeft: true, pokud je volné místo už jen na GOALIE
 *   (tj. GOALIE má free > 0 a všechny ostatní mají free === 0).
 *
 * @param {Object} match MatchDetailDTO (nebo podobná struktura z backendu)
 * @param {"LIGHT"|"DARK"} team tým, pro který počítáme
 */
export const computeTeamPositionAvailability = (match, team) => {
    if (!match || !team) {
        return {
            capacityByPosition: {},
            occupiedCounts: {},
            freeSlotsByPosition: {},
            fullPositions: [],
            totalFreeSlots: 0,
            onlyGoalieLeft: false,
        };
    }

    const totalSlots = match?.maxPlayers ?? 0;
    const slotsPerTeam =
        typeof totalSlots === "number" && totalSlots > 0
            ? Math.floor(totalSlots / 2)
            : 0;

    const icePositions = getIcePositionsForMode(match.matchMode);
    const capacityByPosition = buildPositionCapacityForMode(
        icePositions,
        slotsPerTeam
    );

    // Registrace pro daný tým a pouze REGISTERED
    const registrations = match.registrations ?? [];
    const teamPlayers = registrations.filter(
        (r) => r.team === team && r.status === "REGISTERED"
    );

    // Spočítáme obsazenost na jednotlivých pozicích
    const occupiedCounts = teamPlayers.reduce((acc, reg) => {
        const pos = reg.positionInMatch;
        if (!pos) return acc;
        acc[pos] = (acc[pos] || 0) + 1;
        return acc;
    }, {});

    // Volná místa na jednotlivých pozicích
    const freeSlotsByPosition = {};
    Object.entries(capacityByPosition).forEach(([pos, cap]) => {
        const used = occupiedCounts[pos] || 0;
        const free = cap - used;
        freeSlotsByPosition[pos] = free > 0 ? free : 0;
    });

    // Plné pozice (kapacita > 0 a free === 0)
    const fullPositions = Object.entries(capacityByPosition)
        .filter(
            ([pos, cap]) =>
                cap > 0 && (freeSlotsByPosition[pos] ?? 0) === 0
        )
        .map(([pos]) => pos);

    // Celkový počet volných míst v týmu (na všech pozicích)
    const totalFreeSlots = Object.values(freeSlotsByPosition).reduce(
        (sum, free) => sum + free,
        0
    );

    // Zjistit, jestli zbývá jen místo na brankáře
    const goalieCapacity = capacityByPosition[PlayerPosition.GOALIE] || 0;
    const goalieFree = freeSlotsByPosition[PlayerPosition.GOALIE] || 0;

    let onlyGoalieLeft = false;
    if (goalieCapacity > 0 && goalieFree > 0) {
        const nonGoalieFreeSum = Object.entries(freeSlotsByPosition)
            .filter(([pos]) => pos !== PlayerPosition.GOALIE)
            .reduce((sum, [, free]) => sum + free, 0);
        onlyGoalieLeft = nonGoalieFreeSum === 0;
    }

    return {
        capacityByPosition,
        occupiedCounts,
        freeSlotsByPosition,
        fullPositions,
        totalFreeSlots,
        onlyGoalieLeft,
    };
};