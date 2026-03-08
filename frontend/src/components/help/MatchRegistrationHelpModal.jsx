import {
    RegisteredIcon,
    UnregisteredIcon,
    ExcusedIcon,
    ReservedIcon,
    NoResponseIcon,
    NoExcusedIcon,
} from "../../icons";
import "./MatchRegistrationHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";

/**
 * MatchRegistrationHelpModal
 *
 * Modální dialog zobrazující uživatelskou nápovědu
 * pro registrace hráče na zápas a jejich stavy.
 *
 * Modal obsahuje scénáře:
 * - přihlášení na zápas
 * - odhlášení ze zápasu
 * - omluvení ze zápasu
 * - čekání na místo
 * - možná účast / náhradník
 * - bez reakce
 * - neomluvená absence
 * - zrušený zápas
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null}
 */
const MatchRegistrationHelpModal = ({ show, onClose }) => {
    useGlobalModal(show, onClose);

    if (!show) {
        return null;
    }

    return (
        <>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-scrollable modal-lg" role="document">
                    <div className="modal-content match-registration-help-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">Nápověda k registraci na zápas</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Zavřít"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            <section className="mb-4">
                                <h6 className="fw-bold">1. Přihlášení na zápas</h6>
                                <p>
                                    Pokud se chcete zápasu zúčastnit, je potřeba se na něj přihlásit.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete detail vybraného zápasu.</li>
                                    <li>Zvolte možnost přihlášení na zápas.</li>
                                    <li>Vyberte požadované údaje, například pozici nebo tým, pokud jsou k dispozici.</li>
                                    <li>Potvrďte registraci.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Vaše registrace se uloží k zápasu.</li>
                                    <li>Na kartě nebo v detailu zápasu se zobrazí stav <strong>BUDU</strong>.</li>
                                    <li>Pokud je zápas již plný, můžete být zařazen do čekajícího režimu.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Odhlášení ze zápasu</h6>
                                <p>
                                    Pokud jste byl přihlášen a nemůžete přijít, můžete se ze zápasu odhlásit.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete detail zápasu.</li>
                                    <li>Zvolte možnost <strong>Odhlásit se</strong>.</li>
                                    <li>Potvrďte změnu registrace.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Vaše účast se u zápasu zruší.</li>
                                    <li>U zápasu se zobrazí stav <strong>ODHLÁŠEN</strong>.</li>
                                    <li>Uvolněné místo může být nabídnuto dalším hráčům.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Omluvení ze zápasu</h6>
                                <p>
                                    Pokud předem víte, že se nemůžete zúčastnit, je vhodné se omluvit.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete detail zápasu.</li>
                                    <li>Zvolte možnost <strong>Omluvit se</strong>.</li>
                                    <li>Potvrďte změnu svého stavu.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>U zápasu se zobrazí stav <strong>NEMŮŽU</strong>.</li>
                                    <li>Organizátor vidí, že jste svou neúčast oznámil včas.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Čekání na místo</h6>
                                <p>
                                    Pokud je kapacita zápasu naplněna, nemusí být registrace potvrzena přímo do hry.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Může se zobrazit stav <strong>ČEKÁM</strong>.</li>
                                    <li>To znamená, že momentálně není volné místo v zápase.</li>
                                    <li>Pokud se někdo odhlásí nebo organizátor upraví sestavu, můžete být doplněn mezi aktivní hráče.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">5. Možná účast / náhradník</h6>
                                <p>
                                    V některých případech může být vaše účast vedena jako nejistá nebo náhradní.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>U zápasu se může zobrazit stav <strong>MOŽNÁ</strong>.</li>
                                    <li>Tento stav znamená, že nejste potvrzen jako standardně zařazený hráč.</li>
                                    <li>Definitivní zařazení může záviset na vývoji registrací nebo zásahu organizátora.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">6. Bez reakce</h6>
                                <p>
                                    Pokud jste na zápas ještě nijak nereagoval, systém vás vede bez potvrzeného rozhodnutí.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>U zápasu se zobrazí stav bez odpovědi nebo interně <strong>NO_RESPONSE</strong>.</li>
                                    <li>Znamená to, že jste zatím nepotvrdil účast ani neúčast.</li>
                                    <li>Doporučuje se co nejdříve provést registraci, odhlášení nebo omluvu.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">7. Neomluvená absence</h6>
                                <p>
                                    Pokud jste na zápas nepřišel bez předchozí omluvy, může být vaše účast vedena jako neomluvená.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>U zápasu se zobrazí stav <strong>NEOMLUVEN</strong> nebo <strong>NEPŘIŠEL</strong>.</li>
                                    <li>Tento stav obvykle vzniká až po zápase podle vyhodnocení organizátorem.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">8. Zrušený zápas</h6>
                                <p>
                                    Pokud je zápas zrušen, není možné se na něj dále registrovat ani upravovat účast.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Karta zápasu je označena jako <strong>ZRUŠENÝ</strong>.</li>
                                    <li>Detail zápasu nemusí být dostupný pro běžnou práci s registrací.</li>
                                    <li>Může se zobrazit i důvod zrušení.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">9. Přehled stavů registrace</h6>

                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Stav</th>
                                                <th>Význam</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <RegisteredIcon className="help-icon help-icon-registered" />
                                                    BUDU
                                                </td>
                                                <td>Jste přihlášen na zápas.</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <UnregisteredIcon className="help-icon help-icon-unregistered" />
                                                    ODHLÁŠEN
                                                </td>
                                                <td>Ze zápasu jste se odhlásil.</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <ExcusedIcon className="help-icon help-icon-excused" />
                                                    NEMŮŽU
                                                </td>
                                                <td>Ze zápasu jste omluven.</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <ReservedIcon className="help-icon help-icon-reserved" />
                                                    ČEKÁM
                                                </td>
                                                <td>Momentálně čekáte na volné místo.</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <NoResponseIcon className="help-icon help-icon-substitute" />
                                                    MOŽNÁ
                                                </td>
                                                <td>Vaše účast je vedena jako nejistá nebo náhradní.</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <NoResponseIcon className="help-icon help-icon-no-response" />
                                                    BEZ ODPOVĚDI
                                                </td>
                                                <td>Na zápas jste zatím nijak nereagoval.</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <NoExcusedIcon className="help-icon help-icon-no-excused" />
                                                    NEOMLUVEN
                                                </td>
                                                <td>Na zápas jste nepřišel bez omluvy.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section>
                                <h6 className="fw-bold">10. Doporučený postup</h6>
                                <ol>
                                    <li>Po zobrazení nového zápasu co nejdříve reagujte.</li>
                                    <li>Pokud víte, že přijdete, potvrďte registraci.</li>
                                    <li>Pokud se nemůžete zúčastnit, odhlaste se nebo se omluvte.</li>
                                    <li>Průběžně sledujte svůj stav u zápasu, zejména pokud čekáte na místo.</li>
                                </ol>
                            </section>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Zavřít
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show" onClick={onClose} />
        </>
    );
};

export default MatchRegistrationHelpModal;