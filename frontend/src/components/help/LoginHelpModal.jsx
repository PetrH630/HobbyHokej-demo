import "./LoginHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";

/**
 * LoginHelpModal
 *
 * Komponenta zobrazuje uživatelskou nápovědu pro přihlášení,
 * registraci a obnovu hesla ve formě modálního dialogu.
 *
 * Při otevření blokuje scroll pozadí pomocí useGlobalModal.
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null} modální dialog s nápovědou nebo null
 */
const LoginHelpModal = ({ show, onClose }) => {
    useGlobalModal(show, onClose);

    if (!show) {
        return null;
    }

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-scrollable modal-lg" role="document">
                    <div className="modal-content login-help-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">Nápověda k přihlášení a registraci</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Zavřít"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            <section className="mb-4">
                                <h6 className="fw-bold">1. Registrace nového uživatele</h6>
                                <p>
                                    Registrace slouží k vytvoření uživatelského účtu v systému.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Na hlavní stránce klikněte na tlačítko <strong>Registrace</strong>.</li>
                                    <li>Vyplňte registrační formulář:</li>
                                </ol>

                                <ul>
                                    <li>Jméno</li>
                                    <li>Příjmení</li>
                                    <li>Email v platném formátu</li>
                                    <li>Heslo (minimálně 8 znaků)</li>
                                    <li>Potvrzení hesla</li>
                                </ul>

                                <ol start="3">
                                    <li>Klikněte na tlačítko <strong>Registrovat</strong>.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Pokud jsou všechny údaje správné, účet je vytvořen.</li>
                                    <li>Následně je vám zaslán na zadaný email odkaz pro aktivaci účtu.</li>
                                    <li>Po aktivaci účtu se můžete přihlásit do aplikace.</li>
                                </ul>

                                <h6 className="mt-3">Možné chyby</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Situace</th>
                                                <th>Výsledek</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Email již existuje</td>
                                                <td>Registrace není povolena</td>
                                            </tr>
                                            <tr>
                                                <td>Hesla se neshodují</td>
                                                <td>Formulář zobrazí chybovou hlášku</td>
                                            </tr>
                                            <tr>
                                                <td>Neplatný email</td>
                                                <td>Registrace není povolena</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Zapomenuté heslo</h6>
                                <p>
                                    Pokud zapomenete své heslo, můžete si ho obnovit.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>
                                        Na přihlašovací stránce klikněte na <strong>Zapomenuté heslo</strong>.
                                    </li>
                                    <li>Zadejte svůj email.</li>
                                    <li>Odešlete formulář.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Na zadaný email je odeslán odkaz pro změnu hesla.
                                </p>

                                <h6 className="mt-3">Obnovení hesla</h6>
                                <ol>
                                    <li>Klikněte na odkaz z emailu.</li>
                                    <li>Zadejte nové heslo.</li>
                                    <li>Potvrďte změnu.</li>
                                </ol>
                            </section>

                            <section>
                                <h6 className="fw-bold">3. Přihlášení do aplikace</h6>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>Otevřete přihlašovací stránku.</li>
                                    <li>Zadejte:</li>
                                </ol>

                                <ul>
                                    <li>Email</li>
                                    <li>Heslo</li>
                                </ul>

                                <ol start="3">
                                    <li>Klikněte na <strong>Přihlásit</strong>.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <p>
                                    Po úspěšném přihlášení budete přesměrován do aplikace.
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

export default LoginHelpModal;