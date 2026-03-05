// src/components/matchRegistration/PositionModalView.jsx
import React, { useMemo } from "react";
import { useGlobalModal } from "../../hooks/useGlobalModal";
import {
    PLAYER_POSITION_OPTIONS,
    PlayerPosition,
} from "../../constants/playerPosition";
import { MATCH_MODE_CONFIG } from "../../constants/matchModeConfig";
import { useMatchTeamPositionOverview } from "../../hooks/useMatchTeamPositionOverview";
import "./MatchRegistrationRinkModal.css";
import {
    TeamDarkIcon,
    TeamLightIcon,
} from "../../icons";
/**
 * PositionModalView
 *
 * Read-only modal pro zobrazení rozložení hráčů na pozicích pro vybraný tým.
 * Data o obsazenosti pozic se načítají z backendu přes useMatchTeamPositionOverview.
 *
 * Komponenta:
 * - vykresluje kluziště a nad něj sloty s pozicemi,
 * - zobrazuje hráče na pozicích jako pills,
 * - zvýrazňuje aktuálního hráče,
 * - zobrazuje čekací listinu (náhradníky) pod kluzištěm.
 *
 * Props:
 * @param {boolean} props.isOpen Určuje, zda je dialog otevřený.
 * @param {Function} props.onClose Callback pro zavření modalu.
 * @param {MatchDTO} props.match Data vybraného zápasu načtená z backendu.
 * @param {string|null} props.focusTeam Vybraný tým (DARK/LIGHT), pro který se má načíst rozložení.
 * @param {string|number|null} props.currentPlayerId Identifikátor aktuálního hráče, pokud není předán objekt hráče.
 * @param {PlayerDTO} props.currentPlayer Aktuálně zvolený hráč (přihlášený nebo vybraný v aplikaci).
 */
const PositionModalView = ({
    isOpen,
    onClose,
    match,
    focusTeam,
    currentPlayerId,
    currentPlayer,
}) => {
    useGlobalModal(isOpen);

    const matchId = match?.id ?? match?.matchId ?? null;

    const { data: teamPositions, loading, error } =
        useMatchTeamPositionOverview(matchId, focusTeam, isOpen);

    /**
     * Koordináty pozic se vyhodnocují jako procenta vůči rozměru .rink-stage.
     * Protože uvnitř .rink-stage je <img> na 100% šířku i výšku,
     * souřadnice sedí na skutečně vykreslený obrázek.
     */
    const POSITION_COORDS = {
        [PlayerPosition.GOALIE]: { left: "50%", top: "70%" },
        [PlayerPosition.DEFENSE_LEFT]: { left: "10%", top: "50%" },
        [PlayerPosition.DEFENSE_RIGHT]: { left: "90%", top: "50%" },
        [PlayerPosition.DEFENSE]: { left: "50%", top: "50%" },
        [PlayerPosition.CENTER]: { left: "50%", top: "18%" },
        [PlayerPosition.WING_LEFT]: { left: "8%", top: "11%" },
        [PlayerPosition.WING_RIGHT]: { left: "92%", top: "11%" },
    };

    /**
     * Určuje, z jaké strany se má pozice „rozbalovat“:
     * - right: box se přichytí pravým okrajem na souřadnici (nepřeteče mimo rink)
     * - center: box se vycentruje na souřadnici
     * - left: box začne na souřadnici vlevo a roste doprava
     */
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

    const getLabel = (value) => {
        const found = PLAYER_POSITION_OPTIONS.find((opt) => opt.value === value);
        return found ? found.label : value;
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

    const matchModeKey = teamPositions?.matchMode || match?.matchMode || null;

    const modeLabel =
        (matchModeKey && MATCH_MODE_CONFIG[matchModeKey]?.label) ||
        matchModeKey ||
        "Neznámý systém";

    const positionSlots = teamPositions?.positionSlots ?? [];

    const benchPlayers = useMemo(() => {
        if (!positionSlots.length) return [];

        const result = [];
        const seen = new Set();

        positionSlots.forEach((slot) => {
            (slot.reservedPlayers ?? []).forEach((p) => {
                const key = String(p.playerId ?? p.id ?? p.playerName);
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push(p);
                }
            });
        });

        return result;
    }, [positionSlots]);

    const renderSlotPills = (slot) => {
        const capacity = slot.capacity ?? 0;
        const regs = slot.registeredPlayers ?? [];
        const reserves = slot.reservedPlayers ?? [];
        const freeSlots = Math.max(0, slot.free ?? capacity - regs.length);

        return (
            <div className="pmv-names">
                {regs.map((p) => {
                    const pid = p.playerId ?? p.id;
                    const rawName =
                        p.playerName ?? p.fullName ?? `Hráč ${pid ?? "?"}`;
                    const name = formatPlayerName(rawName);
                    const isCurrent = isCurrentPlayer(pid, rawName);

                    return (
                        <div
                            key={pid ?? name}
                            className={[
                                "pmv-name-pill",
                                "pmv-name-red",
                                isCurrent ? "pmv-name-current" : "",
                            ].join(" ")}
                            title={name}
                        >
                            {name}
                        </div>
                    );
                })}

                {Array.from({ length: freeSlots }).map((_, idx) => (
                    <div
                        key={`empty-${slot.position}-${idx}`}
                        className="pmv-name-pill pmv-name-empty"
                        title="Volné místo"
                    >
                        Volné místo
                    </div>
                ))}

                {reserves.map((p) => {
                    const pid = p.playerId ?? p.id;
                    const rawName =
                        p.playerName ?? p.fullName ?? `Hráč ${pid ?? "?"}`;
                    const name = formatPlayerName(rawName);
                    const isCurrent = isCurrentPlayer(pid, rawName);

                    return (
                        <div
                            key={`reserve-${slot.position}-${pid ?? name}`}
                            className={[
                                "pmv-name-pill",
                                "pmv-name-reserve",
                                isCurrent ? "pmv-name-current-reserve" : "",
                            ].join(" ")}
                            title={`Náhradník - ${name}`}
                        >
                            {name}
                        </div>
                    );
                })}
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
                        {loading && (
                            <div className="text-center text-muted small mb-2">
                                Načítám rozložení pozic pro tým {focusTeam}…
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger py-1 small">
                                {error}
                            </div>
                        )}

                        {!focusTeam && (
                            <div className="text-center text-muted small mb-2">
                                Vyber tým (DARK/LIGHT), aby se zobrazilo
                                rozložení hráčů.
                            </div>
                        )}

                        <div className="rink-wrapper">
                            <div className="rink-scale border-on-image">
                                <div className="rink-stage">
                                    <img
                                        src="/IceRing.png"
                                        alt="Schéma kluziště"
                                        className="rink-image"
                                    />

                                    {positionSlots.map((slot) => {
                                        const pos = slot.position;
                                        const coords = POSITION_COORDS[pos];
                                        if (!coords) return null;

                                        const label = getLabel(pos);
                                        const alignClass = getAlignClass(pos);

                                        return (
                                            <div
                                                key={pos}
                                                className={["pmv-position", alignClass].join(" ")}
                                                style={{
                                                    left: coords.left,
                                                    top: coords.top,
                                                }}
                                                aria-label={label}
                                                title={label}
                                            >
                                                <div className="pmv-position-box">
                                                    <div className="pmv-position-title">
                                                        {label}
                                                    </div>
                                                    <div className="pmv-position-content">
                                                        {renderSlotPills(slot)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {benchPlayers.length > 0 && (
                            <div className="pmv-bench">
                                <div className="pmv-bench-title">
                                    Čekací listina / náhradníci ({focusTeam})
                                </div>
                                <div className="pmv-bench-list">
                                    {benchPlayers.map((p) => {
                                        const pid = p.playerId ?? p.id;
                                        const rawName =
                                            p.playerName ??
                                            p.fullName ??
                                            `Hráč ${pid ?? "?"}`;
                                        const name = formatPlayerName(rawName);
                                        const isCurrent = isCurrentPlayer(pid, rawName);

                                        return (
                                            <span
                                                key={pid ?? name}
                                                className={[
                                                    "pmv-bench-chip",
                                                    isCurrent ? "pmv-name-current-reserve" : "",
                                                ].join(" ")}
                                                title={name}
                                            >
                                                {name}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {focusTeam &&
                            !loading &&
                            !error &&
                            positionSlots.length === 0 && (
                                <div className="text-center text-muted small mt-2">
                                    Pro vybraný tým zatím nejsou k dispozici
                                    žádné pozice nebo registrace.
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PositionModalView;