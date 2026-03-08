import "./AdminNavbarHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";

/**
 * AdminMatchesHelpModal
 *
 * Modální dialog zobrazující nápovědu ke správě zápasů
 * pro administrátora a manažera.
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null} modální dialog s nápovědou nebo null
 */
const AdminMatchesHelpModal = ({ show, onClose }) => {
    useGlobalModal(show, onClose);

    if (!show) {
        return null;
    }

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-scrollable modal-lg" role="document">
                    <div className="modal-content admin-help-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">Nápověda - správa zápasů</h5>
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
                                    Správa zápasů vždy pracuje s aktuálně zvolenou sezónou. Před vytvářením nebo hledáním
                                    zápasu je vhodné nejprve zkontrolovat správnou sezónu v horní části stránky.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Vytvoření nového zápasu</h6>
                                <ol>
                                    <li>Klikněte na tlačítko <strong>Vytvořit nový zápas</strong>.</li>
                                    <li>Vyplňte datum a čas, místo, popis, kapacitu a další údaje.</li>
                                    <li>Uložte formulář v modalu zápasu.</li>
                                </ol>
                                <p>
                                    Po uložení se zápas přidá do seznamu a může vyvolat provozní notifikace.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Editace zápasu</h6>
                                <p>
                                    U existujícího zápasu lze upravit jeho parametry. Tato operace je vhodná například při
                                    změně termínu, lokace, ceny, kapacity nebo popisu.
                                </p>
                                <ul>
                                    <li>editace se otevírá z karty zápasu</li>
                                    <li>po změně může být zápas označen jako změněný</li>
                                    <li>po uložení se seznam obnoví podle aktuálních dat</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Filtry zápasů</h6>
                                <p>
                                    Seznam lze filtrovat podle času a provozního stavu zápasu.
                                </p>
                                <ul>
                                    <li><strong>Nejbližší</strong> - první nadcházející nezrušený zápas</li>
                                    <li><strong>Vše</strong> - kompletní seznam</li>
                                    <li><strong>Budoucí</strong> - zápasy v budoucnu</li>
                                    <li><strong>Uplynulé</strong> - již odehrané zápasy</li>
                                    <li><strong>Zrušené</strong> - zápasy se statusem CANCELED</li>
                                    <li><strong>Obnovené</strong> - zápasy se statusem UNCANCELED</li>
                                    <li><strong>Změněné</strong> - zápasy se statusem UPDATED</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">5. Zrušení a obnova zápasu</h6>
                                <p>
                                    Pokud se zápas nemůže uskutečnit, lze jej zrušit přes samostatný potvrzovací dialog.
                                    Při rušení se vybírá důvod, který se následně používá v systému i v komunikaci.
                                </p>
                                <ol>
                                    <li>Na kartě zvolte akci pro zrušení.</li>
                                    <li>Vyberte důvod zrušení.</li>
                                    <li>Potvrďte akci.</li>
                                </ol>
                                <p>
                                    Zrušený zápas lze v případě potřeby opět obnovit.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">6. Smazání zápasu</h6>
                                <p>
                                    Smazání zápasu je samostatná operace s potvrzením. Používá se hlavně tehdy, pokud byl
                                    zápas vytvořen omylem nebo je potřeba jej zcela odstranit ze systému.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">7. Detail a historie zápasu</h6>
                                <p>
                                    Z karty zápasu lze otevřít detail, kde je možné kontrolovat registrace, rozdělení týmů,
                                    průběh registrací a další provozní informace. U některých akcí je dostupná i historie.
                                </p>
                            </section>

                            <section>
                                <h6 className="fw-bold">8. Demo notifikace</h6>
                                <p>
                                    V demo režimu může po vytvoření, úpravě nebo zrušení zápasu vyskočit modal s ukázkou
                                    odeslaných e-mailů a SMS. Tento modal slouží pouze pro kontrolu chování aplikace v demo prostředí.
                                </p>
                            </section>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
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

export default AdminMatchesHelpModal;
