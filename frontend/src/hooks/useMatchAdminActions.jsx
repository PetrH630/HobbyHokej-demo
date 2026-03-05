import { useState, useCallback } from "react";
import {
    autoLineupAdmin,
    updateMatchScoreAdmin,
} from "../api/matchApi";

/**
 * Hook pro admin/manager akce nad zápasem.
 *
 * Zapouzdřuje volání API a poskytuje jednotný stav načítání a chyby
 * pro operace nad zápasem (např. autolineup, update score).
 */
/**
 * useMatchAdminActions
 *
 * Hook zapouzdřující administrátorské akce nad zápasem (např. rušení, generování sestavy, úpravy stavu).
 * Vrací handlery připravené pro použití v admin UI a sjednocuje zpracování chyb/toastů/modálů.
 */
export const useMatchAdminActions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const runAutoLineup = useCallback(async (matchId) => {
        setLoading(true);
        setError(null);

        try {
            return await autoLineupAdmin(matchId);
        } catch (e) {
            setError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateScore = useCallback(async (matchId, scoreLight, scoreDark) => {
        setLoading(true);
        setError(null);

        try {
            return await updateMatchScoreAdmin(matchId, scoreLight, scoreDark);
        } catch (e) {
            setError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        runAutoLineup,
        updateScore,
    };
};