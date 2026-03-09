import { useMemo, useState } from "react";
import AdminPlayerCard from "./AdminPlayerCard";
import { usePlayerInactivityPeriodsAdmin } from "../../hooks/usePlayerInactivityPeriodsAdmin";

const FILTERS = {
    ALL: "ALL",
    APPROVED: "APPROVED",
    PENDING: "PENDING",
    REJECTED: "REJECTED",
    INACTIVE: "INACTIVE",
};

/**
 * Určí, zda hráč projde filtrem podle statusu a aktuální neaktivity.
 *
 * @param {Object} player hráč
 * @param {boolean} isInactive příznak aktuální neaktivity
 * @param {string} filter aktivní filtr
 * @returns {boolean} true, pokud hráč projde filtrem
 */
const playerPassesFilter = (player, isInactive, filter) => {
    const status = player.playerStatus;

    switch (filter) {
        case FILTERS.APPROVED:
            return status === "APPROVED" && !isInactive;

        case FILTERS.INACTIVE:
            return isInactive === true;

        case FILTERS.PENDING:
            return status === "PENDING" || status === "NEW";

        case FILTERS.REJECTED:
            return status === "REJECTED";

        case FILTERS.ALL:
        default:
            return true;
    }
};

/**
 * Určí, zda hráč odpovídá fulltextovému hledání.
 *
 * Hledání probíhá nad jménem, příjmením, celým jménem,
 * e-mailem, přezdívkou a telefonem.
 *
 * @param {Object} player hráč
 * @param {string} searchTerm hledaný text
 * @returns {boolean} true, pokud hráč odpovídá hledání
 */
const playerMatchesSearch = (player, searchTerm) => {
    const term = searchTerm.trim().toLocaleLowerCase("cs");

    if (!term) {
        return true;
    }

    const name = String(player.name || "").toLocaleLowerCase("cs");
    const surname = String(player.surname || "").toLocaleLowerCase("cs");
    const fullName = `${name} ${surname}`.trim();
    const reversedFullName = `${surname} ${name}`.trim();
    const email = String(player.email || player.userEmail || "").toLocaleLowerCase("cs");
    const phone = String(player.phone || player.phoneNumber || "").toLocaleLowerCase("cs");
    const nickname = String(player.nickname || "").toLocaleLowerCase("cs");

    return (
        name.includes(term) ||
        surname.includes(term) ||
        fullName.includes(term) ||
        reversedFullName.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        nickname.includes(term)
    );
};

/**
 * AdminPlayersTable
 *
 * Komponenta zobrazuje seznam hráčů pro administraci.
 * Umožňuje filtrování podle statusu, neaktivity a fulltextové hledání.
 *
 * Badge u filtrů se přepočítávají i podle aktuálně zadaného hledání.
 *
 * @param {Object} props vstupní hodnoty komponenty
 * @param {Array} props.players seznam hráčů
 * @param {boolean} props.loading příznak načítání dat
 * @param {string} props.error chybová zpráva
 * @param {Function} props.onApprove callback pro schválení hráče
 * @param {Function} props.onReject callback pro zamítnutí hráče
 * @param {Function} props.onEdit callback pro úpravu hráče
 * @param {Function} props.onDelete callback pro smazání hráče
 * @param {Function} props.onChangeUser callback pro změnu uživatele
 * @returns {JSX.Element} seznam hráčů
 */
const AdminPlayersTable = ({
    players,
    loading,
    error,
    onApprove,
    onReject,
    onEdit,
    onDelete,
    onChangeUser,
}) => {
    const [filter, setFilter] = useState(FILTERS.ALL);
    const [searchTerm, setSearchTerm] = useState("");

    const {
        periods,
        loading: inactivityLoading,
        error: inactivityError,
        reload: reloadInactivity,
    } = usePlayerInactivityPeriodsAdmin();

    const safePlayers = Array.isArray(players) ? players : [];
    const safePeriods = Array.isArray(periods) ? periods : [];

    /**
     * Připraví mapu hráčů, kteří jsou právě teď v období neaktivity.
     */
    const inactivityMap = useMemo(() => {
        const now = new Date();
        const map = new Map();

        safePeriods.forEach((p) => {
            const playerId = p.playerId;
            if (!playerId) return;

            const rawFrom = p.inactiveFrom;
            const rawTo = p.inactiveTo;
            if (!rawFrom || !rawTo) return;

            const from = new Date(
                typeof rawFrom === "string" ? rawFrom.replace(" ", "T") : rawFrom
            );
            const to = new Date(
                typeof rawTo === "string" ? rawTo.replace(" ", "T") : rawTo
            );

            if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
                return;
            }

            const isInThisInterval = from <= now && to >= now;

            if (isInThisInterval) {
                map.set(playerId, true);
            }
        });

        return map;
    }, [safePeriods]);

    /**
     * Určí, zda je hráč aktuálně neaktivní.
     *
     * @param {number|string} playerId identifikátor hráče
     * @returns {boolean} true, pokud je hráč právě v neaktivitě
     */
    const isPlayerInactiveNow = (playerId) => inactivityMap.get(playerId) === true;

    /**
     * Seřadí hráče podle příjmení.
     */
    const sortedPlayers = useMemo(() => {
        return safePlayers
            .slice()
            .sort((a, b) =>
                (a.surname || "").localeCompare(b.surname || "", "cs", {
                    sensitivity: "base",
                })
            );
    }, [safePlayers]);

    /**
     * Základní množina hráčů po aplikaci fulltextu.
     * Z této množiny se následně počítají badge i výsledný seznam.
     */
    const searchedPlayers = useMemo(() => {
        return sortedPlayers.filter((player) =>
            playerMatchesSearch(player, searchTerm)
        );
    }, [sortedPlayers, searchTerm]);

    /**
     * Připraví počty pro jednotlivé filtry.
     * Počty se přepočítávají i podle aktuálně zadaného hledání.
     */
    const counts = useMemo(() => {
        return {
            all: searchedPlayers.length,
            active: searchedPlayers.filter((p) =>
                playerPassesFilter(p, isPlayerInactiveNow(p.id), FILTERS.APPROVED)
            ).length,
            inactive: searchedPlayers.filter((p) =>
                playerPassesFilter(p, isPlayerInactiveNow(p.id), FILTERS.INACTIVE)
            ).length,
            pending: searchedPlayers.filter((p) =>
                playerPassesFilter(p, isPlayerInactiveNow(p.id), FILTERS.PENDING)
            ).length,
            rejected: searchedPlayers.filter((p) =>
                playerPassesFilter(p, isPlayerInactiveNow(p.id), FILTERS.REJECTED)
            ).length,
        };
    }, [searchedPlayers, inactivityMap]);

    /**
     * Vyfiltruje hráče podle zvoleného status filtru.
     * Fulltext je již aplikován v searchedPlayers.
     */
    const filteredPlayers = useMemo(() => {
        return searchedPlayers.filter((p) =>
            playerPassesFilter(p, isPlayerInactiveNow(p.id), filter)
        );
    }, [searchedPlayers, inactivityMap, filter]);

    const getFilterLabel = (f) => {
        switch (f) {
            case FILTERS.APPROVED:
                return "Aktivní";
            case FILTERS.PENDING:
                return "Čeká na schválení";
            case FILTERS.INACTIVE:
                return "Neaktivní";
            case FILTERS.REJECTED:
                return "Zamítnutí";
            case FILTERS.ALL:
            default:
                return "Všichni";
        }
    };

    const getFilterCount = (f) => {
        switch (f) {
            case FILTERS.APPROVED:
                return counts.active;
            case FILTERS.PENDING:
                return counts.pending;
            case FILTERS.INACTIVE:
                return counts.inactive;
            case FILTERS.REJECTED:
                return counts.rejected;
            case FILTERS.ALL:
            default:
                return counts.all;
        }
    };

    if (loading || inactivityLoading) {
        return <p>Načítám hráče…</p>;
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    if (inactivityError) {
        return (
            <div className="alert alert-danger" role="alert">
                {inactivityError}
            </div>
        );
    }

    if (safePlayers.length === 0) {
        return <p>V systému zatím nejsou žádní hráči.</p>;
    }

    return (
        <div className="d-flex flex-column gap-3">
            <div className="mb-2">
                <label htmlFor="players-search" className="form-label mb-1">
                    Hledat hráče
                </label>
                <input
                    id="players-search"
                    type="text"
                    className="form-control"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Zadej jméno, příjmení, e-mail, telefon…"
                />
                <div className="form-text">
                    Fulltextové vyhledávání.
                </div>
            </div>

            <div className="mb-2">
                <div className="d-sm-none">
                    <div className="dropdown w-100">
                        <button
                            className="btn btn-primary dropdown-toggle w-100"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {getFilterLabel(filter)}{" "}
                            <span className="badge bg-light text-dark ms-1">
                                {getFilterCount(filter)}
                            </span>
                        </button>

                        <ul className="dropdown-menu w-100">
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => setFilter(FILTERS.ALL)}
                                >
                                    Všichni ({counts.all})
                                </button>
                            </li>
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => setFilter(FILTERS.APPROVED)}
                                >
                                    Aktivní ({counts.active})
                                </button>
                            </li>
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => setFilter(FILTERS.PENDING)}
                                >
                                    Čeká na schválení ({counts.pending})
                                </button>
                            </li>
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => setFilter(FILTERS.INACTIVE)}
                                >
                                    Neaktivní ({counts.inactive})
                                </button>
                            </li>
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => setFilter(FILTERS.REJECTED)}
                                >
                                    Zamítnutí ({counts.rejected})
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="d-none d-sm-flex justify-content-center">
                    <div className="btn-group" role="group" aria-label="Filtr hráčů">
                        <button
                            type="button"
                            className={
                                filter === FILTERS.ALL
                                    ? "btn btn-primary"
                                    : "btn btn-outline-primary"
                            }
                            onClick={() => setFilter(FILTERS.ALL)}
                        >
                            Všichni{" "}
                            <span className="badge bg-light text-dark ms-1">
                                {counts.all}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                filter === FILTERS.APPROVED
                                    ? "btn btn-primary"
                                    : "btn btn-outline-primary"
                            }
                            onClick={() => setFilter(FILTERS.APPROVED)}
                        >
                            Aktivní{" "}
                            <span className="badge bg-light text-dark ms-1">
                                {counts.active}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                filter === FILTERS.PENDING
                                    ? "btn btn-primary"
                                    : "btn btn-outline-primary"
                            }
                            onClick={() => setFilter(FILTERS.PENDING)}
                        >
                            Čeká na schválení{" "}
                            <span className="badge bg-light text-dark ms-1">
                                {counts.pending}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                filter === FILTERS.INACTIVE
                                    ? "btn btn-primary"
                                    : "btn btn-outline-primary"
                            }
                            onClick={() => setFilter(FILTERS.INACTIVE)}
                        >
                            Neaktivní{" "}
                            <span className="badge bg-light text-dark ms-1">
                                {counts.inactive}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                filter === FILTERS.REJECTED
                                    ? "btn btn-primary"
                                    : "btn btn-outline-primary"
                            }
                            onClick={() => setFilter(FILTERS.REJECTED)}
                        >
                            Zamítnutí{" "}
                            <span className="badge bg-light text-dark ms-1">
                                {counts.rejected}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {filteredPlayers.length === 0 && (
                <p className="text-center mb-3">
                    Pro zvolený filtr a hledání nejsou žádní hráči.
                </p>
            )}

            {filteredPlayers.map((player) => (
                <AdminPlayerCard
                    key={player.id}
                    player={player}
                    isInactive={isPlayerInactiveNow(player.id)}
                    onApprove={onApprove}
                    onReject={onReject}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onChangeUser={onChangeUser}
                    onInactivityChanged={reloadInactivity}
                />
            ))}
        </div>
    );
};

export default AdminPlayersTable;