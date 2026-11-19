# Pełne doświadczenie kibica — SalesBeyond / Enea

Cel właściciela: pełne doświadczenie kibica na poziomie produktu referencyjnego, własny wygląd SalesBeyond i Enea jako pierwszy obiekt. Bez edytora stadionów i panelu organizatora. Właściciel wyraźnie zlecił budowę modelu kodem według blueprintu; dostarczenie BLEND/GLB i zakup skanu nie są zależnościami.

## Kolejność i stan

| Etap | Rezultat | Stan |
|---|---|---|
| 1 | Wszystkie widoczne fotele we wspólnym katalogu | Kod: 38 078 foteli, 19 bloków, cztery trybuny i połączone narożniki; każdy ma ID |
| 2 | Spójna mapa 2D i model 3D | Natywny renderer 2D biblioteki, dokładny chart i jawne mapy ID; uproszczony SVG jako fallback. Rzeczywisty kompilator potwierdza zgodność wszystkich pozycji i ID |
| 3 | Koszyk i grupy w budżecie | Kod: limit 10, atomowe dodanie, ceny katalogowe i grupy nieprzechodzące przez zajęte miejsca/alejki; dane demo |
| 4 | Autorska rekonstrukcja Enei w kodzie | Kod i obejrzane rendery CPU: ciągła misa, różne poziomy, biała łukowa membrana, kratownice i gęste niebieskie fotele. Wymaga odbioru w aplikacji i dalszego porównania z referencjami |
| 5 | Spójność geometrii, foteli i kamery | Wspólne parametry; testy podparcia foteli, kadru panoramy i wszystkich bloków. Dokładne oficjalne rzędy/numery nie są zweryfikowane |
| 6 | Docelowe kategorie/ceny, filtry i reguły wydarzenia | Kod: cena/dostępność i liczniki całego stadionu/trybuny/bloku/rzędu; jawna propozycja grupy przed dodaniem, podgląd poza filtrami. Otwarte: pozostawianie pojedynczego fotela, sold-out/closed i zmiany dostępności; kategorie/ulgi klubowe wymagają danych |
| 7 | Dostępność, hold/wygaśnięcie/wznowienie/konflikt i checkout handoff | Otwarte: serwer i trwały magazyn; koszyk przeglądarkowy nie blokuje foteli |
| 8 | Odbiór całego flow na telefonie i desktopie | Zablokowane otwarcie Cloud Desktop przez automatyczną kontrolę; pozostałe prace nie są od tego zależne |
| 9 | Docelowe MVP pod stałym linkiem | Obecne przyrosty wdrażane na salesbeyond.vercel.app. Sam deploy nie zamyka etapów 4–8 |

## Model według blueprintu i nagrania

Blueprint rozpoczyna od budowy stadionu w Three.js z wieloma poziomami, przejściami, membranowym dachem i instancjami krzeseł z metadanymi. Nagranie pokazuje ciągłą gęstą misę, wyróżnienie całego bloku i płynne zbliżenie do trybuny. To referencje wyglądu i zachowania, nie gotowe źródła ani instrukcja kupna skanu.

`eneaLayout.ts` jest źródłem profili, narożników i powierzchni dachu. `eneaModel.ts` generuje architekturę, `stadium.ts` wszystkie fotele, a `fullChart.ts` plan 2D. Testy kompilatora porównują wszystkie ID i pozycje. Model nie jest fotogrametrią ani oficjalną bazą biletową Enei; numery i statusy pozostają demonstracyjne. Nie użyto modelu/tekstur z oferty CGTrader. Publiczny podgląd służył wyłącznie jako referencja bryły.

## Faktyczne użycie silnika

Domyślny plan 2D montuje rzeczywisty `createRenderer` z przypiętego pakietu przez publiczne API. Domyślne 3D jest własnym R3F. Wariant `?renderer=local` pozostaje wcześniejszym testem natywnego 3D dla 648 miejsc. To integracja dostępnego runtime, nie przeniesienie pełnego produktu ani prywatnych źródeł. UI, katalog, kamera, koszyk i model są nasze.

## Odbiór i następne gotowe prace

Najpierw rzeczywisty odbiór nowych interakcji, czytelności, czasu ładowania i lotu kamery, gdy dostęp przeglądarkowy zostanie przywrócony. Filtry i propozycje grup z etapu 6 są w kodzie, wraz z oznaczeniem wielu miejsc na mapie i w 3D. Dalej: reguły wydarzenia i kontrakt hold/handoff z etapu 7. Odróżniać scenariusz demonstracyjny od integracji sprzedażowej. Kryteria wizualne pozostają otwarte mimo zielonych kontroli kodu i obejrzanych renderów CPU.

## Wdrożenie przyrostu

Kod 06cd758 wdrożony na [salesbeyond.vercel.app](https://salesbeyond.vercel.app), production READY, dpl_CqvJJhPkrjxEG5DN1KqGtLKa41A1. HTML, JS, CSS i krytyczne moduły mapy/3D zweryfikowane HTTP 200. Szczegóły i granice w [logu](../.ai/runs/2026-11-18-authored-enea-stadium.md). Brak push/scalenia na GitHub w tym przebiegu; Vercel otrzymał lokalny snapshot źródeł. To wdrożony przyrost, nie odebrane pełne MVP.


## Przyrost wyszukiwania i wielu miejsc 2026-11-19
Filtry i propozycje nie mutują koszyka. Wyszukiwanie zawęża się do wybranego bloku, a bez bloku obejmuje wskazaną trybunę lub cały stadion. Po obejrzeniu propozycja nadal jawnie pokazuje swój blok i rząd. ID koszyka odtwarzane wspólnie z aktywnym podglądem, także po progressive reveal. Kontrole: 65 testów, lint/typecheck/build; stan deploy i niewykonany odbiór przeglądarkowy w [logu](../.ai/runs/2026-11-18-fan-seat-search.md).

Aktualny kod wyszukiwania 2600d4f jest wdrożony production READY na salesbeyond.vercel.app (dpl_H1UvmwKNzTenP6r1R8c4RvKFLgZw). Potwierdzono nowy HTML/JS/CSS i moduły 2D/3D. Bez push/merge GitHub, bez deklaracji odbioru przeglądarkowego.


## Powrót do wyboru i link do fotela 2026-11-19
Koszyk i kontekst można wznowić po odświeżeniu; dane lokalne są walidowane i kanonizowane, z osobnymi kluczami wariantu pełnego/legacy. Zapis nie zawiera cen, obrazów ani danych osobowych. Niedostępny/uszkodzony storage pozostawia działający wybór. Podsumowanie kontroluje aktualny katalog demo i informuje o zmianie ceny/statusu przed kolejnym podsumowaniem. Link do fotela nie kopiuje koszyka; adres śledzi ostatni podgląd i usuwa parametr fotela po powrocie do panoramy. Kontrole: 72 testy, lint/typecheck/build. To lokalne wznowienie, nie serwerowy hold. Kolejny backend musi zapewnić wspólną atomową dostępność, token/wygaśnięcie, konflikty i checkout handoff. Stan publikacji i ograniczenia: [log](../.ai/runs/2026-11-19-fan-session.md).
