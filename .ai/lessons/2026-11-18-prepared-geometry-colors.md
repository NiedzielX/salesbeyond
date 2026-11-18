---
date: 2026-11-18
area: geometry-integration
status: active
source: kontrola danych buildSceneModel, testy i rendery geometrii CPU
---

## Kontekst
Własny GLB zawierał niebieskie siedziska/ławki na czterech trybunach i biały dach. Po przejściu przez zarejestrowaną warstwę shell przypiętego runtime gotowy model miał niebieskie wierzchołki tylko na północnych sektorach. Nie pomogło usunięcie override shell.

## Przyczyna
Format GLB nie gwarantuje, że renderer zachowa semantykę materiałów. Publiczne dane wyjściowej siatki wskazały utratę kolorów; brak kodu źródłowego i GPU nie upoważnia do zgadywania mechanizmu wewnętrznego.

## Reguła
Sprawdzaj materiały i bufory faktycznie przekazywane do renderera, nie samą poprawność pliku modelu. Jeśli potrzebujesz własnych barw powierzchni, korzystaj z jawnego kontraktu przygotowanej siatki i testuj zgodność wszystkich atrybutów oraz zakresów. Odróżniaj kontrolę geometrii CPU od rzeczywistego WebGL i jego reguł cullingu. Nie usuwaj elementów zweryfikowanego modelu stadionu, aby sztucznie poprawić widok; nasz filtr autobetonu dotyczy wyłącznie syntetycznego chartu.

## Jak sprawdzić
Test czterech niebieskich stron i długości atrybutów w venueChart.test.ts, sightlines.test.ts i osobny odbiór GPU. Dwustronny test2500 promieni daje14→0, lecz jednostronny baseline już0; nie raportuj tego jako potwierdzonego błędu natywnego renderera.
