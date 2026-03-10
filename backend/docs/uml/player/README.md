# UML diagramy modulu `player.services`

UML diagramy service tříd z balíčku `cz.phsoft.hokej.player.services`.

## Strukturální diagramy
- `00-player-services-overview.puml`  
  Hlavní přehled architektury modulu hráčů. Ukazuje aplikační fasádu, CQRS rozdělení, podpůrné služby a externí závislosti.
- `01-player-services-class-diagram.puml`  
  Kompletní třídní diagram rozhraní a implementací v balíčku `player.services`, včetně hlavních metod a klíčových závislostí.
- `02-player-command-module.puml`  
  Detail změnové části modulu hráčů.
- `03-player-query-module.puml`  
  Detail čtecí části modulu hráčů.
- `04-current-player-module.puml`  
  Správa aktuálně zvoleného hráče v session.
- `05-player-settings-module.puml`  
  Správa nastavení hráče.
- `06-player-inactivity-module.puml`  
  Evidence období neaktivity hráče.
- `07-player-stats-module.puml`  
  Výpočet statistik hráče v aktuální sezóně.

## Sekvenční diagramy
- `08-sequence-create-player-for-user.puml`  
  Vytvoření hráče pro existujícího uživatele.
- `09-sequence-auto-select-current-player.puml`  
  Automatický výběr aktuálního hráče podle nastavení uživatele.
- `10-sequence-get-player-stats.puml`  
  Výpočet statistik hráče.

