---
date: 2026-11-21
area: crowd-camera
status: active
source: test buforów i rzeczywisty kontroler R3F w StrictMode
---

## Kontekst
Symulowana widownia ma ukryć postać obserwatora, zachować punkt startowy podczas przelotu i pokazywać ten sam wariant w miniaturze co w scenie. Zmiany wielu masek mogą być zatwierdzone przed jedną klatką GPU.

## Przyczyna
Czyszczenie BufferAttribute.updateRanges przy każdym setHidden usuwało wcześniejsze niewysłane przywrócenia, mimo prawidłowych danych CPU. Dotychczasowe robienie miniatury przed onReady mogło z kolei utrwalić maskę lotu zamiast sceny po dotarciu.

## Reguła
Nie czyść oczekujących zakresów przy każdej mutacji. Zachowuj je do transferu; Three WebGLAttributes sam je scala i czyści po wysłaniu. Rozdziel stałe macierze od zmian maski.

Przechowuj logiczną historię obserwatora także przy wyłączonej geometrii. Podczas dowolnego lotu zachowuj ukryte punkty startowe i cele; po dotarciu pozostaw tylko bieżącego obserwatora, a w panoramie przywróć wszystkich. Miniaturę odczytuj po commit rodzica flying=false i zastosowaniu macierzy. Zmiana trybu widowni nie jest nową nawigacją kamery.

## Jak sprawdzić
Regresja trzech setHidden przed transferem musi zachować zakresy wszystkich zmienionych instancji. Test kontrolera R3F z StrictMode sprawdza przełączanie w trakcie lotu, docelową maskę w miniaturze i57perspektyw. CPU nie dowodzi wyglądu/płynności GPU.
