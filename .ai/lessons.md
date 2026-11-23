# Lekcje projektu

- [2026-11-23] [Pusty wynik discovery nie jest błędem transportu](lessons/2026-11-23-empty-discovery-response.md) — opcjonalny własny zasób zwracaj jako jawny pusty sukces bez cookie; błędy operacji i backendu pozostają błędami.

- [2026-11-23] [Sprawdzaj reklamy promieniem z pierwszego rzędu](lessons/2026-11-23-pitch-side-sightlines.md) — pionowy obiekt poza murawą nadal może zasłonić boisko; testuj odcinki widzenia i oglądaj POV WebGL.

- [2026-11-23] [Sprawdź WebGL2 przed montowaniem renderera](lessons/2026-11-23-webgl-preflight.md) — error boundary nie wycisza błędów konstrukcji Canvas; negatywny probe kieruj do fallbacku przed mountem.

- [2026-11-23] [Pochodzenie snapshotu nie jest stanem transferu](lessons/2026-11-23-inventory-provenance.md) — zachowany snapshot nadal pochodzi z usługi podczas refresh/error; stan transferu komunikuj osobno.

- [2026-11-23] [Stan końcowy poza wyciszonym zegarem](lessons/2026-11-23-terminal-state-announcements.md) — nie ogłaszaj każdej sekundy; wynik wygaśnięcia lub zwolnienia przekaż raz przez stabilny status region.

- [2026-11-22] [Rzadkie kopie macierzy i batchowanie instancji](lessons/2026-11-22-sparse-instance-state.md) — nie dubluj pełnego bufora transformacji; backup tylko maskowanych instancji, statyczne otoczenie grupuj.

- [2026-11-21] [Beyond na pionowych szarych powierzchniach](lessons/2026-11-21-beyond-placement.md) — korekta właściciela: prostokąt przy bramce i boki murawy, bez malowania podłoża.

- [2026-11-21] [Maska widowni i miniatura po dotarciu](lessons/2026-11-21-crowd-mask-and-preview.md) — zachowuj oczekujące transfery GPU i odczytuj obraz po commit docelowej maski.

- [2026-11-20] [Propozycje grup i odświeżanie live](lessons/2026-11-20-proposals-and-live-refresh.md) — nie usuwaj grupy przy pollingu i nie przywracaj danych demo zamiast znanej obserwacji.

- [2026-11-20] [Weryfikacja worktree agentów przed zapisem](lessons/2026-11-20-agent-worktree-verification.md) — twórz konkretną izolowaną ścieżkę, porównuj faktyczny git status przed aplikacją patcha.

- [2026-11-20] [Start panoramy, rzeczywisty rząd i przekrój dachu](lessons/2026-11-20-stadium-launch-and-cutaway.md) — odtwarzaj koszyk bez niespodziewanego zbliżenia i zachowaj bryłę dachu.

- [2026-11-20] [Importy wyemitowanego serwera](lessons/2026-11-20-emitted-server-imports.md) — testuj rzeczywisty JS i endpoint po READY; log startu może mieć poziom info.

- [2026-11-19] [Instancje foteli: geometria, kolor i indeks trafień](lessons/2026-11-19-instanced-seat-picking.md) — stabilne macierze, delty kolorów, dokładny raycast tylko kandydatów; osobno koszt budowy i CPU/GPU.

- [2026-11-19] [Odtwarzanie przed zapisem i bieżący deep link](lessons/2026-11-19-fan-session-bootstrap.md) — nie nadpisuj wyboru po błędzie odczytu; synchronizuj URL z dalszą nawigacją.

- [2026-11-19] [Koszyk i podgląd w natywnym zaznaczeniu](lessons/2026-11-19-native-cart-preview-selection.md) — odtwarzaj sumę ID, zachowaj osobne limity i blokuj echa poleceń.

- [2026-11-18] [Ciągłe wykonanie zatwierdzonego MVP](lessons/2026-11-18-continuous-execution.md) — po przyroście wybierz następne gotowe zadanie; blokada GPU nie blokuje całego backlogu.

- [2026-11-18] [Materiały w przygotowanej geometrii](lessons/2026-11-18-prepared-geometry-colors.md) — weryfikuj faktyczne kolory/bufory; CPU i backface-culling nie zastępują odbioru WebGL.
- [2026-11-18] [Promise lotu a faktyczne dotarcie](lessons/2026-11-18-flight-promise-arrival.md) — resolve może oznaczać anulowanie; sprawdzaj stan kamery przed komunikatem i miniaturą.
- [2026-11-17] [Fallback Canvas nie jest testem WebGL](lessons/2026-11-17-canvas-fallback-effects.md) — fallback montuje się zawsze; nie zgłaszaj z niego awarii efektem.
- [2026-11-17] [Orientacja i prześwit przelotu](lessons/2026-11-17-flight-rotation-clearance.md) — odsłaniaj interakcje, kontroluj kolizje i interpoluj orientację kwaternionem.
- [2026-11-17] [Bezwładność orbity a przelot](lessons/2026-11-17-orbit-flight-inertia.md) — usuń pozostały damping przed animacją bez zmiany pozycji kamery.
- [2026-11-17] [Przywracanie raycast w R3F](lessons/2026-11-17-r3f-raycast-reset.md) — przy resetowaniu interakcji podawaj konkretną funkcję zamiast undefined.
- [2026-11-17] [Granica browser QA przy awarii relay](lessons/2026-11-17-preview-qa-limit.md) — brak podglądu oznacza niewykonane kryteria wizualne.
- [2026-11-17] [Zakres funkcjonalnego MVP i delegacja](lessons/2026-11-17-mvp-scope-delegation.md) — utrzymuj uproszczone 3D i pełną ścieżkę miejsca; ograniczone zadania deleguj tańszemu modelowi.
