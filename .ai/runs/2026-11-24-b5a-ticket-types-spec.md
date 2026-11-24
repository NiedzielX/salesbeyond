---
started: 2026-11-24
ended: 2026-11-24
agent: root
spec: .ai/specs/2026-11-24-ticket-types-and-selection-policy.md
outcome: success
---

# B5a — przygotowanie specyfikacji

## Zadanie

Wybrać i opracować następny funkcjonalny przyrost doświadczenia kibica po B1, bez zależności od zdjęć, oficjalnej mapy dostępności lub płatności.

## Przebieg

- Porównano roadmapę, macierz parity i istniejący kontrakt holdów.
- Wybrano typy biletów i eventowe reguły wyboru jako spójny podzakres B5.
- Zapisano draft specyfikacji. Niezależny review trwa.
- Niezależny review wykrył brak serwerowej tożsamości quote, niedookreślony hash idempotencji, formułę ceny i kompatybilność holdów. Draft poprawiono na addytywny kontrakt v2 z krótkim `quoteToken` oraz wersjoświadomym restore.
- Osobny przegląd klienta zalecił mapę `seatId -> ticketTypeId` poza modelem `Seat` oraz jawne `invalidateQuote()`; oba wymagania dopisano.
- Recheck wykrył wyścig ponownego użycia tokenu, niejasny rollback v1 oraz brak retencji quote. Dodano atomowy claim `FOR UPDATE`, wersjonowane serializery/downcast v1, rate limit i cleanup z indeksem TTL.

## Weryfikacja

- Brak zmian kodu produktu.
- `git diff --check` — pass po wszystkich poprawkach.
- Niezależny finalny recheck Luna — no blocker; wszystkie P1/P2 zamknięte.

## Wynik

Draft przeszedł niezależny review i oczekuje wyłącznie na zatwierdzenie właściciela.

## Lekcje

Brak nowej lekcji na etapie draftu.
