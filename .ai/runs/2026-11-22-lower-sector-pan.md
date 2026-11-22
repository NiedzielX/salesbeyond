---
started: 2026-11-22
ended: null
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie

Po kolejnym screenie właściciela obniżyć ręczny pan kamery sektora jeszcze trochę, aby dolna trybuna i rząd 1 nie pozostawały przy dolnej krawędzi, bez zejścia oka w murawę i bez zmiany POV.

## Przebieg

- Produkcyjny screen potwierdził, że limit kąta `.49π` poprawił wybór, lecz target nadal zatrzymuje się na wysokości najniższego siedziska (około 1.58 m). Kamera nie może przez to przesunąć dolnej trybuny wyżej w kadrze.
- Równoległy rozpoczęty test uploadów kolorów pozostaje nieukończony i nie wejdzie do commita kamery.
- Granicę ręcznego targetu rozszerzono do 0.75 m na klonie bounds, bez mutacji kanonicznej geometrii. Przy istniejącym promieniu i kącie minimalne oko wynosi około 1.755 m.

## Weryfikacja

- Test domenowy: 6/6, w tym II-2 oraz dolna wysokość wszystkich 19 prostych/narożnych bloków.
- Controller R3F/Drei/Three: target 0.75 m, eye 1.755 m, row1 `NDC y=0.034`, automatyczny focus `y=0`; 114 kadrów rzędów / 3396 klatek.
- Oczekuje na niezależny review, pełne bramki i deploy.

## Wynik

Przebieg w toku.

## Lekcje

Oczekuje na zweryfikowany wynik.
