# HobbyHokej-demo

![Java](https://img.shields.io/badge/Java-17-orange) ![Spring
Boot](https://img.shields.io/badge/SpringBoot-3.x-brightgreen)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-Frontend-purple)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
![Status](https://img.shields.io/badge/status-active-success)

Webová aplikace pro správu hobby hokejových zápasů, registrací hráčů,
sezón, statistik a notifikační komunikace mezi organizátory a hráči.

Projekt je implementován jako **full‑stack webová aplikace** postavená
na technologickém stacku:

**Java Spring Boot + React + Vite + MariaDB**

Aplikace umožňuje organizaci hobby hokejových zápasů, správu hráčských
registrací, evidenci výsledků a výpočet statistik.

Projekt slouží jako **ukázka návrhu plnohodnotné vícevrstvé webové
aplikace**.

------------------------------------------------------------------------

# Obsah

-   Popis projektu
-   Hlavní funkce systému
-   Architektura systému
-   Doménový model
-   Registrace hráče na zápas
-   Použité technologie
-   Projektová struktura
-   REST API
-   Bezpečnost
-   Uživatelské role
-   Notifikační systém
-   Audit změn
-   Spuštění aplikace
-   Screenshoty aplikace
-   Dokumentace
-   Možná budoucí rozšíření
-   Autor
-   Licence

------------------------------------------------------------------------

# Popis projektu

Aplikace **HobbyHokej** slouží ke správě amatérských hokejových zápasů a
organizaci hráčských registrací.

Systém umožňuje:

-   evidenci hráčů, uživatelů a sezón
-   správu zápasů
-   přihlašování a odhlašování hráčů
-   výběr týmu a pozice na ledě
-   sledování kapacity zápasu
-   evidenci omluvenek a náhradníků
-   správu notifikací
-   vyhodnocení výsledků zápasů
-   výpočet hráčských statistik v rámci sezóny
-   oddělené rozhraní pro administrátora a běžného hráče

Projekt byl vytvořen jako ukázka návrhu **vícevrstvé webové aplikace** s
důrazem na:

-   čistou architekturu
-   práci s DTO
-   oddělení frontend a backend vrstvy
-   zabezpečení přístupu podle rolí
-   přehledné a responzivní uživatelské rozhraní

------------------------------------------------------------------------

# Hlavní funkce systému

Systém zajišťuje:

-   řízení kapacity a obsazenosti pozic
-   evidenci registrací (hráč, tým, pozice)
-   přehled náhradníků a omluvených
-   vyhodnocení výsledků zápasů
-   výpočet hráčských statistik v rámci sezóny
-   auditní historii změn
-   notifikační mechanismus (email, SMS, in‑app)

------------------------------------------------------------------------

# Architektura systému

Aplikace je rozdělena do dvou hlavních částí.

## Architektonický diagram

``` mermaid
flowchart LR
    A[React Frontend] -->|REST API| B[Spring Boot Backend]
    B --> C[(MariaDB Database)]
    B --> D[Notification System]
    B --> E[Scheduler]
```

Backend je implementován jako **modulární monolit s vícevrstvovou
architekturou**.

Základní vrstvy backendu:

-   Controller -- REST endpointy
-   Service -- business logika
-   Repository -- přístup k databázi
-   DTO + Mapper -- API kontrakty
-   Security -- autentizace a autorizace
-   Notification subsystem -- notifikace
-   Scheduler -- plánované úlohy
-   Database layer -- Flyway migrace a auditní triggery

------------------------------------------------------------------------

# Doménový model

Hlavní entity systému:

-   AppUser -- uživatelský účet
-   Player -- hráč propojený s uživatelem
-   Season -- hokejová sezóna
-   Match -- zápas
-   MatchRegistration -- registrace hráče na zápas
-   Notification -- aplikační notifikace

Každá důležitá entita má také **history tabulku pro audit změn**.

------------------------------------------------------------------------

# Registrace hráče na zápas

Typický tok registrace:

1.  hráč se přihlásí do aplikace
2.  frontend načte seznam zápasů
3.  hráč zvolí zápas
4.  hráč vybere tým a pozici
5.  frontend odešle požadavek na backend
6.  backend ověří kapacitu a dostupnost
7.  registrace je uložena do databáze

Backend také automaticky řeší:

-   přesuny mezi stavem REGISTERED / RESERVED
-   kontrolu neaktivity hráče
-   aktualizaci statistik

------------------------------------------------------------------------

# Použité technologie

## Backend

-   Java 17
-   Spring Boot 3
-   Spring Security
-   Spring Data JPA
-   Hibernate
-   MariaDB
-   Flyway
-   MapStruct
-   Maven

## Frontend

-   React
-   Vite
-   JavaScript
-   Bootstrap 5
-   CSS
-   Axios

## Další nástroje

-   Git
-   GitHub
-   Javadoc
-   JSDoc

------------------------------------------------------------------------

# Projektová struktura

    HobbyHokej-demo
    │
    ├── backend
    │   ├── src/main/java/cz/phsoft/hokej
    │   ├── src/main/resources
    │   ├── docs
    │   │   └── Javadoc
    │   └── pom.xml
    │
    ├── frontend
    │   ├── src
    │   ├── docs
    │   ├── package.json
    │   └── vite.config.js
    │
    ├── README.md
    └── .gitignore

------------------------------------------------------------------------

# REST API

Backend poskytuje **JSON REST API používané frontendem**.

Hlavní endpointy:

-   `/api/auth`
-   `/api/users`
-   `/api/players`
-   `/api/matches`
-   `/api/registrations`
-   `/api/seasons`
-   `/api/notifications`

------------------------------------------------------------------------

# Bezpečnost

Bezpečnost systému je implementována pomocí **Spring Security**.

Principy:

-   JSON login
-   session-based autentizace
-   role-based autorizace
-   ochrana endpointů pomocí `@PreAuthorize`

------------------------------------------------------------------------

# Uživatelské role

### ADMIN

-   plná správa systému

### MANAGER

-   správa zápasů a hráčů

### PLAYER

-   vytvoření a správa hráče, registrace na zápasy

------------------------------------------------------------------------

# Notifikační systém

Podporované kanály:

-   In-App notifikace
-   Email
-   SMS

Notifikace se odesílají například při:

-   vytvoření zápasu
-   změně času zápasu
-   registraci hráče
-   změně registrace
-   připomínkách zápasu

------------------------------------------------------------------------

# Audit změn

Systém implementuje audit pomocí **databázových triggerů**.

Pro každou klíčovou entitu existuje:

-   history tabulka
-   trigger pro INSERT
-   trigger pro UPDATE
-   trigger pro DELETE

Audit je verzován pomocí **Flyway migrací**.

------------------------------------------------------------------------

# Spuštění aplikace

## Backend

mvn spring-boot:run

Backend běží typicky na:

http://localhost:8080

## Frontend

npm install\
npm run dev

Frontend běží typicky na:

http://localhost:5173

------------------------------------------------------------------------

# Link na demo aplikaci

http://hokej.phsoft.cz

------------------------------------------------------------------------

# Dokumentace

-   README.md

Backend:
-   backend/README.md
-   backend/docs/ARCHITECTURE.md
-   backend/docs/API.md
-   backend/docs/Javadoc

Frontend:

-   frontend/README.md
-   frontend/docs/ARCHITECTURE.md
-   frontend/docs/COMPONENTS.md
-   frontend/docs/HOOKS.md
-   frontend/docs/MATCH_DOMAIN_MODEL.md
-   frontend/docs/API.md
-   frontend/docs/ADMIN_SYSTEM.md
-   frontend/docs/NOTIFICATION_SYSTEM.md
-   frontend/docs/PLAYER_REGISTRATION_FLOW.md
-   frontend/docs/STATE_FLOW.md

------------------------------------------------------------------------

# Možná budoucí rozšíření

-   mobilní aplikace
-   WebSocket notifikace
-   export statistik
-   rozšíření týmu a soutěží (případně i sportu)
-   integrace plateb za zápasy
-   plánování sezón
-   integrace externích sportovních API

------------------------------------------------------------------------

# Autor

**Petr Hlista**

Projekt vytvořen jako demonstrační full‑stack aplikace pro správu hobby
hokejových zápasů. 

------------------------------------------------------------------------

# Licence

MIT
