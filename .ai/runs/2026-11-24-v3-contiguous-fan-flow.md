---
started: 2026-11-24T15:16:00Z
ended: 2026-11-24T15:19:42Z
agent: codex-root
spec: .ai/specs/2026-11-21-seatlayer-feature-parity.md
outcome: success
---

# V3 — spójna ścieżka kibica w jednej sesji

## Zadanie

Domknąć brak między istniejącymi, rozdzielonymi dowodami: przejść na production w jednej świeżej sesji od planu 2D przez wybór sektora/rzędu/fotela i rzeczywisty widok WebGL2 tego samego ID, a następnie propozycję grupy, koszyk, quote, hold, reload/recovery i release.

Konflikt dwóch sesji i naturalne wygaśnięcie pozostają osobnymi, już przyjętymi gałęziami V3 z `docs/qa-evidence/a2-two-session-conflict-2026-11-24/`.

## Kryteria

- Start bez deep linku, jawne przełączenie na Plan 2D.
- Wybór `II-2`, rzędu `1` i miejsca `16` przez UI; ticket i live-region zgadzają się z wyborem.
- Przejście do Stadionu 3D zachowuje to samo ID i uruchamia WebGL2.
- Wyszukanie grupy dwóch miejsc nie zmienia koszyka; dopiero `Dodaj całą grupę` dodaje dokładnie dwa miejsca.
- Serwerowy quote i hold pokazują te same ID/ceny, reload odzyskuje własny hold, a release kończy go terminalnym komunikatem.
- Brak nieoczekiwanych błędów aplikacji; oczekiwane odpowiedzi usługi są zapisane jawnie.

## Weryfikacja

- Produkcyjny Chromium 1440×900 z SwiftShader/WebGL2, świeży kontekst bez deep linku.
- `Plan 2D` → panel `II-2` → suwak rzędu `1` → miejsce `16`: live-region i ticket zgłosiły `II-2 / 01 / 16`, `85 zł`, dane demo.
- `Stadion 3D`: WebGL2 `true`, URL i ticket nadal `II-2-1-16`, wygenerowana miniatura tej samej perspektywy.
- Wyszukiwanie dwóch miejsc: koszyk `0 → 0`; dopiero `Dodaj całą grupę` dało `0 → 2`, miejsca `20, 21` w `II-2 / rząd 1`.
- Quote z serwera: dwa razy `85 zł`, razem `170 zł`; następnie aktywny hold `10:00`.
- Reload: `Przywrócono Twoją blokadę`, te same dwa ID i `170 zł`.
- Release: `Blokada zakończona` oraz `Blokada została zwolniona. Miejsca można wybrać ponownie.`
- `errors: []`. Powtarzalny skrypt, raport i pięć pełnych screenshotów: `docs/qa-evidence/v3-contiguous-flow-2026-11-24/`.

## Wynik

V3 przyjęte. Główna ścieżka działa w jednej sesji na rzeczywistym 2D, WebGL2 i serwerowym holdzie. Oddzielne dowody z `docs/qa-evidence/a2-two-session-conflict-2026-11-24/` domykają konflikt drugiej sesji i naturalne wygaśnięcie.
