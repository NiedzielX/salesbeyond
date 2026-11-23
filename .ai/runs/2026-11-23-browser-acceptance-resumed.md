---
started: 2026-11-23
ended: null
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie

Wznowić faktyczny odbiór produkcji A1–A3 po ponownym udostępnieniu Cloud Browser, bez obchodzenia zabezpieczeń i bez rozszerzania zakresu B/C. Potwierdzone usterki naprawić od reprodukcji i ponownie wdrożyć.

## Przebieg

- Start z czystego `6dbe427`; production poprzednio READY.
- Przeczytano proces, zatwierdzoną specyfikację, draft parytetu wyłącznie jako mapę zakresu oraz indeks lekcji.
- Skill `cloud-desktop` użyty do rzeczywistej kontroli produkcji. Narzędzie browser zostało ponownie udostępnione po restarcie środowiska; nie użyto kanału zastępczego.
- Tani agent Luna przygotował read-only macierz odbioru A1–A3 dla desktop/mobile.
- Produkcja otworzyła się w Cloud Chrome. Rzeczywisty WebGL jest w tym środowisku niedostępny; aplikacja poprawnie przeszła na natywny plan 2D, wyłączyła 3D/crowd/tour i pokazała jawny komunikat fallbacku. Nie uznajemy tego za odbiór A1/WebGL.
- Faktyczny flow produkcyjny 2D przeszedł dla `II-2 / rząd 1 / miejsce 16`: live snapshot, kanoniczne 85 zł, koszyk, propozycja grupy bez side-effect, quote, hold 10 min, reload/recovery i release. Po zwolnieniu istniejący polite status pokazał pojedynczy komunikat terminalny.
- Browser repro ujawnił błąd pochodzenia danych: podczas quote/create/release nagłówek filtra przełączał się na „katalog demo”, choć zaakceptowany snapshot `II-2` i jego overlay pozostawały używane. Źródło było błędnie uzależnione od `loading/error` zamiast obecności przyjętego snapshotu bloku.
- Niezależny read-only audyt Luny potwierdził diagnozę oraz wąski fix: pochodzenie wynika z klucza w `snapshot.bySection`; nowy/nieodczytany blok pozostaje katalogiem aż do pełnej poprawnej odpowiedzi.

## Weryfikacja

- Browser production przed poprawką: potwierdzony fallback 2D i pełny flow seat→basket→quote→hold→reload/recovery→release; WebGL niedostępny w Cloud Chrome.
- Reprodukcja: po przyjętym snapshotcie `II-2` quote/create/release pokazywały `loading`, zachowywały overlay, lecz filtr błędnie przełączał copy na katalog demo.
- Test przed implementacją: `inventorySource.test.ts` — fail `ERR_MODULE_NOT_FOUND` (brak predykatu).
- `node --experimental-strip-types --test src/domain/inventorySource.test.ts src/integrations/useSectionInventory.test.ts` — pass 2/2 po poprawce.
- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — pass: 174 testy aplikacji oraz 1 test emitowanego API.
- `npm run build` — pass; istniejące ostrzeżenie o dużym lazy chunku `Stadium` pozostaje jawne.
- Niezależny final source review Luny — pass, bez must-fix.
- W toku: deploy i ponowny browser check etykiety. Desktop ma faktyczny widok przeglądarki; osobny viewport 390×844 i A1/WebGL nadal niepotwierdzone.

## Wynik

W toku.
