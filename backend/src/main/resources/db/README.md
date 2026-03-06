# Databázový model projektu HobbyHokej

Model je navržen pro správu uživatelů, hráčů, sezón, zápasů, registrací na zápasy, notifikací a auditní historie změn.

---

## Přehled databázového modelu

Databáze je postavena kolem těchto hlavních domén:

- **Uživatelé a jejich nastavení**
- **Hráči a jejich individuální nastavení**
- **Sezóny a zápasy**
- **Registrace hráčů na zápasy**
- **Notifikace**
- **Auditní historie změn**

Model kombinuje:

- **provozní tabulky** pro aktuální stav systému,
- **history tabulky** pro auditní stopu,
- **cizí klíče** pro udržení referenční integrity,
- **enum hodnoty** pro řízený doménový stav.

---

## ER přehled

```mermaid
erDiagram
    APP_USERS ||--o| APP_USER_SETTINGS : has
    APP_USERS ||--o{ EMAIL_VERIFICATION_TOKENS : owns
    APP_USERS ||--o{ FORGOTTEN_PASSWORD_RESET_TOKEN_ENTITY : owns
    APP_USERS ||--o{ PLAYER_ENTITY : linked_to
    APP_USERS ||--o{ NOTIFICATIONS : receives
    APP_USERS ||--o{ NOTIFICATIONS : creates

    PLAYER_ENTITY ||--o| PLAYER_SETTINGS : has
    PLAYER_ENTITY ||--o{ PLAYER_INACTIVITY_PERIOD : has
    PLAYER_ENTITY ||--o{ MATCH_REGISTRATIONS : registers
    PLAYER_ENTITY ||--o{ NOTIFICATIONS : related_to

    SEASON ||--o{ MATCHES : contains
    MATCHES ||--o{ MATCH_REGISTRATIONS : has
    MATCHES ||--o{ NOTIFICATIONS : triggers

    APP_USERS {
        bigint id PK
        varchar email UK
        bit enabled
        varchar name
        varchar surname
        varchar password
        enum role
        datetime timestamp
        datetime last_login_at
        datetime current_login_at
    }

    APP_USER_SETTINGS {
        bigint id PK
        bigint user_id FK UK
        enum default_landing_page
        enum global_notification_level
        enum manager_notification_level
        enum player_selection_mode
        bit email_digest_enabled
        time email_digest_time
        varchar timezone
        varchar ui_language
    }

    PLAYER_ENTITY {
        bigint id PK
        bigint user_id FK
        varchar name
        varchar surname
        varchar full_name
        varchar nickname
        varchar phone_number
        enum player_status
        enum team
        enum primary_position
        enum secondary_position
        enum type
        datetime timestamp
    }

    PLAYER_SETTINGS {
        bigint id PK
        bigint player_id FK UK
        varchar contact_email
        varchar contact_phone
        bit email_enabled
        bit sms_enabled
        bit notify_on_registration
        bit notify_on_match_change
        bit notify_on_match_cancel
        bit notify_on_excuse
        bit notify_on_payment
        bit notify_reminders
        int reminder_hours_before
        bit possible_move_to_another_team
        bit possible_change_player_position
    }

    PLAYER_INACTIVITY_PERIOD {
        bigint id PK
        bigint player_id FK
        datetime inactive_from
        datetime inactive_to
        varchar inactivity_reason
    }

    SEASON {
        bigint id PK
        varchar name
        date start_date
        date end_date
        bit active
        bigint created_by_user_id
        datetime timestamp
    }

    MATCHES {
        bigint id PK
        bigint season_id FK
        bigint created_by_user_id
        bigint last_modified_by_user_id
        datetime date_time
        varchar location
        varchar description
        enum match_status
        enum cancel_reason
        enum match_mode
        int max_players
        int price
        int score_light
        int score_dark
        datetime timestamp
    }

    MATCH_REGISTRATIONS {
        bigint id PK
        bigint match_id FK
        bigint player_id FK
        enum status
        enum team
        enum position_in_match
        enum excuse_reason
        varchar excuse_note
        varchar admin_note
        varchar created_by
        bit reminder_already_sent
        datetime timestamp
    }

    NOTIFICATIONS {
        bigint id PK
        bigint user_id FK
        bigint player_id FK
        bigint match_id FK
        bigint created_by_user_id FK
        enum type
        varchar message_short
        varchar message_full
        varchar email_to
        varchar sms_to
        datetime created_at
        datetime read_at
    }
```

---

## Hlavní tabulky

### 1. `app_users`
Základní tabulka uživatelů aplikace.

**Účel:**
- autentizace a autorizace,
- vazba na hráčský profil,
- příjem notifikací,
- správa rolí v systému.

**Klíčové sloupce:**
- `id` – primární klíč,
- `email` – unikátní přihlašovací identita,
- `password` – hash hesla,
- `role` – `ROLE_PLAYER`, `ROLE_MANAGER`, `ROLE_ADMIN`,
- `enabled` – aktivní/neaktivní účet,
- `last_login_at`, `current_login_at` – evidence přihlášení.

**Poznámka:**
Jde o centrální identitní entitu celého systému.

---

### 2. `app_user_settings`
Rozšiřující uživatelské nastavení.

**Vazba:**
- `user_id` → `app_users.id`
- 1:1 vztah díky unikátnímu omezení nad `user_id`.

**Účel:**
- preference výchozí stránky,
- globální úroveň notifikací,
- jazyk a časové pásmo,
- digest notifikací e-mailem,
- chování při výběru hráče.

Model je správně oddělen od tabulky uživatelů, takže provozní identita není zahlcena UI a preferenčními daty.

---

### 3. `player_entity`
Doménový profil hráče.

**Účel:**
- reprezentace hráče v hokejové logice,
- vazba na tým, pozice a typ členství,
- možnost napojení na aplikační účet přes `user_id`.

**Klíčové sloupce:**
- `player_status` – `PENDING`, `APPROVED`, `REJECTED`,
- `team` – `DARK`, `LIGHT`,
- `primary_position`, `secondary_position`,
- `type` – `VIP`, `STANDARD`, `BASIC`,
- `user_id` – volitelná vazba na účet uživatele.

**Návrhový význam:**
Oddělení `app_users` a `player_entity` je správné. Umožňuje evidovat hráče i bez plnohodnotného uživatelského účtu a zároveň drží business atributy mimo bezpečnostní identitu.

---

### 4. `player_settings`
Nastavení notifikací a komunikačních preferencí hráče.

**Vazba:**
- `player_id` → `player_entity.id`
- 1:1 vztah díky unikátnímu omezení.

**Účel:**
- e-mailová a SMS notifikace,
- připomínky,
- chování při změně týmu nebo pozice,
- kontaktní údaje odlišné od uživatelského účtu.

Tato tabulka dobře podporuje budoucí rozšíření notifikačního modulu bez zásahu do tabulky hráčů.

---

### 5. `player_inactivity_period`
Evidence období neaktivity hráče.

**Vazba:**
- `player_id` → `player_entity.id`
- 1:N vztah, protože hráč může mít více období neaktivity.

**Účel:**
- plánované absence,
- dočasná nedostupnost,
- možnost filtrovat hráče při registracích a statistikách.

---

### 6. `season`
Sezóny systému.

**Účel:**
- časové rozdělení zápasů,
- určení aktivní sezóny,
- základ pro agregace statistik a přehledů.

**Klíčové sloupce:**
- `name`,
- `start_date`, `end_date`,
- `active`,
- `created_by_user_id`.

**Poznámka:**
V migračním skriptu je `created_by_user_id`, ale není na něj definován cizí klíč. Datově to dává smysl, ale z pohledu integrity by bylo vhodné jej v budoucnu svázat s `app_users.id`, pokud to chování aplikace dovolí.

---

### 7. `matches`
Tabulka zápasů.

**Vazba:**
- `season_id` → `season.id`
- 1 sezóna má více zápasů.

**Účel:**
- plánování zápasů,
- evidence režimu hry,
- kapacita a cena,
- storno důvody,
- uložení výsledného skóre.

**Klíčové sloupce:**
- `date_time`, `location`,
- `match_mode` – herní režim,
- `match_status` – `UNCANCELED`, `CANCELED`, `UPDATED`,
- `cancel_reason`,
- `max_players`, `price`,
- `score_light`, `score_dark`.

**Poznámka k návrhu:**
Uložení skóre přímo do tabulky zápasu je správné a jednoduché řešení. Pro tento typ aplikace není nutné zavádět samostatnou tabulku skóre.

---

### 8. `match_registrations`
Registrace hráčů na konkrétní zápasy.

**Vazby:**
- `match_id` → `matches.id`
- `player_id` → `player_entity.id`

Jde o klíčovou spojovací tabulku mezi hráčem a zápasem, rozšířenou o doménové atributy.

**Účel:**
- evidence přihlášení a odhlášení,
- tým a pozice pro daný zápas,
- omluvenky a důvody,
- správa náhradníků a čekací listiny,
- kontrola odeslání připomínky.

**Klíčové sloupce:**
- `status` – např. `REGISTERED`, `EXCUSED`, `RESERVED`, `SUBSTITUTE`, `NO_RESPONSE`, `NO_EXCUSED`,
- `team`,
- `position_in_match`,
- `excuse_reason`, `excuse_note`,
- `admin_note`,
- `reminder_already_sent`.

**Architektonicky:**
Tato tabulka je navržena dobře, protože nevystupuje jen jako čistá M:N vazba, ale jako samostatná doménová entita s vlastním životním cyklem.

**Doporučení do budoucna:**
V poskytnutých migracích není vidět unikátní omezení typu `(match_id, player_id)`. Pokud aplikace logicky dovoluje jen jednu aktivní registraci hráče na zápas, je vhodné takové omezení doplnit.

---

### 9. `notifications`
Centrální tabulka notifikací.

**Vazby:**
- `user_id` → `app_users.id`
- `player_id` → `player_entity.id`
- `match_id` → `matches.id`
- `created_by_user_id` → `app_users.id`

**Účel:**
- interní notifikace v aplikaci,
- vazba na zápas nebo hráče,
- příprava na více kanálů komunikace,
- audit, kdo notifikaci vytvořil.

**Klíčové prvky návrhu:**
- `type` je převeden na `ENUM`, což omezuje nevalidní hodnoty,
- `message_short` a `message_full` oddělují stručný a detailní text,
- `email_to` a `sms_to` umožňují budoucí multikanálové doručování,
- `read_at` podporuje stav přečteno/nepřečteno,
- unikátní klíč `uk_notification_user_match_type (user_id, match_id, type)` omezuje duplicitní notifikace stejného typu pro stejný zápas a uživatele.

To je velmi dobrý návrh pro notifikační modul v menší až střední aplikaci.

---

## Bezpečnostní a autentizační tabulky

### `email_verification_tokens`
Slouží pro ověření e-mailové adresy uživatele.

**Vlastnosti:**
- token je unikátní,
- jeden token je navázán na jednoho uživatele,
- obsahuje expiraci.

### `forgotten_password_reset_token_entity`
Slouží pro reset zapomenutého hesla.

**Vlastnosti:**
- token je unikátní,
- obsahuje expiraci,
- obsahuje `used_at` pro jednorázové použití,
- vazba na uživatele je přes cizí klíč.

Tyto tabulky odpovídají běžnému bezpečnostnímu návrhu moderní webové aplikace.

---

## Auditní tabulky

Databáze obsahuje samostatné history tabulky pro audit změn:

- `app_users_history`
- `matches_history`
- `match_registration_history`
- `player_entity_history`
- `season_history`

**Účel auditních tabulek:**
- uchování změnové historie,
- možnost dohledat původní stav,
- podpora administrace a kontroly zásahů,
- záznam CRUD akcí pomocí sloupce `action`.

**Typické auditní sloupce:**
- `action`
- `changed_at`
- `original_timestamp`
- reference na původní entitu, například `user_id`, `match_id`, `player_id`, `season_id`.

Z názvů migrací je patrné, že historie je plněna databázovými triggery pro hlavní entity. To je robustní přístup, protože audit nevzniká jen na úrovni aplikace, ale přímo v databázi.

---

## Doménové enumy

Model intenzivně používá `ENUM`, což je zde vhodné, protože stavové hodnoty jsou relativně stabilní a patří do jádra business logiky.

### Hlavní enum oblasti

**Role uživatelů**
- `ROLE_PLAYER`
- `ROLE_MANAGER`
- `ROLE_ADMIN`

**Typ hráče**
- `VIP`
- `STANDARD`
- `BASIC`

**Status hráče**
- `PENDING`
- `APPROVED`
- `REJECTED`

**Tým**
- `DARK`
- `LIGHT`

**Status registrace**
- `REGISTERED`
- `UNREGISTERED`
- `EXCUSED`
- `RESERVED`
- `NO_RESPONSE`
- `SUBSTITUTE`
- `NO_EXCUSED`

**Pozice v zápase**
- `GOALIE`
- `DEFENSE_LEFT`
- `DEFENSE_RIGHT`
- `CENTER`
- `WING_LEFT`
- `WING_RIGHT`
- `DEFENSE`
- `FORWARD`
- `ANY`

**Status zápasu**
- `UNCANCELED`
- `CANCELED`
- `UPDATED`

**Důvod zrušení zápasu**
- `NOT_ENOUGH_PLAYERS`
- `TECHNICAL_ISSUE`
- `WEATHER`
- `ORGANIZER_DECISION`
- `OTHER`

**Typy notifikací**
Obsahují rozsáhlý seznam událostí, například:
- registrace na zápas,
- změny zápasu,
- omluvenky,
- práce s hráčem,
- práce s uživatelem,
- reset hesla,
- bezpečnostní upozornění,
- speciální zprávy.

To ukazuje na dobře promyšlený doménový jazyk systému.

---

## Kardinality vztahů

### 1:1 vztahy
- `app_users` → `app_user_settings`
- `player_entity` → `player_settings`
- `app_users` → `email_verification_tokens` je v praxi 1:1 díky unikátnímu `user_id`

### 1:N vztahy
- `season` → `matches`
- `matches` → `match_registrations`
- `player_entity` → `match_registrations`
- `player_entity` → `player_inactivity_period`
- `app_users` → `notifications`
- `matches` → `notifications`
- `player_entity` → `notifications`

### M:N vztah realizovaný přes entitu
- `player_entity` ↔ `matches` přes `match_registrations`

To je správný a čistý návrh. M:N vazba je rozšířená o vlastní business atributy, takže nevzniká plochá vazební tabulka bez významu.

---

## Silné stránky modelu

### Dobře navržené části
1. **Oddělení identity uživatele od profilu hráče**
   - bezpečnostní a business data nejsou smíchána.

2. **Samostatná tabulka registrací**
   - registrace je plnohodnotná doménová entita.

3. **Auditní historie přes history tabulky a triggery**
   - velmi dobré pro dohledatelnost změn.

4. **Notifikační modul navázaný na uživatele, hráče i zápasy**
   - model je připraven na další rozvoj.

5. **Rozumné použití enumů**
   - zvyšuje konzistenci dat a čitelnost business pravidel.

6. **1:1 settings tabulky**
   - udržují hlavní entity přehledné a rozšiřitelné.

---

## Doporučení pro další vylepšení

### 1. Doplnit unikátní omezení na registraci hráče do zápasu
Doporučené omezení:

```sql
UNIQUE (match_id, player_id)
```

Pokud nemá existovat více registrací stejného hráče na stejný zápas, je vhodné to vynutit i databázově.

### 2. Zvážit cizí klíče pro auditní uživatele
U sloupců jako:
- `season.created_by_user_id`
- `matches.created_by_user_id`
- `matches.last_modified_by_user_id`

by bylo možné doplnit referenční integritu, pokud aplikace nevyžaduje zachování historických hodnot i po smazání uživatele.

### 3. Zvážit indexy podle nejčastějších dotazů
Například:
- `matches(date_time)`
- `match_registrations(status)`
- `match_registrations(team, position_in_match)`
- `player_entity(player_status, team, type)`

To by mohlo zlepšit výkon administračních přehledů a statistik.

### 4. Sjednotit názvosloví některých tabulek
Například:
- `player_entity` vs. ostatní tabulky bez suffixu `_entity`
- `forgotten_password_reset_token_entity` je poměrně technický název

Funkčně je to v pořádku, ale z pohledu čistoty schématu by časem stálo za úvahu názvy zjednodušit.

---

## Shrnutí

Tento databázový model je pro daný typ aplikace kvalitní a dostatečně promyšlený.

Jeho hlavní přednosti jsou:
- čisté oddělení odpovědností mezi entitami,
- dobrá podpora doménové logiky hobby hokejových zápasů,
- připravenost na notifikace a audit,
- rozšiřitelnost bez nutnosti zásadního předělání schématu.

Z pohledu README je možné tento model prezentovat jako **robustní relační návrh pro full-stack sportovní informační systém se správou uživatelů, hráčů, zápasů, registrací, statistik a notifikací**.
