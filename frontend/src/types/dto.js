/**
 * Sdílené doménové typy (DTO) používané ve frontendu.
 *
 * Soubor se používá pouze pro dokumentaci pomocí JSDoc a pro IntelliSense ve VS Code.
 * Typy jsou definované podle toho, jak je frontend reálně čte a předává mezi komponentami.
 *
 * Poznámka:
 * Import typů v JSDoc se provádí přes `import("path").TypeName` a nemá vliv na běh aplikace.
 */

/**
 * @typedef {"DARK"|"LIGHT"} Team
 */

/**
 * @typedef {"REGISTERED"|"UNREGISTERED"|"EXCUSED"|"RESERVED"|"NO_RESPONSE"} RegistrationStatus
 */

/**
 * @typedef {"FORWARD"|"DEFENSE"|"GOALIE"} PlayerPosition
 */

/**
 * @typedef {"UPCOMING"|"IN_PROGRESS"|"FINISHED"|"CANCELED"} MatchStatus
 */

/**
 * PlayerDTO
 * @typedef {Object} PlayerDTO
 * @property {number} id Identifikátor hráče.
 * @property {string} fullName Zobrazované jméno hráče pro UI.
 * @property {Team} [team] Tým hráče, pokud je ve výstupu zahrnut.
 * @property {PlayerPosition} [primaryPosition] Primární pozice hráče, pokud je ve výstupu zahrnuta.
 * @property {RegistrationStatus} [registrationStatus] Stav registrace hráče, pokud je ve výstupu zahrnut.
 */

/**
 * MatchScoreDTO
 * @typedef {Object} MatchScoreDTO
 * @property {number} dark Počet gólů týmu DARK.
 * @property {number} light Počet gólů týmu LIGHT.
 */

/**
 * MatchDTO
 * @typedef {Object} MatchDTO
 * @property {number} id Identifikátor zápasu.
 * @property {string} [description] Popis zápasu zobrazovaný v detailu.
 * @property {string} dateTime Datum a čas zápasu ve formátu ISO (string).
 * @property {number} maxPlayers Maximální kapacita hráčů pro zápas.
 * @property {number} inGamePlayers Aktuální počet hráčů v zápase.
 * @property {number} [inGamePlayersDark] Počet hráčů v týmu DARK.
 * @property {number} [inGamePlayersLight] Počet hráčů v týmu LIGHT.
 * @property {boolean} [isCanceled] Informace, zda je zápas zrušen.
 * @property {MatchScoreDTO} [score] Skóre zápasu, pokud je zápas odehraný.
 * @property {PlayerDTO[]} [registeredDarkPlayers] Registrovaní hráči v týmu DARK.
 * @property {PlayerDTO[]} [registeredLightPlayers] Registrovaní hráči v týmu LIGHT.
 * @property {PlayerDTO[]} [reservedPlayers] Náhradníci.
 * @property {PlayerDTO[]} [excusedPlayers] Omluvení hráči.
 */

/**
 * SuccessResponseDTO
 * @typedef {Object} SuccessResponseDTO
 * @property {string} message Zpráva pro uživatele.
 * @property {number|string} [id] Identifikátor entity, která byla změněna.
 * @property {string} [timestamp] Čas provedení operace.
 */

export {};
