import "./AdminNavbarHelpModal.css";
import { useGlobalModal } from "../../hooks/useGlobalModal";

/**
 * AdminNavbarHelpModal
 *
 * Modální dialog zobrazující nápovědu k administrační navigaci.
 * Vysvětluje přepnutí do režimu správce, dostupné sekce a rozdíl
 * mezi hráčskou a administrační částí aplikace.
 *
 * @param {Object} props vstupní parametry komponenty
 * @param {boolean} props.show určuje, zda je modal otevřený
 * @param {Function} props.onClose callback pro zavření modalu
 * @returns {JSX.Element|null} modální dialog s nápovědou nebo null
 */
const AdminNavbarHelpModal = ({ show, onClose }) => {
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
                    <div className="modal-content admin-help-modal">
                        <div className="modal-header">
                            <h5 className="modal-title">Nápověda - navbar a režim správce</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Zavřít"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            <section className="mb-4">
                                <h6 className="fw-bold">1. Tlačítko Správce</h6>
                                <p>
                                    Uživatel s rolí administrátora nebo manažera má v horní navigaci
                                    k dispozici tlačítko <strong>Správce</strong>. Toto tlačítko slouží
                                    k přepnutí mezi běžnou hráčskou částí aplikace a administrační částí.
                                </p>

                                <h6 className="mt-3">Postup</h6>
                                <ol>
                                    <li>V horní liště klikněte na tlačítko <strong>Správce</strong>.</li>
                                    <li>Aplikace přejde do administrační sekce.</li>
                                    <li>Po přepnutí se v navigaci zobrazí administrační odkazy.</li>
                                </ol>

                                <h6 className="mt-3">Výsledek</h6>
                                <ul>
                                    <li>Změní se kontext aplikace na správu systému.</li>
                                    <li>Začne se zobrazovat administrátorský přehled a administrační menu.</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">2. Zavřít správce</h6>
                                <p>
                                    Pokud se již nacházíte v administrační části, stejné tlačítko se změní
                                    na <strong>Zavřít správce</strong>. Slouží k návratu zpět do běžné hráčské části.
                                </p>

                                <ul>
                                    <li>kliknutí vrátí aplikaci na hráčský přehled</li>
                                    <li>znovu se zobrazí hráčské odkazy jako Přehled, Hráč, Zápasy a Nastavení</li>
                                </ul>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">3. Administrátorské odkazy v navbaru</h6>
                                <p>
                                    V režimu správce se v horní navigaci zobrazují odkazy podle role uživatele.
                                </p>

                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Sekce</th>
                                                <th>Význam</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Přehled</td>
                                                <td>Úvodní administrační rozcestník.</td>
                                            </tr>
                                            <tr>
                                                <td>Hráči</td>
                                                <td>Správa hráčů, schvalování, zamítání, editace a neaktivita.</td>
                                            </tr>
                                            <tr>
                                                <td>Zápasy</td>
                                                <td>Vytváření, úprava, rušení, obnova a mazání zápasů.</td>
                                            </tr>
                                            <tr>
                                                <td>Sezóny</td>
                                                <td>Správa sezón a přepnutí aktivní sezóny.</td>
                                            </tr>
                                            <tr>
                                                <td>Mimo</td>
                                                <td>Přehled a správa neaktivity hráčů.</td>
                                            </tr>
                                            <tr>
                                                <td>Uživatelé</td>
                                                <td>Správa uživatelských účtů. Tato sekce je pouze pro administrátora.</td>
                                            </tr>
                                            <tr>
                                                <td>Help</td>
                                                <td>Centrální nápověda pro administrátora a manažera.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="mb-4">
                                <h6 className="fw-bold">4. Rozdíl mezi administrátorem a manažerem</h6>
                                <p>
                                    Manažer a administrátor sdílí část správcovských funkcí, ale některé akce jsou
                                    vyhrazené pouze administrátorovi.
                                </p>

                                <ul>
                                    <li>manažer obvykle spravuje hráče, zápasy a provozní agendu</li>
                                    <li>administrátor navíc spravuje uživatele a jejich účty</li>
                                    <li>některé prvky se zobrazují podmíněně podle role přes RoleGuard</li>
                                </ul>
                            </section>

                            <section>
                                <h6 className="fw-bold">5. Mobilní navigace</h6>
                                <p>
                                    Na menších zařízeních se navigace zobrazuje přes hamburger menu. Pro administrátora
                                    a manažera je zde navíc přepínač mezi hráčským a správcovským režimem.
                                </p>

                                <ol>
                                    <li>Klikněte na ikonu menu.</li>
                                    <li>Pomocí tlačítka přepněte mezi režimy <strong>na Hráče</strong> a <strong>na Správce</strong>.</li>
                                    <li>Zvolte požadovanou administrační sekci.</li>
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

export default AdminNavbarHelpModal;
