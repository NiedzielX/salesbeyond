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

## Aktualizacja 2026-11-17
Właściciel wyraźnie zezwolił na zwykły lokalny Vite do QA, zamiast managed preview, i polecił wykonywać rekomendowane poprawki w zatwierdzonym zakresie bez kolejnych pytań o drobne decyzje. Ta zgoda pozostaje ważna; nie pytaj ponownie o Vite. Nie oznacza zgody na publikację, zmianę zabezpieczeń ani obejście blokady narzędzia.

## Reguła
Nie uznawaj udanego buildu ani strony logowania Sites za browser QA. Gdy managed preview nie dostarcza adresu, zapisz niesprawdzone AC i pozostaw specyfikację in-progress. Korzystaj z lokalnego Vite w zakresie jawnego wyjątku właściciela; nie zmieniaj uprawnień sieciowych ani zabezpieczeń.

## Jak sprawdzić
Uruchom oficjalny sites-preview po potwierdzonej naprawie infrastruktury, otwórz zwrócony URL i wykonaj docs/QA.md. Sam brak błędów testów nie zamyka kryteriów wizualnych.
