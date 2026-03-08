import { useState } from "react";
import BackButton from "../components/BackButton";
import AdminNavbarHelpModal from "../components/help/AdminNavbarHelpModal";
import AdminPlayersHelpModal from "../components/help/AdminPlayersHelpModal";
import AdminMatchesHelpModal from "../components/help/AdminMatchesHelpModal";
import AdminUsersHelpModal from "../components/help/AdminUsersHelpModal";

/**
 * AdminHelpPage
 *
 * Centrální stránka nápovědy pro administrátora a manažera.
 * Stránka slouží jako rozcestník do jednotlivých oblastí správy systému.
 *
 * @returns {JSX.Element} stránka administrační nápovědy
 */
const AdminHelpPage = () => {
    const [showNavbarHelp, setShowNavbarHelp] = useState(false);
    const [showPlayersHelp, setShowPlayersHelp] = useState(false);
    const [showMatchesHelp, setShowMatchesHelp] = useState(false);
    const [showUsersHelp, setShowUsersHelp] = useState(false);

    return (
        <>
            <BackButton />

            <div className="container mt-4 mb-5">
                <h1 className="h3 mb-3">Nápověda pro správce</h1>

                <p className="text-muted mb-4">
                    Tato stránka obsahuje nápovědu pro administrátora a manažera.
                    Vysvětluje režim správce v navbaru, správu hráčů, správu zápasů
                    a správu uživatelů.
                </p>

                <div className="card shadow-sm mb-3 admin-help-card">
                    <div className="card-header bg-light">
                        <strong>Navbar a režim správce</strong>
                    </div>
                    <div className="card-body">
                        <p className="mb-2">
                            Nápověda k tlačítku Správce, přepínání mezi hráčskou a administrační částí
                            a k významu administračních odkazů v horní navigaci.
                        </p>
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => setShowNavbarHelp(true)}
                        >
                            Otevřít nápovědu
                        </button>
                    </div>
                </div>

                <div className="card shadow-sm mb-3 admin-help-card">
                    <div className="card-header bg-light">
                        <strong>Správa hráčů</strong>
                    </div>
                    <div className="card-body">
                        <p className="mb-2">
                            Schvalování a zamítání hráčů, filtry, editace, neaktivita,
                            historie a statistiky.
                        </p>
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => setShowPlayersHelp(true)}
                        >
                            Otevřít nápovědu
                        </button>
                    </div>
                </div>

                <div className="card shadow-sm mb-3 admin-help-card">
                    <div className="card-header bg-light">
                        <strong>Správa zápasů</strong>
                    </div>
                    <div className="card-body">
                        <p className="mb-2">
                            Výběr sezóny, vytváření zápasů, editace, rušení, obnova,
                            mazání, filtry a provozní poznámky k demo notifikacím.
                        </p>
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => setShowMatchesHelp(true)}
                        >
                            Otevřít nápovědu
                        </button>
                    </div>
                </div>

                <div className="card shadow-sm mb-3 admin-help-card">
                    <div className="card-header bg-light">
                        <strong>Správa uživatelů</strong>
                    </div>
                    <div className="card-body">
                        <p className="mb-2">
                            Přehled uživatelských účtů, aktivace a deaktivace, reset hesla
                            a vazba mezi účtem a přiřazenými hráči.
                        </p>
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => setShowUsersHelp(true)}
                        >
                            Otevřít nápovědu
                        </button>
                    </div>
                </div>

                <AdminNavbarHelpModal
                    show={showNavbarHelp}
                    onClose={() => setShowNavbarHelp(false)}
                />

                <AdminPlayersHelpModal
                    show={showPlayersHelp}
                    onClose={() => setShowPlayersHelp(false)}
                />

                <AdminMatchesHelpModal
                    show={showMatchesHelp}
                    onClose={() => setShowMatchesHelp(false)}
                />

                <AdminUsersHelpModal
                    show={showUsersHelp}
                    onClose={() => setShowUsersHelp(false)}
                />
            </div>
        </>
    );
};

export default AdminHelpPage;
