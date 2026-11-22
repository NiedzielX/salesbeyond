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

## Pierwszy rząd i dolna granica kamery
Kontrolowany suwak ustawiony już na minimum nie emituje zmiany po ponownym wskazaniu tego samego końca. Nie uzależniaj aktywacji pierwszego rzędu wyłącznie od `onChange`: zapewnij jawną, klawiaturową i dotykową akcję ustawienia kadru na bieżącym rzędzie. Osobno sprawdzaj kąt dolnej orbity. Ograniczenie targetu do bryły foteli nie powinno zatrzymywać oka zbyt wysoko; minimalną wysokość potwierdź na prawdziwym kontrolerze i zachowaj ją powyżej murawy oraz paneli.

## Podejście z panoramy
Przekrój zależny od docelowej trybuny nie gwarantuje wolnej trasy od kamery panoramy: pozostawiona przeciwna połowa może leżeć po drodze. W czasie lotu pomijaj roof/frame, po onReady przywracaj pełny dach panoramy lub lokalny przekrój. Zachowaj preferencję użytkownika, jeżeli dach wyłączył. Test rzeczywistego modelu na trasie panorama→III-3-1-29 odtwarza przecięcie membrany i weryfikuje jego brak przy widoczności lotu.
