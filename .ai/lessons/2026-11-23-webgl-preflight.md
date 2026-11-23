---
date: 2026-11-23
area: webgl-fallback
status: active
source: production browser acceptance
---

# Sprawdź WebGL2 przed montowaniem renderera

## Kontekst

React error boundary przełączał UI na działający plan 2D, lecz konstrukcja `Canvas` zdążyła wcześniej zapisać błędy Three i wyjątek konfiguracji R3F do konsoli w przeglądarce bez WebGL.

## Przyczyna

Boundary obsługuje skutki wyjątku renderowania, ale nie zapobiega próbie utworzenia niedostępnego kontekstu. Sama obecność `WebGL2RenderingContext` nie gwarantuje możliwości utworzenia kontekstu.

## Reguła

Przed montowaniem renderera WebGL2 wykonaj mały probe `canvas.getContext('webgl2')`, poproś o zwolnienie udanego kontekstu, gdy opcjonalne rozszerzenie jest dostępne, i przy `null` lub wyjątku przejdź istniejącą ścieżką fallbacku. Zachowaj error boundary oraz listener `webglcontextlost` dla awarii po starcie.

## Jak sprawdzić

W przeglądarce z WebGL wyłączonym aplikacja ma przejść na 2D bez błędów `THREE.WebGLRenderer` i wyjątku R3F; helper musi zwracać false dla `null`/throw oraz true dla kontekstu z rozszerzeniem zwalniania i bez niego.
