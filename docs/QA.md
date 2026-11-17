# QA funkcjonalnego MVP

Status: kontrole kodu wykonane; browser QA NIE WYKONANE. Specyfikacja pozostaje in-progress.

## Automatyczne

`npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
Test regresji Three.js/R3F sprawdza przywrócenie raycast po resecie. Testy danych i domeny sprawdzają 648 miejsc, ceny/statusy/ID, stan wyboru, wspólne pozycje rzędów i kamery, interpolację lotu i brak zmiany oczu przy rozglądaniu, anulowanie callbacków autotour.

## Realna przeglądarka — do wykonania

Uruchomić `sites-preview start <checkout>` w środowisku managed i otworzyć dokładny zwrócony URL. Przy awarii relay nie zastępować tego innym serwerem. Na zwykłym komputerze: `npm run dev`.

1. Rozmiary 390×844 i 1440×900. Obejrzeć zrzuty panoramy/sektora/fotela. Porównać szerokość dokumentu z viewportem; brak poziomego przewijania i krytycznych błędów konsoli.
2. Dla sektorów 101–103 i rzędów 1/6/12 wybrać pierwsze i ostatnie dostępne miejsce: 18 prób. Skontrolować podsumowanie, cenę i widok boiska, brak geometrii przecinającej kamerę. Lot bez cięcia.
3. Po powrocie do panoramy ponownie kliknąć sektor w 3D (regresja raycast). W sektorze wybrać fotel osobno kliknięciem siedziska i oparcia. Kliknąć w scenie fotel z innego rzędu niż w panelu; wrócić i sprawdzić numer rzędu. Kliknięcie zajętego miejsca nic nie wybiera.
4. Dziesięć zmian miejsca, trzy resety panoramy. Brak przeładowania i niespójności biletu. Rozglądanie z fotela nie zmienia pozycji obserwatora.
5. W czasie lotu kliknąć reset i zmienić sektor; końcowa kamera odpowiada ostatniemu wyborowi. Powtórzyć przy prefers-reduced-motion.
6. Autotour: start, stop/Escape/ręczny wybór/drag, odczekać do końca 24 s. Brak spóźnionego nadpisania wyboru.
7. Klawiatura: Tab, Shift+Tab, Enter/Space w sektorach i miejscach; strzałki na suwaku rzędu; powrót. Widoczny fokus i możliwość dalszej nawigacji.
8. Zasymulować brak WebGL w osobnej sesji QA bez zmiany ustawień użytkownika. Komunikat zamiast sceny; panel nie może udawać wyrenderowanego widoku.
9. Sprawdzić dach, pełny ekran i modal O projekcie, stale widoczny napis DEMO.

## Ograniczenie infrastruktury 2026-11-17

`sites-preview start /workspace/worktrees/salesbeyond-process` zakończyło się błędem `relay could not open browser port 4173: timed out waiting for relay readiness`. `sites-preview status`: stopped. Przeglądarka się uruchamia, ale nie uzyskano lokalnego URL ani zrzutów aplikacji. Nie uznaje się kontroli wizualnej za wykonaną.
