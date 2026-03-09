import "./MatchesHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";
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

/**
 * MatchesHelpModal
 *
 * Modální dialog zobrazující uživatelskou nápovědu
 * pro stránku se zápasy hráče.
 *
 * Modal obsahuje scénáře:
 * - výběr sezóny
 * - nadcházející zápasy
 * - uplynulé zápasy
 * - filtr historie zápasů
 * - význam stavů zápasu a registrace
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null}
 */
const MatchesHelpModal = ({ show, onClose }) => {
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
                    <div className="modal-content matches-help-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">Nápověda k zápasům</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Zavřít"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            <section className="mb-4">
                                <h6 className="fw-bold">1. Výběr sezóny</h6>
                                <p>
                                    V horní části stránky lze vybrat sezónu, pro kterou se mají
                                    zobrazit zápasy.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>
                                        V horní části stránky otevřete pole{" "}
                                        <strong>Sezóna</strong>.
                                    </li>
                                    <li>Vyberte požadovanou sezónu ze seznamu.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Zobrazí se zápasy pro zvolenou sezónu.</li>
                                    <li>
                                        Pokud je sezóna již ukončena, zobrazí se pouze historie
                                        zápasů.
                                    </li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Nadcházející zápasy</h6>
                                <p>
                                    V této části jsou zobrazeny všechny budoucí zápasy pro
                                    aktuálně vybraného hráče.
                                </p>

                                <h6 className="mt-3">Co zde uvidíte</h6>
                                <ul>
                                    <li>datum a čas zápasu</li>
                                    <li>místo konání</li>
                                    <li>číslo zápasu</li>
                                    <li>režim zápasu</li>
                                    <li>obsazenost hráčů</li>
                                    <li>cenu za hráče</li>
                                    <li>váš aktuální stav registrace</li>
                                </ul>

                                <h6 className="mt-3">Důležité informace</h6>
                                <ul>
                                    <li>
                                        První aktivní zápas v seznamu může být zvýrazněn jako{" "}
                                        <strong>Nejbližší zápas</strong>.
                                    </li>
                                    <li>
                                        U budoucích zápasů se zobrazuje i počet dnů do začátku
                                        zápasu.
                                    </li>
                                    <li>
                                        Zrušený zápas je označen samostatným stavem a nelze jej
                                        otevřít.
                                    </li>
                                </ul>

                                <h6 className="mt-3">Kliknutí na zápas</h6>
                                <p>
                                    Kliknutím na kartu aktivního zápasu otevřete detail zápasu, kde
                                    lze zobrazit další informace a případně upravit svou
                                    registraci.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Uplynulé zápasy</h6>
                                <p>
                                    Ve spodní části stránky je zobrazena historie již proběhlých
                                    zápasů pro aktuálně vybraného hráče.
                                </p>

                                <h6 className="mt-3">Co zde uvidíte</h6>
                                <ul>
                                    <li>datum a čas odehraného zápasu</li>
                                    <li>místo konání</li>
                                    <li>výsledek zápasu, pokud je k dispozici</li>
                                    <li>váš stav u zápasu</li>
                                </ul>

                                <h6 className="mt-3">Kliknutí na zápas</h6>
                                <p>
                                    Detail uplynulého zápasu lze otevřít pouze tehdy, pokud jste
                                    byli na zápas registrováni. Pokud jste na zápase nebyli, může
                                    být karta zablokována.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Filtr uplynulých zápasů</h6>
                                <p>
                                    Historii zápasů lze filtrovat podle vašeho stavu registrace.
                                </p>

                                <h6 className="mt-3">Dostupné filtry</h6>
                                <ul>
                                    <li>
                                        <strong>Vše</strong> – zobrazí všechny uplynulé zápasy
                                    </li>
                                    <li>
                                        <strong>Byl</strong> – zobrazí zápasy, kde jste byli
                                        registrováni
                                    </li>
                                    <li>
                                        <strong>Odhlášen / omluven</strong> – zobrazí zápasy, ze
                                        kterých jste se odhlásili nebo omluvili
                                    </li>
                                    <li>
                                        <strong>Nereagoval / možná</strong> – zobrazí zápasy bez
                                        odpovědi nebo s nejistou účastí
                                    </li>
                                </ul>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Po změně filtru se seznam historie ihned upraví podle zvoleného
                                    typu.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">
                                    5. Význam stavů registrace hráče
                                </h6>
                                <p>
                                    Každá karta zápasu obsahuje stav, který vyjadřuje váš vztah k
                                    zápasu.
                                </p>

                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Stav</th>
                                                <th>Význam u uplynulých zápasů</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="help-status-cell registered-bg-color">
                                                    <Happy />
                                                </td>
                                                <td>Byl jste a váš tým vyhrál.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell registered-bg-color">
                                                    <Sad />
                                                </td>
                                                <td>Byl jste a váš tým prohrál.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell unregistered-bg-color">
                                                    <UnregisteredIcon className="unregistered-icon" />
                                                    <span>ODHLÁŠEN</span>
                                                </td>
                                                <td>Ze zápasu jste se odhlásil.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell excused-bg-color">
                                                    <ExcusedIcon className="excused-icon" />
                                                    <span>NEMOHL</span>
                                                </td>
                                                <td>Omluvil jste se ze zápasu.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell reserved-bg-color">
                                                    <ReservedIcon className="reserved-icon" />
                                                    <span>BYLO PLNO</span>
                                                </td>
                                                <td>
                                                    Čekáte na místo, protože kapacita byla naplněna.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell noresponse-bg-color">
                                                    <NoResponseIcon className="maybe-icon" />
                                                    <span>NEBYL</span>
                                                </td>
                                                <td>Dal jste možná.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell no-excused-bg-color">
                                                    <NoResponseIcon className="no-response-icon" />
                                                    <span>NEREAGOVAL</span>
                                                </td>
                                                <td>Na zápas jste zatím nijak nereagoval.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <NoExcusedIcon className="no-excused-icon" />
                                                    <span>NEPŘIŠEL</span>
                                                </td>
                                                <td>Na zápas jste nepřišel bez omluvy.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">6. Význam stavů samotného zápasu</h6>
                                <p>
                                    Kromě vašeho stavu registrace může mít vlastní stav i samotný
                                    zápas.
                                </p>

                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Stav zápasu</th>
                                                <th>Význam</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <span>Plánovaný</span>
                                                </td>
                                                <td>Zápas je standardně naplánovaný.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <span>Změněný</span>
                                                </td>
                                                <td>U zápasu došlo ke změně některých údajů.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <span>Obnovený</span>
                                                </td>
                                                <td>
                                                    Zápas byl po předchozí změně znovu potvrzen.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <span>Zrušený</span>
                                                </td>
                                                <td>Zápas se neuskuteční.</td>
                                            </tr>
                                            <tr>
                                                <td className="help-status-cell">
                                                    <span>Odehraný</span>
                                                </td>
                                                <td>Zápas již proběhl.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section>
                                <h6 className="fw-bold">
                                    7. Co dělat, když se zápasy nezobrazují
                                </h6>
                                <ul>
                                    <li>zkontrolujte, zda máte vybraného aktuálního hráče</li>
                                    <li>zkontrolujte, zda je zvolená správná sezóna</li>
                                    <li>
                                        ověřte, zda v dané sezóně existují vytvořené zápasy
                                    </li>
                                    <li>
                                        pokud jste veden jako dlouhodobě mimo hru, některé budoucí
                                        zápasy se nemusí zobrazit
                                    </li>
                                    <li>
                                        <strong>
                                            Možná jste veden jako typ hráče „Základní“. Zobrazí se
                                            pouze 1 nadcházející zápas, a to až 3 dny před zápasem.
                                            VIP a Standard mají přednost v přihlášení k zápasu. Toto
                                            nastavení může změnit manažer nebo admin v nastavení
                                            hráče.
                                        </strong>
                                    </li>
                                </ul>
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

export default MatchesHelpModal;