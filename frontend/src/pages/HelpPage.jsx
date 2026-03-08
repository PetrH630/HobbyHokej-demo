import { useState } from "react";
import LoginHelpModal from "../components/help/LoginHelpModal";
import PlayerHelpModal from "../components/help/PlayerHelpModal";
import SettingsHelpModal from "../components/help/SettingsHelpModal";
import MatchesHelpModal from "../components/help/MatchesHelpModal";
import MatchRegistrationHelpModal from "../components/help/MatchRegistrationHelpModal";

/**
 * HelpPage
 *
 * Stránka zobrazující centrální rozcestník nápovědy pro uživatele.
 * Jednotlivé oblasti aplikace jsou zpřístupněny pomocí odkazů,
 * které otevírají příslušné modální dialogy.
 *
 * @returns {JSX.Element} stránka nápovědy
 */
const HelpPage = () => {
    const [showLoginHelp, setShowLoginHelp] = useState(false);
    const [showPlayerHelp, setShowPlayerHelp] = useState(false);
    const [showSettingsHelp, setShowSettingsHelp] = useState(false);
    const [showMatchesHelp, setShowMatchesHelp] = useState(false);
    const [showMatchRegistrationHelp, setShowMatchRegistrationHelp] = useState(false);

    return (
        <div className="container mt-3 mb-5">
            <h1 className="h3 mb-3 text-center">Nápověda</h1>

            <p className="text-muted text-center mb-4">
                Na této stránce najdete nápovědu k jednotlivým částem aplikace.
            </p>

            <div className="card shadow-sm mb-2 px-1 py-1">
                <div className="card-header bg-light">
                    <strong>Přihlášení a registrace</strong>
                </div>
                <div className="card-body ">
                    <p className="mb-1 ">
                        Nápověda k registraci nového účtu, obnově zapomenutého hesla
                        a přihlášení do aplikace.
                    </p>

                    <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setShowLoginHelp(true)}
                    >
                        Otevřít nápovědu
                    </button>
                </div>
            </div>

            <div className="card shadow-sm mb-2 px-1 py-1">
                <div className="card-header bg-light">
                    <strong>Hráčský profil</strong>
                </div>
                <div className="card-body">
                    <p className="mb-3">
                        Nápověda k vytvoření hráče.
                    </p>

                    <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setShowPlayerHelp(true)}
                    >
                        Otevřít nápovědu
                    </button>
                </div>
            </div>

            <div className="card shadow-sm mb-2 px-1 py-1">
                <div className="card-header bg-light">
                    <strong>Nastavení</strong>
                </div>
                <div className="card-body">
                    <p className="mb-3">
                        Nápověda k profilu uživatele, notifikacím hráče,
                        nastavení účtu a změně hesla.
                    </p>

                    <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setShowSettingsHelp(true)}
                    >
                        Otevřít nápovědu
                    </button>
                </div>
            </div>

            <div className="card shadow-sm mb-2 px-1 py-1">
                <div className="card-header bg-light">
                    <strong>Zápasy</strong>
                </div>
                <div className="card-body">
                    <p className="mb-3">
                        Nápověda k výběru sezóny, nadcházejícím a uplynulým zápasům,
                        filtrům i významu stavů zápasů.
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

            <div className="card shadow-sm mb-2 px-1 py-1">
                <div className="card-header bg-light">
                    <strong>Registrace na zápas</strong>
                </div>
                <div className="card-body">
                    <p className="mb-3">
                        Nápověda k registracím na zápas,
                        odhlášení, omluvení a významu stavů registrace.
                    </p>

                    <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setShowMatchRegistrationHelp(true)}
                    >
                        Otevřít nápovědu
                    </button>
                </div>
            </div>

            <LoginHelpModal
                show={showLoginHelp}
                onClose={() => setShowLoginHelp(false)}
            />

            <PlayerHelpModal
                show={showPlayerHelp}
                onClose={() => setShowPlayerHelp(false)}
            />

            <SettingsHelpModal
                show={showSettingsHelp}
                onClose={() => setShowSettingsHelp(false)}
            />

            <MatchesHelpModal
                show={showMatchesHelp}
                onClose={() => setShowMatchesHelp(false)}
            />

            <MatchRegistrationHelpModal
                show={showMatchRegistrationHelp}
                onClose={() => setShowMatchRegistrationHelp(false)}
            />
        </div>
    );
};

export default HelpPage;