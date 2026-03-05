import {
    RegisteredIcon,
    UnregisteredIcon,
    ExcusedIcon,
    ReservedIcon,
    NoResponseIcon,
    NoExcusedIcon,
    UserIcon,
    MoneyIcon,
    Happy,
    Sad,
} from "../../icons";

import { TeamDarkIcon, TeamLightIcon } from "../../icons";

import CapacityRing from "./CapacityRing";
import { MATCH_MODE_CONFIG } from "../../constants/matchModeConfig";

import "./MatchCard.css";

const statusClassMap = {
    REGISTERED: "match-registered",
    UNREGISTERED: "match-unregistered",
    EXCUSED: "match-excused",
    RESERVED: "match-reserved",
    SUBSTITUTE: "match-substitute",
    NO_RESPONSE: "match-no-response",
    NO_EXCUSED: "match-no-excused",
};

const statusTextUpcomingMap = {
    REGISTERED: "BUDU",
    UNREGISTERED: "ODHLÁŠEN",
    EXCUSED: "NEMŮŽU",
    RESERVED: "ČEKÁM",
    SUBSTITUTE: "MOŽNÁ",
    NO_RESPONSE: "",
    NO_EXCUSED: "NEOMLUVEN",
};

const statusTextPastMap = {
    REGISTERED: "",
    NO_RESPONSE: "NEREAGOVAL",
    NO_EXCUSED: "NEPŘIŠEL",
    UNREGISTERED: "ODHLÁŠEN",
    SUBSTITUTE: "NEBYL",
    EXCUSED: "NEMOHL",
    RESERVED: "BYLO PLNO",
};

const statusIconMap = {
    REGISTERED: RegisteredIcon,
    UNREGISTERED: UnregisteredIcon,
    EXCUSED: ExcusedIcon,
    RESERVED: ReservedIcon,
    SUBSTITUTE: NoResponseIcon,
    NO_RESPONSE: NoResponseIcon,
    NO_EXCUSED: NoExcusedIcon,
};

const matchStatusLabelMap = {
    CANCELED: "ZRUŠENÝ",
    UNCANCELED: "Obnovený",
    UPDATED: "Změněný",
};

const cancelReasonLabelMap = {
    NOT_ENOUGH_PLAYERS: "Málo hráčů",
    TECHNICAL_ISSUE: "Technické problémy",
    WEATHER: "Počasí",
    ORGANIZER_DECISION: "Rozhodnutí organizátora",
    OTHER: "Jiný důvod",
};

const matchResultLabelMap = {
    LIGHT_WIN: "LIGHT",
    DARK_WIN: "DARK",
    DRAW: "Remíza",
};

const formatDateTime = (dateTime) => {
    if (!dateTime) return null;

    const iso = dateTime.replace(" ", "T");
    const d = new Date(iso);

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

const isPastMatch = (dateTime) => {
    if (!dateTime) return false;
    const iso = dateTime.replace(" ", "T");
    const d = new Date(iso);
    const now = new Date();
    return d < now;
};

const getDaysUntilMatch = (dateTime) => {
    if (!dateTime) return null;

    const iso = dateTime.replace(" ", "T");
    const matchDate = new Date(iso);
    if (Number.isNaN(matchDate.getTime())) return null;

    const now = new Date();

    // Vynulování času -> porovnává se jen kalendářní den
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDay = new Date(
        matchDate.getFullYear(),
        matchDate.getMonth(),
        matchDate.getDate()
    );

    const diffMs = matchDay.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(diffDays, 0);
};

const getDaysBadgeClass = (days) => {
    if (days === null || days === undefined) return "match-days--default";
    if (days >= 5) return "match-days--ok";       // 5+
    if (days >= 1) return "match-days--warn";     // 2–4
    return "match-days--danger";                  // 0–1 (dnes + 1)
};

/**
 * MatchCard
 *
 * Karta zápasu pro přehled.
 */
const MatchCard = ({ match, onClick, disabledTooltip, condensed = false }) => {
    const playerMatchStatus = match.playerMatchStatus ?? "NO_RESPONSE";

    const statusText = condensed
        ? statusTextPastMap[playerMatchStatus] ?? playerMatchStatus
        : statusTextUpcomingMap[playerMatchStatus] ?? playerMatchStatus;

    const statusClass = statusClassMap[playerMatchStatus] ?? "";

    const hasDisabledTooltip = !!disabledTooltip;
    const isRegistered = playerMatchStatus === "REGISTERED";

    const formatted = formatDateTime(match.dateTime);
    const past = isPastMatch(match.dateTime);

    const rawMatchStatus = match.matchStatus || null;
    const isCanceled = rawMatchStatus === "CANCELED";

    const isDisabledByTooltip = hasDisabledTooltip && !isRegistered;
    const isClickable = !!onClick && !isDisabledByTooltip && !isCanceled;

    const statusModifier = playerMatchStatus.toLowerCase();

    const cardLayoutClass = condensed ? "match-card--condensed" : "match-card--default";

    let matchStatusText = "";
    if (past) {
        if (
            !rawMatchStatus ||
            rawMatchStatus === "CANCELED" ||
            rawMatchStatus === "UNCANCELED" ||
            rawMatchStatus === "UPDATED"
        ) {
            matchStatusText = "Odehraný";
        } else {
            matchStatusText = matchStatusLabelMap[rawMatchStatus] ?? rawMatchStatus;
        }
    } else {
        if (!rawMatchStatus) {
            matchStatusText = "Plánovaný";
        } else {
            matchStatusText = matchStatusLabelMap[rawMatchStatus] ?? rawMatchStatus;
        }
    }

    const matchModeKey = match.matchMode || null;
    const matchModeConfig = matchModeKey ? MATCH_MODE_CONFIG[matchModeKey] : null;
    const matchModeLabel = matchModeConfig?.label || null;

    const hasScore =
        match.scoreDark !== null &&
        match.scoreDark !== undefined &&
        match.scoreLight !== null &&
        match.scoreLight !== undefined;

    const resultKey = match.result || null;
    const resultLabel = resultKey ? matchResultLabelMap[resultKey] ?? resultKey : null;

    /**
     * Výsledek pro hráče v past + REGISTERED:
     * Backend vrací:
     * - match.draw (boolean|null)
     * - match.playerWon (boolean|null)
     * - match.playerTeam (DARK/LIGHT/null) – už jen informativně
     */
    const drawFlag = match.draw; // boolean|null|undefined
    const playerWonFlag = match.playerWon; // boolean|null|undefined

    const isRegisteredPast = past && playerMatchStatus === "REGISTERED";

    const outcomeIcon =
        isRegisteredPast && drawFlag !== true
            ? (playerWonFlag === true ? Happy : playerWonFlag === false ? Sad : null)
            : null;

    const StatusIcon = isRegisteredPast
        ? (drawFlag === true ? null : (outcomeIcon || RegisteredIcon))
        : (statusIconMap[playerMatchStatus] || null);

    const statusTextOverride = isRegisteredPast
        ? (drawFlag === true ? "Remíza" : "")
        : statusText;

    let overlayTooltipContent = null;

    if (isCanceled) {
        const label = match.cancelReason
            ? cancelReasonLabelMap[match.cancelReason] ?? match.cancelReason
            : null;

        overlayTooltipContent = (
            <div className="match-card-tooltip-inner">
                <div className="match-card-tooltip-title">ZRUŠENÝ</div>
                {label && (
                    <div className="match-card-tooltip-reason">
                        Důvod:
                        <p>
                            <strong>{label}</strong>
                        </p>
                    </div>
                )}
            </div>
        );
    } else if (disabledTooltip) {
        overlayTooltipContent = disabledTooltip;
    }

    const handleClick = () => {
        if (isClickable && onClick) onClick();
    };

    const daysUntil = !past ? getDaysUntilMatch(match.dateTime) : null;
    const daysBadgeClass = getDaysBadgeClass(daysUntil);

    return (
        <div
            className={`match-card
                ${statusClass}
                ${cardLayoutClass}
                ${isCanceled ? "match-card--canceled" : ""}
                ${isClickable ? "clickable" : ""}
                ${isDisabledByTooltip ? "match-card--disabled" : ""}`}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : -1}
            onClick={isClickable ? handleClick : undefined}
            onKeyDown={isClickable ? (e) => e.key === "Enter" && handleClick() : undefined}
        >
            <div className="card-body match-card__body">
                {formatted && (
                    <>
                        <div className="match-card__header">
                            <h5 className="card-title text-muted text-center match-day">
                                {formatted.day} {"  #"}
                                {match.matchNumber}

                                {!past && daysUntil !== null && (
                                    <span className={`match-days ${daysBadgeClass}`}>
                                        {" "}– {daysUntil === 0
                                            ? "DNES !!!"
                                            : `za ${daysUntil} ${daysUntil === 1
                                                ? "den"
                                                : daysUntil >= 2 && daysUntil <= 4
                                                    ? "dny"
                                                    : "dní"
                                            }`}
                                    </span>
                                )}
                            </h5>

                            {matchStatusText && (
                                <div
                                    className={`match-card__match-status match-card__match-status--${(
                                        rawMatchStatus ?? "DEFAULT"
                                    ).toLowerCase()} text-center`}
                                >
                                    <strong>{matchStatusText}</strong>
                                </div>
                            )}
                        </div>

                        <h3 className="text-center match-date">{formatted.dateTime}</h3>
                    </>
                )}

                <div className="text-center">
                    <p className="card-text text-center">{match.location}</p>

                    {past && hasScore && (
                        <p className="card-text text-center match-score">
                            <strong>
                                <TeamDarkIcon className="match-reg-team-icon-dark" />{" "}
                                {match.scoreDark}{" "}
                                : {match.scoreLight}{" "}
                                <TeamLightIcon className="match-reg-team-icon-light" />
                            </strong>                           
                        </p>
                    )}
                </div>

                {matchModeLabel && (
                    <p className="card-text text-center match-mode">
                        <strong>{matchModeLabel}</strong>
                    </p>
                )}

                {!condensed && match.description && (
                    <p className="card-text">
                        Popis: <strong>{match.description}</strong>
                    </p>
                )}

                <p className="card-text text-center players-count">
                    <span className="players-count__wrap">
                        <UserIcon
                            className={`player-icon player-icon--${match.playerTeam?.toLowerCase() ?? "default"}`}
                        />
                        <strong>
                            {match.inGamePlayers} / {match.maxPlayers}{" "}
                        </strong>

                        <CapacityRing
                            value={match.inGamePlayers}
                            max={match.maxPlayers}
                            size={50}
                            stroke={10}
                            title={`Obsazenost: ${match.inGamePlayers}/${match.maxPlayers}`}
                        />
                    </span>
                </p>

                {!condensed && (
                    <p className="card-text text-center">
                        <MoneyIcon className="money-icon" />
                        <strong>
                            {match.pricePerRegisteredPlayer.toFixed(0)} Kč /{" "}
                            <UserIcon className="player-price-icon" />
                        </strong>
                    </p>
                )}

                <div className="text-center status-cell">
                    <span className={`player-match-status player-match-status--${statusModifier}`}>
                        {StatusIcon && (
                            <StatusIcon
                                className={
                                    isRegisteredPast && outcomeIcon
                                        ? "player-match-status-icon player-match-outcome-icon"
                                        : "player-match-status-icon"
                                }
                            />
                        )}
                        <strong className="player-match-status-text">
                            {statusTextOverride}
                        </strong>
                    </span>
                </div>
            </div>

            {overlayTooltipContent && (
                <div className="match-card-tooltip">{overlayTooltipContent}</div>
            )}
        </div>
    );
};

export default MatchCard;