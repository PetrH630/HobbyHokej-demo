
# HobbyHokej Frontend

Frontendová část aplikace **HobbyHokej**, která poskytuje uživatelské rozhraní pro správu hobby hokejových zápasů, registraci hráčů, správu sezón, notifikace a administraci systému.

Frontend je implementován jako **Single Page Application (SPA)** pomocí Reactu a komunikuje s backendem prostřednictvím REST API.

---

# Přehled aplikace

Frontend aplikace umožňuje:

- registraci a přihlášení uživatelů
- správu hráčských profilů
- registraci hráčů na zápasy
- výběr týmů a pozic
- přehled nadcházejících zápasů
- zobrazení statistik hráče
- administraci zápasů
- správu sezón
- správu uživatelů a hráčů
- notifikační systém

Aplikace je navržena jako **modulární React aplikace**, kde jsou jednotlivé části systému odděleny pomocí komponent, hooks a API vrstvy.

---

# Technologie

## Core

- React
- Vite
- JavaScript (ES6+)

## UI

- Bootstrap 5
- vlastní CSS moduly

## Komunikace s backendem

- Axios
- REST API

---

# Architektura frontend aplikace

Frontend je rozdělen do několika logických vrstev.

React Components  
↓  
Custom Hooks (business logika)  
↓  
API layer (Axios)  
↓  
Spring Boot REST API  

### Hlavní principy

- oddělení UI a business logiky
- využití custom hooks pro práci s API
- znovupoužitelné komponenty
- centralizovaná API vrstva
- modulární struktura projektu

---

# Struktura projektu

frontend
│
├── src
│   ├── api
│   ├── components
│   ├── constants
│   ├── hooks
│   ├── pages
│   ├── context
│   ├── utils
│   └── assets
│
├── public
├── package.json
└── vite.config.js

---

# Hlavní funkční moduly

## Autentizace

Uživatelé se mohou:

- registrovat
- přihlásit
- obnovit heslo

Po přihlášení frontend pracuje s session vytvořenou backendem.

---

## Správa hráčů

Uživatel může:

- vytvořit hráčský profil
- upravit profil
- zobrazit historii hráče
- zobrazit statistiky

---

## Zápasy

Frontend umožňuje:

- zobrazit seznam zápasů
- zobrazit detail zápasu
- registraci na zápas
- změnu týmu
- změnu pozice

Administrátor může:

- vytvářet zápasy
- upravovat zápasy
- rušit zápasy
- zadávat výsledky

---

## Registrace hráče

Hráč se může registrovat na konkrétní zápas.

Registrace obsahuje:

- zápas
- tým
- pozici
- stav registrace

Systém podporuje:

- náhradníky
- omluvené hráče
- kontrolu kapacity

---

## Statistiky hráče

Frontend zobrazuje:

- počet odehraných zápasů
- výhry
- prohry
- remízy
- úspěšnost hráče

---

## Notifikace

Frontend podporuje:

- badge s počtem notifikací
- seznam notifikací
- označení notifikací jako přečtené

---

# Spuštění aplikace

Instalace závislostí

npm install

Spuštění vývojového serveru

npm run dev

Frontend bude dostupný na:

http://localhost:5173

---

# Build aplikace

Produkční build:

npm run build

Výsledné soubory se vytvoří ve složce:

dist/

---

# Licence

Projekt je licencován pod licencí MIT.
