import React, { useState } from "react";
import { usePlayers } from "../../hooks/usePlayers";
import PlayerCard from "./PlayerCard";
import { setCurrentPlayer } from "../../api/playerApi";
import { useNavigate } from "react-router-dom";
import { useCurrentPlayer } from "../../hooks/useCurrentPlayer";
import PlayerHelpModal from "../help/PlayerHelpModal";

import "./Players.css";

/**
 * Players
 *
 * React komponenta používaná ve frontend aplikaci.
 *
 * Zobrazuje seznam hráčů uživatele a umožňuje výběr aktuálního hráče.
 * Pokud uživatel ještě nemá vytvořeného žádného hráče, nabídne jeho vytvoření.
 * V obou stavech rozhraní je dostupné tlačítko pro otevření nápovědy.
 */
const Players = () => {
    const { players, loading, error } = usePlayers();
    const navigate = useNavigate();
    const { currentPlayer, refreshCurrentPlayer } = useCurrentPlayer();

    const [showHelp, setShowHelp] = useState(false);

    const handleSelectPlayer = async (playerId) => {
        try {
            await setCurrentPlayer(playerId);
            await refreshCurrentPlayer();
            navigate("/app/matches");
        } catch (err) {
            console.error("Nelze nastavit aktuálního hráče", err);
            alert("Nepodařilo se vybrat hráče.");
        }
    };

    if (loading) {
        return <p>Načítám hráče…</p>;
    }

    if (error) {
        return <p className="text-danger">{error}</p>;
    }

    return (
        <>
            {players.length === 0 ? (
                <div className="text-center mt-4">
                    <p className="mb-3">
                        Ještě nemáte vytvořeného žádného hráče.
                        <br />
                        Chcete ho nyní vytvořit?
                    </p>

                    <div>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/app/createPlayer")}
                        >
                            Vytvořit hráče
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => setShowHelp(true)}
                        >
                            Nápověda
                        </button>
                    </div>
                </div>
            ) : (
                <div className="container mt-4">
                    <div className="player-list">
                        {players.map((p) => {
                            const isActive = currentPlayer?.id === p.id;

                            const disabledTooltip =
                                p.playerStatus === "PENDING"
                                    ? "Hráč čeká na schválení administrátorem"
                                    : p.playerStatus === "REJECTED"
                                        ? "Hráč byl zamítnut administrátorem"
                                        : "";

                            return (
                                <div className="player-item" key={p.id}>
                                    <div
                                        className={`selected-player-frame ${isActive ? "selected-player-frame--on" : ""
                                            }`}
                                        aria-label={isActive ? "Vybraný hráč" : undefined}
                                    >
                                        {isActive && (
                                            <div className="selected-player-badge">
                                                Vybraný hráč
                                            </div>
                                        )}

                                        <PlayerCard
                                            player={p}
                                            isActive={false}
                                            onSelect={() => handleSelectPlayer(p.id)}
                                            disabledTooltip={disabledTooltip}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-4">
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate("/app/createPlayer")}
                        >
                            Přidat dalšího hráče
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => setShowHelp(true)}
                        >
                            Nápověda
                        </button>
                    </div>
                </div>
            )}

            <PlayerHelpModal
                show={showHelp}
                onClose={() => setShowHelp(false)}
            />
        </>
    );
};

export default Players;