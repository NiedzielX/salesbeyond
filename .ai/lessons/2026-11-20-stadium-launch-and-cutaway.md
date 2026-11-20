---
date: 2026-11-20
area: fan-experience
status: active
source: korekta właściciela i zrzut otwarcia / rzędu 6 / brakującego dachu
---

## Kontekst
Właściciel zauważył nieoczekiwane zbliżenie po otwarciu, brak charakterystycznego dachu i stale wskazywany rząd 6.

## Przyczyna
Bootstrap odtwarzał zapisany viewport, kamera animowała również pierwszy layout i resize. initialSelection miało row=6, a każda zmiana sektora zachowywała tę wartość. Warunek dachu pozwalał renderować go wyłącznie w overview, więc wejście do dowolnego sektora usuwało całą bryłę dachową.

## Reguła
Otwieraj zwykły adres panoramą; koszyk i preferencje odtwarzaj niezależnie. Wprost wskazany link do fotela nadal może otworzyć perspektywę. Ustaw pierwszy layout i responsywną korektę kadru bez lotu. Pokazuj zaznaczenie rzędu dopiero po wskazaniu rzędu/fotela, a kliknięcie krzesła przekazuje jego rzeczywisty numer. Zachowuj tożsamość stadionu przez pełny dach w panoramie i lokalny przekrój przy wybranej trybunie zamiast ukrywania całej konstrukcji.

## Jak sprawdzić
Regresje bootstrapu i rowFocused, dla wszystkich czterech stron znak płaszczyzny przekroju oraz zachowane wierzchołki dachu. Odbiór prawdziwego WebGL nadal wymagany: CPU nie potwierdza wyglądu ani pracy OrbitControls. Nie deklaruj oficjalnego bliźniaka.
