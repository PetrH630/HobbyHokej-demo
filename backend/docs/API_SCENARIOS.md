# API_SCENARIOS.md

# HobbyHokej backend – scénáře API

Popisuje endpointy, oprávnění, běžné úspěšné varianty, typické chybové scénáře a výjimky, které jsou v kódu viditelné.

## Rozsah a důležité omezení analýzy

Analýza vychází z těchto vrstev:
- controllers
- services a service impl
- dto
- custom exceptions
- bezpečnostní helpery pro current player a ownership

V dodaném ZIPu jsem **nenašel globální exception handler** ani kompletní **SecurityConfig / SecurityFilterChain**. Z toho plyne:
- HTTP statusy u business chyb jsou odvozené z `BusinessException` a konkrétních custom výjimek.
- `401 Unauthorized` a `403 Forbidden` vychází z `@PreAuthorize(...)`, Spring Security a z explicitních `AccessDeniedException` / `Forbidden...Exception`.
- U čistých `IllegalArgumentException` a validačních chyb `@Valid` předpokládám standardní Spring chování nebo vlastní handler, ale bez handleru to nelze potvrdit na 100 %.
- U endpointů bez `@PreAuthorize` nelze bez security konfigurace jistě říct, zda jsou opravdu veřejné, nebo jsou omezené jinak.

## Jednotný chybový model

V projektu je přítomna třída `ApiError` a základní `BusinessException`. To silně naznačuje, že business chyby se vrací ve standardizované JSON odpovědi přibližně s těmito poli:
- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `clientIp`
- volitelně `details`

## Přehled typických HTTP stavů napříč API

- `200 OK` – úspěšné načtení nebo změna
- `201 Created` – vytvoření entity
- `204 No Content` – úspěch bez těla odpovědi
- `400 Bad Request` – neplatný vstup, validační chyba, chybějící current player, špatné datum, špatné heslo, neplatná kombinace dat
- `401 Unauthorized` – uživatel není přihlášen a endpoint vyžaduje autentizaci
- `403 Forbidden` – uživatel je přihlášen, ale nemá roli nebo přístup k cizím datům
- `404 Not Found` – entita neexistuje
- `405 Method Not Allowed` – v projektu použito i jako business chyba pro některé zakázané operace
- `409 Conflict` – konflikt business pravidel, duplicita, překryv, neplatný stav
- `410 Gone` – expirovaný reset token

---

# 1. Match API

Základ: `/api/matches`

## GET `/api/matches`
**Přístup:** ADMIN, MANAGER  
**Účel:** Vrátí všechny zápasy.

**Úspěšný scénář:**
- uživatel má potřebnou roli
- vrátí se seznam `MatchDTO`

**Chybové scénáře:**
- 401 pokud není přihlášen
- 403 pokud nemá roli ADMIN/MANAGER

## GET `/api/matches/upcoming`
**Přístup:** ADMIN, MANAGER  
**Účel:** Vrátí budoucí zápasy.

**Úspěch:** seznam budoucích `MatchDTO`.

**Chyby:** 401, 403.

## GET `/api/matches/past`
**Přístup:** ADMIN, MANAGER  
**Účel:** Vrátí odehrané nebo minulé zápasy.

**Chyby:** 401, 403.

## POST `/api/matches`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `MatchDTO`  
**Účel:** Vytvoření zápasu.

**Úspěšné varianty:**
- DTO projde validací
- datum zápasu je business validní
- sezóna je validní vůči období zápasu
- zápas je uložen a vrácen jako `MatchDTO`

**Business chyby z kódu:**
- `InvalidMatchDateTimeException` → 400
- `InvalidSeasonPeriodDateException` → 400
- `DemoModeOperationNotAllowedException` → 405 v demo režimu

**Další možné chyby:**
- validační chyba `@Valid` → typicky 400
- 401, 403

## GET `/api/matches/{id}`
**Přístup:** ADMIN, MANAGER  
**Účel:** Detail jednoho zápasu v základním DTO.

**Chyby:**
- `MatchNotFoundException` → 404
- 401, 403

## GET `/api/matches/{id}/history`
**Přístup:** ADMIN, MANAGER  
**Účel:** Historie změn zápasu.

**Chyby:**
- `MatchNotFoundException` → 404, pokud service ověřuje existenci zápasu
- 401, 403

## PUT `/api/matches/{id}`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `MatchDTO`  
**Účel:** Úprava zápasu.

**Úspěšné varianty:**
- zápas existuje
- změna je povolená pro aktuální stav zápasu
- nové datum je validní
- změna projde doménovou logikou a případně vyvolá notifikace

**Business chyby z kódu:**
- `MatchNotFoundException` → 404
- `InvalidMatchDateTimeException` → 400
- `InvalidMatchStatusException` → 409
- `DemoModeOperationNotAllowedException` → 405

**Možné technické chyby:**
- `IllegalArgumentException` při nepodporovaném notification contextu nebo nekorektních datech; bez handleru nelze přesně potvrdit status
- 401, 403

## DELETE `/api/matches/{id}`
**Přístup:** ADMIN  
**Účel:** Smazání zápasu.

**Úspěch:** `SuccessResponseDTO`.

**Business chyby:**
- `MatchNotFoundException` → 404
- `DemoModeOperationNotAllowedException` → 405

**Chyby oprávnění:** 401, 403.

## PATCH `/api/matches/{matchId}/cancel`
**Přístup:** ADMIN, MANAGER  
**Účel:** Zrušení zápasu.

**Úspěšné varianty:**
- zápas existuje
- stav zápasu dovoluje zrušení
- případně je zadaný důvod zrušení
- systém odešle související notifikace

**Business chyby:**
- `MatchNotFoundException` → 404
- `InvalidMatchStatusException` → 409

## PATCH `/api/matches/{matchId}/uncancel`
**Přístup:** ADMIN, MANAGER  
**Účel:** Obnovení zrušeného zápasu.

**Chyby:**
- `MatchNotFoundException` → 404
- `InvalidMatchStatusException` → 409
- 401, 403

## GET `/api/matches/available-for-player/{playerId}`
**Přístup:** ADMIN, MANAGER  
**Účel:** Vrátí zápasy dostupné pro konkrétního hráče.

**Business chyby:**
- `PlayerNotFoundException` → 404
- 401, 403

## GET `/api/matches/{id}/detail`
**Přístup:** authenticated  
**Účel:** Detail zápasu pro běžného uživatele, včetně kontrol přístupu podle sezóny a aktivního hráče.

**Úspěšné varianty:**
- uživatel je přihlášen
- zápas existuje
- uživatel má přístup k detailu podle aktuální sezóny a current player kontextu

**Chyby z kódu:**
- `MatchNotFoundException` → 404
- `AccessDeniedException` → 403 při nepřihlášení, cizí sezóně, nepřístupném zápasu nebo chybějícím aktivním hráči

## GET `/api/matches/next`
**Přístup:** authenticated  
**Účel:** Vrátí nejbližší další zápas.

**Poznámka:** Pokud žádný další zápas není, může service vrátit `null`, prázdnou odpověď nebo business chybu; to z controlleru nelze s jistotou potvrdit.

## GET `/api/matches/me/upcoming`
**Přístup:** authenticated  
**Účel:** Budoucí zápasy aktuálně zvoleného hráče.

**Chyby:**
- `CurrentPlayerNotSelectedException` → 400
- `PlayerNotFoundException` → 404, pokud current player už neexistuje
- 401

## GET `/api/matches/me/upcoming-overview`
**Přístup:** authenticated  
**Účel:** Přehled budoucích zápasů aktuálního hráče.

**Chyby:** stejné jako výše.

## GET `/api/matches/me/all-passed`
**Přístup:** authenticated  
**Účel:** Přehled všech proběhlých zápasů aktuálního hráče.

**Chyby:**
- `CurrentPlayerNotSelectedException` → 400
- 401

## GET `/api/matches/{matchId}/positions`
**Přístup:** authenticated  
**Účel:** Celkový přehled pozic zápasu.

**Chyby:**
- `MatchNotFoundException` → 404
- případně 403, pokud je přístup omezen business logikou

## GET `/api/matches/{matchId}/positions/{team}`
**Přístup:** authenticated  
**Účel:** Přehled pozic konkrétního týmu v zápase.

**Chyby:**
- `MatchNotFoundException` → 404
- neplatná hodnota `team` → typicky 400

## POST `/api/matches/{matchId}/auto-lineup`
**Přístup:** ADMIN, MANAGER  
**Účel:** Automatické rozestavení první lajny.

**Chyby:**
- `MatchNotFoundException` → 404
- `InvalidMatchStatusException` → 409, pokud stav zápasu neumožňuje automatické sestavení
- 401, 403

## PATCH `/api/matches/{matchId}/score`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `MatchScoreUpdateRequest`  
**Účel:** Uložení nebo změna skóre zápasu.

**Úspěšné varianty:**
- zápas existuje
- oba výsledky jsou vyplněné
- skóre není záporné
- stav zápasu dovoluje změnu skóre

**Business chyby z kódu:**
- `MatchNotFoundException` → 404
- `InvalidMatchStatusException` → 409
- `IllegalArgumentException` při nevyplněném nebo záporném skóre; bez handleru nelze přesně potvrdit status, typicky 400

---

# 2. Registration API

Základ: `/api/registrations`

## GET `/api/registrations`
**Přístup:** ADMIN, MANAGER  
Vrací všechny registrace.

## GET `/api/registrations/match/{matchId}`
**Přístup:** ADMIN, MANAGER  
Vrací registrace konkrétního zápasu.

**Chyby:** `MatchNotFoundException` → 404, 401, 403.

## GET `/api/registrations/player/{playerId}`
**Přístup:** ADMIN, MANAGER  
Vrací registrace konkrétního hráče.

**Chyby:** `PlayerNotFoundException` → 404, 401, 403.

## GET `/api/registrations/match/{matchId}/no-response`
**Přístup:** ADMIN, MANAGER  
Vrací hráče bez reakce na zápas.

**Chyby:** `MatchNotFoundException` → 404, 401, 403.

## POST `/api/registrations/upsert/{playerId}`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `MatchRegistrationRequest`  
**Účel:** Vytvoří nebo upraví registraci konkrétního hráče na zápas.

**Úspěšné varianty:**
- hráč existuje
- zápas existuje
- hráč je ve stavu, který dovoluje registraci
- datum zápasu dovoluje změnu registrace
- pozice odpovídá módu a kapacitě
- registrace se založí nebo aktualizuje

**Business chyby z kódu:**
- `PlayerNotFoundException` → 404
- `MatchNotFoundException` → 404
- `InvalidPlayerStatusException` → 400
- `InvalidMatchDateTimeException` → 400
- `DuplicateRegistrationException` → nejčastěji 409, v jedné variantě konstruktoru i 404 message-based fallback
- `RegistrationNotFoundException` → 404
- `PositionCapacityExceededException` → 409
- `InvalidSeasonStateException` → 409

## PATCH `/api/registrations/match/{matchId}/players/{playerId}/no-excused`
**Přístup:** ADMIN, MANAGER  
**Účel:** Označí hráče jako neomluveného.

**Chyby:**
- `RegistrationNotFoundException` → 404
- `InvalidPlayerStatusException` → 400, pokud stav nedovoluje změnu
- `MatchNotFoundException` / `PlayerNotFoundException` → 404

## PATCH `/api/registrations/match/{matchId}/players/{playerId}/cancel-no-excused`
**Přístup:** ADMIN, MANAGER  
**Účel:** Zruší status neomluvené absence.

**Chyby:** obdobné jako u předchozího endpointu.

## PATCH `/api/registrations/me/{matchId}/change-team`
**Přístup:** authenticated  
**Účel:** Přesun registrace aktuálního hráče mezi týmy.

**Úspěch:** current player existuje a má registraci na zápas, změna je povolená.

**Chyby:**
- `CurrentPlayerNotSelectedException` → 400
- `RegistrationNotFoundException` → 404
- `DuplicateRegistrationException` → 409, pokud by změna vedla ke konfliktu
- `InvalidPlayerStatusException` → 400
- `InvalidMatchDateTimeException` → 400
- 401

## PATCH `/api/registrations/{playerId}/{matchId}/change-team`
**Přístup:** ADMIN, MANAGER  
**Účel:** Admin změna týmu u registrace jiného hráče.

**Chyby:** stejné jako výše plus 403 při chybě oprávnění.

## PATCH `/api/registrations/{matchId}/players/{playerId}/position`
**Přístup:** ADMIN, MANAGER  
**Účel:** Změna pozice hráče v registraci.

**Chyby:**
- `RegistrationNotFoundException` → 404
- `PositionCapacityExceededException` → 409
- `InvalidPlayerStatusException` → 400
- `InvalidMatchDateTimeException` → 400
- neplatná pozice pro mód zápasu → typicky 400 nebo 409 dle service logiky

## POST `/api/registrations/me/upsert`
**Přístup:** authenticated  
**Vstup:** `MatchRegistrationRequest`  
**Účel:** Vytvoření nebo změna registrace pro current player.

**Chyby:**
- `CurrentPlayerNotSelectedException` → 400
- `PlayerNotFoundException` → 404
- `MatchNotFoundException` → 404
- `InvalidPlayerStatusException` → 400
- `InvalidMatchDateTimeException` → 400
- `DuplicateRegistrationException` → 409
- `PositionCapacityExceededException` → 409
- `InvalidSeasonStateException` → 409

## GET `/api/registrations/me/for-current-player`
**Přístup:** authenticated  
Vrací všechny registrace current playera.

**Chyby:** `CurrentPlayerNotSelectedException` → 400, 401.

---

# 3. Registration history API

Základ: `/api/registrations/history`

## GET `/api/registrations/history/me/matches/{matchId}`
**Přístup:** authenticated  
**Účel:** Historie registrace current playera na konkrétní zápas.

**Chyby:**
- `CurrentPlayerNotSelectedException` → 400
- `MatchNotFoundException` → 404
- `ForbiddenPlayerAccessException` / `AccessDeniedException` → 403, pokud history není jeho

## GET `/api/registrations/history/admin/matches/{matchId}/players/{playerId}`
**Přístup:** ADMIN, MANAGER  
**Účel:** Historie registrace konkrétního hráče na zápas.

**Chyby:** `MatchNotFoundException`, `PlayerNotFoundException` → 404, plus 401/403.

---

# 4. Player API

Základ: `/api/players`

## GET `/api/players`
**Přístup:** ADMIN, MANAGER  
Vrací všechny hráče.

## GET `/api/players/{id}`
**Přístup:** ADMIN, MANAGER  
Vrací jednoho hráče.

**Chyby:** `PlayerNotFoundException` → 404.

## GET `/api/players/{id}/history`
**Přístup:** ADMIN, MANAGER  
Vrací historii hráče.

**Chyby:** `PlayerNotFoundException` → 404.

## POST `/api/players`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `PlayerDTO`  
**Účel:** Vytvoření hráče.

**Business chyby:**
- `DuplicateNameSurnameException` → 409
- `InvalidPlayerStatusException` → 400
- `DemoModeOperationNotAllowedException` → 405
- případně `UserNotFoundException` / `InvalidChangePlayerUserException` podle napojení na uživatele

## PUT `/api/players/{id}`
**Přístup:** ADMIN, MANAGER  
**Účel:** Úprava hráče.

**Chyby:**
- `PlayerNotFoundException` → 404
- `DuplicateNameSurnameException` → 409
- `InvalidPlayerStatusException` → 400
- `DemoModeOperationNotAllowedException` → 405

## DELETE `/api/players/{id}`
**Přístup:** ADMIN, MANAGER  
**Účel:** Smazání hráče.

**Chyby:**
- `PlayerNotFoundException` → 404
- `DemoModeOperationNotAllowedException` → 405

## PUT `/api/players/{id}/approve`
**Přístup:** ADMIN, MANAGER  
**Účel:** Schválení hráče.

**Chyby:**
- `PlayerNotFoundException` → 404
- `InvalidPlayerStatusException` → 400, pokud hráč už je ve finálním nebo nekompatibilním stavu

## PUT `/api/players/{id}/reject`
**Přístup:** ADMIN, MANAGER  
**Účel:** Zamítnutí hráče.

**Chyby:**
- `PlayerNotFoundException` → 404
- `InvalidPlayerStatusException` → 400

## POST `/api/players/{playerId}/change-user`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `ChangePlayerUserRequest`  
**Účel:** Přepojení hráče na jiného uživatele.

**Chyby:**
- `PlayerNotFoundException` → 404
- `UserNotFoundException` → 404
- `InvalidChangePlayerUserException` → 409

## POST `/api/players/me`
**Přístup:** authenticated  
**Účel:** Vytvoření hráče pro přihlášeného uživatele.

**Chyby:**
- `DuplicateNameSurnameException` → 409
- `InvalidPlayerStatusException` → 400
- `UserNotFoundException` → 404, pokud auth odkazuje na neexistujícího uživatele
- 401

## GET `/api/players/me`
**Přístup:** authenticated  
Vrací hráče přihlášeného uživatele.

## PUT `/api/players/me`
**Přístup:** authenticated  
**Účel:** Úprava current playera.

**Chyby:**
- `CurrentPlayerNotSelectedException` → 400
- `PlayerNotFoundException` → 404
- `ForbiddenPlayerAccessException` → 403
- `DuplicateNameSurnameException` → 409

## GET `/api/players/me/history`
**Přístup:** authenticated  
Vrací historii current playera.

**Chyby:** `CurrentPlayerNotSelectedException` → 400.

## GET `/api/players/me/stats`
**Přístup:** authenticated  
Vrací statistiky current playera.

**Chyby:**
- `CurrentPlayerNotSelectedException` → 400
- `PlayerNotFoundException` → 404

## GET `/api/players/{playerId}/stats`
**Přístup:** ADMIN, MANAGER  
Vrací statistiky zvoleného hráče.

**Chyby:** `PlayerNotFoundException` → 404.

---

# 5. Current player API

Základ: `/api/current-player`

## POST `/api/current-player/{playerId}`
**Přístup:** authenticated  
**Účel:** Nastavení aktuálního hráče do session.

**Úspěch:** hráč existuje a patří přihlášenému uživateli.

**Chyby:**
- `PlayerNotFoundException` → 404
- `ForbiddenPlayerAccessException` → 403
- `InvalidPlayerStatusException` → 400, pokud current player nelze nastavit kvůli stavu

## POST `/api/current-player/auto-select`
**Přístup:** authenticated  
**Účel:** Automaticky vybere current playera pro uživatele.

**Chyby:**
- `UserNotFoundException` → 404
- `InvalidPlayerStatusException` → 400
- situace bez vhodného hráče může skončit business chybou nebo bez výběru; z controlleru to nelze jistě potvrdit

## GET `/api/current-player`
**Přístup:** authenticated  
Vrací current playera.

**Chyby:**
- `CurrentPlayerNotSelectedException` → 400
- `PlayerNotFoundException` → 404

---

# 6. Player inactivity API

Základ: `/api/inactivity/admin`

## GET `/api/inactivity/admin/all`
**Přístup:** ADMIN, MANAGER  
Vrací všechna období neaktivity.

## GET `/api/inactivity/admin/{id}`
**Přístup:** ADMIN, MANAGER  
Vrací jedno období neaktivity.

**Chyby:** `InactivityPeriodNotFoundException` → 404.

## GET `/api/inactivity/admin/player/{playerId}`
**Přístup:** ADMIN, MANAGER  
Vrací období neaktivity konkrétního hráče.

**Chyby:** `PlayerNotFoundException` → 404.

## POST `/api/inactivity/admin`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `PlayerInactivityPeriodDTO`  
**Účel:** Vytvoření období neaktivity.

**Business chyby:**
- `PlayerNotFoundException` → 404
- `InvalidInactivityPeriodDateException` → 400
- `InactivityPeriodOverlapException` → 409

## PUT `/api/inactivity/admin/{id}`
**Přístup:** ADMIN, MANAGER  
**Účel:** Úprava období neaktivity.

**Chyby:**
- `InactivityPeriodNotFoundException` → 404
- `InvalidInactivityPeriodDateException` → 400
- `InactivityPeriodOverlapException` → 409

## DELETE `/api/inactivity/admin/{id}`
**Přístup:** ADMIN, MANAGER  
**Účel:** Smazání období neaktivity.

**Chyby:** `InactivityPeriodNotFoundException` → 404.

## GET `/api/inactivity/admin/me/all`
**Přístup:** authenticated  
Vrací období neaktivity current playera.

**Chyby:** `CurrentPlayerNotSelectedException` → 400.

---

# 7. Player settings API

## GET `/api/players/{playerId}/settings`
**Přístup:** authenticated  
**Účel:** Vrací nastavení konkrétního hráče.

**Poznámka:** bez kompletní security konfigurace nelze potvrdit, zda je přístup omezen jen na ownera nebo i na admina. Doporučené je ověření vlastnictví.

**Možné chyby:**
- `PlayerNotFoundException` → 404
- `ForbiddenPlayerAccessException` → 403

## PATCH `/api/players/{playerId}/settings`
**Přístup:** authenticated  
**Vstup:** `PlayerSettingsDTO`  
**Účel:** Změna nastavení konkrétního hráče.

**Možné chyby:** `PlayerNotFoundException`, `ForbiddenPlayerAccessException`.

## GET `/api/me/settings`
**Přístup:** authenticated  
Vrací nastavení current playera.

**Chyby:** `CurrentPlayerNotSelectedException` → 400.

## PATCH `/api/me/settings`
**Přístup:** authenticated  
Mění nastavení current playera.

**Chyby:** `CurrentPlayerNotSelectedException` → 400, případně validační 400.

---

# 8. Season API

Základ: `/api/seasons`

## POST `/api/seasons`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `SeasonDTO`  
**Účel:** Vytvoření sezóny.

**Business chyby:**
- `InvalidSeasonPeriodDateException` → 400
- `SeasonPeriodOverlapException` → 409
- `DuplicateSeasonNameException` → 409

## PUT `/api/seasons/{id}`
**Přístup:** ADMIN, MANAGER  
**Účel:** Úprava sezóny.

**Chyby:**
- `SeasonNotFoundException` → 404
- `InvalidSeasonPeriodDateException` → 400
- `SeasonPeriodOverlapException` → 409
- `DuplicateSeasonNameException` → 409
- `InvalidSeasonStateException` → 409

## GET `/api/seasons/{id}/history`
**Přístup:** ADMIN, MANAGER  
Vrací historii sezóny.

**Chyby:** `SeasonNotFoundException` → 404.

## GET `/api/seasons`
**Přístup:** ADMIN, MANAGER  
Vrací všechny sezóny.

## GET `/api/seasons/active`
**Přístup:** ADMIN, MANAGER  
Vrací aktivní sezónu.

**Poznámka:** pokud aktivní sezóna neexistuje, může být vráceno `null` nebo business chyba; z controlleru nelze přesně potvrdit.

## PUT `/api/seasons/{id}/active`
**Přístup:** ADMIN, MANAGER  
Nastaví aktivní sezónu.

**Chyby:**
- `SeasonNotFoundException` → 404
- `InvalidSeasonStateException` → 409

## GET `/api/seasons/me`
**Přístup:** authenticated  
Vrací všechny sezóny dostupné uživateli.

## GET `/api/seasons/me/current`
**Přístup:** authenticated  
Vrací aktuálně zvolenou sezónu uživatele.

## POST `/api/seasons/me/current/{seasonId}`
**Přístup:** authenticated  
Nastaví current season do user kontextu.

**Chyby:** `SeasonNotFoundException` → 404.

---

# 9. Notification API

## GET `/api/notifications/badge`
**Přístup:** authenticated  
Vrací badge s počtem nepřečtených notifikací.

## GET `/api/notifications/since-last-login`
**Přístup:** authenticated  
Vrací notifikace od posledního přihlášení.

## GET `/api/notifications/recent`
**Přístup:** authenticated  
Vrací poslední notifikace uživatele.

## POST `/api/notifications/{id}/read`
**Přístup:** authenticated  
Označí notifikaci jako přečtenou.

**Možné chyby:**
- notifikace neexistuje → pravděpodobně 404
- notifikace nepatří uživateli → pravděpodobně 403

## POST `/api/notifications/read-all`
**Přístup:** authenticated  
Označí všechny notifikace jako přečtené.

## GET `/api/notifications/admin/all`
**Přístup:** ADMIN, MANAGER  
Vrací všechny notifikace v admin pohledu.

---

# 10. Admin notification API

Základ: `/api/notifications/admin`

## POST `/api/notifications/admin/special`
**Přístup:** ADMIN, MANAGER  
**Vstup:** `SpecialNotificationRequestDTO`  
**Účel:** Odeslání speciální notifikace na zvolené cíle.

**Úspěšné varianty:**
- request obsahuje validní typ cíle
- je určena cílová množina hráčů / uživatelů
- notifikace je vytvořena a předána k odeslání

**Možné chyby:**
- validační chyba requestu → 400
- chybné cíle nebo nekonzistentní výběr → typicky 400
- chyba odesílacího kanálu → může být 500 nebo business chyba, v controlleru není vidět

## GET `/api/notifications/admin/special/targets`
**Přístup:** ADMIN, MANAGER  
Vrací možné cíle pro speciální notifikaci.

---

# 11. Demo notification API

Základ: `/api/demo/notifications`

## GET `/api/demo/notifications`
Vrací dočasně uložené demo notifikace a podle názvu store je pravděpodobně zároveň čistí.

## DELETE `/api/demo/notifications`
Vymaže demo notifikace.

**Poznámka:** Endpointy nemají `@PreAuthorize`; bez security konfigurace nelze potvrdit, zda jsou veřejné.

---

# 12. Match reminder admin API

Základ: `/api/admin/match-reminders`

## GET `/api/admin/match-reminders/run`
Spustí reminder job ručně.

## GET `/api/admin/match-reminders/no-response/run`
Spustí no-response reminder ručně.

## GET `/api/admin/match-reminders/no-response/preview`
Vrátí preview adresátů pro no-response reminder.

**Důležitá poznámka:** V dodaném controlleru nejsou `@PreAuthorize`. Pokud to není kryto security konfigurací, může jít o bezpečnostní riziko.

---

# 13. Authentication API

Základ: `/api/auth`

## POST `/api/auth/register`
**Přístup:** veřejný  
**Vstup:** `RegisterUserDTO`  
**Účel:** Registrace nového uživatele.

**Úspěšné varianty:**
- e-mail ještě neexistuje
- hesla se shodují
- uživatel je vytvořen
- je odeslán aktivační e-mail

**Business chyby:**
- `UserAlreadyExistsException` → 409
- `PasswordsDoNotMatchException` → 400

## GET `/api/auth/me`
**Přístup:** authenticated  
Vrací aktuálního uživatele.

**Chyby:** `UserNotFoundException` → 404, 401.

## GET `/api/auth/verify?token=...`
**Přístup:** veřejný  
Ověří aktivační token uživatele.

**Business chyby:**
- `InvalidUserActivationException` → 409
- případně `UserNotFoundException` → 404, pokud token odkazuje na neexistující záznam

## GET `/api/auth/reset-password?token=...`
**Přístup:** veřejný  
Redirect / validace reset tokenu pro frontend.

**Chyby:**
- `InvalidResetTokenException` → 404 nebo 410 podle důvodu

## POST `/api/auth/forgotten-password`
**Přístup:** veřejný  
**Vstup:** `EmailDTO`  
Požádá o reset hesla.

**Možné scénáře:**
- e-mail existuje → vygeneruje se token a odešle e-mail
- e-mail neexistuje → implementace může vracet úspěch kvůli bezpečnosti, nebo chybu; z controlleru to nelze potvrdit

## GET `/api/auth/forgotten-password/info?token=...`
**Přístup:** veřejný  
Vrací základní info k reset tokenu, typicky e-mail.

**Chyby:** `InvalidResetTokenException` → 404 nebo 410.

## POST `/api/auth/forgotten-password/reset`
**Přístup:** veřejný  
**Vstup:** `ForgottenPasswordResetDTO`  
Dokončí reset hesla.

**Business chyby:**
- `InvalidResetTokenException` → 404 nebo 410
- `PasswordsDoNotMatchException` → 400

---

# 14. App user API

Základ: `/api/users`

## GET `/api/users/me`
**Přístup:** authenticated  
Vrací data přihlášeného uživatele.

## PUT `/api/users/me/update`
**Přístup:** authenticated  
**Vstup:** `AppUserDTO`  
Upraví profil uživatele.

**Možné chyby:**
- `UserNotFoundException` → 404
- validační chyba → 400
- duplicita unikátního pole → typicky 409

## POST `/api/users/me/change-password`
**Přístup:** authenticated  
**Vstup:** `ChangePasswordDTO`  
Změní heslo přihlášeného uživatele.

**Business chyby:**
- `InvalidOldPasswordException` → 400
- `PasswordsDoNotMatchException` → 400
- `UserNotFoundException` → 404

## GET `/api/users`
**Přístup:** ADMIN, MANAGER  
Vrací všechny uživatele.

## GET `/api/users/{id}`
**Přístup:** ADMIN, MANAGER  
Vrací konkrétního uživatele.

**Chyby:** `UserNotFoundException` → 404.

## POST `/api/users/{id}/reset-password`
**Přístup:** ADMIN  
Reset hesla administrátorem.

**Chyby:**
- `UserNotFoundException` → 404
- `DemoModeOperationNotAllowedException` → 405

## PATCH `/api/users/{id}/activate`
**Přístup:** ADMIN  
Ruční aktivace uživatele.

**Business chyby:**
- `UserNotFoundException` → 404
- `InvalidAdminActivateDeactivateException` → 405
- `InvalidUserActivationException` → 409

## PATCH `/api/users/{id}/deactivate`
**Přístup:** ADMIN  
Ruční deaktivace uživatele.

**Business chyby:** stejné typy jako u aktivace.

## GET `/api/users/{id}/history`
**Přístup:** ADMIN  
Vrací historii uživatele.

**Chyby:** `UserNotFoundException` → 404.

## GET `/api/users/me/history`
**Přístup:** authenticated  
Vrací historii přihlášeného uživatele.

---

# 15. App user settings API

Základ: `/api/user`

## GET `/api/user/settings`
**Přístup:** authenticated  
Vrací nastavení přihlášeného uživatele.

## PATCH `/api/user/settings`
**Přístup:** authenticated  
**Vstup:** `AppUserSettingsDTO`  
Upraví nastavení přihlášeného uživatele.

**Chyby:** `UserNotFoundException` → 404, validační 400.

---

# 16. Public / system / debug endpointy

## GET `/api/public/app-mode`
Vrací informace o módu aplikace, například `demoMode`.

## GET `/api/debug/me`
Debug endpoint vracející info o autentizaci.

## GET `/api/test`
Testovací endpoint vracející text.

## POST `/api/email/test/send-mail`
Test odeslání e-mailu.

**Poznámka:** U debug a test endpointů je vhodné je v produkci chránit nebo vypnout.

---

# 17. Souhrn nalezených custom business výjimek

## Match
- `MatchNotFoundException` → 404
- `InvalidMatchDateTimeException` → 400
- `InvalidMatchStatusException` → 409

## Player
- `PlayerNotFoundException` → 404
- `CurrentPlayerNotSelectedException` → 400
- `DuplicateNameSurnameException` → 409
- `InvalidPlayerStatusException` → 400
- `InactivityPeriodNotFoundException` → 404
- `InactivityPeriodOverlapException` → 409
- `InvalidInactivityPeriodDateException` → 400

## Registration
- `MatchRegistrationNotFoundException` → 404
- `RegistrationNotFoundException` → 404
- `DuplicateRegistrationException` → primárně 409
- `PositionCapacityExceededException` → 409

## Season
- `SeasonNotFoundException` → 404
- `InvalidSeasonPeriodDateException` → 400
- `SeasonPeriodOverlapException` → 409
- `DuplicateSeasonNameException` → 409
- `InvalidSeasonStateException` → 409

## User
- `UserNotFoundException` → 404
- `UserAlreadyExistsException` → 409
- `PasswordsDoNotMatchException` → 400
- `InvalidOldPasswordException` → 400
- `InvalidResetTokenException` → 404 nebo 410
- `InvalidUserActivationException` → 409
- `InvalidAdminActivateDeactivateException` → 405
- `InvalidChangePlayerUserException` → 409
- `ForbiddenPlayerAccessException` → 403
- `AccountNotActivatedException` → 403

## Demo mode
- `DemoModeOperationNotAllowedException` → 405

---

# 18. Doporučení k dopracování dokumentace projektu

Aby bylo API popsáno opravdu enterprise způsobem, doporučuji doplnit do backendu ještě tyto věci:

1. **Globální exception handler** do zdrojáků dokumentace, pokud existuje.
2. **SecurityConfig** nebo ekvivalent, aby bylo jasné, které endpointy jsou skutečně veřejné.
3. **OpenAPI / Swagger** anotace pro requesty a odpovědi.
4. U endpointů vracejících `String` nebo `Void` sjednotit response model.
5. U interních endpointů jako `debug`, `test`, `email/test`, `match-reminders/run` jasně označit, zda jsou produkční, nebo jen servisní.

---

# 19. Co je v tomto dokumentu jisté a co je odhad

**Jisté z kódu:**
- URL endpointů
- HTTP metody
- `@PreAuthorize` pravidla uvedená přímo v controllerech
- volané service vrstvy
- custom výjimky a jejich HTTP statusy z `BusinessException`
- existence current player a ownership konceptu

**Odhad / nelze 100 % potvrdit bez dalších souborů:**
- přesný JSON tvar chybové odpovědi za běhu
- mapování `IllegalArgumentException`
- veřejnost endpointů bez `@PreAuthorize`, pokud ji řídí centrální security konfigurace
- přesné chování některých service metod v okrajových stavech bez detailního průchodu každé metody řádek po řádku

