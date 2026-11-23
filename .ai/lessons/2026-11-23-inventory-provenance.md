---
date: 2026-11-23
area: inventory-ui
status: active
source: production browser acceptance
---

# Pochodzenie snapshotu nie jest stanem transferu

## Kontekst

Podczas odświeżenia aktywnego bloku zaakceptowany snapshot i jego ceny/statusy pozostawały w overlayu, ale nagłówek chwilowo nazywał te same dane katalogiem demo, bo pochodzenie było bramkowane przez `loading` i `error`.

## Przyczyna

Stan transportu opisuje bieżącą próbę pobrania. Nie zmienia źródła już zaakceptowanych danych. Hook celowo zachowuje ostatni snapshot przy odświeżaniu i błędzie.

## Reguła

Wyznaczaj pochodzenie aktywnego bloku z obecności jego zaakceptowanego klucza w snapshotcie. `loading` i `error` pokazuj osobno jako stan odświeżenia; nie degraduj nimi zachowanych danych do katalogu demo.

## Jak sprawdzić

Po poprawnym odczycie uruchom kolejne odświeżenie i pozostaw je pending, a potem odrzuć. Klucz bloku, ceny/statusy i etykieta źródła muszą pozostać serwerowe; nowy nieodczytany blok pozostaje katalogiem do udanej odpowiedzi.
