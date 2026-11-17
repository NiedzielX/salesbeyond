---
date: 2026-11-17
area: react-three-fiber
status: active
source: rzeczywisty lokalny browser QA i review R3F Canvas
---

## Kontekst
Po otwarciu aplikacja natychmiast pokazywała BRAK 3D, nawet bez błędu utworzenia kontekstu w konsoli.

## Przyczyna
R3F montuje fallback jako dzieci elementu HTML canvas, niezależnie od tego, czy przeglądarka obsługuje canvas. Efekt w komponencie Unavailable przekazanym do fallback zawsze zgłaszał awarię i odmontowywał scenę. Dodatkowo czytnik ekranu może eksponować tekst fallbacku przy działającej grafice.

## Reguła
W fallback HTML canvas umieszczaj tylko neutralną treść bez efektów zgłaszających awarię. Błąd renderera zgłaszaj przez error boundary, a utratę kontekstu przez webglcontextlost. Nie traktuj montowania fallbacku jako testu WebGL.

## Jak sprawdzić
Otwórz stronę i sprawdź, że nie ma fałszywego BRAK 3D przed inicjalizacją. Przy rzeczywistym braku WebGL powinien wystąpić błąd kontekstu i jawny komunikat; panel pozostaje dostępny. W cloud QA po poprawce renderer podjął inicjalizację, a kontekst okazał się rzeczywiście niedostępny. Działająca scena nadal wymaga urządzenia z WebGL.
