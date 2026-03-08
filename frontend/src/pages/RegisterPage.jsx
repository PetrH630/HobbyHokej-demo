// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import { tryGetDemoNotifications, tryClearDemoNotifications } from "../api/demoApi";
import DemoNotificationsModal from "../components/demo/DemoNotificationsModal";

const hasAnyDemoItems = (demo) => {
  if (!demo) return false;
  return (demo.emails?.length ?? 0) > 0 || (demo.sms?.length ?? 0) > 0;
};

/**
 * RegisterPage
 *
 * Komponenta zobrazuje registrační formulář nového uživatele.
 * Provádí základní frontend validaci vstupních údajů ještě před odesláním
 * požadavku na backend a po úspěšné registraci zobrazuje potvrzovací zprávu.
 *
 * Validuje se zejména:
 * - e-mail ve správném formátu
 * - heslo s minimální délkou 8 znaků
 * - shoda hesla a potvrzení hesla
 *
 * Po úspěšné registraci se může načíst DEMO obsah se zachycenými
 * notifikacemi a zobrazit se v modálním okně.
 *
 * @returns {JSX.Element} Stránka registrace.
 */
const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // DEMO modal
  const [demoNotifications, setDemoNotifications] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

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
   * Aktualizuje hodnotu pole ve formuláři.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e změnová událost vstupního pole
   * @returns {void}
   */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Uzavírá DEMO modal a současně čistí jeho data.
   *
   * @returns {void}
   */
  const handleCloseDemoModal = () => {
    setShowDemoModal(false);
    setDemoNotifications(null);
  };

  /**
   * Vrací text validační chyby pro e-mail.
   *
   * @returns {string} Chybová zpráva nebo prázdný řetězec.
   */
  const getEmailError = () => {
    if (!form.email) return "";
    if (!isValidEmail(form.email)) {
      return "Zadejte platný e-mail ve formátu např. uzivatel@example.com.";
    }
    return "";
  };

  /**
   * Vrací text validační chyby pro heslo.
   *
   * @returns {string} Chybová zpráva nebo prázdný řetězec.
   */
  const getPasswordError = () => {
    if (!form.password) return "";
    if (!isValidPassword(form.password)) {
      return "Heslo musí obsahovat alespoň 8 znaků.";
    }
    return "";
  };

  /**
   * Vrací text validační chyby pro potvrzení hesla.
   *
   * @returns {string} Chybová zpráva nebo prázdný řetězec.
   */
  const getPasswordConfirmError = () => {
    if (!form.passwordConfirm) return "";
    if (form.password !== form.passwordConfirm) {
      return "Hesla se neshodují.";
    }
    return "";
  };

  const emailError = getEmailError();
  const passwordError = getPasswordError();
  const passwordConfirmError = getPasswordConfirmError();

  const isFormValid =
    form.name.trim() !== "" &&
    form.surname.trim() !== "" &&
    form.email.trim() !== "" &&
    form.password.trim() !== "" &&
    form.passwordConfirm.trim() !== "" &&
    !emailError &&
    !passwordError &&
    !passwordConfirmError;

  /**
   * Zpracovává odeslání registračního formuláře.
   *
   * Nejprve se provede frontend validace vstupních hodnot.
   * Pokud validace neprojde, formulář se neodešle.
   * Při úspěchu se odešle registrace na backend, zobrazí se potvrzení
   * a případně se načtou DEMO notifikace pro zobrazení v modálním dialogu.
   *
   * @param {React.FormEvent<HTMLFormElement>} e odesílací událost formuláře
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isValidEmail(form.email)) {
      setError("Zadejte platný e-mail ve správném formátu.");
      return;
    }

    if (!isValidPassword(form.password)) {
      setError("Heslo musí obsahovat alespoň 8 znaků.");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError("Hesla se neshodují.");
      return;
    }

    setLoading(true);

    try {
      await tryClearDemoNotifications();
      await registerUser(form);

      setSuccess(true);

      const demo = await tryGetDemoNotifications();
      console.log("[RegisterPage] demo:", demo);

      if (hasAnyDemoItems(demo)) {
        setDemoNotifications(demo);
        setShowDemoModal(true);
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Registrace se nezdařila."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow p-4">
            <h3 className="text-center mb-4">Registrace</h3>

            {error && <div className="alert alert-danger">{error}</div>}

            {success && (
              <div className="alert alert-success">
                <strong>Registrace proběhla úspěšně.</strong>
                <br />
                Byl Vám zaslán e-mail s odkazem pro aktivaci účtu. Prosím
                zkontrolujte svou schránku (i složku Spam).
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Křestní jméno
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="surname" className="form-label">
                    Příjmení
                  </label>
                  <input
                    id="surname"
                    type="text"
                    className="form-control"
                    name="surname"
                    value={form.surname}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${emailError ? "is-invalid" : form.email ? "is-valid" : ""}`}
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="např. uzivatel@example.com"
                    autoComplete="email"
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
                    className={`form-control ${passwordError ? "is-invalid" : form.password ? "is-valid" : ""}`}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Zadejte heslo"
                    autoComplete="new-password"
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

                <div className="mb-3">
                  <label htmlFor="passwordConfirm" className="form-label">
                    Potvrzení hesla
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    className={`form-control ${passwordConfirmError ? "is-invalid" : form.passwordConfirm ? "is-valid" : ""}`}
                    name="passwordConfirm"
                    value={form.passwordConfirm}
                    onChange={handleChange}
                    placeholder="Zadejte heslo znovu"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <div className="form-text">
                    Potvrzení hesla musí být shodné se zadaným heslem.
                  </div>
                  {passwordConfirmError && (
                    <div className="invalid-feedback d-block">
                      {passwordConfirmError}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-2"
                  disabled={loading || !isFormValid}
                >
                  {loading ? "Registruji…" : "Registrovat"}
                </button>
              </form>
            )}

            <button
              type="button"
              className="btn btn-outline-secondary w-100 mt-2"
              onClick={() => navigate("/login")}
            >
              Zpět na přihlášení
            </button>
          </div>
        </div>
      </div>

      {showDemoModal && demoNotifications && (
        <DemoNotificationsModal
          show={showDemoModal}
          notifications={demoNotifications}
          loading={false}
          error={null}
          onClose={handleCloseDemoModal}
        />
      )}
    </div>
  );
};

export default RegisterPage;