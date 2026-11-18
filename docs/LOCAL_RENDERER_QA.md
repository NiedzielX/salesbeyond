# Odbiór lokalnego wariantu sceny — 2026-11-18

## Stan
Próba integracyjna pozostaje **in-progress**. Włączana przez `/?renderer=local`; domyślny wcześniejszy renderer zachowany. Bez publikacji, push i scalenia.

## Sprawdzone
- 27 testów Node: obecne 20 oraz mapowanie wszystkich 648 ID, pozycje/statusy/metryczna skala boiska w rzeczywistym kompilatorze sceny, własny samowystarczalny GLB, nawigacja sektora/rzędu/fotela, unieważnianie starych lotów, disposal i odróżnienie lotu przerwanego od dotarcia.
- Lint, typecheck i build; wynik finalnego `npm ci` i bramek w logu przebiegu.
- Niezależne review osobnej sesji gpt-6-luna. Zgłoszony błąd anulowanego lotu naprawiony i ponownie przejrzany.
- Browser QA rzeczywistego panelu/fallbacku: 18 wyborów dla 1440×900 i 18 dla ramki 390×844. Sektory 101/102/103, rzędy 1/6/12, pierwsze i ostatnie wolne miejsce; cena i numery zgodne, powrót zachowuje rząd. Mobile odczyt viewportu: szerokość390, wysokość843 przy ramce844; nie udawać pomiaru innej wysokości.
- Brak poziomego overflow w obu rozmiarach. Miejsce 4 w sektorze102/rzędzie6 disabled. Suwak z klawiatury Home/strzałki, fokus wewnątrz modala po Shift+Tab, Escape zamyka modal. Reload odtwarza startowy ekran. StrictMode przy braku GPU nie zostawia canvasa.
- W konsoli aplikacji jawne `Local stadium: WebGL2 is unavailable.`. Komunikaty o wysyłaniu metadanych rozszerzenia Chrome nie pochodzą z aplikacji. Aplikacja pokazuje BRAK3D i nie podstawia fikcyjnego renderu.
- Zrzuty obejrzane: `qa-evidence/local-renderer/desktop-1440x900.jpg`, `mobile-390x844.jpg`; wyniki36 wyborów w `results.json`. Zrzuty dokumentują panel i awarię WebGL, nie stadion3D.
- Tymczasowa lokalna strona z ramką o określonym rozmiarze użyta do QA i usunięta przed commitem. Nie jest funkcją produktu ani elementem buildu.

## Niesprawdzone — bramki przed zastąpieniem poprzedniej sceny
1. Realne WebGL2: panorama, cztery trybuny/boisko/dach i wybrany punkt widzenia. Brak wizualnego odbioru, kliknięć GPU i potwierdzenia orientacji/funkcji miniatury.
2. Czasy i ciągłość przelotu, prześwit przez dach, rozglądanie oraz reduced-motion. Kod adaptera nie wymusza2.4s; należy zmierzyć zachowanie runtime i porównać z wymaganiem2–3s. Nie twierdzić, że stare testy kamery Three weryfikują nowy runtime.
3. 18 próbek kliknięć/lotów i10 kolejnych zmian w scenie, retry po przeciągnięciu, reset w trakcie, prawdziwa utrata kontekstu i ponowne mount/unmount z aktywnym GPU.
4. Cold start i requesty wszystkich lazy chunks/workerów/fontów/tekstur na działającym GPU. Źródła aplikacji nie używają obcego API i usunięto fonty Google, lecz nie jest to pełny dowód niezależności sieciowej runtime.
5. Zachowanie na fizycznym telefonie i rzeczywisty czas pierwszej klatki/FPS.

## Następny odbiór
Uruchomić `npm ci && npm run dev`, otworzyć `/?renderer=local` w środowisku z działającym WebGL2. Przejść powyższe bramki i porównać z domyślną sceną. Bez przechodzenia przez ustawienia zabezpieczeń lub zmieniania polityki przeglądarki.
