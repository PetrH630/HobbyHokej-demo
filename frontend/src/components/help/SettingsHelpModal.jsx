import "./SettingsHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";

/**
 * SettingsHelpModal
 *
 * Modální dialog zobrazující uživatelskou nápovědu
 * pro stránku nastavení účtu a hráče.
 *
 * Modal obsahuje scénáře:
 * - profil hráče
 * - nastavení notifikací hráče
 * - profil uživatele
 * - nastavení uživatelského účtu
 * - změna hesla
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null}
 */
const SettingsHelpModal = ({ show, onClose }) => {
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
                    <div className="modal-content settings-help-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">Nápověda k nastavení</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Zavřít"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            <section className="mb-4">
                                <h6 className="fw-bold">1. Profil hráče</h6>
                                <p>
                                    V této části lze upravit základní údaje aktuálně vybraného hráče.
                                </p>

                                <h6 className="mt-3">Co lze upravit</h6>
                                <ul>
                                    <li>jméno</li>
                                    <li>příjmení</li>
                                    <li>přezdívku</li>
                                    <li>telefonní číslo</li>
                                    <li>tým</li>
                                    <li>primární pozici</li>
                                    <li>sekundární pozici</li>
                                </ul>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete záložku <strong>Nastavení hráče</strong>.</li>
                                    <li>V části <strong>Profil hráče</strong> upravte požadované údaje.</li>
                                    <li>Klikněte na <strong>Uložit profil hráče</strong>.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Změny se uloží do profilu aktuálního hráče a projeví se v aplikaci.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Nastavení notifikací hráče</h6>
                                <p>
                                    V této části lze nastavit, jaké notifikace má hráč dostávat.
                                </p>

                                <h6 className="mt-3">Co lze nastavit</h6>
                                <ul>
                                    <li>e-mailové notifikace</li>
                                    <li>SMS notifikace</li>
                                    <li>kontaktní e-mail</li>
                                    <li>kontaktní telefon</li>
                                    <li>čas připomenutí před zápasem</li>
                                </ul>

                                <h6 className="mt-3">Důležité podmínky</h6>
                                <ul>
                                    <li>
                                        Pokud jsou zapnuté e-mailové notifikace, musí být vyplněn
                                        kontaktní e-mail.
                                    </li>
                                    <li>
                                        Pokud jsou zapnuté SMS notifikace, musí být vyplněn
                                        kontaktní telefon.
                                    </li>
                                    <li>
                                        Telefon musí být zadán v mezinárodním formátu,
                                        například <strong>+420123456789</strong>.
                                    </li>
                                </ul>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete záložku <strong>Nastavení hráče</strong>.</li>
                                    <li>V části <strong>Nastavení notifikací hráče</strong> upravte požadované volby.</li>
                                    <li>Klikněte na tlačítko pro uložení nastavení.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Uloží se notifikační nastavení hráče a budou podle něj odesílány
                                    další zprávy a připomenutí.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Profil uživatele</h6>
                                <p>
                                    V této části lze upravit základní údaje uživatelského účtu.
                                </p>

                                <h6 className="mt-3">Co lze upravit</h6>
                                <ul>
                                    <li>jméno</li>
                                    <li>příjmení</li>
                                </ul>

                                <p>
                                    E-mail sloužící pro přihlášení je zobrazen pouze informativně
                                    a nelze jej zde měnit.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete záložku <strong>Nastavení uživatele (účtu)</strong>.</li>
                                    <li>V části <strong>Profil uživatele</strong> upravte požadované údaje.</li>
                                    <li>Klikněte na <strong>Uložit profil uživatele</strong>.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Aktualizují se základní údaje uživatelského účtu.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Nastavení uživatelského účtu</h6>
                                <p>
                                    Tato část slouží pro úpravu dalších vlastností uživatelského účtu
                                    podle dostupných voleb v aplikaci.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete záložku <strong>Nastavení uživatele (účtu)</strong>.</li>
                                    <li>V části <strong>Nastavení uživatelského účtu</strong> upravte dostupné volby.</li>
                                    <li>Klikněte na tlačítko pro uložení nastavení.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Změny se uloží k uživatelskému účtu a budou použity při další práci
                                    v systému.
                                </p>
                            </section>

                            <section>
                                <h6 className="fw-bold">5. Změna hesla</h6>
                                <p>
                                    V této části lze změnit přihlašovací heslo k účtu.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete záložku <strong>Změna hesla</strong>.</li>
                                    <li>Zadejte své stávající heslo.</li>
                                    <li>Zadejte nové heslo.</li>
                                    <li>Potvrďte nové heslo.</li>
                                    <li>Klikněte na tlačítko pro změnu hesla.</li>
                                </ol>

                                <h6 className="mt-3">Pravidla</h6>
                                <ul>
                                    <li>Nové heslo musí mít alespoň 8 znaků.</li>
                                    <li>Nové heslo a potvrzení se musí shodovat.</li>
                                    <li>Nové heslo se musí lišit od stávajícího hesla.</li>
                                </ul>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Po úspěšném uložení je přihlašovací heslo změněno.
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

export default SettingsHelpModal;