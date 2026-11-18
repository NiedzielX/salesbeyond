---
started: 2026-11-18
ended: 2026-11-18
agent: Codex
spec: .ai/specs/2026-11-18-local-stadium-renderer.md
outcome: partial
---

## Zadanie
Zatwierdzona próba lokalnego renderera, własny wygląd i produkt dla klubów piłkarskich, Enea Stadion jako pierwszy scenariusz.

## Przebieg
Osobny worktree salesbeyond-local-venue i gałąź feat/local-stadium-renderer z d9d36fb. Przeczytano indeks lekcji i specyfikację. Zgoda właściciela zapisana w specyfikacji.

Ponownie przeczytano oryginalny brief i tekst PDF blueprintu z załączników. Zachowano jego opowieść: panorama→sektor→rząd→miejsce→ciągły lot→widok→karta. Użytkownik potwierdził, że blueprint pozostaje kierunkiem, a bazę techniczną należy poprawiać, kiedy mamy konkretny lepszy pomysł. Enea pierwszy scenariusz produktu dla klubów, bez sugerowania oficjalnej współpracy.

Dodano lokalny chart z648 miejscami, mapowanie do domeny, własną generowaną w pamięci bryłę GLB (cztery trybuny, dach, teren), CPU-prepared scene, lazy wrapper DOM i nawigację. Poprawiono kadr całego stadionu: domyślny model kadrował tylko wybieralne północne rzędy. Karta ma ścieżkę miniatury z własnej kamery dopiero po potwierdzonym dotarciu. Bez zewnętrznych modeli, obrazów AI i backendu. Fonty Google zastąpiono systemowymi.

Niezależne review świeżej sesji gpt-6-luna wykryło resolve Promise także po anulowaniu lotu. Test reprodukcji26/27; po zmianie na onReady(arrived)27/27. UI zachowuje wybrany fotel, pokazuje przerwanie i retry, nie deklaruje widoku z miejsca. Reset/unmount ignorują stare wyniki. Ponowne review bez nowych potwierdzonych usterek. Sektor kadruje sektor, a dopiero zmiana rzędu przybliża rząd.

Przypięto core0.109.1. Sprawdzono daty nowych pakietów w registry: core2026-10-26, earcut3.2.4 z2026-09-28, konva10.9.1 z2026-10-31, ogl1.0.11 z2025-01-27, polygon-clipping0.15.7 z2023-12-18, robust-predicates3.0.3 z2026-03-22. Automatycznie rozwiązane splaytree3.2.4 z2026-11-16 było zbyt świeże: override do3.2.3 z2025-12-27, zgodne z ^3.1.0 zależności polygon-clipping. npm ls potwierdza override. Nie instalowano wrapperów JS/React.

## Weryfikacja
- Stan wyjściowy: pierwsze npm ci upadło z ENOENT zapisu cache do niedostępnego /home/agent/.npm. Ponowione z --cache /workspace/.npm-cache: npm ci, lint, typecheck,20/20 testów, build exit0. To problem miejsca cache, nie błąd repo ani powód do wyłączania kontroli integralności.
- Po implementacji i po finalnym pinowaniu: npm ci --cache /workspace/.npm-cache, npm run lint, npm run typecheck, npm test, npm run build: exit0;27/27 testów. npm ls splaytree:3.2.3 overridden. git diff --check: exit0.
- Testy korzystają z rzeczywistego kompilatora nowego runtime, weryfikują metryczną skalę105×68m, pozycje i statusy648 foteli, GLB oraz callbacki/race/disposal. Nie udają uruchomienia GPU.
- Build: główny JS246.24kB/gzip78.40, nowy runtime lazy452.35kB/gzip158.55, poprzednia scena lazy951.45kB/gzip262.37. Przedtem jeden główny1197.15kB/gzip339.80. Nie jest to pomiar całkowitego czasu ładowania/FPS. Ostrzeżenie Vite dotyczy zachowanego starego chunku>500kB; instalator przypomina o EOL istniejącego ESLint9.39.1.
- Realna przeglądarka: lokalny Vite5174, wariant /?renderer=local. CPU preflight wykrywa brak kontekstu WebGL2; info w konsoli i poprawny fallback. Nie próbowano obchodzić polityki GPU/DevTools.
- Własna tymczasowa ramka QA:18 wyborów przy1440×900 i18 przy nominalnym390×844 (odczyt innerHeight843). W każdym: sektory101–103, rzędy1/6/12, pierwszy i ostatni dostępny fotel. Numery i ceny36/36 zgodne, powrót zachowuje rząd, disabled miejsce odrzucone, brak overflow. Home/strzałki suwaka, focus trap Shift+Tab, Escape i reload działają. Zrzuty obejrzane i zapisane w docs/qa-evidence/local-renderer, wyniki w results.json. Strona QA usunięta.
- Nie sprawdzono: wyglądu sceny na GPU, rzeczywistego raycast, prześwitu i czasu lotu, miniatury, live reduced-motion, mount/unmount/utraty kontekstu z aktywnym GPU ani pełnej sieci cold start. Wcześniejsze testy kamery R3F nie są dowodem działania kamery nowego runtime.

## Wynik
Przyrost zakodowany i zapisany do lokalnego review. Nowa scena pozostaje wariantem /?renderer=local, wcześniejszy renderer nadal domyślny do czasu odbioru GPU. Specyfikacja in-progress, outcome partial z powodu nieodebranych AC2–AC5. Nie wykonano push, publikacji ani scalenia. Kontynuacja odbioru opisana w docs/LOCAL_RENDERER_QA.md.

## Lekcje
Nowa: .ai/lessons/2026-11-18-flight-promise-arrival.md. Zaktualizowano istniejącą lekcję zakresu o pierwszeństwo blueprintu i produkt dla klubów/Enea jako pierwszy cel.
