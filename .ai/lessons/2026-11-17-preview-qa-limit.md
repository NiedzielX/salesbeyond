---
date: 2026-11-17
area: qa
status: active
source: sites-preview start/status, sesje rozpoznania i implementacji
---

## Kontekst
Przeglądarka cloud uruchamia się, ale sites-preview nie uzyskuje relay portu 4173. Build i testy domeny przechodzą.

## Przyczyna
Potwierdzony objaw infrastruktury: relay readiness timeout, status stopped. Przyczyna wewnętrzna relay nie została ustalona; nie przypisujemy awarii aplikacji.

## Reguła
Nie uznawaj udanego buildu ani strony logowania Sites za browser QA. Gdy managed preview nie dostarcza adresu, zapisz niesprawdzone AC i pozostaw specyfikację in-progress. Nie zastępuj zarządzanego preview serwerem uruchomionym obok ani nie zmieniaj uprawnień sieciowych.

## Jak sprawdzić
Uruchom oficjalny sites-preview po potwierdzonej naprawie infrastruktury, otwórz zwrócony URL i wykonaj docs/QA.md. Sam brak błędów testów nie zamyka kryteriów wizualnych.
