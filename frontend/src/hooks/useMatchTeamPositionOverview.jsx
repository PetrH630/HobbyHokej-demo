import { useEffect, useState } from "react";
import { getMatchTeamPositionOverview } from "../api/matchApi";

/**
 * Načítá MatchTeamPositionOverviewDTO pro daný zápas a tým.
 *
 * Volá endpoint pouze pokud:
 * - isOpen === true
 * - matchId není null
 * - team (focusTeam) je zadaný
 */
/**
 * useMatchTeamPositionOverview
 *
 * Hook pro načtení přehledu obsazenosti pozic pro konkrétní tým v zápase.
 * Používá se v modalech a přehledech rozestavení, kde je potřeba zobrazit pozice, kapacitu a obsazenost.
 */
export const useMatchTeamPositionOverview = (matchId, team, isOpen) => {
    const [data, setData] = useState(null);   // MatchTeamPositionOverviewDTO
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !matchId || !team) {
            setData(null);
            setError(null);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const dto = await getMatchTeamPositionOverview(matchId, team);
                if (!cancelled) {
                    setData(dto);
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setError("Nepodařilo se načíst rozložení pozic pro vybraný tým.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [matchId, team, isOpen]);

    return { data, loading, error };
};