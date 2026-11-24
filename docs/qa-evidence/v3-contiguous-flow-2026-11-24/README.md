# V3 — spójna ścieżka kibica

Data: 2026-11-24  
Deployment: <https://salesbeyond.vercel.app/>  
Przeglądarka: Chromium 1440×900, SwiftShader WebGL2, świeży kontekst.

## Wynik

Jeden przebieg produkcyjny wykonał bez rozdzielania sesji:

1. `Plan 2D` → `II-2` → rząd `1` → miejsce `16` (`85 zł`).
2. `Stadion 3D` zachował `II-2-1-16`; WebGL2 działał.
3. Wyszukanie pary nie zmieniło pustego koszyka; jawne dodanie dało miejsca `20, 21`.
4. Quote potwierdził `2 × 85 zł = 170 zł`.
5. Hold rozpoczął się od `10:00`.
6. Reload odzyskał własny hold z tymi samymi ID i ceną.
7. Release zakończył hold i zwolnił miejsca.

`verification.json` zawiera dokładny tekst każdego stanu i `errors: []`. Pięć screenshotów pokazuje kluczowe etapy. `probe-production.mjs` powtarza scenariusz, ale tworzy realną dziesięciominutową blokadę demo i zawsze zwalnia ją w ścieżce sukcesu.

Konflikt świeżej drugiej sesji oraz naturalne wygaśnięcie są udokumentowane osobno w `../a2-two-session-conflict-2026-11-24/`.
