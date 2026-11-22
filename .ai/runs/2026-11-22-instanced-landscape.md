---
started: 2026-11-22
ended: null
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie

Zmniejszyć mierzalny koszt sceny A1 bez zmiany wyglądu pierścienia zieleni ani symulowanej widowni: zastąpić 65 par osobnych meshów drzew trzema instancjonowanymi batchami i usunąć pełną kopię 38 078 macierzy kontrolera widowni.

## Dowód wejściowy

`Stadium.Scene` tworzył 65 pni i 65 koron jako 130 osobnych meshów, a każdy JSX tworzył geometrię i materiał. Pozycja, wysokość, rozmiar i dwa kolory były deterministyczne.

Niezależny audyt `a1_scene_performance_audit` zmierzył 9 przeplatanych prób Node `--expose-gc`: kontroler widowni z 38 078 kopiami `Matrix4` zatrzymywał 10 065 696 B sterty (mediana init 64.81 ms), wariant sparse 1 840 648 B (51.87 ms), przy bitowo równych macierzach, ranges i bounds. To pomiar CPU/heap Node, nie GPU/FPS urządzenia.

## Przebieg

- Dodano helper macierzy i trzy `InstancedMesh` drzew; regresja sprawdza 65 pozycji, podział 33/32, skalę i bounds.
- Kontroler widowni zapisuje backup macierzy wyłącznie dla aktualnie ukrytych instancji; pełny bufor pozostaje autorytatywny. Regresja sprawdza bitowe odtworzenie całego bufora i zachowanie wszystkich pending update ranges.
- Targeted 7/7 pass. Pełne bramki: lint pass, typecheck pass, 169 testów JS + 1 emitted API pass, build pass (istniejące ostrzeżenie o dużych chunkach pozostaje).
- Niezależny read-only review Luny: bez must-fix; transformacje/kolory/bounds/raycast i sparse restore/ranges zgodne. Browser/GPU/FPS nie były sprawdzane.

## Wynik

Kod gotowy do wdrożenia; produkcyjny proof w toku.
