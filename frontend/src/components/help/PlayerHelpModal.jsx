import "./PlayerHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";

/**
 * PlayerHelpModal
 *
 * Modální dialog zobrazující uživatelskou nápovědu
 * pro práci s hráči, jejich výběrem a přepínáním.
 *
 * Modal obsahuje scénáře:
 * - vytvoření hráče
 * - výběr aktuálního hráče
 * - přepínání více hráčů v navigaci
 * - úprava profilu hráče
 * - nastavení hráče
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null}
 */
const PlayerHelpModal = ({ show, onClose }) => {
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
                    <div className="modal-content player-help-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                Nápověda - hráči, výběr hráče a přepínání
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
                                <h6 className="fw-bold">1. Vytvoření hráče</h6>

                                <p>
                                    Po registraci je vhodné vytvořit hráčský profil, který slouží
                                    pro registraci na zápasy a pro práci s hráčskou částí aplikace.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Po přihlášení přejděte do sekce <strong>Hráč</strong>.</li>
                                    <li>Klikněte na <strong>Vytvořit hráče</strong> nebo <strong>Přidat dalšího hráče</strong>.</li>
                                    <li>Vyplňte informace o hráči.</li>
                                </ol>

                                <ul>
                                    <li>Jméno</li>
                                    <li>Příjmení</li>
                                    <li>Přezdívka - nepovinné</li>
                                    <li>Telefon - nepovinné</li>
                                    <li>Tým</li>
                                    <li>Primární pozice</li>
                                    <li>Sekundární pozice</li>
                                </ul>

                                <ol start="4">
                                    <li>Uložte formulář.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>V systému je vytvořen nový hráčský profil.</li>
                                    <li>Hráče lze následně vybrat jako aktuálního.</li>
                                    <li>Po výběru hráče lze zobrazovat zápasy a používat další hráčské funkce.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Výběr hráče</h6>

                                <p>
                                    Pokud máte více hráčů, je potřeba vybrat, se kterým hráčem
                                    chcete aktuálně pracovat.
                                </p>

                                <h6 className="mt-3">Postup na stránce Hráč</h6>
                                <ol>
                                    <li>Otevřete stránku <strong>Hráč</strong>.</li>
                                    <li>V seznamu hráčů klikněte na kartu hráče, kterého chcete používat.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Zvolený hráč se nastaví jako aktuální hráč.</li>
                                    <li>Aplikace jej zvýrazní štítkem <strong>Vybraný hráč</strong>.</li>
                                    <li>Po výběru může dojít k přechodu na stránku zápasů.</li>
                                </ul>

                                <h6 className="mt-3">Důležité omezení</h6>
                                <ul>
                                    <li>Hráče ve stavu čekajícího schválení nelze běžně vybrat.</li>
                                    <li>Hráče zamítnutého administrátorem také nelze aktivně používat.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Přepínání více hráčů v horní navigaci</h6>

                                <p>
                                    Pokud máte přiřazeno více hráčů, lze aktuálního hráče přepínat
                                    přímo v horní navigační liště aplikace.
                                </p>

                                <h6 className="mt-3">Kde přepínání najdete</h6>
                                <ul>
                                    <li>na počítači v pravé části navbaru pod jménem uživatele</li>
                                    <li>na mobilu v horní části aplikace pod údaji uživatele</li>
                                </ul>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete rozbalovací seznam hráčů v navbaru.</li>
                                    <li>Vyberte jiného hráče ze seznamu.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Vybraný hráč se okamžitě nastaví jako aktuální.</li>
                                    <li>Následné stránky a data se zobrazují pro právě zvoleného hráče.</li>
                                    <li>Týká se to hlavně zápasů, přehledu a nastavení hráče.</li>
                                </ul>

                                <h6 className="mt-3">Poznámka</h6>
                                <p>
                                    Pokud máte pouze jednoho hráče, seznam pro přepínání se nezobrazuje
                                    a v navigaci je vidět jen jeho jméno.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Úprava profilu hráče</h6>

                                <p>
                                    U aktuálně vybraného hráče lze později upravit profilové údaje.
                                </p>

                                <h6 className="mt-3">Co lze upravit</h6>
                                <ul>
                                    <li>jméno</li>
                                    <li>příjmení</li>
                                    <li>přezdívku</li>
                                    <li>telefon</li>
                                    <li>tým</li>
                                    <li>primární a sekundární pozici</li>
                                </ul>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete stránku <strong>Nastavení</strong>.</li>
                                    <li>V záložce <strong>Nastavení hráče</strong> upravte požadovaná pole.</li>
                                    <li>Uložte profil hráče.</li>
                                </ol>
                            </section>

                            <section>
                                <h6 className="fw-bold">5. Nastavení hráče</h6>

                                <p>
                                    Kromě profilu lze upravit také nastavení vztahující se k aktuálnímu hráči,
                                    například notifikace a kontaktní údaje pro upozornění.
                                </p>

                                <h6 className="mt-3">Příklady nastavení</h6>
                                <ul>
                                    <li>kontaktní e-mail</li>
                                    <li>kontaktní telefon</li>
                                    <li>e-mailové notifikace</li>
                                    <li>SMS notifikace</li>
                                    <li>čas připomenutí před zápasem</li>
                                </ul>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Nastavení se vždy vztahuje k aktuálně vybranému hráči, proto je dobré
                                    před úpravami zkontrolovat, že máte nahoře v navigaci zvolen správný profil.
                                </p>
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

export default PlayerHelpModal;