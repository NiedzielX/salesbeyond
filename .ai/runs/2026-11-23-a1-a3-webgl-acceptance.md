---
started: 2026-11-23
ended: 2026-11-23
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie

Po jawnej zgodzie właściciela wznowić produkcyjny odbiór A1–A3 w Chromium z WebGL2 na desktopie 1440×900 i emulacji dotykowej 390×844. Oddzielić dowód od Cloud Chrome bez WebGL oraz uczciwie pozostawić nieodebrane kryteria.

## Przebieg

- Cloud Chrome ponownie sprawdzony: preflight poprawnie przechodzi do planu 2D; brak błędów aplikacji w konsoli, widoczne były tylko błędy rozszerzenia środowiska.
- Chromium headless uruchomiony ze SwiftShader WebGL2; testy desktop/mobile w toku.
- Niezależny agent Luna przygotował macierz brakujących dowodów i wskazał kryteria, których pojedynczy smoke test nie może zamknąć.
- Produkcyjny WebGL smoke potwierdził panoramę, rząd 1, POV, crowd, kanoniczny koszyk i touch, ale ujawnił zasłanianie murawy przez panel Beyond oraz oczekiwane `401/404` w konsoli.
- Reklama dostała test-first regresję raycast z rzeczywistego pierwszego rzędu dla obu końców stadionu. Ostateczny panel jest mały, pionowy i ponad poprzeczką; obejrzany POV zachowuje napis oraz wolną murawę.
- Discovery bieżącego holda zwraca pusty sukces bez sesji/holda, bez ustawienia cookie; favicon jest jawnie zadeklarowany. Niezależny review obu poprawek: PASS.
- Produkcyjny build po poprawkach sprawdzono lokalnie w Chromium WebGL2 na desktop i emulowanym mobile. Publiczny deploy nie został wykonany bez nowej autoryzacji właściciela.

## Weryfikacja

- Cloud Chrome 1180×757: fallback 2D działa; WebGL niedostępny; brak poziomego overflow.
- Chromium 390×844 preflight: WebGL2 `true`; `scrollWidth=clientWidth=390`.
- Produkcyjny smoke przed poprawką: II-2 / rząd 1 / miejsce 16, crowd i koszyk spójne; touch target 44 px; potwierdzone zasłonięcie i błędy konsoli `401 current` + `404 favicon`.
- Test regresji reklamy przed poprawką: fail, jedno przecięcie panelu; po poprawce: pass dla II-2 i IV-2.
- Targeted current-hold API/client: 32/32 pass.
- Pełne bramki: lint pass; typecheck pass; 179 testów aplikacji + 1 emitowanego API pass; build pass z istniejącym ostrzeżeniem o dużym lazy chunku Stadium.
- Lokalny production preview po poprawkach, 1440×900 i 390×844: WebGL2/canvas pass, brak overflow, seat/crowd/basket pass, 44 px touch, 0 page errors i 0 console errors w końcowych przebiegach.
- Obejrano panoramę, rząd 1 i POV przed/po korekcie reklamy. SwiftShader 1–2 RAF/500 ms — nie jest dowodem wydajności urządzenia.

## Wynik

Partial. A1–A3 nie są w całości zamknięte, ale blokada WebGL została zdjęta i wykonano realny smoke desktop/mobile. Dwie potwierdzone regresje mają test-first poprawki, pełne bramki, niezależny review i obejrzany production preview. Otwarte pozostają pełna macierz trybun/rzędów, dwie sesje, klawiatura/AT, fizyczny telefon, hardware-GPU baseline i publiczny smoke po autoryzowanym deployu. Dowód: `docs/qa-evidence/a1-a3-webgl-2026-11-23/verification.json`.

## Lekcje

- `.ai/lessons/2026-11-23-pitch-side-sightlines.md`
- `.ai/lessons/2026-11-23-empty-discovery-response.md`
