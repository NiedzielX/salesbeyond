---
date: 2026-11-20
area: deployment
status: active
source: rzeczywisty błąd FUNCTION_INVOCATION_FAILED i regresja emitted JS
---

## Kontekst
Funkcja Vercel przeszła build i osiągnęła READY, lecz pierwsze GET status zwracało 500. Lokalny node --experimental-strip-types uruchamiał źródła poprawnie.

## Przyczyna
Import holdRuntime.ts pozostał w skompilowanym API .js. Paczka zawierała kod JavaScript i Node nie znajdował wskazanego pliku .ts. Samo typecheck/noEmit ani testowanie źródeł TypeScript nie obejmowało tej granicy.

## Reguła
Włącz rewriteRelativeImportExtensions przy emisji serwera używającego względnych importów .ts. Sprawdzaj załadowanie wyemitowanego API w Node bez źródeł TypeScript. Po każdym deploy funkcji wywołaj faktyczny endpoint; READY nie dowodzi działania. Odczytuj też logi info/stderr — ten błąd startu został zapisany na poziomie info, więc filtr error/fatal go pominął.

## Jak sprawdzić
node scripts/test-server-output.mjs odtwarzał ERR_MODULE_NOT_FOUND przed zmianą, po zmianie potwierdza status 200/demo i inventory 503. Końcowy dowód HTTP po wdrożeniu zapisać w logu; test transpileModule nie jest dowodem pakowania Vercel.
