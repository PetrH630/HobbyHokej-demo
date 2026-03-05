import React, { useMemo } from "react";
import { useGlobalModal } from "../../hooks/useGlobalModal";
import {
    PLAYER_POSITION_OPTIONS,
    PlayerPosition,
} from "../../constants/playerPosition";
import { MATCH_MODE_CONFIG } from "../../constants/matchModeConfig";
import "./MatchRegistrationRinkModal.css";
import { getIcePositionsForMode } from "../../utils/matchPositionUtils";
import { useMatchTeamPositionOverview } from "../../hooks/useMatchTeamPositionOverview";
import {    
    TeamDarkIcon,
    TeamLightIcon,
} from "../../icons";

/**
 * PlayerPositionModal
 *
 * Modal pro výběr pozice v zápase.
 * Vykreslení pozic používá stejné rozložení jako PositionModalView (.pmv-position*),
 * ale interakce je povolena přes třídu .pmv-position--interactive a klikatelné pills.
 *
 * Props:
 * @param {boolean} props.isOpen určuje, zda je dialog otevřený.
 * @param {Function} props.onClose callback pro zavření modalu.
 * @param {Function} props.onSelectPosition callback pro výběr pozice.
 * @param {MatchDTO} props.match Data vybraného zápasu.
 * @param {string|null} props.focusTeam Vybraný tým (DARK/LIGHT).
 * @param {PlayerPosition} props.defaultPosition Předvybraná pozice.
 * @param {string|null} props.matchModeKey Klíč režimu zápasu (fallback, pokud ještě nejsou data z DTO).
 * @param {Array} props.occupiedPositions Fallback seznam obsazených pozic (pokud ještě nejsou data z DTO).
 * @param {boolean} props.isCapacityFull Fallback informace o kapacitě zápasu.
 * @param {Object|null} props.positionCounts Fallback počty hráčů na pozicích.
 * @param {boolean} props.onlyGoalieLeft Fallback informace, že je volný už jen gólman.
 * @param {string|number|null} props.currentPlayerId Identifikátor aktuálního hráče (volitelné).
 * @param {PlayerDTO|null} props.currentPlayer Aktuální hráč (volitelné).
 */
const PlayerPositionModal = ({
    isOpen,
    onClose,
    onSelectPosition,
    match,
    focusTeam,

    defaultPosition = PlayerPosition.ANY,
    matchModeKey: matchModeKeyProp,
    occupiedPositions = [],
    isCapacityFull: isCapacityFullProp = false,
    positionCounts = null,
    onlyGoalieLeft: onlyGoalieLeftProp = false,

    // volitelné zvýraznění aktuálního hráče
    currentPlayerId,
    currentPlayer,
}) => {
    useGlobalModal(isOpen);

    const matchId = match?.id ?? match?.matchId ?? null;

    const { data: teamPositions, loading, error } = useMatchTeamPositionOverview(
        matchId,
        focusTeam,
        isOpen && !!matchId && !!focusTeam
    );

    const occupiedSet = new Set(occupiedPositions ?? []);

    const matchModeKey = teamPositions?.matchMode || matchModeKeyProp || null;

    const modeLabel =
        (matchModeKey && MATCH_MODE_CONFIG[matchModeKey]?.label) ||
        matchModeKey ||
        "Neznámý systém";

    const POSITION_COORDS = {
        [PlayerPosition.GOALIE]: { left: "50%", top: "70%" },
        [PlayerPosition.DEFENSE_LEFT]: { left: "10%", top: "50%" },
        [PlayerPosition.DEFENSE_RIGHT]: { left: "90%", top: "50%" },
        [PlayerPosition.DEFENSE]: { left: "50%", top: "50%" },
        [PlayerPosition.CENTER]: { left: "50%", top: "18%" },
        [PlayerPosition.WING_LEFT]: { left: "8%", top: "11%" },
        [PlayerPosition.WING_RIGHT]: { left: "92%", top: "11%" },
    };

    const icePositions = getIcePositionsForMode(matchModeKey);

    const getLabel = (value) => {
        const found = PLAYER_POSITION_OPTIONS.find((opt) => opt.value === value);
        return found ? found.label : value;
    };

    const getAlignClass = (position) => {
        switch (position) {
            case PlayerPosition.WING_RIGHT:
            case PlayerPosition.DEFENSE_RIGHT:
                return "pmv-position--right";
            case PlayerPosition.CENTER:
            case PlayerPosition.DEFENSE:
            case PlayerPosition.GOALIE:
                return "pmv-position--center";
            default:
                return "pmv-position--left";
        }
    };

    const formatPlayerName = (fullName) => {
        if (!fullName) return "";
        const parts = fullName.trim().split(/\s+/);

        if (parts.length === 1) {
            return parts[0].toUpperCase();
        }

        const firstInitial = parts[0][0].toUpperCase();
        const lastName = parts[parts.length - 1].toUpperCase();
        return `${firstInitial}. ${lastName}`;
    };

    const normalizeNameKey = (name) => {
        if (!name) return "";
        return String(name).trim().toLowerCase().replace(/\s+/g, " ");
    };

    const currentIdKey = useMemo(() => {
        const raw =
            currentPlayerId ??
            currentPlayer?.playerId ??
            currentPlayer?.id ??
            null;

        return raw == null ? null : String(raw);
    }, [currentPlayerId, currentPlayer]);

    const currentNameKey = useMemo(() => {
        const raw =
            currentPlayer?.playerName ??
            currentPlayer?.fullName ??
            currentPlayer?.name ??
            null;

        return normalizeNameKey(raw);
    }, [currentPlayer]);

    const isCurrentPlayer = (pid, rawName) => {
        if (currentIdKey != null && pid != null) {
            if (String(pid) === currentIdKey) return true;
        }
        if (currentNameKey) {
            const nameKey = normalizeNameKey(rawName);
            if (nameKey && nameKey === currentNameKey) return true;
        }
        return false;
    };

    const positionSlots = teamPositions?.positionSlots ?? [];

    const findSlotForPosition = (pos) =>
        positionSlots.find((s) => s.position === pos) || null;

    const getCount = (pos) => {
        if (teamPositions) {
            const slot = findSlotForPosition(pos);
            const regs = slot?.registeredPlayers ?? [];
            return regs.length || slot?.occupied || 0;
        }
        if (positionCounts && typeof positionCounts[pos] === "number") {
            return positionCounts[pos];
        }
        return 0;
    };

    const isFull = (pos) => {
        if (teamPositions) {
            const slot = findSlotForPosition(pos);
            const free = slot?.free ?? 0;
            return free <= 0;
        }
        return occupiedSet.has(pos);
    };

    const isCapacityFullFromDto = useMemo(() => {
        if (!teamPositions || !positionSlots.length) return null;
        const totalOccupied = positionSlots.reduce(
            (sum, s) => sum + (s.occupied ?? 0),
            0
        );
        const maxPlayers = teamPositions.maxPlayers ?? null;
        if (maxPlayers == null) return null;
        return totalOccupied >= maxPlayers;
    }, [teamPositions, positionSlots]);

    const isCapacityFull =
        typeof isCapacityFullFromDto === "boolean"
            ? isCapacityFullFromDto
            : isCapacityFullProp;

    const onlyGoalieLeftFromDto = useMemo(() => {
        if (!teamPositions || !positionSlots.length) return null;

        const goalieSlot = positionSlots.find(
            (s) => s.position === PlayerPosition.GOALIE
        );
        const goalieFree = (goalieSlot?.free ?? 0) > 0;

        const anyNonGoalieFree = positionSlots.some(
            (s) =>
                s.position !== PlayerPosition.GOALIE && (s.free ?? 0) > 0
        );

        return goalieFree && !anyNonGoalieFree;
    }, [teamPositions, positionSlots]);

    const onlyGoalieLeft =
        typeof onlyGoalieLeftFromDto === "boolean"
            ? onlyGoalieLeftFromDto
            : onlyGoalieLeftProp;

    const handleClick = (pos) => {
        if (!onSelectPosition) return;
        if (isFull(pos)) return;
        onSelectPosition(pos);
    };

    const handleReserveClick = (pos) => {
        if (!onSelectPosition) return;
        onSelectPosition(pos, { reserve: true });
    };

    const renderSelectableSlotPills = (pos) => {
        if (!teamPositions) {
            const cnt = getCount(pos);
            return (
                <div className="pmv-names pmv-names--wrap">
                    <div className="pmv-name-pill pmv-name-info">
                        Hráčů na pozici: {cnt}
                    </div>
                </div>
            );
        }

        const slot = findSlotForPosition(pos);
        const capacity = slot?.capacity ?? 0;
        const regs = slot?.registeredPlayers ?? [];
        const occupied = regs.length;
        const free = Math.max(0, slot?.free ?? capacity - occupied);

        const isFullPosition = capacity > 0 && free === 0 && occupied > 0;

        const filledPills = regs.map((p) => {
            const pid = p.playerId ?? p.id;
            const rawName = p.playerName ?? p.fullName ?? `Hráč ${pid ?? "?"}`;
            const name = formatPlayerName(rawName);
            const hasDash = rawName.includes("-");
            const isCurrent = isCurrentPlayer(pid, rawName);

            return (
                <div
                    key={pid ?? name}
                    className={[
                        "pmv-name-pill",
                        hasDash ? "pmv-name-green" : "pmv-name-red",
                        isCurrent ? "pmv-name-current" : "",
                    ].join(" ")}
                    title={rawName}
                >
                    {name}
                </div>
            );
        });

        const freePills = Array.from({ length: free }).map((_, idx) => (
            <button
                key={`free-${pos}-${idx}`}
                type="button"
                className="pmv-name-pill pmv-name-empty pmv-name-clickable"
                title="Volné místo - kliknutím se na tuto pozici přihlásíš"
                onClick={() => handleClick(pos)}
            >
                Volné místo
            </button>
        ));

        const reservePill = isFullPosition ? (
            <button
                key={`reserve-${pos}`}
                type="button"
                className="pmv-name-pill pmv-name-reserve pmv-name-clickable"
                title="Přihlásíš se jako náhradník na tuto pozici"
                onClick={() => handleReserveClick(pos)}
            >
                Náhradník
            </button>
        ) : null;

        return (
            <div className="pmv-names pmv-names--wrap">
                {filledPills}
                {freePills}
                {reservePill}
                {capacity === 0 && (
                    <div className="pmv-name-pill pmv-name-info">
                        Bez definované kapacity
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="modal d-block custom-modal-overlay" tabIndex="-1" role="dialog">
            <div
                className="modal-dialog modal-dialog-centered custom-modal-dialog"
                role="document"
            >
                <div className="modal-content">
                    <div className="modal-header d-flex justify-content-between align-items-start">
                        <div>
                            <h5 className="modal-title mb-0">Rozložení hráčů</h5>

                            <div className="text-muted small d-flex align-items-center gap-2">
                                Mód: <strong>{modeLabel}</strong>

                                {focusTeam ? (
                                    <>
                                        {" "}• Tým:
                                        <span className="d-flex align-items-center ms-1">
                                            {focusTeam === "DARK" && (
                                                <TeamDarkIcon className="match-reg-team-icon-dark" />
                                            )}
                                            {focusTeam === "LIGHT" && (
                                                <TeamLightIcon className="match-reg-team-icon-light" />
                                            )}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {" "}•{" "}
                                        <span className="text-muted">
                                            Tým není vybrán
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={onClose}
                        />
                    </div>

                    <div className="modal-body pmv-modal-body">
                        <div className="rink-wrapper mb-3">
                            <div className="rink-scale">
                                <div className="rink-stage">
                                    <img
                                        src="/IceRing.png"
                                        alt="Schéma kluziště"
                                        className="rink-image"
                                    />

                                    {icePositions.map((pos) => {
                                        const coords = POSITION_COORDS[pos];
                                        if (!coords) return null;

                                        const active = pos === defaultPosition;
                                        const full = isFull(pos);
                                        const label = getLabel(pos);
                                        const alignClass = getAlignClass(pos);

                                        const title = full
                                            ? `${label} – pozice je plně obsazena`
                                            : `${label} – pozice má volná místa`;

                                        return (
                                            <div
                                                key={pos}
                                                className={[
                                                    "pmv-position",
                                                    "pmv-position--interactive",
                                                    alignClass,
                                                    active ? "rink-position-badge-active" : "",
                                                    full
                                                        ? "rink-position-badge-full"
                                                        : "rink-position-badge-free",
                                                ].join(" ")}
                                                style={{
                                                    left: coords.left,
                                                    top: coords.top,
                                                }}
                                                title={title}
                                                aria-label={title}
                                            >
                                                <div className="pmv-position-box">
                                                    <div className="pmv-position-title">
                                                        {label}
                                                    </div>
                                                    <div className="pmv-position-content">
                                                        {renderSelectableSlotPills(pos)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <p className="mb-2 text-center text-muted small">
                                Načítám obsazenost pozic…
                            </p>
                        )}

                        {error && (
                            <div className="alert alert-danger py-1 small">
                                {error}
                            </div>
                        )}

                        {isCapacityFull ? (
                            <p className="mb-3 text-center text-muted small">
                                Kapacita zápasu je aktuálně{" "}
                                <strong>naplněna</strong>. Můžeš si zvolit
                                pozici dole a budeš zařazen na{" "}
                                <strong>čekací listinu</strong>.
                            </p>
                        ) : onlyGoalieLeft ? (
                            <p className="mb-3 text-center text-muted small">
                                Volné místo je už jen pro brankáře. Můžeš být
                                jako náhradník <strong>obránce</strong> nebo{" "}
                                <strong>útočník</strong>.
                            </p>
                        ) : (
                            <p className="mb-3 text-center text-muted small">
                                Kliknutím na <strong>„Volné místo“</strong> u
                                konkrétní pozice se přihlásíš k zápasu.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerPositionModal;