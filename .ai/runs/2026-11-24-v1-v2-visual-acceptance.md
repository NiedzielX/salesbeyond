---
started: 2026-11-24T15:06:00Z
ended: 2026-11-24T15:14:13Z
agent: codex-root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: success
---

# V1/V2 — wizualny odbiór Enei i kadrów

## Zadanie

Domknąć najmniejszą reprezentatywną macierz produkcyjnych kadrów V1/V2: panorama i dach, narożnik/sektor, dolny rząd, górny rząd oraz perspektywa fotela; porównać z istniejącymi referencjami kodowego modelu i wymaganiami blueprintu bez deklarowania oficjalnego cyfrowego bliźniaka.

## Przebieg

- Obejrzano istniejące referencje overview/roof/sector/seat z `docs/qa-evidence/enea-fidelity-2026-11-20/`.
- Tańszy agent przygotował read-only minimalną macierz widoków i kryteria pass/fail; root odpowiadał za produkcyjne screenshoty, ocenę i zapis różnic.
- Produkcyjny Chromium ze SwiftShader/WebGL2 wykonał osiem kadrów: panorama, cztery trybuny, narożnik, desktopowy rząd 1 oraz panorama i rząd 1 na 390×844.
- Root obejrzał każdy kadr. Niezależny agent zwrócił uwagę, że wycinek samej sceny nie dowodzi numeru miejsca, dlatego wykonano dodatkowe pełne kadry `.experience` i odczyt stanu live-region/ticketu dla `II-2 / 01 / 16` na desktopie i telefonie oraz `C1 / 37 / 47` na desktopie.

## Weryfikacja

- `node docs/qa-evidence/v1-v2-visual-2026-11-24/probe-visual-matrix.mjs` — 8/8 kadrów WebGL2, zero błędów aplikacji, `scrollWidth` równy viewportowi 1440 lub 390.
- `node docs/qa-evidence/v1-v2-visual-2026-11-24/probe-ui-evidence.mjs` — dokładne ID panelu i ogłoszenia ARIA zgodne z URL-em dla trzech przypadków; zero błędów aplikacji; pełny mobilny ticket pokazuje sektor `II-2`, rząd `01`, miejsce `16` i oznaczenie `DEMO`.
- Ręczny przegląd obrazów: panorama ma zamkniętą bryłę, cztery trybuny, narożniki, pełną membranę i boisko; wszystkie perspektywy zachowują murawę; dolny rząd nie wpada pod murawę; przekrój dachu jest lokalny; Beyond nie przecina linii widzenia; mobilne 390 px nie ma overflow.
- Dowody: `docs/qa-evidence/v1-v2-visual-2026-11-24/verification.json`, `ui-verification.json` oraz 11 screenshotów w tym samym katalogu.

## Wynik

V1 i V2 przyjęte dla zakresu proceduralnego MVP Enea-like. To odbiór rozpoznawalnej, spójnej rekonstrukcji i kadrów, nie deklaracja oficjalnego ani fotogrametrycznego cyfrowego bliźniaka.

Jawne różnice do dalszego polishu, nie blokery MVP:

- biała membrana ma niski kontrast z bardzo jasnym tłem panoramy;
- etykiety sektorów są gęste w mobilnej panoramie;
- pionowa tablica Beyond mocno zaznacza się w bliskim widoku rzędu 1, choć nie zasłania boiska.

## Lekcje

Sam screenshot sceny nie wystarcza do dowodu mapowania fotela. Macierz wizualna musi łączyć kontrolowany URL, odczyt dostępnego stanu panelu i pełny kadr UI. Dzięki temu można osobno ocenić geometrię oraz zgodność ID bez dopowiadania brakujących danych z obrazu.
