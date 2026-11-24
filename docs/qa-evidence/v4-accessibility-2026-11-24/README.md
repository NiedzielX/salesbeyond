# V4 — browser accessibility i mobile

Data: 2026-11-24  
Deployment: <https://salesbeyond.vercel.app/>  
Środowisko: Playwright Chromium, SwiftShader WebGL2.

## Przyjęte dla MVP

- Klawiatura: logiczny `Tab` / `Shift+Tab`, aktywacja `Enter` / `Space`, brak skoku scrolla.
- Emulowany dotyk 390×844: brak poziomego overflow, kontrolki 44 px, zmiana miejsca i recenter.
- Jawny przełącznik pomiędzy pionowym przewijaniem strony i sterowaniem sceną.
- `prefers-reduced-motion` prowadzi do tego samego miejsca i skraca obserwowane dotarcie względem wariantu `no-preference` w tym samym syntetycznym środowisku.
- Istniejący dowód B3 obejmuje WebGL fallback, utratę kontekstu i dalszą nawigację w 2D.

## Granice dowodu

Emulacja nie zastępuje fizycznego Safari/Chrome, prawdziwych gestów wielodotykowych ani klawiatury ekranowej. Struktura ARIA i testy ogłoszeń nie zastępują ręcznego NVDA/VoiceOver. SwiftShader nie jest sprzętowym GPU, dlatego jego czasy nie są progiem wydajności produktu. Te trzy punkty przechodzą do checklisty pilota z klubem, a nie blokują koncepcyjnego MVP.
