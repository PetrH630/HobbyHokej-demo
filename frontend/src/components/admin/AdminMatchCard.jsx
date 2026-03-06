import { useState } from "react";
import RoleGuard from "../RoleGuard";
import AdminMatchHistory from "./AdminMatchHistory";
import AdminMatchDetailInline from "./AdminMatchDetailInline";
import {
    matchStatusLabel,
    matchCancelReasonLabel,
} from "../../utils/matchFormatter";
import { useGlobalDim } from "../../hooks/useGlobalDim";
import ConfirmActionModal from "../common/ConfirmActionModal";
import { MATCH_MODE_CONFIG } from "../../constants/matchModeConfig";
import { TeamDarkIcon, TeamLightIcon, UserIcon, MoneyIcon } from "../../icons";

import {
    InfoCircle,
    PencilSquare,
    ClockHistory,
    XOctagon,
    ArrowCounterclockwise,
} from "react-bootstrap-icons";


/**
 * AdminMatchCard
 *
 * Karta pro zobrazení přehledových informací o zápasu
 * a pro spuštění administračních akcí nad vybraným zápasem.
 *
 * Komponenta umožňuje:
 * - zobrazit detail zápasu,
 * - zobrazit historii změn,
 * - otevřít formulář pro úpravu,
 * - zrušit nebo obnovit zápas.
 *
 * V jednu chvíli může být otevřen pouze jeden rozbalovací blok,
 * aby se detail a historie nepřekrývaly.
 *
 * @param {Object} props Vstupní parametry komponenty.
 * @param {MatchDTO} props.match Data vybraného zápasu načtená z backendu.
 * @param {Function} props.onEdit Callback pro otevření editace zápasu.
 * @param {Function} props.onDelete Callback pro smazání zápasu.
 * @param {Function} props.onCancel Callback pro zrušení zápasu.
 * @param {Function} props.onUnCancel Callback pro obnovení zrušeného zápasu.
 * @returns {JSX.Element} Karta zápasu s akcemi a rozbalovacím obsahem.
 */
const AdminMatchCard = ({ match, onEdit, onDelete, onCancel, onUnCancel }) => {
    const [activePanel, setActivePanel] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const isExpanded = activePanel !== null;
    const dimActive = isExpanded;

    useGlobalDim(dimActive);

    const statusText = matchStatusLabel(match.matchStatus);
    const cancelReasonText = matchCancelReasonLabel(match.cancelReason);

    const isCanceled = match.matchStatus === "CANCELED";

    /**
     * Bezpečně převede řetězec data a času z backendu
     * na instanci Date pro účely formátování v UI.
     *
     * @param {string} dt Datum a čas ve formátu vráceném backendem.
     * @returns {Date|null} Instance Date nebo null při neplatné hodnotě.
     */
    const parseDateTime = (dt) => {
        if (!dt) return null;
        const safe = dt.replace(" ", "T");
        const d = new Date(safe);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    /**
     * Vrátí textovou reprezentaci data a času
     * včetně dne v týdnu pro zobrazení v administraci.
     *
     * @param {string} dt Datum a čas zápasu.
     * @returns {{day: string, dateTime: string}} Objekt s názvem dne a formátovaným datem.
     */
    const formatWithDay = (dt) => {
        const d = parseDateTime(dt);
        if (!d) return { day: "-", dateTime: "-" };

        const dayName = new Intl.DateTimeFormat("cs-CZ", {
            weekday: "long",
        }).format(d);

        const datePart = new Intl.DateTimeFormat("cs-CZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(d);

        const timePart = d.toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit",
        });

        return {
            day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            dateTime: `${datePart} ${timePart}`,
        };
    };

    const formatted = formatWithDay(match.dateTime);

    const matchDate = parseDateTime(match.dateTime);
    const now = new Date();
    const isPast = matchDate ? matchDate < now : false;

    let badgeText = "budoucí";
    let badgeClass = "bg-success";

    if (isCanceled) {
        badgeText = "zrušený";
        badgeClass = "bg-danger";
    } else if (isPast) {
        badgeText = "uplynulý";
        badgeClass = "bg-secondary";
    }

    /**
     * Přepne aktivní rozbalovací sekci.
     * Pokud je kliknuto na již otevřenou sekci, sekce se zavře.
     *
     * @param {"detail"|"history"} panel Název sekce, která se má přepnout.
     */
    const togglePanel = (panel) => {
        setActivePanel((prev) => (prev === panel ? null : panel));
    };

    const showDetail = activePanel === "detail";
    const showHistory = activePanel === "history";

    const cardClassName =
        "card shadow-sm mb-1 p-1" +
        (isExpanded ? "border border-2 " : "") +
        (dimActive
            ? "bg-white dim-keep"
            : isExpanded
                ? "bg-danger bg-opacity-10"
                : "");

    /**
     * Sestaví krátký popisek zápasu pro texty potvrzovacích dialogů.
     *
     * @returns {string} Textový titulek zápasu.
     */
    const buildMatchTitle = () =>
        `#${match.matchNumber ?? match.id} – ${formatted.dateTime}`;

    const hasScore =
        match.scoreDark !== null &&
        match.scoreDark !== undefined &&
        match.scoreLight !== null &&
        match.scoreLight !== undefined;

    const matchModeKey = match.matchMode || null;
    const matchModeConfig = matchModeKey ? MATCH_MODE_CONFIG[matchModeKey] : null;
    const matchModeLabel = matchModeConfig?.label || "-";

    return (
        <>
            {dimActive && (
                <div
                    className="global-dim-click"
                    onClick={() => setActivePanel(null)}
                    aria-hidden="true"
                />
            )}

            <div className={cardClassName}>
                {/* === ŘÁDEK 1 – ZÁKLADNÍ INFO O ZÁPASE === */}
                <div className="card-body border-bottom py-2">
                    <div className="row align-items-start">
                        <div className="col-md-2 fw-bold">
                            {match.matchNumber != null && (
                                <span className="me-2">#{match.matchNumber}</span>
                            )}
                            <span className="text-muted me-2">{formatted.day}</span>
                        </div>

                        <div className="col-md-3 fw-bold">
                            <span>{formatted.dateTime}</span>

                            <div className="mt-1">
                                <span className={`badge ${badgeClass}`}>
                                    {badgeText}
                                </span>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <small className="text-muted d-block">
                                Místo: <strong>{match.location || "-"}</strong>
                            </small>

                            <small className="text-muted d-block mt-1">
                                {isPast ? (
                                    <>{hasScore && (
                                            <span className="ms-2">
                                                <strong>
                                                    <TeamDarkIcon className="match-reg-team-icon-dark" />{" "}
                                                    {match.scoreDark} : {match.scoreLight}{" "}
                                                    <TeamLightIcon className="match-reg-team-icon-light" />
                                                </strong>
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        Status: <strong>{isCanceled ? "Zrušený" : "Plánovaný"}</strong>
                                    </>
                                )}
                            </small>
                        </div>

                        <div className="col-md-2">
                            <small className="text-muted d-block">
                                Max. hráčů: <strong>{match.maxPlayers ?? "-"}</strong>
                            </small>                            
                        </div>

                        <div className="col-md-2">
                            <small className="text-muted d-block">
                                Cena:{" "}
                                <strong>
                                    {match.price != null ? `${match.price} Kč` : "-"}
                                </strong>
                            </small>

                            <small className="text-muted d-block mt-1">
                                <strong>{matchModeLabel}</strong>
                            </small>
                        </div>
                    </div>
                </div>

                {/* === ŘÁDEK 2 – STAV + AKCE === */}
                <div className="card-body border-bottom bg-light py-2">
                    <div className="row align-items-center">
                        {statusText && (
                            <div className="col-md-4">
                                <small className="text-muted d-block">
                                    Stav{" "}
                                    <strong>
                                        {statusText}
                                        {match.cancelReason && (
                                            <div className="mt-1">
                                                <small className="text-muted d-block">
                                                    - {cancelReasonText}
                                                </small>
                                            </div>
                                        )}
                                    </strong>
                                </small>
                            </div>
                        )}
                        <div className={statusText ? "col-md-8" : "col-12"}>
                            <RoleGuard roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
                                <div className="d-flex justify-content-end">
                                    <div className="btn-group btn-group-sm flex-wrap gap-2">
                                        {/* DETAIL */}
                                        <button
                                            type="button"
                                            className={
                                                "btn btn-outline-info d-inline-flex align-items-center justify-content-center gap-1" +
                                                (showDetail ? " active" : "")
                                            }
                                            onClick={() => togglePanel("detail")}
                                            title="Detail"
                                        >
                                            <InfoCircle className="me-1" />
                                            <span className="d-none d-md-inline text-nowrap">
                                                {showDetail ? "Skrýt detail" : "Detail"}
                                            </span>
                                        </button>

                                        {/* UPRAVIT */}
                                        <button
                                            type="button"
                                            className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-1"
                                            disabled={!onEdit}
                                            onClick={() => onEdit && onEdit(match)}
                                            title="Upravit"
                                        >
                                            <PencilSquare className="me-1" />
                                            <span className="d-none d-md-inline text-nowrap">
                                                Upravit
                                            </span>
                                        </button>

                                        {/* HISTORIE */}
                                        <button
                                            type="button"
                                            className={
                                                "btn btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-1" +
                                                (showHistory ? " active" : "")
                                            }
                                            onClick={() => togglePanel("history")}
                                            title="Historie"
                                        >
                                            <ClockHistory className="me-1" />
                                            <span className="d-none d-md-inline text-nowrap">
                                                {showHistory ? "Skrýt historii" : "Historie"}
                                            </span>
                                        </button>

                                        {/* ZRUŠIT */}
                                        {!isCanceled && (
                                            <button
                                                type="button"
                                                className="btn btn-warning d-inline-flex align-items-center justify-content-center gap-1"
                                                disabled={!onCancel}
                                                onClick={() =>
                                                    setConfirmAction({
                                                        type: "cancel",
                                                        title: "Potvrzení zrušení",
                                                        message: `Opravdu chcete zrušit zápas ${buildMatchTitle()}?`,
                                                    })
                                                }
                                                title="Zrušit zápas"
                                            >
                                                <XOctagon className="me-1" />
                                                <span className="d-none d-md-inline text-nowrap">
                                                    Zrušit zápas
                                                </span>
                                            </button>
                                        )}

                                        {/* OBNOVIT */}
                                        {isCanceled && (
                                            <button
                                                type="button"
                                                className="btn btn-success d-inline-flex align-items-center justify-content-center gap-1"
                                                disabled={!onUnCancel}
                                                onClick={() =>
                                                    setConfirmAction({
                                                        type: "uncancel",
                                                        title: "Potvrzení obnovení",
                                                        message: `Opravdu chcete obnovit zápas ${buildMatchTitle()}?`,
                                                    })
                                                }
                                                title="Obnovit"
                                            >
                                                <ArrowCounterclockwise className="me-1" />
                                                <span className="d-none d-md-inline text-nowrap">
                                                    Obnovit zápas
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </RoleGuard>
                        </div>
                    </div>
                </div>

                {/* === ŘÁDEK 3 – DETAIL ZÁPASU === */}
                {showDetail && (
                    <div className="card-body bg-white border-top">
                        <h6 className="mb-2">
                            Detail zápasu #{match.matchNumber ?? match.id}
                        </h6>
                        <AdminMatchDetailInline matchId={match.id} />
                    </div>
                )}

                {/* === ŘÁDEK 4 – HISTORIE ZÁPASU === */}
                {showHistory && (
                    <div className="card-body bg-white border-top">
                        <h6 className="mb-2">
                            Historie zápasu #{match.matchNumber ?? match.id}
                        </h6>
                        <AdminMatchHistory matchId={match.id} />
                    </div>
                )}
            </div>

            {confirmAction && (
                <ConfirmActionModal
                    show={true}
                    title={confirmAction.title}
                    message={confirmAction.message}
                    confirmText={confirmAction.type === "cancel" ? "Zrušit" : "Obnovit"}
                    confirmVariant={confirmAction.type === "cancel" ? "warning" : "success"}
                    onClose={() => setConfirmAction(null)}
                    onConfirm={() => {
                        if (confirmAction.type === "cancel") {
                            onCancel && onCancel(match);
                        } else if (confirmAction.type === "uncancel") {
                            onUnCancel && onUnCancel(match.id);
                        }
                        setConfirmAction(null);
                    }}
                />
            )}
        </>
    );
};

export default AdminMatchCard;