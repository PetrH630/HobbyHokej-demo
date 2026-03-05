import { useEffect, useState, useCallback } from "react";
import { fetchSpecialNotificationTargets } from "../api/notificationsApi";

/**
 * Struktura návratové hodnoty hooku useSpecialNotificationTargets.
 *
 * @typedef {Object} SpecialNotificationTargetsResult
 * @property {Array<Object>} targets seznam dostupných cílů pro speciální notifikaci
 * @property {boolean} loading příznak probíhajícího načítání
 * @property {string|null} error chybová zpráva vhodná pro zobrazení v uživatelském rozhraní
 * @property {function(): Promise<void>} reload funkce pro manuální znovunačtení seznamu cílů
 */

/**
 * useSpecialNotificationTargets
 *
 * Hook pro načítání možných příjemců speciální notifikace.
 *
 * Hook volá backend endpoint:
 * `/api/notifications/admin/special/targets`
 *
 * Vrací seznam dostupných cílů notifikací (např. skupiny uživatelů,
 * role nebo další definované cílové entity) spolu se stavem načítání
 * a případnou chybovou zprávou.
 *
 * Vlastnosti hooku:
 * - automatické načtení při prvním použití (autoLoad = true),
 * - možnost manuálního znovunačtení přes funkci reload(),
 * - chyba je vrácena jako řetězec vhodný pro zobrazení v UI.
 *
 * Použití:
 * Hook se používá v administraci při konfiguraci rozesílání
 * speciálních notifikací.
 *
 * @param {boolean} [autoLoad=true] určuje, zda se mají cíle načíst automaticky při prvním renderu
 * @returns {SpecialNotificationTargetsResult} návratová struktura hooku
 */
export const useSpecialNotificationTargets = (autoLoad = true) => {
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState(null);

    const loadTargets = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchSpecialNotificationTargets();
            setTargets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Nepodařilo se načíst cíle pro speciální notifikaci:", err);

            // Snažíme se z chybové odpovědi vytáhnout čitelnou zprávu,
            // ale pokud není k dispozici, použijeme obecnou.
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Nepodařilo se načíst možné příjemce speciální zprávy.";

            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (autoLoad) {
            loadTargets();
        }
    }, [autoLoad, loadTargets]);

    return {
        targets,
        loading,
        error,
        reload: loadTargets,
    };
};