
# Architektura aplikace

Aplikace je rozdělena na dvě hlavní části.

## Frontend

React aplikace poskytuje uživatelské rozhraní pro:

- registraci hráčů
- správu zápasů
- administraci systému
- zobrazení statistik

Struktura:

src/
- components – UI komponenty
- hooks – business logika frontendu
- api – komunikace s backendem
- constants – sdílené konstanty
- context – globální stav aplikace

Frontend komunikuje s backendem pomocí REST API.
