# SalesBeyond / Enea — scenariusz demo dla klubu

Stały adres: <https://salesbeyond.vercel.app/>  
Czas: 6–7 minut  
Cel: pokazać drogę kibica od stadionu i widoku z miejsca do wspólnego wyboru oraz czasowej blokady.

## Przed spotkaniem

1. Otwórz czyste okno przeglądarki na stałym adresie, bez parametru `?seat=`.
2. Sprawdź, czy panorama 3D i przycisk `Plan 2D` są widoczne.
3. Nie zostawiaj aktywnej blokady po próbie; użyj `Zwolnij całą grupę`.
4. Jeśli 3D nie działa, przejdź od razu do planu awaryjnego 2D poniżej. Cały wybór i blokada nadal działają.

## 0:00–1:00 — stadion

- Pokaż panoramę: pełny dach, cztery trybuny, narożniki i murawę.
- Powiedz: „To koncepcyjne, proceduralne demo stadionu Enea-like. Nie jest oficjalnym planem ani fotogrametrycznym cyfrowym bliźniakiem.”
- Opcjonalnie włącz `Z kibicami`, aby porównać pustą i wypełnioną trybunę.

## 1:00–2:30 — od planu do widoku z miejsca

1. Kliknij `Plan 2D`.
2. W panelu wybierz blok `II-2`, rząd `1`, miejsce `16`.
3. Pokaż ticket: `II-2 / 01 / 16`, cena demo `85 zł`.
4. Kliknij `Stadion 3D` albo `Zobacz z tego miejsca w 3D`.
5. Pokaż tę samą identyfikację miejsca i perspektywę; użyj `Na boisko`, aby jawnie wycentrować murawę.

Nie obiecuj, że `85 zł` jest oficjalnym cennikiem. To wartość demonstracyjna; późniejszy quote potwierdza cenę serwerową w chwili sprawdzenia.

## 2:30–3:45 — miejsca obok siebie

1. Przewiń do `Razem na trybunie`.
2. Zostaw `2 osoby` i kliknij `Znajdź miejsca obok siebie`.
3. Zwróć uwagę na `PROPOZYCJA · DANE DEMO`, wspólny rząd i cenę całej grupy.
4. Opcjonalnie kliknij `Obejrzyj widok`.
5. Kliknij `Dodaj całą grupę` i pokaż dwa miejsca w `Twój wybór`.

Numery proponowanych foteli zależą od bieżącej dostępności. Nie zapowiadaj z góry konkretnych numerów.

## 3:45–5:30 — wspólna dostępność i blokada

1. W `Potwierdź swój wybór` kliknij `Sprawdź dostępność i cenę`.
2. Pokaż ID miejsc, ceny i sumę potwierdzoną przez serwer.
3. Kliknij `Potwierdź blokadę miejsc`.
4. Pokaż komunikat `Miejsca są czasowo zablokowane` i licznik zaczynający od `10:00`.
5. Powiedz: „To czasowa blokada testowa w wydarzeniu demo, nie bilet ani zakup. Płatności nie są podłączone.”

## 5:30–6:15 — wznowienie i bezpieczne zakończenie

1. Odśwież stronę.
2. Pokaż `Przywrócono Twoją blokadę` oraz niezmienione ID i sumę.
3. Kliknij `Zwolnij całą grupę`.
4. Zakończ na komunikacie `Blokada została zwolniona. Miejsca można wybrać ponownie.`

Nie czekaj dziesięciu minut na naturalne wygaśnięcie podczas prezentacji. Ten przypadek ma osobny dowód QA.

## Plan awaryjny 2D

Jeżeli sesja nie ma WebGL:

- pozostań na `Plan 2D`; aplikacja pokazuje jawny fallback i wyłącza niedostępne 3D;
- wybierz ten sam blok, rząd i fotel z panelu;
- pokaż ticket, propozycję grupy, koszyk, quote, hold, reload i release;
- powiedz wprost: „Perspektywa 3D nie jest dostępna w tej sesji, ale wybór i wspólna dostępność działają.”

Nie przełączaj profilu przeglądarki ani nie obchodź ustawień urządzenia w trakcie spotkania.

## Granice MVP

- Rekonstrukcja jest autorską interpretacją Enea-like, bez oficjalnych wymiarów, nazw miejsc i cennika klubu.
- Dane planu poza aktywnie odświeżanym blokiem pozostają katalogiem demonstracyjnym.
- Nie ma płatności, wydania biletu ani integracji z produkcyjnym systemem sprzedaży klubu.
- Odbiór mobilny obejmuje emulację 390×844; fizyczny telefon, VoiceOver/NVDA oraz hardware-GPU są checklistą pilota.
- Demo nie stanowi deklaracji zgodności prawnej ani oficjalnego cyfrowego bliźniaka.

## Dowody

- [V1/V2 — bryła i kadry](qa-evidence/v1-v2-visual-2026-11-24/README.md)
- [V3 — spójny przebieg 2D → 3D → hold](qa-evidence/v3-contiguous-flow-2026-11-24/README.md)
- [V4 — mobile, klawiatura i reduced motion](qa-evidence/v4-accessibility-2026-11-24/README.md)
- [Konflikt dwóch sesji i naturalne wygaśnięcie](qa-evidence/a2-two-session-conflict-2026-11-24/verification.json)
- [Aktualna roadmapa i zakres](FAN_EXPERIENCE_ROADMAP.md)
