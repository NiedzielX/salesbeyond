---
started: 2026-11-23T16:02:20Z
ended: 2026-11-24T11:25:00Z
agent: codex-root
spec: .ai/specs/implemented/2026-11-23-seat-navigation-and-pitch-recenter.md
outcome: success
---

# B3 — nawigacja między miejscami i recenter kamery

## Zadanie

Wdrożyć zatwierdzoną specyfikację B3: fizyczne poprzednie/następne miejsce, dostępny interfejs i jednorazowe wycentrowanie perspektywy fotela na murawie.

## Przebieg

- Właściciel jawnie zatwierdził specyfikację B3 2026-11-23.
- Status specyfikacji zmieniono z `draft` na `in-progress`.
- Izolowany helper nawigacji i testy zlecono tańszemu agentowi w osobnym worktree; integrację UI i kamery realizuje agent główny.
- Indeks sąsiadów korzysta z kanonicznego `inventory` i `physicalRowRuns()`. Bieżący overlay służy tylko do prezentacji ceny/statusu, a wybór przechodzi istniejącą ścieżką `selectSeat`.
- Dodano stabilne kontrolki poprzednie/recenter/następne, fokus graniczny, stały region `aria-live` i cele dotykowe 44 px.
- Sterownik kamery zużywa rosnący token jednorazowo, bazuje token przy montażu i nie odtwarza żądania odrzuconego podczas lotu, dla innego fotela ani po remouncie.
- Niezależny review odtworzył race osobnego rootu R3F: spóźnione zakończenie lotu 17 mogło odblokować lot 18 i zgubić jego miniaturę. Dodano generację nawigacji aktualizowaną synchronicznie przez rodzica oraz test regresyjny dokładnej kolejności 17→18.

## Weryfikacja

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: 190 testów aplikacji + 1 emitowany test API, 0 błędów.
- `npm run build`: pass; pozostaje wcześniejsze ostrzeżenie o chunku Stadium >500 kB.
- Harness rzeczywistego kontrolera R3F potwierdza niezmienną pozycję oka, kierunek na `[0, 1, 0]`, synchronizację kątów, stabilny mały drag, ponowne centrowanie i brak replayu/skutków ubocznych.
- Chromium na lokalnym buildzie produkcyjnym: desktop 1440×900 WebGL2, emulacja touch 390×844, fallback bez WebGL i `?renderer=local` bez błędów aplikacji i bez poziomego overflow. Przyciski mobile mają 44 px wysokości; finalny zrzut wykonano po aktywacji recenteru i pojawieniu się miniatury. Obejrzano oba zrzuty.
- Rzeczywista kontrolka na planie 2D z pełnym mockowanym snapshotem bloku i aktywnym holdem zmieniła `II-2-1-16` na `II-2-1-17`, zapisała ID w localStorage, pokazała cenę/status z overlayu i nie zmieniła koszyka, holda ani nie wysłała mutacji API.
- Dodatkowa macierz AC6–AC7: Tab/Shift+Tab, Enter i spacja bez skoku scrolla; tap w trybie przewijania strony i sterowania sceną; local 2D→3D z działającą nawigacją i bez recenteru; po recenterze symulowana utrata kontekstu z dostępnym `WEBGL_lose_context`, fallback 2D, ukryty recenter i nadal działające następne miejsce. Wszystkie przebiegi bez błędów aplikacji.
- Świeży, niezależny review `gpt-6.2-sol` odtworzył race, zweryfikował poprawkę generacji i po uzupełnieniu ścieżek back/Plan 2D/failScene nie znalazł dalszych must-fix.
- Pełne wyniki: `docs/qa-evidence/b3-seat-navigation-2026-11-24/verification.json`.
- Commit `1d97188` wdrożono na production jako `dpl_3wAuEqcpAD7F4w1tNFe5G2xwVDAm`; alias `salesbeyond.vercel.app` jest READY, a `/`, favicon i odczyty API zwracają HTTP 200.
- Publiczny smoke: w cloudowym Chrome bez WebGL nawigacja `II-2-1-16` → `II-2-1-17` zaktualizowała URL, po czym aplikacja poprawnie uruchomiła fallback 2D. Osobny Chromium/SwiftShader WebGL2 potwierdził tę samą nawigację, aktywny i działający `Na boisko`, brak błędów aplikacji i brak poziomego overflow dla 1440×900 oraz emulacji touch 390×844. Obejrzano oba zrzuty produkcyjne.
- Vercel po smoke: zagregowane runtime errors z ostatniej godziny — brak; runtime `error`/`fatal` dla deploymentu z ostatnich 30 minut — brak.

## Wynik

Implementacja, autoryzowany deploy i publiczny odbiór B3 są zakończone. Wszystkie AC1–AC8 mają dowód; specyfikację przeniesiono do `implemented/`.

## Lekcje

`.ai/lessons/2026-11-24-one-shot-camera-requests.md`: historyczny token kamery trzeba bazować przy montażu i zużywać przed guardami, aby odrzucona akcja nie odtworzyła się później.
