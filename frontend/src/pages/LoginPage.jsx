// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { loginUser } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";
import usePostLoginRedirect from "../hooks/usePostLoginRedirect";
import LoginHelpModal from "../components/help/LoginHelpModal";
import "../App.css";

/**
 * LoginPage
 *
 * Komponenta zobrazuje přihlašovací formulář uživatele.
 * Provádí základní frontend validaci vstupních údajů ještě před odesláním
 * požadavku na backend a po úspěšném přihlášení obnovuje aplikační stav.
 *
 * Používá se validace:
 * - e-mailu ve správném formátu
 * - hesla s minimální délkou 8 znaků
 *
 * Po úspěšném přihlášení se aktualizuje autentizační kontext,
 * provede se post-login redirect a následně se obnoví celá SPA,
 * aby se znovu načetly všechny contexty aplikace.
 *
 * @returns {JSX.Element} Stránka přihlášení.
 */
const LoginPage = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const postLoginRedirect = usePostLoginRedirect();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    /**
     * Ověřuje, zda má e-mail základní platný formát.
     *
     * @param {string} value hodnota e-mailu
     * @returns {boolean} Vrací true, pokud je formát platný.
     */
    const isValidEmail = (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    /**
     * Ověřuje, zda heslo splňuje minimální délku.
     *
     * @param {string} value hodnota hesla
     * @returns {boolean} Vrací true, pokud heslo obsahuje alespoň 8 znaků.
     */
    const isValidPassword = (value) => {
        return value.trim().length >= 8;
    };

    /**
     * Vrací text validační chyby pro e-mail.
     *
     * @returns {string} Chybová zpráva nebo prázdný řetězec.
     */
    const getEmailError = () => {
        if (!email) return "";
        if (!isValidEmail(email)) return "Zadejte platný e-mail ve formátu např. uzivatel@example.com.";
        return "";
    };

    /**
     * Vrací text validační chyby pro heslo.
     *
     * @returns {string} Chybová zpráva nebo prázdný řetězec.
     */
    const getPasswordError = () => {
        if (!password) return "";
        if (!isValidPassword(password)) return "Heslo musí obsahovat alespoň 8 znaků.";
        return "";
    };

    const emailError = getEmailError();
    const passwordError = getPasswordError();
    const isFormValid =
        email.trim() !== "" &&
        password.trim() !== "" &&
        !emailError &&
        !passwordError;

    /**
     * Zpracovává odeslání formuláře.
     *
     * Nejprve se provede frontend validace vstupních údajů.
     * Pokud validace neprojde, formulář se neodešle.
     * Při úspěchu se provede přihlášení přes API, aktualizace uživatele,
     * přesměrování podle role/stavu a následné obnovení celé aplikace.
     *
     * @param {React.FormEvent<HTMLFormElement>} e odesílací událost formuláře
     * @returns {Promise<void>}
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isValidEmail(email)) {
            setError("Zadejte platný e-mail ve správném formátu.");
            return;
        }

        if (!isValidPassword(password)) {
            setError("Heslo musí obsahovat alespoň 8 znaků.");
            return;
        }

        setLoading(true);

        try {
            await loginUser(email, password);
            await updateUser();
            await postLoginRedirect();

            // Provede se obnovení celé SPA, aby se znovu načetly všechny contexty.
            window.location.reload();
        } catch (err) {
            setError(err?.response?.data?.message || "Neplatné přihlášení");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-12 d-flex justify-content-center">
                    <div
                        className="card shadow p-4 mx-auto auth-card"
                        style={{ maxWidth: "420px" }}
                    >
                        <h3 className="text-center mb-2">HokejApp</h3>
                        <h5 className="text-center mb-4 text-muted">Přihlášení</h5>

                        <h6 className="text-center mb-0">Přístupy:</h6>
                        <hr />
                        <p className="mb-1">
                            admin@example.com - Role Admin
                            <br />
                            Admin123
                        </p>
                        <p className="mb-1">
                            player1@example.com - Role Manažer
                            <br />
                            Heslo123
                        </p>
                        <p className="mb-0">
                            player2-10@example.com - Role Hráč
                            <br />
                            Heslo123
                        </p>
                        <hr />

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">
                                    E-mail
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className={`form-control ${emailError ? "is-invalid" : email ? "is-valid" : ""}`}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="např. uzivatel@example.com"
                                    autoComplete="username"
                                    required
                                />
                                <div className="form-text">
                                    Zadejte e-mail ve formátu např. uzivatel@example.com.
                                </div>
                                {emailError && (
                                    <div className="invalid-feedback d-block">
                                        {emailError}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">
                                    Heslo
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    className={`form-control ${passwordError ? "is-invalid" : password ? "is-valid" : ""}`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Zadejte heslo"
                                    autoComplete="current-password"
                                    minLength={8}
                                    required
                                />
                                <div className="form-text">
                                    Heslo musí obsahovat alespoň 8 znaků.
                                </div>
                                {passwordError && (
                                    <div className="invalid-feedback d-block">
                                        {passwordError}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={loading || !isFormValid}
                            >
                                {loading ? "Přihlašuji…" : "Přihlásit se"}
                            </button>
                        </form>

                        <div className="mt-3 text-center">
                            <Link to="/forgotten-password">
                                Zapomenuté heslo?
                            </Link>
                        </div>

                        <div className="mt-2 text-center">
                            Nemáte účet?{" "}
                            <Link to="/register">
                                Zaregistrujte se
                            </Link>
                        </div>
                        <div className="text-center mt-3">
                            <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => setShowHelpModal(true)}
                            >
                                Nápověda k přihlášení a registraci
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <LoginHelpModal
                show={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />
        </div>

    );
    
};

export default LoginPage;