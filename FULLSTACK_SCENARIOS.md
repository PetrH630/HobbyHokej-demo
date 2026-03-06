# HobbyHokej – kompletní scénáře full-stack aplikace

Tento dokument propojuje backendové API scénáře a frontendové uživatelské toky do jedné full-stack dokumentace. Zaměřuje se na to, co uživatel udělá v UI, jaké volání odchází na backend a jaké jsou možné výsledky celé operace.

## Analytický základ

Dokument vychází z kompletní analýzy obou ZIP balíků:
- backend: Spring Boot, Spring Security, controller/service/DTO/exception vrstvy
- frontend: React + Vite SPA, routy, hooky, kontexty, API moduly, admin a player UI

## Hlavní role v systému
- **anonymní návštěvník**
- **přihlášený uživatel**
- **hráč**
- **manager**
- **admin**

Role se v aplikaci překrývají tak, že jeden účet může být současně přihlášený uživatel a zároveň mít hráčský kontext.

## Hlavní doménové moduly
- autentizace a účty
- hráči a current player
- sezóny
- zápasy
- registrace na zápasy
- neaktivity
- notifikace
- admin správa

---

# 1. Vstup do aplikace a autentizace

## Scénář 1.1 – návštěvník otevře veřejný web
**Frontend:** `/` -> `PublicLandingPage`

**Backend:**
- volitelně `GET /api/public/app-mode`

**Výsledek:**
- návštěvník vidí veřejnou prezentaci aplikace
- frontend může přizpůsobit texty nebo demo prvky podle `demoMode`

## Scénář 1.2 – registrace nového účtu
**Frontend kroky:**
- uživatel vyplní formulář na `/register`
- klikne na registraci

**Backend volání:**
- `POST /api/auth/register`

**Úspěšný full-stack tok:**
- backend vytvoří účet a pošle ověřovací e-mail
- frontend zobrazí hlášku o nutnosti potvrdit e-mail

**Chybové větve:**
- špatně vyplněný formulář -> frontend nebo backend vrátí validační chybu
- e-mail už existuje -> backend vrátí konflikt, frontend zobrazí zprávu
- chyba odeslání e-mailu -> backend 500, frontend zobrazí obecnou chybu

## Scénář 1.3 – aktivace účtu přes odkaz
**Frontend:** otevře `/verify?token=...`

**Backend:**
- `GET /api/auth/verify?token=...`

**Výsledek:**
- při validním tokenu se účet aktivuje
- frontend zobrazí úspěch a nabídne login
- při neplatném tokenu zobrazí chybu

## Scénář 1.4 – přihlášení
**Frontend:** `/login`

**Backend:**
- `POST /api/auth/login`
- následně `GET /api/auth/me`

**Úspěšný tok:**
- backend založí session
- frontend obnoví `user` v `AuthProvider`
- přesměruje do `/app`

**Návazné kroky po loginu:**
- `CurrentPlayerProvider` zavolá `/api/players/me`
- současně zavolá `/api/current-player`
- `SeasonProvider` načte sezóny a current season
- `HomeDecider` rozhodne, jaký dashboard se zobrazí

**Chybové větve:**
- špatné heslo -> login chyba
- účet neaktivní -> backend 403
- session se sice založí, ale `/auth/me` selže -> frontend zůstane v nestabilním stavu a měl by se vrátit na login

## Scénář 1.5 – odhlášení
**Frontend:** klik na logout v navbaru

**Backend:**
- `POST /api/auth/logout`

**Výsledek:**
- session a kontext se vyčistí
- frontend ihned vynuluje `user`
- přesměruje na `/login`

---

# 2. Current player a osobní kontext uživatele

## Scénář 2.1 – uživatel má jednoho hráče
**Frontend:** po loginu `useCurrentPlayer`

**Backend volání:**
- `GET /api/players/me`
- `GET /api/current-player`
- případně `POST /api/current-player/{playerId}`

**Tok:**
- backend vrátí seznam jednoho hráče
- current player ještě není nastaven
- frontend ho automaticky nastaví
- od té chvíle fungují hráčské stránky bez další volby

## Scénář 2.2 – uživatel má více hráčů
**Tok:**
- backend vrátí více hráčů
- frontend current player nenastaví automaticky
- uživatel musí ručně vybrat hráče v navbaru

**Dopad:**
- pokud hráče nevybere, některé požadavky na `/me/...` skončí 400 `CurrentPlayerNotSelectedException`

## Scénář 2.3 – uživatel se pokusí nastavit cizího hráče
**Frontend:** volání `POST /api/current-player/{id}`

**Backend:**
- kontrola vlastnictví / oprávnění

**Výsledek:**
- 403 `ForbiddenPlayerAccessException`
- frontend musí oznámit, že vybraný hráč není dostupný

---

# 3. Správa vlastního účtu a vlastních profilů

## Scénář 3.1 – uživatel upraví vlastní profil
**Frontend:** `/app/settings`

**Backend:**
- `GET /api/users/me`
- `PUT /api/users/me/update`

**Úspěch:**
- UI načte aktuální data
- uživatel upraví jméno, kontakt nebo další pole
- backend uloží změny
- frontend ukáže success notifikaci

**Chyby:**
- 400 validace
- 409 kolize unikátních údajů
- 405 v demo režimu u chráněných demo uživatelů

## Scénář 3.2 – uživatel změní heslo
**Backend:**
- `POST /api/users/me/change-password`

**Úspěch:**
- staré heslo sedí
- nové heslo je validní
- změna proběhne

**Chyba:**
- staré heslo nesedí -> 400
- hesla se neshodují -> 400
- demo režim -> 405

## Scénář 3.3 – uživatel spravuje vlastní preference
**Backend:**
- `GET/PATCH /api/user/settings`
- `GET/PATCH /api/me/settings`

**Účel:**
- uživatelské nastavení aplikace
- hráčské nastavení aktuálního hráče

---

# 4. Vytvoření a správa hráče

## Scénář 4.1 – uživatel vytvoří nového hráče
**Frontend:** `/app/createPlayer`

**Backend:**
- `POST /api/players/me`

**Úspěšný tok:**
- formulář se odešle
- backend vytvoří hráče navázaného na účet
- frontend aktualizuje seznam hráčů
- případně hráče rovnou nastaví jako current player

**Chyby:**
- duplicitní jméno/příjmení -> 409
- nevalidní data -> 400

## Scénář 4.2 – uživatel upraví aktuálního hráče
**Backend:**
- `PUT /api/players/me`

**Podmínka:**
- musí být nastaven current player

**Chyba:**
- current player není zvolen -> 400

## Scénář 4.3 – admin schválí nebo zamítne hráče
**Frontend:** `/app/admin/players`

**Backend:**
- `PUT /api/players/{id}/approve`
- `PUT /api/players/{id}/reject`

**Úspěch:**
- změní se stav hráče
- UI aktualizuje řádek/tabulku

**Chyby:**
- hráč neexistuje -> 404
- změna stavu není povolená -> 400

---

# 5. Sezóny a výběr sezóny

## Scénář 5.1 – admin vytvoří sezónu
**Frontend:** `/app/admin/seasons`

**Backend:**
- `POST /api/seasons`

**Úspěch:**
- sezóna se uloží
- vrací se `201 Created`
- frontend obnoví seznam sezón

**Chyby:**
- duplicitní název -> 409
- překryv období -> 409
- neplatné datumy -> 400

## Scénář 5.2 – admin aktivuje sezónu
**Backend:**
- `PUT /api/seasons/{id}/active`

**Výsledek:**
- zvolená sezóna se stane globálně aktivní
- další přehledy a filtry se budou řídit novou sezónou

## Scénář 5.3 – běžný uživatel si přepne svou pracovní sezónu
**Backend:**
- `GET /api/seasons/me`
- `GET /api/seasons/me/current`
- `POST /api/seasons/me/current/{seasonId}`

**Výsledek:**
- frontend přepne kontext sezóny bez zásahu do globální aktivní sezóny

---

# 6. Zápasy v uživatelském pohledu

## Scénář 6.1 – uživatel otevře přehled nadcházejících zápasů
**Frontend:** `/app/matches`

**Backend:**
- `GET /api/matches/me/upcoming-overview`

**Podmínka:**
- current player musí být zvolen

**Výsledek:**
- frontend zobrazí karty zápasů s kapacitou, statusem registrace a termínem

## Scénář 6.2 – uživatel otevře detail zápasu
**Frontend:** `/app/matches/:id`

**Backend:**
- `GET /api/matches/{id}/detail`
- `GET /api/matches/{id}/positions`
- případně `GET /api/matches/{id}/positions/{team}`

**Výsledek:**
- zobrazí se detail zápasu, obsazení, týmové sloty a akce registrace

## Scénář 6.3 – uživatel sleduje své odehrané zápasy
**Backend:**
- `GET /api/matches/me/all-passed`

**Výsledek:**
- UI zobrazí přehled minulých zápasů a výsledků

---

# 7. Registrace hráče na zápas

Tohle je klíčový full-stack use case celé aplikace.

## Scénář 7.1 – standardní přihlášení na zápas
**Frontend:** detail zápasu -> uživatel zvolí tým a pozici

**Backend:**
- `POST /api/registrations/me/upsert`

**Úspěšný tok:**
- current player je nastaven
- zápas existuje a je otevřený
- tým/pozice jsou platné pro mód zápasu
- registrace se uloží
- frontend přenačte detail zápasu a stav registrace

**Možné chyby:**
- current player není zvolen -> 400
- zápas neexistuje -> 404
- pozice je plná -> 409
- hráč je už registrován -> 409
- pozice není pro mód zápasu platná -> 400
- změna už není kvůli stavu zápasu dovolena -> 409

## Scénář 7.2 – přihlášení jako náhradník
**Frontend:** v requestu `substitute=true`

**Výsledek:**
- backend uloží náhradnický status
- UI zobrazí odpovídající badge / stav

## Scénář 7.3 – omluva hráče
**Frontend:** otevře `ExcuseModal`

**Backend:**
- `POST /api/registrations/me/upsert` s `excuseReason`, `excuseNote`

**Výsledek:**
- registrace je převedena do omluveného stavu
- detail zápasu se překreslí

## Scénář 7.4 – odhlášení hráče
**Backend:**
- `POST /api/registrations/me/upsert` s `unregister=true`

**Výsledek:**
- hráč je odhlášen
- frontend zaktualizuje kapacitu i status na kartě

## Scénář 7.5 – změna týmu
**Backend:**
- `PATCH /api/registrations/me/{matchId}/change-team`

**Výsledek:**
- tým se přepne
- obsazení týmů i detail zápasu se znovu načte

**Chyba:**
- tým nelze změnit kvůli pravidlům nebo kapacitě -> 409

## Scénář 7.6 – admin změní registraci jinému hráči
**Frontend:** admin detail zápasu

**Backend:**
- `POST /api/registrations/upsert/{playerId}`
- `PATCH /api/registrations/{playerId}/{matchId}/change-team`
- `PATCH /api/registrations/{matchId}/players/{playerId}/position`

**Výsledek:**
- admin ručně opraví nebo nastaví registraci
- UI refreshne seznam registrací a pozic

## Scénář 7.7 – admin označí neomluvenou absenci
**Backend:**
- `PATCH /api/registrations/match/{matchId}/players/{playerId}/no-excused`

**Následky:**
- status registrace se změní
- později může vstoupit do statistik a historie

## Scénář 7.8 – admin zruší neomluvenou absenci
**Backend:**
- `PATCH /api/registrations/match/{matchId}/players/{playerId}/cancel-no-excused`

---

# 8. Admin správa zápasů

## Scénář 8.1 – admin vytvoří zápas
**Frontend:** `/app/admin/matches`

**Backend:**
- `POST /api/matches`

**Výsledek:**
- nový zápas se uloží a objeví v tabulce / kartách

**Chyby:**
- datum v minulosti nebo neplatný čas -> 400
- nevalidní formulář -> 400

## Scénář 8.2 – admin upraví zápas
**Backend:**
- `PUT /api/matches/{id}`

**Chyba:**
- nepovolený stavový přechod -> 409

## Scénář 8.3 – admin zruší zápas
**Backend:**
- `PATCH /api/matches/{matchId}/cancel?reason=...`

**Výsledek:**
- frontend aktualizuje kartu zápasu, stav a případné akce registrace

## Scénář 8.4 – admin obnoví zrušený zápas
**Backend:**
- `PATCH /api/matches/{matchId}/uncancel`

## Scénář 8.5 – admin vygeneruje automatickou první lajnu
**Backend:**
- `POST /api/matches/{matchId}/auto-lineup`

**Výsledek:**
- backend přeskládá registrace / starting lineup
- frontend musí přenačíst detail registrací a rozestavení

## Scénář 8.6 – admin zapíše skóre
**Backend:**
- `PATCH /api/matches/{matchId}/score`

**Výsledek:**
- backend uloží skóre, vítěze a výsledek
- hráčské statistiky a přehled minulých zápasů se od té chvíle mění

---

# 9. Statistiky a historie

## Scénář 9.1 – hráč otevře své statistiky
**Backend:**
- `GET /api/players/me/stats`

**Výsledek:**
- frontend zobrazí souhrn sezóny a grafy v `PlayerStats` / `PlayerStatsCharts`

## Scénář 9.2 – admin otevře statistiky libovolného hráče
**Backend:**
- `GET /api/players/{playerId}/stats`

## Scénář 9.3 – admin nebo hráč otevře historii změn
**Backend:**
- `GET /api/players/me/history`
- `GET /api/players/{id}/history`
- `GET /api/matches/{id}/history`
- `GET /api/seasons/{id}/history`
- `GET /api/registrations/history/...`
- `GET /api/users/me/history`
- `GET /api/users/{id}/history`

**Výsledek:**
- UI může zobrazit auditní časovou osu a vysvětlit změny v datech

---

# 10. Neaktivity hráčů

## Scénář 10.1 – hráč sleduje své neaktivity
**Frontend:** `/app/my-inactivity`

**Backend:**
- `GET /api/inactivity/admin/me/all`

## Scénář 10.2 – admin založí neaktivitu hráči
**Frontend:** `/app/admin/inactivity`

**Backend:**
- `POST /api/inactivity/admin`

**Úspěch:**
- období se uloží
- následné výpočty dostupnosti hráče se tím ovlivní

**Chyby:**
- špatné datumy -> 400
- překryv období -> 409

## Scénář 10.3 – admin upraví nebo smaže neaktivitu
**Backend:**
- `PUT /api/inactivity/admin/{id}`
- `DELETE /api/inactivity/admin/{id}`

---

# 11. Notifikace a reminder flow

## Scénář 11.1 – hráč sleduje své notifikace
**Frontend:** `/app/notifications`

**Backend:**
- `GET /api/notifications/badge`
- `GET /api/notifications/recent`
- `GET /api/notifications/since-last-login`
- `POST /api/notifications/{id}/read`
- `POST /api/notifications/read-all`

**Výsledek:**
- uživatel vidí počet nových notifikací
- může je označovat jako přečtené

## Scénář 11.2 – admin ručně spustí match reminders
**Frontend:** `/app/admin/notifications`

**Backend:**
- `GET /api/admin/match-reminders/run`
- `GET /api/admin/match-reminders/no-response/run`
- `GET /api/admin/match-reminders/no-response/preview`

**Výsledek:**
- admin dostane textový výsledek nebo preview seznamu

## Scénář 11.3 – admin odešle speciální notifikaci
**Backend:**
- `GET /api/notifications/admin/special/targets`
- `POST /api/notifications/admin/special`

**Výsledek v produkci:**
- backend vrátí 204 a zpráva je reálně odeslána

**Výsledek v demo režimu:**
- backend vrátí `DemoNotificationsDTO`
- frontend může ukázat zachycené e-maily/SMS bez reálného odeslání

---

# 12. Admin správa uživatelů

## Scénář 12.1 – admin zobrazí seznam uživatelů
**Frontend:** `/app/admin/users`

**Backend:**
- `GET /api/users`

## Scénář 12.2 – admin otevře detail uživatele
**Frontend:** `/app/admin/users/:id`

**Backend:**
- `GET /api/users/{id}`
- `GET /api/users/{id}/history`

## Scénář 12.3 – admin resetuje heslo uživateli
**Backend:**
- `POST /api/users/{id}/reset-password`

## Scénář 12.4 – admin aktivuje nebo deaktivuje účet
**Backend:**
- `PATCH /api/users/{id}/activate`
- `PATCH /api/users/{id}/deactivate`

---

# 13. Typické end-to-end chybové scénáře

## 13.1 Session vypršela během práce
- frontend pošle chráněný request
- backend vrátí 401
- další render chráněné části skončí redirectem na `/login`
- neuložené změny v UI mohou být ztraceny

## 13.2 Uživatel nemá správnou roli
- admin část se může skrýt přes `RoleGuard`
- při přímém backend volání stejně přijde 403
- frontend musí chybový stav zobrazit, ne jen mlčky schovat obsah

## 13.3 Chybí current player
- backend vrátí 400 na řadě `me` endpointů
- UI musí nabídnout výběr hráče a vysvětlit, proč nelze pokračovat

## 13.4 Data na frontendu a backendu nejsou v souladu
V analyzovaném kódu existují minimálně tyto nesoulady:
- FE očekává `GET /api/seasons/{id}`, ale BE endpoint neexistuje
- FE očekává `PUT /api/users/{id}`, ale BE endpoint v controlleru není

Dopad:
- příslušné obrazovky nebo akce mohou selhávat i při správně fungujícím backendu
- je vhodné sjednotit contract-first dokumentaci

---

# 14. Doporučení pro finální profesionální dokumentaci projektu

## Co už je silné
- backend i frontend mají dobrou modulární strukturu
- aplikace má čitelné role, jasné moduly a auditní historii
- current player a current season dávají aplikaci profesionální kontextové chování
- registrace na zápasy je doménově dobře rozpracovaná

## Co bych doplnil dál
- ukázkové JSON requesty a response ke všem klíčovým use casům
- tabulku route -> component -> hook -> API -> DTO
- tabulku role -> povolené akce
- jednotný error handling na FE
- OpenAPI specifikaci pro backend a samostatný FE contract dokument
