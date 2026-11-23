---
date: 2026-11-23
area: hold-api
status: active
source: production browser console acceptance
---

# Pusty wynik discovery nie jest błędem transportu

## Kontekst

Odczyt bieżącej blokady bez cookie albo bez aktywnego holda był oczekiwanym stanem aplikacji, ale odpowiedzi `401/404` generowały błędy zasobu w konsoli przeglądarki.

## Przyczyna

Endpoint discovery mieszał brak zasobu należącego do sesji z błędem uwierzytelnienia/transportu, chociaż brak blokady nie wymagał tworzenia sesji ani interwencji użytkownika.

## Reguła

Dla bezpiecznego odczytu opcjonalnego zasobu zwracaj udany, jawny pusty wynik bez tworzenia sesji. Zachowaj błędy autoryzacji dla operacji wymagających własności i nie zamieniaj błędów backendu na pusty sukces.

## Jak sprawdzić

Bez cookie i z obcym cookie discovery zwraca `200` z `hold:null`, nie ustawia cookie i nie ujawnia danych. Create/get/release nadal wymagają własnej sesji, a nieprawidłowe wyniki lub awarie backendu pozostają błędami.
