import "./AdminNavbarHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";

/**
 * AdminUsersHelpModal
 *
 * Modální dialog zobrazující nápovědu ke správě uživatelů.
 * Sekce je určena pouze administrátorovi.
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null} modální dialog s nápovědou nebo null
 */
const AdminUsersHelpModal = ({ show, onClose }) => {
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
                            <h5 className="modal-title">Nápověda - správa uživatelů</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Zavřít"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            <section className="mb-4">
                                <h6 className="fw-bold">1. K čemu slouží správa uživatelů</h6>
                                <p>
                                    Tato sekce slouží ke správě uživatelských účtů v systému. Je určena pouze administrátorovi.
                                    Na kartě každého uživatele jsou vidět základní údaje, role a přiřazení hráči.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Přehled uživatelského účtu</h6>
                                <ul>
                                    <li>jméno a příjmení</li>
                                    <li>e-mail</li>
                                    <li>role nebo role uživatele</li>
                                    <li>stav účtu - aktivní nebo neaktivní</li>
                                    <li>seznam přiřazených hráčů</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Reset hesla</h6>
                                <p>
                                    Pokud uživatel ztratí přístup ke svému účtu nebo je potřeba provést servisní zásah,
                                    lze na kartě účtu použít akci <strong>Reset hesla</strong>.
                                </p>
                                <p>
                                    Tato operace se používá jen v odůvodněných případech a měla by být prováděna s ohledem
                                    na bezpečnost účtu.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Aktivace a deaktivace účtu</h6>
                                <p>
                                    Účet lze podle potřeby aktivovat nebo deaktivovat. Neaktivní účet se používá například
                                    tehdy, pokud uživatel nesmí dočasně nebo trvale přistupovat do systému.
                                </p>
                                <ul>
                                    <li><strong>Aktivovat</strong> - znovu zpřístupní účet</li>
                                    <li><strong>Deaktivovat</strong> - zablokuje běžné používání účtu</li>
                                </ul>
                                <p>
                                    U administrátorského účtu jsou některé akce záměrně blokované, aby nedošlo k nežádoucímu
                                    odstavení správy systému.
                                </p>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">5. Přiřazení hráči u uživatele</h6>
                                <p>
                                    Ve spodní části karty je uveden seznam hráčů navázaných na konkrétní uživatelský účet.
                                    Díky tomu lze rychle zkontrolovat, jaké hráčské profily pod účet patří.
                                </p>
                                <ul>
                                    <li>viditelné je jméno hráče, přezdívka a identifikátor</li>
                                    <li>u každého hráče je uveden i tým</li>
                                    <li>tento přehled pomáhá při řešení podpory a správy oprávnění</li>
                                </ul>
                            </section>

                            <section>
                                <h6 className="fw-bold">6. Doporučený postup práce</h6>
                                <ol>
                                    <li>Nejprve zkontrolujte identitu uživatele a správnost účtu.</li>
                                    <li>Ověřte, zda problém souvisí s heslem, deaktivací nebo s navázaným hráčem.</li>
                                    <li>Teprve poté použijte reset hesla nebo změnu aktivace.</li>
                                    <li>U administrátorských účtů postupujte obezřetně.</li>
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

export default AdminUsersHelpModal;
