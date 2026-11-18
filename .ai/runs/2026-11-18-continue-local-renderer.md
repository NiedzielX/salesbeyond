---
started: 2026-11-18
ended: 2026-11-18
agent: Codex
spec: .ai/specs/2026-11-18-local-stadium-renderer.md
outcome: partial
---

## Zadanie
Kontynuować zatwierdzoną integrację, domknąć możliwe do sprawdzenia ryzyka nawigacji, geometrii i cyklu życia. Zachować kierunek blueprintu i Enea jako pierwszy cel.

## Przebieg
Stan początkowy czysty, HEAD950d7f7. Przeczytano lekcje, aktualny adapter i dokumentację odbioru. Środowisko wznowione. Sprawdzono dostępność lokalnych narzędzi i możliwości środowiska.

Z rzeczywistego przygotowanego modelu wyeksportowano trójkąty/kolory i punkty oczu. Test2500 promieni dostępnych500 foteli do5 punktów boiska wykazał14 przecięć z autogenerowanym betonem sektorów przy liczeniu obu stron. Nowy test sightlines.test.ts upadł przed zmianą. **Kontrkontrola z backface-culling:0 także przed zmianą**, więc nie jest to dowód błędu wizualnego runtimeGPU. Warunek jest konserwatywną kontrolą naszego syntetycznego modelu.

Kontrola kolorów: registeredShellGlb dawał niebieskie wierzchołki tylko na północnych sektorach7866, pozostałe trzy trybuny0. Usunięcie override theme.venue3d.shell niczego nie zmieniało. Zamiast przechodzić przez przemapowującą materiały warstwę GLB, własne powierzchnie przekazano do publicznego przygotowanego MeshData z ich kolorami. GLB eksportowany z tych samych powierzchni pozostaje dostępny.

Nowy applyAuthoredArchitecture usuwa tylko autogenerowane material5 w sectionSolidRanges naszego chartu, utrzymuje natywne treads/risers, kompaktuje bufory i zakresy, dopisuje autorską bryłę i przelicza render/clip bounds. Nie dotyczy rzeczywistego zweryfikowanego stadionu ani danych importowanych. Po zmianie dwustronne promienie0/2500. Dane648 foteli/ceny/statusy bez zmian.

Wyodrębniono mostek zdarzeń: wyłącznie jawny onSeatPick zmienia fotel (wbudowane next/previous wyłączone), nie obserwacja celu kamery. Dispose zamyka handlery przed disposal renderera. Guard poleceń i deduplikacja przed commitem React sprawdzone czterema testami. Nie twierdzić, że zastępuje to prawdziwy StrictMode/GPU test całego komponentu.

Własny eksport geometrii i Blender4.3.2/CyclesCPU pozwoliły obejrzeć bryłę i ten sam widok narożnika przed/po. Pierwszy render upadł, bo systemowy Blender nie ma OpenImageDenoise; wyłączono denoising w tym pomocniczym renderze CPU, bez zmiany przeglądarki. Zapisano reprodukowalne skrypty i trzy obejrzane obrazy. To nie są zrzuty WebGL; pomijają instancjonowane fotele, runtime shading i ruch kamery.

Read-only review osobnej sesji gpt-6-luna: brak potwierdzonego błędu kompaktowania, buforów, współrzędnych i bridge. Integrator sam sprawdził kontrakty, wyniki i diff. Do GPU QA pozostawiono highlight autorskiej bryły poza sectionSolidRanges (natywne stopnie nadal w zakresach; brak filtra sektorów w MVP).

## Weryfikacja
- Lint, typecheck, npm test33/33, npm run build exit0. Nowe testy obejmują2500 promieni, kolory czterech trybun, długości/ranges buforów i cztery scenariusze mostka. git diff --check exit0.
- Stan początkowy odtworzono z czystego950d7f7 i jego raportu27/27; nie deklarowano ponownego pełnego baseline27 testów przed zmianą. Rzeczywista reprodukcja testu geometrii była czerwona przed poprawką.
- Build: główny246.24kB/gzip78.40; LocalVenue3.66kB/gzip1.82; localScene3.25kB/gzip1.58; runtime452.35kB/gzip158.55; stara scena951.45kB/gzip262.37. Znane ostrzeżenie>500kB dotyczy starego chunku, bez nowych zależności.
- Wykonano node --experimental-strip-types scripts/export-geometry-review.mjs i blender --background --factory-startup --threads4 --python scripts/render-geometry-review.py. W aktualnej opaque-siatce6320 trójkątów. Obejrzane obrazy w docs/qa-evidence/geometry-review, dokładne polecenia w README tego katalogu.
- HTTP lokalnego Vite5174:200. Próba CUA getTab po URL, potem jeden retry po ID3 potwierdzonym z cua.getState, kończyła się Emulation.setFocusEmulationEnabled timeout. Nie wykonano nowego browser QA ani nowego testu tworzenia WebGL. Nie zmieniano protokołu ani ustawień zabezpieczeń. CUA podsumowane jako niedostępne sterowanie kartą.
- Nie sprawdzono realnej sceny, kamer, miniatur, cold-start requestów i żywego montowania/odmontowania na GPU. Wcześniejsze36 prób panelu pozostają historią wcześniejszego przyrostu, nie nowymi testami.

## Wynik
Kod geometrii i mostka poprawiony, bramki33/33 zielone; dokumentacja i powtarzalna kontrolaCPU dostarczone. Specyfikacja pozostaje in-progress, nowa scena nadal opt-in /?renderer=local. Outcome partial: AC2–AC5 mają nadal bramki GPU/sieci. Bez push, publikacji i scalenia. Nie ogłaszać MVP odebranego na podstawie obrazówCPU.

## Lekcje
Nowa .ai/lessons/2026-11-18-prepared-geometry-colors.md: sprawdzanie faktycznych buforów i barw oraz rozdzielenie CPU/backface-culling od odbioru WebGL.
