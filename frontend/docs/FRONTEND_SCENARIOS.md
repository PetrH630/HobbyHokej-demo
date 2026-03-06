# HobbyHokej – scénáře frontendu

Tento dokument popisuje scénáře frontendové SPA aplikace postavené na React + Vite. Vychází z analyzovaných rout, API modulů, hooků, kontextů a hlavních komponent. Zaměřuje se na uživatelské toky, navigaci, ochranu rout, práci se session a vazbu na backend.

## Rozsah analýzy

Analyzované části:
- `App.jsx`, `main.jsx`, `RequireAuth.jsx`
- routy v chráněné i veřejné části
- `useAuth`, `useCurrentPlayer`, `SeasonProvider`, notifikační kontexty
- API moduly ve složce `api/`
- hlavní stránky a navigační logika

## Architektura frontendu

Frontend je SPA aplikace s těmito vrstvami:
- **routing** přes `react-router-dom`
- **API vrstva** přes `axios` s `baseURL: /api` a `withCredentials: true`
- **autentizační kontext** přes `AuthProvider`
- **current player kontext** přes `CurrentPlayerProvider`
- **sezónní kontext** přes `SeasonProvider`
- **globální notifikace** přes `NotificationProvider` a `NotificationBadgeProvider`
- **role-based rendering** přes `RequireAuth` a `RoleGuard`

## Bootstrapping aplikace

V `main.jsx` se aplikace skládá v pořadí:
- `AuthProvider`
- `NotificationProvider`
- `NotificationBadgeProvider`
- `App`

Důsledek:
- autentizace je dostupná celému stromu aplikace
- UI notifikace a badge jsou k dispozici napříč chráněnou částí

## Ochrana rout

### RequireAuth
`RequireAuth`:
- čeká, než `useAuth` dočte uživatele
- při `loading` zobrazuje text „Ověřuji přihlášení…“
- pokud `user` existuje, pustí do chráněné části
- jinak přesměruje na `/login`

### RoleGuard
`RoleGuard`:
- neroutuje pryč, pouze nerenedruje children
- přístup se řídí `user.role`
- používá se pro admin/manager sekce a některé položky navigace

Praktický důsledek:
- backend zajišťuje skutečnou bezpečnost
- frontend skryje nepovolené části UI, ale není to náhrada backend autorizace

---

# 1. Veřejná část aplikace

Veřejné routy běží v `PublicLayout`:
- `/`
- `/login`
- `/register`
- `/verify`
- `/forgotten-password`
- `/reset-password`

## Scénář: otevření landing page
- uživatel přijde na `/`
- vykreslí se `PublicLandingPage`
- podle `modeApi` může frontend zjistit, zda je aktivní demo režim

## Scénář: registrace
Route: `/register`

Tok:
- uživatel vyplní registrační formulář
- frontend zavolá `registerUser(data)` -> `POST /api/auth/register`
- při úspěchu zobrazí potvrzení o nutnosti ověřit e-mail
- při chybě přečte `ApiError.message` nebo validační detaily a zobrazí je ve formuláři

Možné chybové stavy v UI:
- nevalidní formulář
- e-mail už existuje
- dočasná chyba serveru

## Scénář: ověření účtu
Route: `/verify?token=...`

Tok:
- stránka načte `token` z query parametru
- frontend zavolá `verifyEmail(token)` -> `GET /api/auth/verify`
- při 200 zobrazí úspěšné aktivování účtu
- při 400 zobrazí neplatný nebo expirovaný odkaz

## Scénář: zapomenuté heslo – vyžádání odkazu
Route: `/forgotten-password`

Tok:
- uživatel zadá e-mail
- frontend volá `requestForgottenPassword(email)`
- při úspěchu ukáže neutrální potvrzení
- při chybě vypíše server message

## Scénář: zapomenuté heslo – finální reset
Route: `/reset-password?token=...`

Tok:
- stránka načte token z query
- volá `getForgottenPasswordInfo(token)` a zobrazí navázaný e-mail
- po vyplnění nového hesla volá `resetForgottenPassword(data)`
- při úspěchu informuje uživatele, že heslo bylo změněno
- při chybě vypíše neplatný token nebo problém s heslem

## Scénář: login
Route: `/login`

Tok:
- uživatel zadá e-mail a heslo
- frontend volá `loginUser(email, password)`
- po úspěchu zavolá `updateUser()` v auth kontextu
- aplikace přejde do `/app`
- následně se načítá current player a další kontext

UI stavy:
- loading loginu
- chyba přihlášení
- chyba neaktivovaného účtu

---

# 2. Chráněná část aplikace

Chráněná část běží pod `/app` a používá:
- `RequireAuth`
- `CurrentPlayerProvider`
- `SeasonProvider`
- `SharedLayout`

`SharedLayout` vykresluje:
- `HeaderTop`
- `Navbar`
- případnou globální alert notifikaci
- obsah stránky přes `Outlet`
- `Footer`
- `CookieConsentBanner`

## Scénář: vstup do aplikace po loginu
- `useAuth` dotáhne aktuálního uživatele přes `/auth/me`
- `RequireAuth` pustí uživatele do `/app`
- `CurrentPlayerProvider` paralelně načte `/players/me` a `/current-player`
- pokud current player neexistuje a uživatel má právě jednoho hráče, frontend provede automatické nastavení přes `/current-player/{id}`
- `SeasonProvider` načte aktuální sezónu uživatele
- `HomeDecider` rozhodne, zda se ukáže admin přehled nebo běžný home

## Scénář: logout
- kliknutí v `Navbar`
- frontend volá `logoutUser()` -> `/api/auth/logout`
- i kdyby backend selhal, lokálně se `user` nastaví na `null`
- přesměrování na `/login`

---

# 3. Navigace a role-based UI

## Navbar
Navbar kombinuje tři kontexty:
- autentizovaný uživatel
- current player
- aktuální route

Umí:
- přepínat mezi hráči uživatele
- zobrazovat hráčské menu
- zobrazovat admin menu
- přepínat mezi běžným a admin režimem
- zobrazovat notifikační ikony

## HomeDecider
- `ROLE_ADMIN` -> `AdminHomePage`
- ostatní -> `Home`

To znamená, že jedna vstupní route `/app` dynamicky mění dashboard podle role.

---

# 4. Frontendové scénáře podle rout

## /app/player
Hráčský dashboard.

Pravděpodobné funkce:
- přehled aktuálního hráče
- základní statistiky, stav registrací, rychlé odkazy

## /app/players
Správa hráče v uživatelském pohledu.

Typické scénáře:
- zobrazení detailu current player
- editace vlastního hráče
- zobrazení historie hráče
- přístup ke statistikám

Používané API:
- `getMyPlayers`
- `updateMyCurrentPlayer`
- `getMyPlayerHistory`
- `getMyPlayerStats`

## /app/createPlayer
Vytvoření nového hráče pro aktuální účet.

Scénář:
- uživatel vyplní formulář
- frontend validuje vstup
- volá `createPlayer(data)`
- po úspěchu obnoví current player kontext a přesměruje uživatele

## /app/matches
Přehled zápasů pro current player.

Typické scénáře:
- načtení nadcházejících zápasů přes `getMyUpcomingMatchesOverview`
- zobrazení minulých zápasů přes `getMyPassedMatchesOverview`
- otevření detailu konkrétního zápasu
- práce s registrací na zápas

## /app/matches/:id
Detail zápasu.

Tok:
- frontend načte `MatchDetailDTO`
- načte přehled pozic / týmů
- umožní registraci, omluvu, odhlášení nebo změnu týmu
- modal okna (`PlayerPositionModal`, `ExcuseModal`, `TeamSelectModal`, `PositionModalView`) řeší interakci s registrací

## /app/my-inactivity
Vlastní období neaktivity.

Tok:
- načtení přes `getMyInactivity`
- zobrazení v kartách / seznamu
- běžný uživatel zde spíš sleduje stav; admin edituje jinde

## /app/settings
Nastavení účtu a hráče.

Dílčí scénáře:
- editace uživatelského profilu
- změna hesla
- editace uživatelských preferencí
- editace hráčských preferencí

Používané API:
- `userApi.getCurrent`, `userApi.updateCurrent`, `userApi.changeMyPassword`
- `getUserSettings`, `updateUserSettings`
- `getCurrentPlayerSettings`, `updateCurrentPlayerSettings`

## /app/notifications
Uživatelské notifikace.

Scénáře:
- načtení badge a posledních notifikací
- filtrování na „od posledního přihlášení“ nebo „recent“
- označení jedné notifikace jako přečtené
- označení všech jako přečtené

---

# 5. Admin / manager scénáře

## /app/admin
Admin dashboard.

Pravděpodobné funkce:
- zkratky do správy hráčů, zápasů, sezón a notifikací
- souhrnné přehledy

## /app/admin/players
Správa hráčů.

Scénáře:
- načtení všech hráčů
- vytvoření hráče administrátorem
- editace hráče
- schválení / zamítnutí hráče
- změna přiřazeného uživatele
- otevření historie hráče
- otevření statistik hráče

Používané API:
- `getAllPlayersAdmin`
- `getPlayerById`
- `createPlayerAdmin`
- `updatePlayerAdmin`
- `approvePlayerAdmin`
- `rejectPlayerAdmin`
- `changePlayerUserAdmin`
- `getPlayerHistoryAdmin`
- `getPlayerStatsAdmin`

## /app/admin/matches
Správa zápasů.

Scénáře:
- načtení všech / upcoming / past zápasů
- vytvoření a editace zápasu
- zrušení a obnovení zápasu
- správa registrací hráčů na zápase
- změna týmu hráče v zápase
- změna pozice hráče v zápase
- ruční označení `NO_EXCUSED`
- zrušení `NO_EXCUSED`
- automatické generování první lajny
- zápis skóre
- zobrazení historie zápasu a historie registrace hráče v zápase

Používané API:
- `matchApi`
- `matchRegistrationApi`
- `matchRegistrationHistoryApi`

## /app/admin/seasons
Správa sezón.

Scénáře:
- seznam sezón
- vytvoření sezóny
- editace sezóny
- aktivace sezóny
- zobrazení historie sezóny

## /app/admin/inactivity
Správa neaktivit hráčů.

Scénáře:
- načtení všech neaktivit
- filtrování podle hráče
- vytvoření, úprava, smazání

## /app/admin/notifications
Admin notifikace.

Scénáře:
- přehled všech notifikací v systému
- ruční spuštění připomínek
- náhled reminderů bez odpovědi
- odeslání speciální zprávy vybraným cílům
- v demo režimu zobrazení zachycených e-mailů/SMS

## /app/admin/users
Pouze admin.

Scénáře:
- seznam uživatelů
- detail uživatele
- reset hesla
- aktivace / deaktivace účtu
- zobrazení historie účtu

---

# 6. Stavový management a hook scénáře

## useAuth
`useAuth` řeší:
- načtení aktuálního uživatele po mountu
- držení `user` a `loading`
- obnovu uživatele po loginu
- lokální logout

Typické stavy:
- `loading=true` při startu aplikace
- `user=null` při anonymním návštěvníkovi
- `user!=null` po úspěšném loginu

## useCurrentPlayer
`useCurrentPlayer` řeší:
- seznam hráčů přihlášeného uživatele
- current player
- automatické nastavení current player při jediném hráči
- změnu current player přes select v navbaru

Důležitý scénář:
- když backend current player nemá a uživatel má více hráčů, UI ponechá `currentPlayer = null`
- některé stránky pak mohou skončit chybou „není zvolen aktuální hráč“, pokud uživatel hráče ručně nevybere

## Notification contexty
Slouží pro:
- globální alert zprávy
- badge nepřečtených notifikací
- synchronizaci seznamu notifikací s UI

---

# 7. Typické chybové scénáře frontendu

## Session vypršela
- backend vrátí 401
- další chráněný request selže
- `RequireAuth` při novém načtení uživatele pošle uživatele na `/login`

## Přístup bez role
- frontend část UI skryje přes `RoleGuard`
- když uživatel přesto ručně zavolá endpoint, backend vrátí 403
- UI musí zpracovat server error a nevěřit pouze skrytí prvků

## Není zvolen current player
- request na `/matches/me/...`, `/registrations/me/...`, `/players/me` nebo settings může selhat 400
- frontend by měl uživateli nabídnout výběr hráče v navbaru

## Validační chyba formuláře
- backend vrátí `ApiError.details`
- frontend může pole podbarvit a zobrazit zprávu u konkrétního inputu

## Server error 500
- komponenty používající hooky by měly zobrazit fallback text / alert místo pádu celé stránky

---

# 8. Zjištěné nesoulady a doporučení

## Nalezené nesoulady FE vs BE
- `seasonApi.getSeasonByIdAdmin()` očekává `GET /api/seasons/{id}`, ale controller takový endpoint nemá.
- `userApi.updateAdmin()` očekává `PUT /api/users/{id}`, ale v analyzovaném controlleru tento endpoint není.
- některé komentáře v API souborech uvádějí přísnější role než backend; backend v několika případech pouští i `MANAGER`.
- URL `/api/inactivity/admin/me/all` je funkční, ale pro frontend i dokumentaci působí neintuitivně.

## Doporučení pro frontend dokumentaci
- přidat jednotný error handler pro axios
- sjednotit mapování backend `ApiError` -> formulářové chyby
- doplnit loading/empty/error stavy ke každé stránce
- sepsat zvlášť tabulku: route -> page -> hook -> API endpointy
