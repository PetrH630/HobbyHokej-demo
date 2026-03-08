import "./AdminNavbarHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";

/**
 * AdminPlayersHelpModal
 *
 * Modální dialog zobrazující nápovědu ke správě hráčů
 * pro administrátora a manažera.
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null} modální dialog s nápovědou nebo null
 */
const AdminPlayersHelpModal = ({ show, onClose }) => {
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
                            <h5 className="modal-title">Nápověda - správa hráčů</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Zavřít"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            <section className="mb-4">
                                <h6 className="fw-bold">1. Co stránka Hráči umožňuje</h6>
                                <p>
                                    Stránka správy hráčů slouží ke globálnímu přehledu všech hráčů v systému.
                                    Umožňuje filtrovat hráče podle stavu a provádět nad nimi správní akce.
                                </p>
                                <ul>
                                    <li>schválit čekajícího hráče</li>
                                    <li>zamítnout hráče</li>
                                    <li>upravit profil hráče</li>
                                    <li>zobrazit historii a statistiky</li>
                                    <li>nastavit nebo zkontrolovat neaktivitu</li>
                                    <li>smazat hráče</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Filtry hráčů</h6>
                                <p>
                                    Seznam lze filtrovat podle provozního stavu hráče. Na mobilu je filtr zobrazen
                                    jako dropdown, na větších zařízeních jako přepínací tlačítka.
                                </p>
                                <ul>
                                    <li><strong>Všichni</strong> - zobrazí všechny hráče</li>
                                    <li><strong>Aktivní</strong> - schválení hráči, kteří právě nejsou v neaktivitě</li>
                                    <li><strong>Čeká na schválení</strong> - noví nebo neschválení hráči</li>
                                    <li><strong>Neaktivní</strong> - hráči, kteří mají právě aktivní období mimo hru</li>
                                    <li><strong>Zamítnutí</strong> - hráči ve stavu REJECTED</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Schválení a zamítnutí hráče</h6>
                                <p>
                                    Nově vytvořený hráč může být nejprve ve stavu čekání. Administrátor nebo manažer
                                    rozhodne, zda bude schválen pro další používání systému.
                                </p>
                                <ol>
                                    <li>Vyhledejte hráče v seznamu nebo přes filtr.</li>
                                    <li>Na kartě použijte akci <strong>Schválit</strong> nebo <strong>Zamítnout</strong>.</li>
                                    <li>Po provedení akce dojde k aktualizaci seznamu.</li>
                                </ol>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Editace hráče</h6>
                                <p>
                                    U hráče lze otevřít editační modal a upravit jeho profilové údaje.
                                </p>
                                <ul>
                                    <li>jméno a příjmení</li>
                                    <li>přezdívku</li>
                                    <li>telefon</li>
                                    <li>tým</li>
                                    <li>primární a sekundární pozici</li>
                                    <li>typ hráče</li>
                                </ul>
                                <p>
                                    Po uložení změn se karta hráče aktualizuje podle nového stavu dat.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">5. Neaktivita hráče</h6>
                                <p>
                                    U každého hráče lze sledovat nebo nastavovat období neaktivity. Tato funkce slouží
                                    například pro dlouhodobé zranění, dočasné přerušení hraní nebo provozní vyřazení.
                                </p>
                                <ul>
                                    <li>aktivní neaktivita ovlivňuje filtrování hráčů</li>
                                    <li>neaktivní hráči se odlišují od běžně schválených hráčů</li>
                                    <li>na kartě lze otevřít přehled historie neaktivity</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">6. Historie a statistiky hráče</h6>
                                <p>
                                    Administrátor nebo manažer může z karty otevřít historii registrací a hráčské statistiky.
                                </p>
                                <ul>
                                    <li>historie pomáhá zkontrolovat účasti a chování hráče v čase</li>
                                    <li>statistiky zobrazují přehled výkonů a výsledků podle dat systému</li>
                                </ul>
                            </section>

                            <section>
                                <h6 className="fw-bold">7. Smazání hráče</h6>
                                <p>
                                    Smazání je nevratná nebo citlivá operace. Před potvrzením je vhodné ověřit, zda hráč
                                    nemá důležitou historii, která by měla v systému zůstat zachována.
                                </p>
                                <ol>
                                    <li>Na kartě hráče zvolte akci pro smazání.</li>
                                    <li>Potvrďte dialog.</li>
                                    <li>Po úspěšném smazání se hráč odstraní ze seznamu.</li>
                                </ol>
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

export default AdminPlayersHelpModal;
