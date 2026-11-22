---
started: 2026-11-21
ended: 2026-11-22
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie

Kontynuować zatwierdzone pakiety A1–A3 pełnego doświadczenia kibica po wdrożeniu kamery dolnych rzędów. Znaleźć źródłowo potwierdzone luki, naprawić je z regresją i nie rozszerzać zakresu o B/C.

## Przebieg

- Punkt wyjścia: czysty `92fda63` na `feat/local-stadium-renderer`; produkcja poprzedniego przyrostu READY.
- Delegowano trzy rozłączne audyty read-only: A2 fan flow i A3 mobile/accessibility na Lunie oraz A1 performance/Three na Sol. Agenci nie zapisują, nie pushują, nie otwierają PR i nie używają zablokowanego kanału przeglądarkowego.
- Root sprawdza rzeczywisty kod, dowody i każdą propozycję przed zmianą.
- Właściciel dostarczył drugi screenshot: II-2, suwak już na rzędzie 1, kamera nadal w kadrze całego sektora. Trzy audyty potwierdziły przyczynę: wejście do sektora zachowuje `rowFocused=false`, a kontrolowany range na minimalnej wartości nie emituje `change` po wybraniu tego samego końca.
- Dodano jawną akcję „Pokaż rząd 01 w 3D”. Wspólny handler aktywuje ten sam rząd i zwiększa reset przy jawnym przywróceniu kadru, więc działa także po ręcznej zmianie kamery.
- Po kolejnym doprecyzowaniu właściciela sektorowy limit orbity zmieniono z `.47π` na `.49π`. Target nadal pozostaje w obwiedni foteli, a minimalna wysokość oka we wszystkich 19 sektorach wynosi około 2.585 m zamiast 4.591 m. Overview i POV zachowują poprzednie limity.
- Audyt A2 nie znalazł dalszego source-proven defektu w koszyku/hold/recovery/release/inventory/privacy. Audyt A3 nie znalazł statycznie dowodliwego overflow; realny browser/mobile gate pozostaje otwarty. Audyt performance wskazał przyszłe mierzalne optymalizacje, ale zgodnie z planem nie wdrażano ich bez baseline urządzenia.

## Weryfikacja

- Test kontrolera R3F/Drei/Three w StrictMode: wejście `row=1,rowFocused=false` → aktywacja tego samego numeru → `rowFocused=true`; po ręcznym zejściu eyeY 2.585, row 1 NDC y≈−.185; po akcji rzędu y=0; 114 kadrów rzędów i 3396 kroków. Panorama nadal `.47π`.
- Focused testy domenowe: 14/14 pass. Niezależny review Sol: brak must-fix; 26/26 dodatkowych testów kamery/clearance/roof/preview/session/crowd pass.
- Końcowe `npm run lint`, `npm run typecheck`, `npm test` (163 źródła + 1 emitted-server) i `npm run build`: exit 0. Build nadal raportuje ostrzeżenie o dużym chunku Stadium.
- Commit `2f904ec`; Vercel production `dpl_3eJc86HiySgQJoX8ZpQmi73badLE` READY, alias `salesbeyond.vercel.app`, aliasError null. HTML/main JS/CSS/Stadium chunk HTTP 200 z prawidłowymi MIME i markerami nowego przycisku/instrukcji/kąta. API status service 200, II-3 1998 miejsc; runtime error/fatal 15m: 0. Dowód: `docs/qa-evidence/lower-rows-2026-11-21/deployment-proof-2026-11-22.json`.
- Existing crowd controller regression: 57 perspektyw i 62 miniatury pass. Brak browser/WebGL/touch/keyboard acceptance.

## Wynik

Poprawka zintegrowana, przetestowana i wdrożona. Outcome pozostaje partial wyłącznie w zakresie realnego browser/WebGL/touch/keyboard acceptance; kanał nie jest obchodzony. Snapshot Vercel pochodzi z lokalnego commitu, bez push/merge GitHub.

## Lekcje

Stosowane istniejące lekcje o ciągłej realizacji, izolacji agentów i granicy browser QA.
