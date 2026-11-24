---
started: 2026-11-24
ended: 2026-11-24
agent: /root/a2_two_session_browser
spec: .ai/specs/2026-11-21-seatlayer-feature-parity.md (approved A2 criteria)
outcome: partial
---

# Zadanie

Uzupełnić brakujący browser acceptance dla konfliktu tego samego fotela między sesjami i potwierdzić odzyskanie oraz sprzątnięcie stanu na produkcji.

## Przebieg

- Przeczytano `AGENTS.md`, `.ai/lessons.md`, kryteria A2 w specyfikacji parytetu i poprzedni zapis produkcyjnego browser acceptance.
- Otworzono produkcję w dwóch kartach Cloud Chrome. Sesja A miała zachowany wybór `II-2 / rząd 1 / miejsce 16` i quote serwera.
- Po kliknięciu potwierdzenia aplikacja pokazała wcześniej istniejącą aktywną blokadę w sesji A, więc nie przypisano jej utworzenia temu przebiegowi.
- Niezależny cookie jar sesji B wysłał prośbę o ten sam fotel: HTTP 409, `held`, `seatIds: [II-2-1-16]`.
- Odświeżenie sesji A przywróciło blokadę. Zwolniono ją przez UI.
- Sprawdzono z sesji B, że `current` wynosi `null`, a inventory fotela wrócił do `available`.
- Zamknięto obie karty i usunięto tymczasowy cookie jar.
- Root następnie uruchomił powtarzalny probe Playwright w dwóch świeżych, izolowanych kontekstach. Obie sesje uzyskały quote przed holdem; A utworzyła hold, B zobaczyła komunikat konfliktu po HTTP 409, A po reloadzie zobaczyła recovery, a `finally` zwolnił hold A.
- Natychmiastowa kolejna repetycja trafiła w limiter podczas drugiego quote. Nie ponawiano agresywnie; to ograniczenie demo, nie regresja konfliktu.

## Weryfikacja

- Browser UI production: quote, aktywna blokada, recovery po reloadzie oraz release — pass.
- Niezależna sesja HTTP production: ten sam fotel zwrócił 409 `held` — pass.
- Po release: `current=null`, fotel `available` — pass.
- Dwa świeże konteksty UI: oba quote przed holdem; A create + reload recovery; B czytelny konflikt 409 bez aktywnego holda; cleanup A — pass.
- Oczekiwany HTTP 409 pojawia się jako wpis konsoli przeglądarki; brak `pageerror`.
- Nie sprawdzono w tym przebiegu expiry ani pełnego re-holdu sesji B po zwolnieniu A; dostępność po release potwierdzono osobnym odczytem inventory/current.

## Wynik

Partial dla całego A2, ale konflikt dwóch świeżych sesji UI jest odebrany: quote obu stron, create A, konflikt B, reload recovery A i cleanup. Do osobnego odbioru pozostaje expiry. Dowód: `docs/qa-evidence/a2-two-session-conflict-2026-11-24/verification.json`.
