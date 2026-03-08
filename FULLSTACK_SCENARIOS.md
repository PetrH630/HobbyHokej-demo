
# HobbyHokej – Full‑stack scénáře aplikace

Tento dokument popisuje fungování aplikace HobbyHokej z pohledu uživatele i backendového API. 
Cílem je mít na jednom místě přehled hlavních scénářů systému – co uživatel udělá v aplikaci,
jaké požadavky odejdou na backend a jaké mohou být výsledky jednotlivých operací.

Dokument slouží jako technická dokumentace projektu a zároveň jako přehled hlavních use‑case scénářů
pro celý full‑stack systém.

---

# Architektura aplikace

Aplikace je implementována jako full‑stack řešení složené ze dvou hlavních částí:

**Backend**
- Java
- Spring Boot
- Spring Security
- vrstvy controller / service / repository
- DTO objekty
- exception handling

**Frontend**
- React
- Vite
- SPA aplikace
- React Router
- kontexty a custom hooky
- API moduly komunikující s backendem

Frontend komunikuje s backendem pomocí REST API.

---

# Hlavní role v systému

Systém pracuje s několika typy uživatelů:

- běžný přihlášený uživatel
- hráč
- manager
- admin

Jednotlivé role se mohou kombinovat. Jeden účet může být například zároveň hráčem
a zároveň administrátorem systému.

---

# Hlavní doménové moduly aplikace

Aplikace je rozdělena do několika logických modulů:

- autentizace a uživatelské účty
- hráči a current player
- sezóny
- zápasy
- registrace hráčů na zápasy
- neaktivity hráčů
- notifikace
- administrace systému
- statistiky

---

# 1. Vstup do aplikace a autentizace

## Otevření veřejné stránky

Frontend:
```
/
```

Komponenta:
```
PublicLandingPage
```

Backend může volitelně volat:

```
GET /api/public/app-mode
```

Výsledek:

- návštěvník vidí veřejnou prezentaci aplikace
- frontend může přizpůsobit obsah podle režimu aplikace (např. demo mode)

---

## Registrace nového účtu

Frontend:

- uživatel otevře registrační stránku
- vyplní formulář
- odešle registraci

Backend:

```
POST /api/auth/register
```

Úspěšný průběh:

- backend vytvoří nový účet
- odešle ověřovací e‑mail
- frontend zobrazí informaci o nutnosti potvrdit e‑mail

Možné chyby:

- nevalidní data → HTTP 400
- e‑mail již existuje → HTTP 409
- chyba při odeslání e‑mailu → HTTP 500

---

## Aktivace účtu

Frontend otevře odkaz z e‑mailu:

```
/verify?token=...
```

Backend:

```
GET /api/auth/verify?token=...
```

Výsledek:

- při validním tokenu se účet aktivuje
- uživatel je přesměrován na přihlášení

Při neplatném tokenu se zobrazí chybová stránka.

---

## Přihlášení

Frontend:

```
/login
```

Backend:

```
POST /api/auth/login
GET /api/auth/me
```

Úspěšný tok:

- backend vytvoří session
- frontend obnoví kontext přihlášeného uživatele
- uživatel je přesměrován do aplikace

Možné chyby:

- špatné přihlašovací údaje → HTTP 401
- účet není aktivní → HTTP 403

---

## Odhlášení

Frontend:

kliknutí na tlačítko logout

Backend:

```
POST /api/auth/logout
```

Výsledek:

- session je zrušena
- frontend vyčistí uživatelský kontext
- uživatel je přesměrován na přihlášení

---

# 2. Current Player

Po přihlášení aplikace pracuje s konceptem **current player**.

Current player reprezentuje aktivní hráčský profil,
se kterým uživatel aktuálně pracuje.

---

## Uživatel má jednoho hráče

Backend:

```
GET /api/players/me
```

Výsledek:

- backend vrátí seznam hráčů
- pokud existuje pouze jeden hráč,
  může být automaticky nastaven jako current player

---

## Uživatel má více hráčů

Výsledek:

- uživatel musí vybrat aktivního hráče

Backend:

```
POST /api/current-player/{playerId}
```

---

## Pokus o nastavení cizího hráče

Backend kontroluje oprávnění.

Výsledek:

- pokud hráč nepatří uživateli → HTTP 403

---

# 3. Správa uživatelského účtu

## Úprava profilu

Backend:

```
GET /api/users/me
PUT /api/users/me/update
```

Výsledek:

- uživatel může upravit své osobní údaje
- změny jsou uloženy do databáze

---

## Změna hesla

Backend:

```
POST /api/users/me/change-password
```

Možné chyby:

- nesprávné původní heslo
- neplatné nové heslo

---

## Uživatelská nastavení

Backend:

```
GET /api/user/settings
PATCH /api/user/settings
```

Výsledek:

- ukládání preferencí uživatele

---

# 4. Správa hráčů

## Vytvoření hráče

Frontend:

```
/app/createPlayer
```

Backend:

```
POST /api/players/me
```

Výsledek:

- nový hráč je vytvořen
- hráč je navázán na uživatelský účet

---

## Úprava hráče

Backend:

```
PUT /api/players/me
```

Podmínka:

- musí být zvolen current player

---

## Schválení hráče administrátorem

Backend:

```
PUT /api/players/{id}/approve
PUT /api/players/{id}/reject
```

Výsledek:

- změní se stav hráče v systému

---

# 5. Sezóny

## Vytvoření sezóny

Backend:

```
POST /api/seasons
```

Možné chyby:

- duplicitní název
- neplatné datumy

---

## Aktivace sezóny

Backend:

```
PUT /api/seasons/{id}/active
```

Výsledek:

- sezóna se stane globálně aktivní

---

## Výběr pracovní sezóny

Backend:

```
POST /api/seasons/me/current/{seasonId}
```

Uživatel může pracovat s jinou sezónou,
aniž by měnil globální aktivní sezónu.

---

# 6. Zápasy

## Přehled nadcházejících zápasů

Backend:

```
GET /api/matches/me/upcoming-overview
```

Frontend zobrazí přehled zápasů ve formě karet.

---

## Detail zápasu

Backend:

```
GET /api/matches/{id}/detail
```

Frontend zobrazí:

- detail zápasu
- obsazení týmů
- pozice hráčů

---

## Odehrané zápasy

Backend:

```
GET /api/matches/me/all-passed
```

Frontend zobrazí historii zápasů a výsledky.

---

# 7. Registrace na zápas

Toto je hlavní doménová funkcionalita aplikace.

## Přihlášení na zápas

Backend:

```
POST /api/registrations/me/upsert
```

Možné chyby:

- zápas neexistuje
- pozice je obsazená
- registrace není povolena

---

## Přihlášení jako náhradník

Registrace je vytvořena se statusem náhradníka.

---

## Omluva hráče

Registrace je převedena do omluveného stavu.

---

## Odhlášení ze zápasu

Registrace je zrušena.

---

## Změna týmu

Backend:

```
PATCH /api/registrations/me/{matchId}/change-team
```

---

# 8. Administrace zápasů

## Vytvoření zápasu

Backend:

```
POST /api/matches
```

---

## Úprava zápasu

Backend:

```
PUT /api/matches/{id}
```

---

## Zrušení zápasu

Backend:

```
PATCH /api/matches/{matchId}/cancel
```

---

## Obnovení zápasu

Backend:

```
PATCH /api/matches/{matchId}/uncancel
```

---

## Automatická sestava

Backend:

```
POST /api/matches/{matchId}/auto-lineup
```

Backend automaticky vytvoří základní rozestavení hráčů.

---

## Zápis skóre

Backend:

```
PATCH /api/matches/{matchId}/score
```

Výsledek:

- uloží se skóre zápasu
- aktualizují se statistiky

---

# 9. Statistiky

## Statistiky aktuálního hráče

Backend:

```
GET /api/players/me/stats
```

Frontend zobrazí přehled statistik hráče.

---

## Statistiky konkrétního hráče

Backend:

```
GET /api/players/{playerId}/stats
```

---

# 10. Neaktivity hráčů

## Přehled neaktivit

Backend:

```
GET /api/inactivity/admin/me/all
```

---

## Vytvoření neaktivity

Backend:

```
POST /api/inactivity/admin
```

---

## Úprava nebo smazání neaktivity

Backend:

```
PUT /api/inactivity/admin/{id}
DELETE /api/inactivity/admin/{id}
```

---

# 11. Notifikace

## Přehled notifikací

Backend:

```
GET /api/notifications/recent
```

---

## Označení notifikace jako přečtené

Backend:

```
POST /api/notifications/{id}/read
```

---

## Označení všech jako přečtené

Backend:

```
POST /api/notifications/read-all
```

---

# 12. Administrace uživatelů

## Seznam uživatelů

Backend:

```
GET /api/users
```

---

## Detail uživatele

Backend:

```
GET /api/users/{id}
```

---

## Reset hesla

Backend:

```
POST /api/users/{id}/reset-password
```

---

## Aktivace nebo deaktivace účtu

Backend:

```
PATCH /api/users/{id}/activate
PATCH /api/users/{id}/deactivate
```

---

# Shrnutí

Tento dokument popisuje hlavní scénáře fungování aplikace HobbyHokej
z pohledu full‑stack systému.

Obsahuje:

- hlavní use‑case scénáře aplikace
- vazbu mezi frontendem a backendovým API
- základní administrátorské operace
- typické uživatelské akce v systému

Dokument slouží jako technický přehled aplikace
a může být použit jako součást projektové dokumentace.
