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
                <div
                    className="modal-dialog modal-dialog-scrollable modal-lg"
                    role="document"
                >
                    <div className="modal-content match-registration-help-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                Nápověda k registraci na zápas
                            </h5>
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
                                    Pokud se chcete zápasu zúčastnit, je potřeba se na něj
                                    přihlásit.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete detail vybraného zápasu.</li>
                                    <li>Zvolte možnost přihlášení na zápas (z vybraných možností - tlačítko).</li>
                                    <li>V dalším okně si vyberte tým a pote volnou pozici v týmu, na které chcete hrát.</li>
                                    <li>Pokud není pozice v týmu volná, můžete se i tak na ni přihlásit a budete veden jako náhradník. 
                                        V případě, že se někdo ze zápasu na dané pozici odhlásí, budete automaticky zařazen na tuto pozici
                                    </li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Vaše registrace se uloží k zápasu.</li>
                                    <li>
                                        Na kartě nebo v detailu zápasu se zobrazí stav{" "}
                                        <strong>BUDU</strong>.
                                    </li>                                   
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Odhlášení ze zápasu</h6>
                                <p>
                                    Pokud jste byl přihlášen a nemůžete přijít, můžete se ze
                                    zápasu odhlásit.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete detail zápasu.</li>
                                    <li>
                                        Zvolte možnost <strong>Nepříjdu</strong>.
                                    </li>                                    
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Vaše účast se u zápasu zruší.</li>
                                    <li>
                                        U zápasu se zobrazí stav <strong>ODHLÁŠEN</strong>.
                                    </li>
                                    <li>
                                        Uvolněné místo bude nabídnuto dalším hráčům.
                                    </li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Omluvení ze zápasu</h6>
                                <p>
                                    Pokud předem víte, že se nemůžete zúčastnit, je vhodné se
                                    omluvit.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete detail zápasu.</li>
                                    <li>
                                        Zvolte možnost <strong>Omluvit se</strong>.
                                    </li>
                                    <li>
                                        Zvolte možnost <strong>Omluvit se</strong> a vyberte důvod.
                                    </li>
                                    <li>
                                        
                                    </li>
                                    <li>Potvrďte odeslání vašeho odhlášení.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>
                                        U zápasu se zobrazí stav <strong>NEMŮŽU</strong>.
                                    </li>
                                    <li>
                                        Organizátor vidí, že jste svou neúčast oznámil včas.
                                    </li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Čekání na místo</h6>
                                <p>
                                    Pokud je kapacita zápasu naplněna, můžete se i tak zařadit na obsazenou pozici. Vaše registrace
                                    bude zaznamenána, a v případě uvolnění kapacity budete automaticky zařazen do sestavy v zápasu.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>
                                        Může se zobrazit stav <strong>ČEKÁM</strong>.
                                    </li>
                                    <li>
                                        To znamená, že momentálně není volné místo v zápase.
                                    </li>
                                    <li>
                                        Pokud se někdo odhlásí nebo organizátor upraví sestavu (zvýši kapacitu hráčů),
                                        můžete být doplněn mezi aktivní hráče.
                                    </li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">
                                    5. Možná účast / náhradník
                                </h6>
                                <p>
                                    V některých případech může být vaše účast vedena jako možná. Znamená to, že ještě 
                                    nevíte, zda budete moci přijít.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>
                                        U zápasu se může zobrazit stav <strong>MOŽNÁ</strong>.
                                    </li>
                                    <li>
                                        Tento stav znamená, že nejste potvrzen jako standardně
                                        zařazený hráč.
                                    </li>
                                    <li>
                                        Tato možnost je především pro organizátora zápasu, aby věděl, že o zápase víte, 
                                        ale ještě nejste rozhodnut.
                                    </li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">6. Bez reakce</h6>
                                <p>
                                    Pokud jste na zápas ještě nijak nereagoval, systém vás vede bez
                                    potvrzeného rozhodnutí.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>
                                        U zápasu se zobrazí stav bez odpovědi nebo interně{" "}
                                        <strong>NO_RESPONSE</strong>.
                                    </li>
                                    <li>
                                        Znamená to, že jste zatím nijak nereagoval.
                                    </li>
                                    <li>
                                        Systém vám dle vašeho nastavení notifikaci zašle upozornění, že je vypsán termín 
                                        zápasu, a že jste na něj ještě nijak nereagoval.
                                    </li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">7. Neomluvená absence</h6>
                                <p>
                                    Pokud jste na zápas nepřišel bez předchozí omluvy, může být
                                    vaše účast vedena jako neomluvená.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>
                                        U zápasu se zobrazí stav <strong>NEOMLUVEN</strong> nebo{" "}
                                        <strong>NEPŘIŠEL</strong>.
                                    </li>
                                    <li>
                                        Tento stav vzniká až po zápase pokud jste se k zápasu zaregistroval, a nakonec
                                        jste bez omluvy, nebo zrušení registrace na zápas nepřišel.
                                    </li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">8. Zrušený zápas</h6>
                                <p>
                                    Pokud je zápas zrušen, není možné se na něj dále registrovat
                                    ani upravovat účast.
                                </p>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>
                                        Karta zápasu je označena jako <strong>ZRUŠENÝ</strong>.
                                    </li>
                                    <li>
                                        Detail zápasu tak nebude dostupný pro další registrace.
                                    </li>
                                    <li>Může se zobrazit i důvod zrušení.</li>
                                    <li>Zápas může být organizátorem obnoven, a vaše registrace tak bude nadále platná.</li>
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
                                                <td className="help-status-cell">
                                                    <RegisteredIcon className="help-icon help-icon-registered" />
                                                    <span>BUDU</span>
                                                </td>
                                                <td>Jste přihlášen na zápas.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <UnregisteredIcon className="help-icon help-icon-unregistered" />
                                                    <span>ODHLÁŠEN</span>
                                                </td>
                                                <td>Ze zápasu jste se odhlásil.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <ExcusedIcon className="help-icon help-icon-excused" />
                                                    <span>NEMŮŽU</span>
                                                </td>
                                                <td>Ze zápasu jste omluven.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <ReservedIcon className="help-icon help-icon-reserved" />
                                                    <span>ČEKÁM</span>
                                                </td>
                                                <td>Momentálně čekáte na volné místo.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <NoResponseIcon className="help-icon help-icon-substitute" />
                                                    <span>MOŽNÁ</span>
                                                </td>
                                                <td>
                                                    Vaše účast je vedena jako nejistá.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <NoResponseIcon className="help-icon help-icon-no-response" />
                                                    <span>BEZ ODPOVĚDI</span>
                                                </td>
                                                <td>Na zápas jste zatím nijak nereagoval.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <NoExcusedIcon className="help-icon help-icon-no-excused" />
                                                    <span>NEOMLUVEN</span>
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
                                    <li>
                                        Pokud se nemůžete zúčastnit, odhlaste se nebo se omluvte, ať organizátor zápasu ví, 
                                        jaka bude účast, a může případně při nedostatečné účasti zápas zrušit.
                                    </li>
                                    <li>
                                        Průběžně sledujte svůj stav u zápasu, zejména pokud čekáte
                                        na místo.
                                    </li>
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