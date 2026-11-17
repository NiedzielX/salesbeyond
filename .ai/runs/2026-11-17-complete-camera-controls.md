---
started: 2026-11-17T17:07:53.009715+01:00
ended: 2026-11-17T17:12:51+01:00
agent: Codex
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
related: .ai/runs/2026-11-17-finish-mvp-interactions.md
---

## Zadanie
Kontynuować zakres MVP bez przerywania przy drobnych przyrostach; dopracować kontroler kamery, telefon i klawiaturę oraz wymagane testy.

## Przebieg
Przeczytano zasady/spec i istotne lekcje.
- Odtworzono problem pozostałej bezwładności OrbitControls prawdziwym sterownikiem: 11/12 testów przed poprawką; po pauseOrbit 12/12. Stan wyjściowy kamery i cel są zachowane.
- Dodano wyliczenie dystansu panoramy z bryły i perspektywy; test projekcji narożników obejmuje proporcje telefonu, desktopu i szerszego ekranu. Pierwsza próba prostej skali nie mieściła desktopu; zastąpiono ją analitycznym dopasowaniem frustum. Końcowy test zielony.
- Zmiana rozmiaru ekranu nie uruchamia nowego lotu z fotela ani nie zeruje kierunku patrzenia.
- Utrata kontekstu GPU zgłasza niedostępność, zatrzymuje tour i odmontowuje scenę; panel danych pozostaje.
- Modal O projekcie utrzymuje fokus i oddaje go po zamknięciu. Otwarcie modala zatrzymuje tour.
- Read-only review gpt-6-luna wskazał konflikt autoFocus i zapisywania opener w useEffect. Integrator potwierdził kolejność commit/pasywny efekt i usunął autoFocus; fokus jest ustawiany dopiero po zapisaniu opener. Browser QA tego zachowania nie wykonano.
- Brak narzędzi przeglądarki w aktualnym katalogu narzędzi. Help sites-preview potwierdza tylko start/status/stop; brak udokumentowanej naprawy relay. Nie uruchamiano serwera zastępczego ani nie ponawiano wadliwego startu bez naprawy.

## Weryfikacja
- npm run lint: exit 0.
- npm run typecheck: exit 0.
- npm test: exit 0, 14/14 pass. Obejmuje prawdziwe OrbitControls, projekcję kamery i cleanup listenera utraty kontekstu.
- npm run build: exit 0, 2252 moduły; JS 1196,15 kB/gzip 339,47 kB. Ostrzeżenie o paczce >500 kB.
- git diff --check: exit 0.
- Review: niezależna sesja gpt-6-luna; poprawiono wskazaną regresję fokusu, integrator sam zweryfikował diff i wykonał kontrole.
- Browser QA: nie wykonano. Matematyczny test kadru nie jest odbiorem wyglądu ani sceny WebGL.

## Wynik
Commit kodu 8961d50. Dokończono poprawki kamery, kadru na telefonie, WebGL i klawiatury mieszczące się w R4/R7. Brak nowych funkcji poza MVP, publikacji, push i scalania. Spec pozostaje in-progress: brakuje realnego browser QA wskutek niedostępności infrastruktury.

## Lekcje
.ai/lessons/2026-11-17-orbit-flight-inertia.md — pozostałe damping trzeba usunąć przed lotem.
