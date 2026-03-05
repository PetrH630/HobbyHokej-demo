
# HobbyHokej

HobbyHokej je full‑stack webová aplikace určená pro organizaci a správu hobby hokejových zápasů.
Systém umožňuje správu zápasů, registraci hráčů na konkrétní pozice, řízení kapacity týmů,
sledování statistik hráčů v rámci sezón a notifikační komunikaci s hráči.

Projekt je navržen jako **modulární webový systém** s odděleným frontendem a backendem.

Frontend poskytuje uživatelské rozhraní pro hráče a administrátory.
Backend poskytuje REST API, business logiku a práci s databází.

---

# Architektura systému

Aplikace je rozdělena do dvou hlavních částí:

Frontend (React SPA)
        │
        │ REST API
        ▼
Backend (Spring Boot)
        │
        ▼
Database (MariaDB)

Backend je implementován jako **modulární monolit s vícevrstvovou architekturou**. fileciteturn0file2

Základní vrstvy backendu:

- Controller – REST endpointy
- Service – business logika
- Repository – přístup k databázi
- DTO + Mapper – API kontrakty a převod mezi DTO a entitami
- Security – autentizace a autorizace
- Notification subsystem – notifikace
- Scheduler – plánované úlohy
- Database layer – Flyway migrace a audit triggery

---

# Hlavní funkce systému

Systém zajišťuje:

- řízení kapacity a obsazenosti pozic
- evidenci registrací (hráč, tým, pozice)
- přehled náhradníků a omluvených
- vyhodnocení výsledků zápasů
- výpočet hráčských statistik v rámci sezóny
- auditní historii změn
- notifikační mechanismus (email, SMS, in‑app)

Tyto funkce jsou implementovány v backendové doménové logice a dostupné přes REST API. fileciteturn0file0

---

# Technologie

## Backend

- Java 17
- Spring Boot 3
- Spring Security
- Spring Data JPA
- Hibernate
- MariaDB
- Flyway
- MapStruct
- Maven

## Frontend

- React
- Vite
- Bootstrap
- Axios

---

# Struktura projektu

```
HobbyHokej
│
├─ backend
│   ├─ src/main/java/cz/phsoft/hokej
│   ├─ src/main/resources
│   ├─ docs
│   └─ pom.xml
│
├─ frontend
│   ├─ src
│   ├─ package.json
│   └─ vite.config.js
│
└─ docs
```

Backend je členěn **doménově** podle hlavních modulů:

- match
- player
- registration
- season
- user
- notifications
- security
- config

Tento návrh umožňuje jasné oddělení odpovědností mezi jednotlivými částmi systému. fileciteturn0file2

---

# Doménový model

Hlavní entity systému:

- AppUser – uživatelský účet
- Player – hráč propojený s uživatelem
- Season – hokejová sezóna
- Match – zápas
- MatchRegistration – registrace hráče na zápas
- Notification – aplikační notifikace

Každá důležitá entita má také **history tabulku pro audit změn**. fileciteturn0file2

---

# Registrace hráče na zápas

Typický tok registrace:

1. hráč se přihlásí do aplikace
2. frontend načte seznam zápasů
3. hráč zvolí zápas
4. hráč vybere tým a pozici
5. frontend odešle požadavek na backend
6. backend ověří kapacitu a dostupnost
7. registrace je uložena do databáze

Backend také automaticky řeší:

- přesuny mezi stavem REGISTERED / RESERVED
- kontrolu neaktivity hráče
- aktualizaci statistik

---

# REST API

Backend poskytuje **JSON REST API** používané frontendem. fileciteturn0file1

Základní prefix endpointů:

```
/api/...
```

Příklady hlavních API oblastí:

- /api/auth – autentizace a registrace
- /api/users – správa uživatelů
- /api/players – správa hráčů
- /api/matches – zápasy
- /api/registrations – registrace hráčů
- /api/seasons – sezóny
- /api/notifications – notifikace

API vrací data ve formátu JSON.

---

# Bezpečnost

Bezpečnost systému je implementována pomocí **Spring Security**.

Principy:

- JSON login
- session-based autentizace
- role-based autorizace
- ochrana endpointů pomocí @PreAuthorize

Role systému:

- ADMIN – plná správa systému
- MANAGER – správa zápasů a hráčů
- PLAYER – registrace na zápasy

---

# Notifikační systém

Systém podporuje více komunikačních kanálů:

- In‑App notifikace
- Email
- SMS

Notifikace se odesílají například při:

- vytvoření zápasu
- změně času zápasu
- registraci hráče
- změně registrace
- připomínkách zápasu

Notifikační subsystém je navržen jako rozšiřitelný a oddělený od doménových modulů. fileciteturn0file2

---

# Audit změn

Systém implementuje audit pomocí **databázových triggerů**.

Pro každou klíčovou entitu existuje:

- history tabulka
- trigger pro INSERT
- trigger pro UPDATE
- trigger pro DELETE

Audit je verzován pomocí Flyway migrací.

Výhody:

- audit funguje i mimo aplikaci
- nelze jej obejít aplikační vrstvou
- poskytuje kompletní historii změn

---

# Spuštění aplikace

## Backend

```
mvn spring-boot:run
```

Backend běží typicky na:

```
http://localhost:8080
```

## Frontend

```
npm install
npm run dev
```

Frontend běží typicky na:

```
http://localhost:5173
```

---

# Dokumentace

Podrobnější dokumentace projektu:

Backend:

- docs/ARCHITECTURE.md
- docs/API.md
- docs/Javadoc

Frontend:

- docs/ARCHITECTURE.md
- docs/COMPONENTS.md
- docs/HOOKS.md

---

# Licence

Tento projekt je licencován pod licencí **MIT**.
