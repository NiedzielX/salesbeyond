---
started: 2026-11-24T15:31:00Z
ended: 2026-11-24T15:38:00Z
agent: codex-root
spec: .ai/specs/2026-11-24-event-catalog-and-history.md
outcome: success
---

# B1 — katalog wydarzeń i historia przeglądarki

## Zadanie

Po decyzji właściciela, aby rozwijać kolejne funkcje zamiast polishu MVP, przygotować najmniejszy wartościowy pakiet buyer feature: wybór wydarzenia na tym samym stadionie, izolację koszyka/inventory/holda oraz bezpieczne deep linki i Back/Forward.

## Przebieg

- Zatrzymano audyt optymalizacji bundla; nie zmieniano konfiguracji ani kodu wydajnościowego.
- Sprawdzono draft parity B1, bieżący pojedynczy fixture `enea-demo`, klucze sesji, hooki inventory/hold oraz event-scoped backend i schemat PostgreSQL.
- Backend/RPC już przyjmują `eventId`; klient React nadal hardkoduje `enea-demo` w trzech miejscach.
- Przygotowano draft specyfikacji i poddano go niezależnemu review Luny. Cztery must-fix oraz pięć doprecyzowań włączono do wymagań i kryteriów. Implementacja nie startuje przed jawnym zatwierdzeniem właściciela.

## Weryfikacja

- Root sprawdził bieżący katalog eventu, URL/session, hooki hold/inventory, event-scoped API oraz schemat PostgreSQL.
- Niezależny review exact draft: must-fix dotyczące hold/history, statusów, storage pointer i legacy renderer rozwiązane w pliku.
- `git diff --check`: pass.

## Wynik

Draft B1 jest gotowy do decyzji właściciela. Nie zmieniono kodu aplikacji, bazy ani produkcji.
