---
started: 2026-11-22
ended: null
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie

Zmniejszyć koszt wskazywania foteli w zatwierdzonym zakresie A1 bez zmiany zachowania wyboru: pozostawić jeden właściciel zdarzeń foteli i nie rejestrować raycastów, gdy scena foteli nie jest interaktywna.

## Przebieg

- Punkt wyjścia: czysty `5d12299` na `feat/local-stadium-renderer`, produkcja poprawki kamery READY.
- Audyt źródła potwierdził dwie warstwy handlerów R3F wokół każdej grupy foteli. Wewnętrzny handler zatrzymuje propagację, więc zewnętrzne podświetlenie sektora nie uczestniczy w trafieniu fotela, ale nadal powiększa ścieżkę obsługi.
- Niezależny audyt A1 przygotowuje reprodukcję na faktycznym rendererze R3F; root zweryfikuje ją przed zmianą.
- Zewnętrzne handlery wrappera sektora usunięto; etykiety DOM zachowały własny hover/click. Handlery grupy foteli są przekazywane wyłącznie, gdy widok jest interaktywny; istniejące czyszczenie hovera i kursora pozostało.
- Niezależny review nie znalazł must-fix ani regresji semantyki. Rzeczywisty WebGL pozostaje osobnym, otwartym kryterium.

## Weryfikacja

- `node docs/qa-evidence/seat-pointer-2026-11-22/probe-r3f.mjs`: nested 28, one 14, inactive 0, reactivated 14 raycastów; identyczny aktywny trace i `instanceId`.
- `npm run lint`, `npm run typecheck`, `npm test` (163+1) i `npm run build`: exit 0. Znane ostrzeżenie o dużym chunku Stadium pozostaje.
- Niezależny review: 9/9 dodatkowych testów, brak must-fix. Nie wykonano browser/WebGL acceptance.

## Wynik

Kod, regresja i review gotowe; oczekuje na wdrożenie oraz proof produkcji.

## Lekcje

Brak nowych na tym etapie.
