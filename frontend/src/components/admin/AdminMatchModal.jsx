// src/components/admin/AdminMatchModal.jsx
import { useEffect, useState } from "react";
import DateTimePicker from "../forms/DateTimePicker";
import { validateMatch } from "../../validation/matchValidation";
import { tryClearDemoNotifications } from "../../api/demoApi";
import {
    MATCH_MODE_OPTIONS,
    calculateMaxPlayers,
} from "../../constants/matchModeConfig";

// backend "yyyy-MM-dd HH:mm:ss" -> picker
const toPickerValue = (value) => {
    if (!value) return "";
    const s = String(value);
    if (s.includes("T")) return s.slice(0, 16);
    return s.replace(" ", "T").slice(0, 16);
};

// picker -> backend
const toBackendDateTime = (valueString) => {
    if (!valueString) return null;
    if (valueString.includes("T")) {
        const [date, time] = valueString.split("T");
        const [hh = "00", mm = "00"] = time.split(":");
        return `${date} ${hh}:${mm}:00`;
    }
    return valueString;
};

/**
 * AdminMatchModal
 *
 * Bootstrap modal komponenta pro práci s modálním dialogem.
 *
 * Umožňuje vytvoření nového zápasu i úpravu existujícího zápasu.
 * Obsahuje lokální stav formuláře, validaci vstupu a převod datumu
 * mezi formátem pickeru a backendovým formátem.
 *
 * Props:
 * @param {MatchDTO} props.match Data vybraného zápasu načtená z backendu.
 * @param {boolean} props.show určuje, zda je dialog otevřený.
 * @param {Function} props.onClose callback pro předání akce do nadřazené vrstvy.
 * @param {Function} props.onSave callback pro předání uložených dat nadřazené vrstvě.
 * @param {boolean} props.saving Příznak, že probíhá ukládání a akce mají být dočasně blokovány.
 * @param {string} props.serverError Chybová zpráva vrácená ze serveru.
 */
const AdminMatchModal = ({
    match,
    show,
    onClose,
    onSave,
    saving,
    serverError,
}) => {
    const isNew = !match?.id;

    const [values, setValues] = useState({
        id: match?.id ?? null,
        dateTime: match?.dateTime ? toPickerValue(match.dateTime) : "",
        location: match?.location || "",
        description: match?.description || "",
        maxPlayers:
            match?.maxPlayers !== undefined && match?.maxPlayers !== null
                ? match.maxPlayers
                : "",
        price:
            match?.price !== undefined && match?.price !== null
                ? match.price
                : "",
        matchStatus: match?.matchStatus || null,
        cancelReason: match?.cancelReason || null,
        matchNumber: match?.matchNumber || null,
        seasonId: match?.seasonId || null,
        matchMode: match?.matchMode || null,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!show) return;

        if (match) {
            setValues({
                id: match.id ?? null,
                dateTime: match?.dateTime ? toPickerValue(match.dateTime) : "",
                location: match.location || "",
                description: match.description || "",
                maxPlayers:
                    match.maxPlayers !== undefined &&
                        match.maxPlayers !== null
                        ? match.maxPlayers
                        : "",
                price:
                    match.price !== undefined && match.price !== null
                        ? match.price
                        : "",
                matchStatus: match.matchStatus || null,
                cancelReason: match.cancelReason || null,
                matchNumber: match.matchNumber || null,
                seasonId: match.seasonId || null,
                matchMode: match.matchMode || null,
            });
        } else {
            setValues({
                id: null,
                dateTime: "",
                location: "",
                description: "",
                maxPlayers: "",
                price: "",
                matchStatus: null,
                cancelReason: null,
                matchNumber: null,
                seasonId: null,
                matchMode: null,
            });
        }

        setErrors({});
    }, [match, show]);

    /*
     * Automatické přepočítání maxPlayers při změně matchMode.
     *
     * - u nového zápasu vždy, jakmile se změní matchMode,
     * - u existujícího zápasu pouze tehdy, když uživatel opravdu změní
     *   matchMode na jinou hodnotu než byla původně v match.matchMode.
     */
    useEffect(() => {
        if (!values.matchMode) return;

        const calculated = calculateMaxPlayers(values.matchMode);

        if (isNew) {
            setValues((prev) => ({
                ...prev,
                maxPlayers: calculated,
            }));
        } else if (values.matchMode !== match?.matchMode) {
            setValues((prev) => ({
                ...prev,
                maxPlayers: calculated,
            }));
        }
    }, [values.matchMode, isNew, match]);

    const handleChange = (patch) => {
        setValues((prev) => ({ ...prev, ...patch }));

        const key = Object.keys(patch)[0];
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy[key];
            return copy;
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        handleChange({ [name]: value });
    };

    /**
     * Zpracuje odeslání formuláře a zavolá příslušný callback nadřazené komponenty.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateMatch(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) return;

        await tryClearDemoNotifications();

        const payload = {
            id: values.id,
            dateTime: toBackendDateTime(values.dateTime),
            location: values.location?.trim(),
            description:
                values.description?.trim() !== ""
                    ? values.description.trim()
                    : null,
            maxPlayers:
                values.maxPlayers === "" ? null : Number(values.maxPlayers),
            price: values.price === "" ? null : Number(values.price),
            matchMode: values.matchMode || null,
        };

        onSave(payload);
    };

    /**
     * Zajistí konzistentní zavření modalu a vrácení lokálního stavu do výchozího nastavení.
     */
    const handleClose = () => {
        if (!saving) onClose();
    };

    if (!show) return null;

    const dateTimeClass =
        "form-control border-primary" + (errors.dateTime ? " is-invalid" : "");
    const locationClass =
        "form-control border-primary" + (errors.location ? " is-invalid" : "");
    const descriptionClass =
        "form-control border-primary" + (errors.description ? " is-invalid" : "");
    const maxPlayersClass =
        "form-control border-primary" + (errors.maxPlayers ? " is-invalid" : "");
    const priceClass = "form-control border-primary" + (errors.price ? " is-invalid" : "");

    return (
        <>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {isNew
                                        ? "Vytvořit nový zápas"
                                        : `Upravit zápas #${values.id}`}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleClose}
                                    disabled={saving}
                                    aria-label="Zavřít"
                                />
                            </div>

                            <div className="modal-body">
                                {serverError && (
                                    <div className="alert alert-danger">
                                        {serverError}
                                    </div>
                                )}

                                <div>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            htmlFor="match-dateTime"
                                        >
                                            Datum a čas zápasu
                                        </label>

                                        <DateTimePicker
                                            id="match-dateTime"
                                            name="dateTime"
                                            value={values.dateTime || ""}
                                            onChange={(valueString) =>
                                                handleChange({
                                                    dateTime: valueString,
                                                })
                                            }
                                            placeholder="Vyber datum a čas…"
                                            required
                                            className={dateTimeClass}
                                        />
                                        {errors.dateTime && (
                                            <div className="invalid-feedback d-block">
                                                {errors.dateTime}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            htmlFor="match-location"
                                        >
                                            Místo konání
                                        </label>
                                        <input
                                            type="text"
                                            id="match-location"
                                            name="location"
                                            className={locationClass}
                                            value={values.location || ""}
                                            onChange={handleInputChange}
                                            placeholder="Např. Hala Polárka"
                                            disabled={saving}
                                        />
                                        {errors.location && (
                                            <div className="invalid-feedback d-block">
                                                {errors.location}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            htmlFor="match-description"
                                        >
                                            Popis (volitelné)
                                        </label>
                                        <textarea
                                            id="match-description"
                                            name="description"
                                            className={descriptionClass}
                                            value={values.description || ""}
                                            onChange={handleInputChange}
                                            rows={1}
                                            placeholder="Např. přátelské utkání…"
                                            disabled={saving}
                                        />
                                        {errors.description && (
                                            <div className="invalid-feedback d-block">
                                                {errors.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3 mt-3">
                                        <label
                                            className="form-label"
                                            htmlFor="match-matchMode"
                                        >
                                            Herní systém
                                        </label>
                                        <select
                                            id="match-matchMode"
                                            className="form-select border-primary"
                                            value={values.matchMode || ""}
                                            onChange={(e) =>
                                                handleChange({
                                                    matchMode:
                                                        e.target.value || null,
                                                })
                                            }
                                            disabled={saving}
                                        >
                                            <option value="">
                                                -- Vyber herní systém --
                                            </option>

                                            {MATCH_MODE_OPTIONS.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            htmlFor="match-maxPlayers"
                                        >
                                            Maximální počet hráčů (celkem)
                                        </label>
                                        <input
                                            type="number"
                                            id="match-maxPlayers"
                                            name="maxPlayers"
                                            className={maxPlayersClass}
                                            value={values.maxPlayers ?? ""}
                                            onChange={handleInputChange}
                                            min={1}
                                            disabled={saving}
                                        />
                                        {errors.maxPlayers && (
                                            <div className="invalid-feedback d-block">
                                                {errors.maxPlayers}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label
                                            className="form-label"
                                            htmlFor="match-price"
                                        >
                                            Cena (celkem za pronájem)
                                        </label>
                                        <input
                                            type="number"
                                            id="match-price"
                                            name="price"
                                            className={priceClass}
                                            value={values.price ?? ""}
                                            onChange={handleInputChange}
                                            min={0}
                                            disabled={saving}
                                        />
                                        {errors.price && (
                                            <div className="invalid-feedback d-block">
                                                {errors.price}
                                            </div>
                                        )}
                                    </div>
                                </div>



                                {!isNew && (
                                    <div className="mt-3">
                                        <small className="text-muted">
                                            Stav zápasu:{" "}
                                            {values.matchStatus ||
                                                "NENASTAVEN"}
                                        </small>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleClose}
                                    disabled={saving}
                                >
                                    Zavřít
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Ukládám…"
                                        : isNew
                                            ? "Vytvořit zápas"
                                            : "Uložit změny"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show"></div>
        </>
    );
};

export default AdminMatchModal;