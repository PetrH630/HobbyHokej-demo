# HobbyHokej – API scénáře backendu

Popisuje reálně nalezené endpointy a jejich pravděpodobné scénáře podle controllerů a doménových výjimek.

## Rozsah analýzy

Analyzované oblasti:
- `config/SecurityConfig.java`
- `config/GlobalExceptionHandler.java`
- controllery modulů `system`, `match`, `registration`, `player`, `season`, `notifications`, `user`
- doménové výjimky a jednotný formát `ApiError`
- související DTO a názvy servisních operací

Důležitá poznámka:
- U business pravidel, která nebyla explicitně rozepsána v controlleru, je scénář formulován jako „pravděpodobný / očekávaný podle service a výjimek“.
- HTTP 401 není ošetřeno v `GlobalExceptionHandler`, ale vyplývá ze Spring Security pro nepřihlášené volání chráněných endpointů.

## Bezpečnostní model backendu

### Veřejné endpointy
Bez přihlášení jsou podle `SecurityConfig` dostupné zejména:
- `POST /api/auth/register`
- `GET /api/auth/verify`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgotten-password`
- `GET /api/auth/forgotten-password/info`
- `POST /api/auth/forgotten-password/reset`
- `GET /api/public/app-mode`
- v demo režimu také `GET/DELETE /api/demo/notifications`

### Chráněné endpointy
- obecně všechny ostatní ` /api/** ` vyžadují přihlášení
- admin/manager zóna: zápasy, hráči, registrace, neaktivity, notifikace
- čistě admin zóna: některé operace nad uživateli, testovací endpointy, reset hesel, aktivace/deaktivace účtů, mazání některých entit podle controlleru

### Typické bezpečnostní scénáře
- nepřihlášený uživatel -> 401 / přesměrování logikou frontendu
- přihlášený bez role -> 403 Forbidden
- role ADMIN nebo MANAGER -> přístup ke správě zápasů, hráčů, sezón, registrací a notifikací
- role ADMIN -> navíc správa uživatelů, testovací utility, reset hesel, aktivace/deaktivace účtů

## Jednotný chybový model

Backend vrací chyby ve formátu `ApiError` s poli:
- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `clientIp`
- `details` pro validační chyby

### Mapování výjimek
- `BusinessException` -> status podle konkrétní doménové výjimky
- `AccessDeniedException` -> 403
- `IllegalArgumentException` -> 400
- `IllegalStateException` -> 409
- `DataIntegrityViolationException` -> 409
- `MethodArgumentNotValidException` -> 400 + `details`
- ostatní neošetřené chyby -> 500

## Přehled doménových výjimek nalezených v projektu

### Match
- `MatchNotFoundException` -> 404
- `InvalidMatchDateTimeException` -> 400
- `InvalidMatchStatusException` -> 409

### Player
- `PlayerNotFoundException` -> 404
- `DuplicateNameSurnameException` -> 409
- `CurrentPlayerNotSelectedException` -> 400
- `InvalidPlayerStatusException` -> 400
- `InactivityPeriodNotFoundException` -> 404
- `InactivityPeriodOverlapException` -> 409
- `InvalidInactivityPeriodDateException` -> 400

### Registration
- `DuplicateRegistrationException` -> typicky 409
- `MatchRegistrationNotFoundException` -> 404
- `RegistrationNotFoundException` -> 404
- `PositionCapacityExceededException` -> 409

### Season
- `SeasonNotFoundException` -> 404
- `DuplicateSeasonNameException` -> 409
- `SeasonPeriodOverlapException` -> 409
- `InvalidSeasonPeriodDateException` -> 400
- `InvalidSeasonStateException` -> 409

### User
- `UserNotFoundException` -> očekávaně 404
- `UserAlreadyExistsException` -> očekávaně 409
- `AccountNotActivatedException` -> 403
- `ForbiddenPlayerAccessException` -> 403
- `InvalidOldPasswordException` -> 400
- `PasswordsDoNotMatchException` -> očekávaně 400
- `InvalidResetTokenException` -> očekávaně 400 nebo 404 podle implementace
- `InvalidAdminActivateDeactivateException` -> 405
- `InvalidChangePlayerUserException` -> 409
- `InvalidUserActivationException` -> očekávaně 400/409

### Demo režim
- `DemoModeOperationNotAllowedException` -> 405

---

# 1. System / autentizace / režim aplikace

## GET /api/public/app-mode
**Účel:** vrací, zda backend běží v demo režimu.

**Úspěšný scénář:**
- klient zavolá veřejný endpoint
- backend vrátí objekt `{ demoMode: true|false }`

**Chybové scénáře:**
- prakticky jen 500 při interní chybě

## POST /api/auth/register
**Účel:** registrace nového uživatele.

**Vstup:** `RegisterUserDTO`

**Úspěšný scénář:**
- validní vstupní data
- e-mail ještě neexistuje
- uživatel se uloží
- vytvoří se aktivační token
- odešle se aktivační e-mail
- odpověď 200 s textem o úspěšné registraci

**Chybové scénáře:**
- neplatný vstup DTO -> 400
- duplicitní uživatel / e-mail -> očekávaně 409
- chyba při notifikaci nebo ukládání -> 500

## POST /api/auth/login
**Účel:** přihlášení uživatele přes `CustomJsonLoginFilter`.

**Úspěšný scénář:**
- validní přihlašovací údaje
- účet existuje a je aktivní
- vytvoří se session, nastaví cookie

**Chybové scénáře:**
- špatné jméno / heslo -> 401
- účet není aktivovaný -> 403 (`AccountNotActivatedException` nebo obdobná logika)
- interní chyba autentizace -> 500

## POST /api/auth/logout
**Účel:** odhlášení uživatele a vyčištění session atributů.

**Úspěšný scénář:**
- smaže se `JSESSIONID`
- odstraní se `CURRENT_PLAYER_ID`, `CURRENT_SEASON_ID`, `CURRENT_SEASON_CUSTOM`
- vrací JSON `{"status":"ok","message":"Odhlášeno"}`

## GET /api/auth/me
**Účel:** vrací aktuálně přihlášeného uživatele.

**Scénáře:**
- přihlášený uživatel -> 200 + `AppUserDTO`
- nepřihlášený -> 401
- uživatel v session neexistuje v DB -> očekávaně 404/500 dle service

## GET /api/auth/verify?token=...
**Účel:** aktivace účtu přes e-mailový token.

**Úspěch:**
- token existuje a je platný
- účet se aktivuje
- vrací 200 s textem o úspěšné aktivaci

**Chyba:**
- token je neplatný nebo expirovaný
- controller vrací přímo 400 s textem, nikoli `BusinessException`

## GET /api/auth/reset-password?token=...
**Účel:** přesměrování na frontend stránku resetu hesla.

**Úspěch:**
- backend vrátí 302 Found
- do hlavičky `Location` vloží URL frontendu s tokenem

**Chyba:**
- chybějící token -> 400
- interní chyba -> 500

## POST /api/auth/forgotten-password
**Účel:** založení požadavku na reset zapomenutého hesla.

**Vstup:** `EmailDTO`

**Úspěch:**
- e-mail je validní
- vytvoří se reset token
- odešle se e-mail
- vrací 200 bez body

**Chyba:**
- nevalidní e-mail -> 400
- neexistující uživatel -> podle implementace buď 200 kvůli bezpečnosti, nebo 404/400
- demo režim může write operaci blokovat -> 405

## GET /api/auth/forgotten-password/info?token=...
**Účel:** vrátí e-mail navázaný na reset token.

**Úspěch:**
- token je platný -> 200 + `{ email: ... }`

**Chyba:**
- token neplatný/expirovaný -> očekávaně `InvalidResetTokenException`
- 400 nebo 404 podle service implementace

## POST /api/auth/forgotten-password/reset
**Účel:** finální nastavení nového hesla.

**Vstup:** `ForgottenPasswordResetDTO`

**Úspěch:**
- token je platný
- nová hesla jsou validní a shodná
- heslo se změní, token se zneplatní
- vrací 200 bez body

**Chyby:**
- neplatný token -> 400/404
- hesla se neshodují -> 400
- porušení pravidel hesla -> 400
- demo režim může write operaci blokovat -> 405

---

# 2. Uživatelé a uživatelská nastavení

## GET /api/users/me
Vrací profil přihlášeného uživatele.

Scénáře:
- přihlášený uživatel -> 200 + `AppUserDTO`
- nepřihlášený -> 401
- uživatel nenalezen -> 404

## PUT /api/users/me/update
Aktualizuje vlastní uživatelský profil.

Úspěch:
- validní DTO
- uživatel existuje
- data se uloží
- vrací 200 s textem `Uživatel byl změněn`

Chyby:
- 400 validační chyba
- 409 při kolizi unikátních údajů
- 405 v demo režimu u chráněných uživatelů

## POST /api/users/me/change-password
Změna hesla přihlášeného uživatele.

Úspěch:
- staré heslo sedí
- nové heslo splňuje pravidla
- potvrzení souhlasí
- vrací 200 s textem `Heslo úspěšně změněno`

Chyby:
- `InvalidOldPasswordException` -> 400
- `PasswordsDoNotMatchException` -> očekávaně 400
- demo režim -> 405

## GET /api/users
Seznam všech uživatelů pro ADMIN/MANAGER.

Chyby:
- 401 bez přihlášení
- 403 bez role

## GET /api/users/{id}
Detail uživatele pro ADMIN/MANAGER.

Chyby:
- `UserNotFoundException` -> očekávaně 404

## POST /api/users/{id}/reset-password
Admin reset hesla na výchozí hodnotu.

Úspěch:
- admin zadá existující ID
- heslo se resetuje
- vrací 200 s textem o resetu

Chyby:
- 403 bez role ADMIN
- 404 uživatel neexistuje
- 405 demo režim

## PATCH /api/users/{id}/activate
## PATCH /api/users/{id}/deactivate
Admin aktivace/deaktivace účtu.

Úspěch:
- admin mění stav existujícího účtu
- vrací 200 s textem

Chyby:
- `InvalidAdminActivateDeactivateException` -> 405
- `UserNotFoundException` -> 404
- 403 bez role ADMIN

## GET /api/users/{id}/history
Audit historie uživatele, pouze ADMIN.

## GET /api/users/me/history
Historie aktuálního uživatele.

## GET /api/user/settings
## PATCH /api/user/settings
Globální uživatelská nastavení přihlášeného uživatele.

Typické scénáře:
- načtení preferencí landing page, player selection mode apod.
- update preferencí uloží `AppUserSettingsDTO`
- neplatná data -> 400
- nepřihlášený -> 401

---

# 3. Current player a hráčský kontext

## POST /api/current-player/{playerId}
Nastaví aktuálního hráče v session.

Úspěch:
- uživatel je přihlášen
- hráč existuje
- hráč patří přihlášenému uživateli nebo je povolen podle role
- backend uloží `CURRENT_PLAYER_ID`
- vrací `SuccessResponseDTO`

Chyby:
- `PlayerNotFoundException` -> 404
- `ForbiddenPlayerAccessException` -> 403
- 401 bez přihlášení

## POST /api/current-player/auto-select
Automatický výběr hráče po loginu.

Pravděpodobný scénář:
- pokud má uživatel právě jednoho hráče, nastaví se automaticky
- pokud má více hráčů, service může vrátit info nebo neprovést změnu

## GET /api/current-player
Vrací aktuálně zvoleného hráče.

Scénáře:
- current player nastaven -> 200 + `PlayerDTO`
- current player nenastaven -> pravděpodobně 200 s `null` nebo 400 podle service

---

# 4. Hráči

## Admin/manager endpointy

### GET /api/players
Seznam všech hráčů.

### GET /api/players/{id}
Detail hráče.

### GET /api/players/{id}/history
Historie změn hráče.

### POST /api/players
Vytvoření hráče.

Úspěch:
- validní `PlayerDTO`
- jméno/příjmení není duplicitní
- data se uloží

Chyby:
- `DuplicateNameSurnameException` -> 409
- `InvalidPlayerStatusException` -> 400
- 400 validační chyba

### PUT /api/players/{id}
Aktualizace hráče.

Chyby:
- `PlayerNotFoundException` -> 404
- `DuplicateNameSurnameException` -> 409
- `InvalidPlayerStatusException` -> 400

### DELETE /api/players/{id}
Smazání hráče.

Chyby:
- 404 hráč nenalezen
- 409 pokud je hráč navázán na další data

### PUT /api/players/{id}/approve
### PUT /api/players/{id}/reject
Schválení nebo zamítnutí hráče.

Chyby:
- `PlayerNotFoundException` -> 404
- `InvalidPlayerStatusException` -> 400

### POST /api/players/{playerId}/change-user
Přeřazení hráče pod jiného uživatele.

Chyby:
- `InvalidChangePlayerUserException` -> 409
- `UserNotFoundException` -> 404
- `PlayerNotFoundException` -> 404

## Uživatelské hráčské endpointy

### POST /api/players/me
Vytvoření vlastního hráče pro přihlášený účet.

Scénáře:
- uživatel vyplní profil hráče
- hráč se vytvoří a naváže na účet
- případně může dojít i k automatickému výběru current player

Chyby:
- duplicitní jméno a příjmení -> 409
- nevalidní vstup -> 400

### GET /api/players/me
Vrací všechny hráče přihlášeného uživatele.

### PUT /api/players/me
Aktualizuje aktuálně zvoleného hráče.

Chyby:
- `CurrentPlayerNotSelectedException` -> 400
- `ForbiddenPlayerAccessException` -> 403
- `PlayerNotFoundException` -> 404

### GET /api/players/me/history
Historie aktuálního hráče.

### GET /api/players/me/stats
Statistiky aktuálního hráče.

Typické scénáře:
- backend vypočítá účasti, výsledky, počty zápasů v sezóně, tým, primární pozici
- pokud hráč nemá current context -> 400
- pokud hráč neexistuje -> 404

### GET /api/players/{playerId}/stats
Statistiky libovolného hráče pro ADMIN/MANAGER.

---

# 5. Nastavení hráče a neaktivity

## GET /api/players/{playerId}/settings
## PATCH /api/players/{playerId}/settings
Nastavení konkrétního hráče.

Pravděpodobná pravidla:
- přihlášený uživatel smí pracovat jen se svým hráčem
- admin/manager mohou mít širší oprávnění přes service logiku
- při cizím hráči hrozí `ForbiddenPlayerAccessException` -> 403

## GET /api/me/settings
## PATCH /api/me/settings
Nastavení aktuálního hráče.

Chyby:
- current player není zvolen -> 400
- nepřihlášený -> 401

## GET /api/inactivity/admin/all
## GET /api/inactivity/admin/{id}
## GET /api/inactivity/admin/player/{playerId}
Přehled neaktivit pro správu.

## POST /api/inactivity/admin
Vytvoření období neaktivity.

Úspěch:
- validní datumové rozmezí
- hráč existuje
- neaktivita se nepřekrývá s jinou neaktivitou hráče

Chyby:
- `PlayerNotFoundException` -> 404
- `InvalidInactivityPeriodDateException` -> 400
- `InactivityPeriodOverlapException` -> 409

## PUT /api/inactivity/admin/{id}
Aktualizace neaktivity.

Chyby:
- `InactivityPeriodNotFoundException` -> 404
- `InvalidInactivityPeriodDateException` -> 400
- `InactivityPeriodOverlapException` -> 409

## DELETE /api/inactivity/admin/{id}
Smazání neaktivity.

Chyby:
- `InactivityPeriodNotFoundException` -> 404

## GET /api/inactivity/admin/me/all
Vlastní neaktivity přihlášeného uživatele.

Poznámka: URL obsahuje `admin`, ale controller ji zpřístupňuje běžně přihlášenému uživateli.

---

# 6. Sezóny

## POST /api/seasons
Vytvoření sezóny.

Úspěch:
- validní název a období
- nevznikne kolize názvu ani překryv s jinou sezónou
- vrací 201 + `SeasonDTO`

Chyby:
- `DuplicateSeasonNameException` -> 409
- `SeasonPeriodOverlapException` -> 409
- `InvalidSeasonPeriodDateException` -> 400

## PUT /api/seasons/{id}
Aktualizace sezóny.

Chyby:
- `SeasonNotFoundException` -> 404
- duplicita názvu -> 409
- překryv období -> 409
- nevalidní datumy -> 400

## GET /api/seasons/{id}/history
Historie sezóny.

## GET /api/seasons
Seznam všech sezón pro ADMIN/MANAGER.

## GET /api/seasons/active
Aktuálně aktivní globální sezóna.

Chyba:
- pokud není aktivní sezóna nastavena -> `SeasonNotFoundException` -> 404

## PUT /api/seasons/{id}/active
Nastavení globálně aktivní sezóny.

Chyby:
- `SeasonNotFoundException` -> 404
- `InvalidSeasonStateException` -> 409

## GET /api/seasons/me
Seznam sezón pro přihlášeného uživatele.

## GET /api/seasons/me/current
Aktuálně vybraná sezóna uživatele.

Scénáře:
- uživatel má vlastní current season -> vrátí ji
- jinak service použije default, typicky globálně aktivní sezónu
- pokud není žádná dostupná -> může vrátit `null` nebo 404 dle service

## POST /api/seasons/me/current/{seasonId}
Nastavení aktuální sezóny uživatele.

Chyby:
- `SeasonNotFoundException` -> 404

---

# 7. Zápasy

## Admin/manager správa zápasů

### GET /api/matches
Všechny zápasy.

### GET /api/matches/upcoming
Nadcházející zápasy.

### GET /api/matches/past
Odehrané zápasy.

### POST /api/matches
Vytvoření zápasu.

Úspěch:
- validní `MatchDTO`
- datum splňuje business pravidla
- vrací vytvořený zápas

Chyby:
- `InvalidMatchDateTimeException` -> 400
- nevalidní DTO -> 400

### GET /api/matches/{id}
Detail zápasu v admin pohledu.

Chyby:
- `MatchNotFoundException` -> 404

### GET /api/matches/{id}/history
Audit historie zápasu.

### PUT /api/matches/{id}
Aktualizace zápasu.

Chyby:
- `MatchNotFoundException` -> 404
- `InvalidMatchDateTimeException` -> 400
- `InvalidMatchStatusException` -> 409

### DELETE /api/matches/{id}
Mazání zápasu, pouze ADMIN.

Chyby:
- `MatchNotFoundException` -> 404
- 409 pokud je zápas navázán na další data

### PATCH /api/matches/{matchId}/cancel?reason=...
Zrušení zápasu s důvodem.

Úspěch:
- zápas existuje
- stav dovoluje zrušení
- uloží se `cancelReason` a status
- vrací `SuccessResponseDTO`

Chyby:
- `MatchNotFoundException` -> 404
- `InvalidMatchStatusException` -> 409
- neplatný enum důvodu -> 400

### PATCH /api/matches/{matchId}/uncancel
Obnovení dříve zrušeného zápasu.

Chyby:
- `MatchNotFoundException` -> 404
- `InvalidMatchStatusException` -> 409

### GET /api/matches/available-for-player/{playerId}
Zápasy dostupné pro konkrétního hráče.

Pravděpodobná pravidla:
- hráč musí existovat
- filtruje se podle sezóny, stavu hráče, neaktivity a stavu zápasu

### POST /api/matches/{matchId}/auto-lineup
Automatické vygenerování první lajny.

Chyby:
- `MatchNotFoundException` -> 404
- `InvalidMatchStatusException` nebo `IllegalStateException` -> 409
- nekonzistentní registrace / nedostatek hráčů -> 409 nebo 400

### PATCH /api/matches/{matchId}/score
Uložení skóre zápasu.

Vstup: `MatchScoreUpdateRequest`

Úspěch:
- zápas existuje
- skóre je validní
- backend přepočítá výsledek a vítěze
- vrací aktualizovaný `MatchDTO`

Chyby:
- `MatchNotFoundException` -> 404
- nevalidní vstup nebo záporné hodnoty -> 400
- nepovolená změna stavu -> 409

## Uživatelské zápasové endpointy

### GET /api/matches/{id}/detail
Detail zápasu pro běžného uživatele.

### GET /api/matches/next
Nejbližší nadcházející zápas.

Scénář:
- pokud existuje -> vrací `MatchDTO`
- pokud neexistuje -> může vrátit `null`

### GET /api/matches/me/upcoming
Nadcházející zápasy aktuálního hráče.

Chyby:
- `CurrentPlayerNotSelectedException` -> 400

### GET /api/matches/me/upcoming-overview
Lehčí přehled nadcházejících zápasů.

### GET /api/matches/me/all-passed
Přehled odehraných zápasů aktuálního hráče.

### GET /api/matches/{matchId}/positions
Přehled pozic a slotů pro oba týmy.

### GET /api/matches/{matchId}/positions/{team}
Přehled slotů pro konkrétní tým.

Chyby pro obě pozicové varianty:
- `MatchNotFoundException` -> 404
- neplatný `team` enum -> 400

---

# 8. Registrace na zápasy

## Admin/manager endpointy

### GET /api/registrations
Všechny registrace v systému.

### GET /api/registrations/match/{matchId}
Registrace pro konkrétní zápas.

### GET /api/registrations/player/{playerId}
Registrace konkrétního hráče.

### GET /api/registrations/match/{matchId}/no-response
Hráči bez odpovědi na konkrétní zápas.

### POST /api/registrations/upsert/{playerId}
Ruční registrace nebo změna registrace za zvoleného hráče.

Vstup: `MatchRegistrationRequest`

Pravděpodobné úspěšné větve:
- registrace hráče na zápas
- omluva hráče
- odhlášení hráče
- označení jako náhradník
- změna pozice nebo týmu dle requestu

Pravděpodobné chyby:
- `PlayerNotFoundException` -> 404
- `MatchNotFoundException` -> 404
- `DuplicateRegistrationException` -> 409
- `PositionCapacityExceededException` -> 409
- neplatná pozice pro mód zápasu -> 400
- operace po uzávěrce / ve špatném stavu zápasu -> 409 nebo 400

### PATCH /api/registrations/match/{matchId}/players/{playerId}/no-excused
Označení hráče jako neomluveně nepřítomného.

Chyby:
- `MatchRegistrationNotFoundException` nebo `RegistrationNotFoundException` -> 404
- změna ze špatného stavu -> 409

### PATCH /api/registrations/match/{matchId}/players/{playerId}/cancel-no-excused
Zrušení neomluvené absence a převedení na omluvu.

Chyby:
- registrace neexistuje -> 404
- neplatný `ExcuseReason` -> 400
- nepovolený stav -> 409

### PATCH /api/registrations/{playerId}/{matchId}/change-team
Admin změna týmu registrace.

### PATCH /api/registrations/{matchId}/players/{playerId}/position?position=...
Admin změna pozice v zápase.

Chyby:
- registrace neexistuje -> 404
- kapacita pozice naplněna -> 409
- pozice není pro mód povolena -> 400

## Uživatelské endpointy

### POST /api/registrations/me/upsert
Správa registrace aktuálního hráče.

To je jeden z klíčových endpointů celé aplikace. Podle requestu může vyvolat několik variant:
- přihlášení na zápas
- přihlášení jako náhradník
- omluvu účasti
- odhlášení z již existující registrace
- změnu týmové volby a pozice

Typický úspěšný scénář přihlášení:
- current player je nastaven
- zápas existuje a je registrace povolená
- tým/pozice jsou validní pro mód zápasu
- kapacita dovoluje přihlášení
- vrací aktualizovanou `MatchRegistrationDTO`

Typické chybové scénáře:
- `CurrentPlayerNotSelectedException` -> 400
- `PlayerNotFoundException` -> 404
- `MatchNotFoundException` -> 404
- `DuplicateRegistrationException` -> 409
- `PositionCapacityExceededException` -> 409
- neplatná pozice / tým / mód -> 400
- změna už není kvůli stavu zápasu povolena -> 409

### PATCH /api/registrations/me/{matchId}/change-team
Rychlá změna týmu aktuálního hráče.

Chyby:
- current player není vybrán -> 400
- registrace neexistuje -> 404
- tým nelze změnit kvůli pravidlům -> 409

### GET /api/registrations/me/for-current-player
Seznam registrací aktuálně zvoleného hráče.

---

# 9. Historie registrací

## GET /api/registrations/history/me/matches/{matchId}
Historie změn registrace aktuálního hráče v konkrétním zápase.

Chyby:
- current player není vybrán -> 400
- zápas neexistuje -> 404

## GET /api/registrations/history/admin/matches/{matchId}/players/{playerId}
Historie registrace libovolného hráče v zápase pro ADMIN/MANAGER.

---

# 10. Notifikace a připomínky

## GET /api/notifications/badge
Počet nepřečtených notifikací od posledního loginu.

## GET /api/notifications/since-last-login
Notifikace od posledního přihlášení.

## GET /api/notifications/recent?limit=...
Poslední notifikace aktuálního uživatele.

## POST /api/notifications/{id}/read
Označení jedné notifikace jako přečtené.

Chyby:
- notifikace neexistuje nebo nepatří uživateli -> očekávaně 404 nebo 403

## POST /api/notifications/read-all
Hromadné označení všech notifikací jako přečtených.

## GET /api/notifications/admin/all?limit=...
Admin/manager přehled všech notifikací.

## GET /api/notifications/admin/special/targets
Načte příjemce pro speciální notifikaci.

## POST /api/notifications/admin/special
Odešle speciální zprávu vybraným cílům.

Scénáře:
- produkce -> obvykle 204 No Content
- demo režim -> 200 + `DemoNotificationsDTO` se zachycenými zprávami

Chyby:
- nevalidní payload -> 400
- chybějící cíle -> 400
- odesílání blokované demo politikou -> 405

## GET /api/admin/match-reminders/run
Ruční spuštění klasických připomínek registrovaným hráčům.

## GET /api/admin/match-reminders/no-response/run
Ruční spuštění připomínek hráčům bez odpovědi.

## GET /api/admin/match-reminders/no-response/preview
Pouze náhled adresátů bez skutečného odeslání.

---

# 11. Demo a testovací endpointy

## GET /api/demo/notifications
Vrací a současně vyčte zachycené demo e-maily a SMS.

Poznámka: endpoint je podle security otevřený jen v demo režimu.

## DELETE /api/demo/notifications
Vyčistí zachycené demo notifikace.

## GET /api/debug/me
Debug informace o přihlášeném uživateli, pouze ADMIN.

## GET /api/test
Test endpoint, pouze ADMIN.

## POST /api/email/test/send-mail
Testovací odeslání e-mailu, pouze ADMIN.

---

# 12. Důležité poznámky a zjištěné vazby

## Silné stránky backendu
- velmi dobré rozdělení na moduly
- čitelný `SecurityConfig`
- jednotný `ApiError`
- bohatá sada doménových výjimek
- jasné oddělení hráčského a administrativního pohledu

## Pozor na tyto body
- 401 scénáře nejsou explicitně popsány v handleru, ale řeší je Spring Security
- některé controller metody vracejí přímo text/`ResponseEntity<String>`, jiné DTO; to je funkční, ale dokumentačně je dobré to sjednotit
- část pravidel je ukryta v service vrstvě, takže pro úplně formální API specifikaci by bylo vhodné doplnit i přesný seznam business pravidel k registraci, změně týmů, auto-lineupu a statistikám
- endpoint `/api/inactivity/admin/me/all` je názvem matoucí, protože je dostupný i běžně přihlášenému uživateli

## Doporučení pro další verzi dokumentace
- přidat ke každému endpointu ukázkový request/response JSON
- přidat tabulku rolí k jednotlivým modulům
- vytvořit vedle tohoto dokumentu i formální OpenAPI/Swagger popis
