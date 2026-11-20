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
| 6 | Ceny, filtry i reguły wydarzenia | Wdrożone: filtry, grupy, reguły i aktualizacja wybranego bloku z Supabase co 15 s / focus / ręcznie / po zmianie holda. Wspólna migawka dla panelu, mapy i 3D. Pozostałe bloki opisuje katalog demo; brak oficjalnego cennika/ulg klubu |
| 7 | Quote, hold, wygaśnięcie, wznowienie i konflikt | Supabase/Vercel połączone, transakcje i właściciel sesji potwierdzone realnym HTTP i PostgreSQL. Panel quote/confirm/countdown/release i current recovery wdrożony. Otwarte: odbiór w aplikacji. Płatności/produkcyjny operator sprzedaży nie są podłączone |
| 8 | Odbiór całego flow na telefonie i desktopie | Zablokowane otwarcie Cloud Desktop przez automatyczną kontrolę; pozostałe prace nie są od tego zależne |
| 9 | Docelowe MVP pod stałym linkiem | Obecne przyrosty wdrażane na salesbeyond.vercel.app. Sam deploy nie zamyka etapów 4–8 |

## Model według blueprintu i nagrania

Blueprint rozpoczyna od budowy stadionu w Three.js z wieloma poziomami, przejściami, membranowym dachem i instancjami krzeseł z metadanymi. Nagranie pokazuje ciągłą gęstą misę, wyróżnienie całego bloku i płynne zbliżenie do trybuny. To referencje wyglądu i zachowania, nie gotowe źródła ani instrukcja kupna skanu.

`eneaLayout.ts` jest źródłem profili, narożników i powierzchni dachu. `eneaModel.ts` generuje architekturę, `stadium.ts` wszystkie fotele, a `fullChart.ts` plan 2D. Testy kompilatora porównują wszystkie ID i pozycje. Model nie jest fotogrametrią ani oficjalną bazą biletową Enei; numery i statusy pozostają demonstracyjne. Nie użyto modelu/tekstur z oferty CGTrader. Publiczny podgląd służył wyłącznie jako referencja bryły.

## Faktyczne użycie silnika

Domyślny plan 2D montuje rzeczywisty `createRenderer` z przypiętego pakietu przez publiczne API. Domyślne 3D jest własnym R3F. Wariant `?renderer=local` pozostaje wcześniejszym testem natywnego 3D dla 648 miejsc. To integracja dostępnego runtime, nie przeniesienie pełnego produktu ani prywatnych źródeł. UI, katalog, kamera, koszyk i model są nasze.

## Bieżący etap: jakość stadionu i odbiór całego doświadczenia

Stan na 2026-11-20: źródła 91272b3 wdrożone production READY na salesbeyond.vercel.app. 147 testów źródeł + 1 test gotowego API, lint/typecheck/build przeszły. Rzeczywisty HTTP potwierdza quote/inventory, wyścig dwóch sesji, własność, idempotencję, odzyskanie i release. To nie jest dowód wyglądu ani pełnej ścieżki w przeglądarce.

| Kolejność | Konkretny rezultat | Kryterium odbioru | Stan |
|---|---|---|---|
| V1 | Trzy uwagi właściciela zamknięte na ekranie | Zwykły adres zaczyna od panoramy; pełny dach w panoramie, zamierzony przekrój w sektorze; rzeczywisty kliknięty rząd zamiast narzuconego 6. Obserwacja na desktopie i małym ekranie | Kod/regresje wdrożone; odbiór pending |
| V2 | Czytelna sylwetka Enei i poprawne kadry | Panorama z dachem, cztery trybuny, narożniki, sektor i perspektywa fotela porównane z blueprintem/nagraniem/referencjami. Lista konkretnych różnic przed poprawianiem geometrii | Odbiór obrazu pending; bez deklaracji oficjalnego bliźniaka |
| V3 | Pełna ścieżka kibica w działającej aplikacji | 2D → sektor/rząd/fotel → 3D → grupa/koszyk → cena z serwera → blokada → reload → zwolnienie/wygaśnięcie. Osobna sesja wywołuje czytelny konflikt; podgląd i ID pozostają zgodne | API/adaptery passed; prawdziwa UI ścieżka pending |
| V4 | Wygodne użycie na telefonie | Wybór dotykiem i klawiaturą, panel nie zasłania sceny, brak poziomego przewijania; prawidłowe loading/error/expiry i powrót fokusu. Sprawdzić ładowanie i responsywność przed dalszą optymalizacją | Pending |
| V5 | Powtarzalne demo dla klubu | Stały link, odebrany scenariusz panoramy/wyboru/grupy/blokady i jawne dane demo; aktualny raport ograniczeń | Po V1–V4 |

Ja integruję model, kamerę i pełny flow. Równoległe, ograniczone zadania Lun dotyczą audytu różnic, adapterów i testów; wyniki przechodzą root review i własne bramki. Nie oznacza to pracy agentów po zakończeniu tury.

Aktualna blokada dotyczy wyłącznie prawdziwego odbioru przeglądarkowego: wcześniejsza automatyczna odmowa dostępu pozostaje nierozwiązana. Sam powrót namespace narzędzia lub restart środowiska nie dowodzi zdjęcia blokady. Nie ponawiać przez inne narzędzie/subagenta. Odpowiedź właściciela na wysłane pytanie o trzy objawy nadal pending; nie traktować braku odpowiedzi jako pass.

Dokładność Enei dopracowywać na podstawie porównanych kadrów, a nie zgadywanych wymiarów. BLEND/GLB i zakup skanu nie są wymaganiami. Następny przyrost ma poprawiać odbiór stadionu i pełny scenariusz kibica; backend jest już podstawą tego scenariusza. Braki RLS innych tabel współdzielonej aplikacji wine wymagają osobnego przeglądu, nie są częścią wizualnego etapu Enei.

Dowód bieżącego wdrożenia: [raport 2026-11-20](qa-evidence/hold-engine/verification-2026-11-20.md). Poniżej historia wcześniejszych przyrostów — dawne sformułowania o braku backendu nie opisują aktualnego stanu.

## Wdrożenie przyrostu

Kod 06cd758 wdrożony na [salesbeyond.vercel.app](https://salesbeyond.vercel.app), production READY, dpl_CqvJJhPkrjxEG5DN1KqGtLKa41A1. HTML, JS, CSS i krytyczne moduły mapy/3D zweryfikowane HTTP 200. Szczegóły i granice w [logu](../.ai/runs/2026-11-18-authored-enea-stadium.md). Brak push/scalenia na GitHub w tym przebiegu; Vercel otrzymał lokalny snapshot źródeł. To wdrożony przyrost, nie odebrane pełne MVP.


## Przyrost wyszukiwania i wielu miejsc 2026-11-19
Filtry i propozycje nie mutują koszyka. Wyszukiwanie zawęża się do wybranego bloku, a bez bloku obejmuje wskazaną trybunę lub cały stadion. Po obejrzeniu propozycja nadal jawnie pokazuje swój blok i rząd. ID koszyka odtwarzane wspólnie z aktywnym podglądem, także po progressive reveal. Kontrole: 65 testów, lint/typecheck/build; stan deploy i niewykonany odbiór przeglądarkowy w [logu](../.ai/runs/2026-11-18-fan-seat-search.md).

Aktualny kod wyszukiwania 2600d4f jest wdrożony production READY na salesbeyond.vercel.app (dpl_H1UvmwKNzTenP6r1R8c4RvKFLgZw). Potwierdzono nowy HTML/JS/CSS i moduły 2D/3D. Bez push/merge GitHub, bez deklaracji odbioru przeglądarkowego.


## Powrót do wyboru i link do fotela 2026-11-19
Koszyk i kontekst można wznowić po odświeżeniu; dane lokalne są walidowane i kanonizowane, z osobnymi kluczami wariantu pełnego/legacy. Zapis nie zawiera cen, obrazów ani danych osobowych. Niedostępny/uszkodzony storage pozostawia działający wybór. Podsumowanie kontroluje aktualny katalog demo i informuje o zmianie ceny/statusu przed kolejnym podsumowaniem. Link do fotela nie kopiuje koszyka; adres śledzi ostatni podgląd i usuwa parametr fotela po powrocie do panoramy. Kontrole: 72 testy, lint/typecheck/build. To lokalne wznowienie, nie serwerowy hold. Kolejny backend musi zapewnić wspólną atomową dostępność, token/wygaśnięcie, konflikty i checkout handoff. Stan publikacji i ograniczenia: [log](../.ai/runs/2026-11-19-fan-session.md).

Kod a8010c1 opublikowany production READY na salesbeyond.vercel.app (dpl_GeHLBkuf7oW4kmodnRSRGtWVqn7M). Potwierdzono nowy HTML/JS/CSS, moduły 3D/2D i serwowanie strony z linkiem fotela. Odtwarzanie i kopiowanie w działającej przeglądarce nadal wymagają odbioru; zapis lokalny nie zmienia otwartego etapu serwerowego hold/handoff.


## Większy etap — polityka i jakość interakcji
Reguły nowych izolowanych foteli uwzględniają luki numeracji, fizyczne alejki i pionowe przerwy. Ten sam evaluator filtruje rekomendacje i sprawdza całe dodanie. Poprzednie single i usuwanie są zachowane; preferencja jest opcjonalna, bez przypisywania jej klubowi. Zamknięty wybór daje zero wolnych wyników, zachowując podgląd katalogu. Topologia jest indeksowana raz, koszyki korzystają z tego samego katalogu.

R3F nie przepisuje macierzy foteli przy hover, a BVH wybiera kandydatów do dokładnego raycast Three. Pomiar CPU i testy są w docs/qa-evidence/seat-picking; brak odbioru WebGL. [Kontrakt następnej warstwy](SEAT_HOLD_CONTRACT.md) opisuje rzeczywiste atomowe holdy; to nie jest połączony backend. Integracja Supabase Free jest zainstalowana, lecz nie ma potwierdzonego zasobu połączonego z projektem. Log: ../.ai/runs/2026-11-19-sustained-fan-mvp.md.
