---
status: implemented
created: 2026-11-24
owner: product-owner
related:
  - .ai/specs/2026-11-21-seatlayer-feature-parity.md
  - .ai/specs/2026-11-24-event-catalog-and-history.md
  - docs/FAN_EXPERIENCE_ROADMAP.md
---

# B5a — typy biletów i reguły wyboru wydarzenia

## Problem

Kibic może wybrać i czasowo zablokować miejsca, lecz każde miejsce ma jedną cenę. Nie może przypisać rodzaju biletu, a limit i reguła pojedynczego wolnego miejsca nie są przedstawione jako część polityki konkretnego wydarzenia. Przez to ścieżka nadal przypomina wybór fotela, a nie przygotowanie rzeczywistego zamówienia klubowego.

## Cel i zakres

Dodać do obu demonstracyjnych wydarzeń jawny, izolowany cennik typów biletów oraz przypisanie jednego typu do każdego wybranego miejsca. Cena i polityka wyboru mają być autorytatywnie wyliczane przez backend przed blokadą, zachowane w quote/hold i poprawnie odtworzone w tej samej sesji.

Zakres:

- typy `normalny`, `ulgowy` i `dziecko` jako jawne dane demonstracyjne wydarzenia;
- domyślny typ `normalny`, zmieniany osobno dla każdego miejsca przed quote;
- ceny w integer minor units jako `max(0, seat.price_minor + ticket_type.adjustment_minor)`; brak działań zmiennoprzecinkowych w kontrakcie i brak użycia frontendowego `catalogPriceMultiplier` jako ceny autorytatywnej;
- event A: 1–10 miejsc, event B: 2–6 miejsc, aby udowodnić izolację polityk;
- dotychczasowa reguła no-orphan pozostaje opcją użytkownika, ale backend nadal jest ostatecznym źródłem reguł wydarzenia;
- serwerowy quote v2 zwraca krótkotrwały, nieprzezroczysty `quoteToken` oraz pozycje z `ticketTypeId`, cenę jednostkową i sumę dla dokładnego wyboru;
- zmiana miejsca, typu biletu, wydarzenia lub reguły unieważnia wcześniejszy quote;
- czytelny komunikat, gdy wybór nie spełnia minimum/maksimum;
- migracja istniejących danych demo bez zmiany ID foteli i bez ingerencji w inne schematy Supabase.

### Poza zakresem

- płatność, zamówienie, bilet QR/PDF, email, zwrot i dane kupującego;
- oficjalne ceny, ulgi lub regulamin klubu;
- kody promocyjne, dynamic pricing, pakiety rodzinne i membership;
- edytor cennika i panel organizatora;
- deploy, produkcyjna migracja oraz publikacja bez osobnej zgody właściciela.

## Wymagania

- **R1 — model wydarzenia:** każdy event publikuje stabilne ID typów biletów, polskie etykiety, kolejność, całkowitoliczbowy `adjustmentMinor` oraz politykę `minSeats`/`maxSeats`. Autorytatywna kwota pozycji to `max(0, seat.price_minor + adjustment_minor)` z kontrolą safe-integer/overflow; frontendowy mnożnik katalogowy pozostaje wyłącznie prezentacją demo.
- **R2 — przypisanie per miejsce:** stan kibica utrzymuje `ticketTypeBySeat: Record<seatId,ticketTypeId>` obok koszyka, bez zmiany modelu geometrii `Seat`. Koszyk ma dokładnie jeden dozwolony typ na fotel. Domyślny typ jest deterministyczny; usunięcie/wyczyszczenie fotela usuwa zbędne przypisanie.
- **R3 — autorytet serwera:** `POST /api/v2/events/:eventId/quotes` przyjmuje pary `seatId` + `ticketTypeId` i `avoidSingle`; backend w jednej transakcji sprawdza event, typ, dostępność, wersję i `minSeats`/`maxSeats`, a następnie sam oblicza ceny. Klient nie przesyła kwoty. Quote jest związany z hashem sesji, eventem, wersją, kanonicznie posortowanym mapowaniem fotel→typ i regułą; wygasa po maksymalnie 120 sekundach.
- **R4 — niezmienny snapshot i create v2:** quote zwraca losowy, nieprzezroczysty `quoteToken`, `expiresAt`, wersję i pozycje `{seatId,ticketTypeId,priceMinor}`. `POST /api/v2/events/:eventId/holds` przyjmuje token i idempotency key; RPC blokuje wiersz quote `FOR UPDATE`, ponownie blokuje/waliduje event i fotele, sprawdza niezmieniony hash/wersję/cenę, a następnie atomowo zapisuje `consumedHoldId` i `consumedIdempotencyKey`. Ponowne create z tym samym tokenem i kluczem zwraca zapisany hold jako replay; inny klucz dostaje `quote_consumed` i nigdy nie tworzy drugiego holda. Nowszy quote nie unieważnia starszego, ale każdy ma własny TTL i dokładny snapshot.
- **R5 — izolacja wydarzeń:** typ lub polityka z eventu A nie może zostać użyta w evencie B. Przełączenie wydarzenia nie przenosi koszyka ani przypisań.
- **R6 — UX i dostępność:** typ jest wybieralny klawiaturą i dotykiem w koszyku; etykieta i aktualna cena są czytelne bez polegania na kolorze. Błędy minimum/maksimum wskazują konkretną regułę.
- **R7 — prywatność:** zapis lokalny może zawierać wyłącznie event, ID foteli, preferencje i ID typów; bez danych osobowych i bez uznawania lokalnej ceny za autorytatywną.
- **R8 — kompatybilność:** stare lokalne sesje bez typów otrzymują domyślny typ. Endpointy v1 pozostają bez reinterpretacji requestu; v2 ma osobne ścieżki i sygnatury. Wspólny rekord DB zachowuje legacy item `{seatId,priceMinor}` albo v2 `{seatId,ticketTypeId,priceMinor}`. Serializery v2 zachowują typ, a serializer v1 świadomie projektuje każdy v2 item do `{seatId,priceMinor}`, dzięki czemu stary klient może odczytać i zwolnić aktywny hold po rollbacku, lecz nie może utworzyć ani zmienić typu v2. Istniejących JSON items nie przepisujemy.
- **R9 — błędy polityki:** pusty wybór pozostaje stanem bez quote; 1 miejsce przy minimum 2 jest blokowane przed żądaniem z komunikatem i ponownie odrzucane przez serwer jako `below_minimum`; przekroczenie maksimum daje `seat_limit`. Zmiana eventu usuwa koszyk danego eventu z aktywnego widoku zgodnie z izolacją B1.
- **R10 — invalidacja quote:** zmiana zbioru foteli, któregokolwiek `ticketTypeId`, wydarzenia albo `avoidSingle` natychmiast wywołuje domenowe `invalidateQuote()` i usuwa akcję create. Niepotwierdzonego tokenu nie zapisujemy ani nie odtwarzamy po reloadzie.
- **R11 — ograniczenie i retencja quote:** endpoint quote korzysta z tego samego sesyjno-adresowego rate limitera co create, z osobnym limitem operacji. `quotes.expires_at` ma indeks; RPC usuwa wygasłe quote starsze niż 1 godzinę przed utworzeniem nowego rekordu, a test retencji potwierdza brak nieograniczonego wzrostu. Token ani request hash nie trafiają do logów.

## Kryteria akceptacji

- **AC1 (R1, R5):** test katalogu potwierdza trzy typy i różne polityki A/B; wszystkie ID są unikalne w obrębie wydarzenia.
- **AC2 (R2, R7, R8, R10):** testy reducera/sesji pokrywają default, zmianę typu, usunięcie/wyczyszczenie miejsca, reload, starą sesję i izolację eventów; każda zmiana wejścia quote natychmiast usuwa możliwość create.
- **AC3 (R3, R9):** testy API/SQL odrzucają nieznany typ, typ z innego eventu, duplikat fotela, wybór poniżej minimum i powyżej maksimum; kwota wynika wyłącznie z tabel backendu i nie może być ujemna ani przekroczyć zakresu bigint/safe integer kontraktu.
- **AC4 (R4):** testy domeny/API/SQL odrzucają create z wygasłym/cudzym tokenem, zmienionym eventem, wersją, typem, ceną lub polityką; równoległe create tego samego tokenu z różnymi kluczami tworzą najwyżej jeden hold, a replay z tym samym kluczem zwraca ten sam hold. Równoległe quote są niezależne. Restore pokazuje dokładny snapshot typu i kwoty.
- **AC5 (R5):** ten sam fotel i różne typy/eventy dają oczekiwane, odseparowane ceny; hold jednego eventu nie blokuje odpowiednika drugiego.
- **AC6 (R6):** desktop 1440×900 i mobile 390×844 przechodzą wybór typu, quote, hold, reload i release bez overflow i błędów konsoli; kontrolki mają cele co najmniej 44 px.
- **AC7:** `npm run lint`, `npm run typecheck`, `npm test` i `npm run build` są zielone. Addytywna migracja uruchomiona po `001-seat-holds.sql` i obu fixture eventów przechodzi na izolowanym PostgreSQL; ponowne uruchomienie nie duplikuje typów/quote ani nie zmienia aktywnych holdów, a event version rośnie dokładnie raz na faktyczną zmianę cennika/polityki.
- **AC8:** UI wszędzie oznacza cennik jako demo i nie sugeruje zakupu ani oficjalnej ulgi Enea/Lech.
- **AC9 (R8, R11):** fixture aktywnego holda legacy oraz v2 przechodzi `current/get/release`; serializer v1 downcastuje v2 bez zmiany DB, serializer v2 zachowuje typ. Quote podlega rate limitowi, a test cleanup usuwa wyłącznie rekordy wygasłe ponad godzinę temu.

## Projekt rozwiązania

1. Rozszerzyć `src/data/event.ts` o eventowe definicje typów i politykę; dodać czyste funkcje rozwiązywania domyślnego/dozwolonego typu.
2. Dodać `FanState.ticketTypeBySeat` niezależnie od geometrii `Seat`. `fanSession` zapisuje wyłącznie dozwolone ID przypięte do miejsc w koszyku, uzupełnia default w starszym payloadzie i korzysta z istniejącego eventowego klucza storage.
3. Rozszerzyć `Basket` o dostępny select typu per miejsce i sumę katalogową demo; unieważniać quote przy zmianie typu.
4. Dodać osobny kontrakt HTTP v2: quote z items i create z `quoteToken`; v1 pozostaje bez reinterpretacji. Rozszerzyć klienta, wersjoświadome parsery serwera i maszynę `liveHold` o dokładne pozycje oraz jawne `invalidateQuote()` po zmianie wyboru.
5. Addytywnie dodać `events.min_seats`, `ticket_types(event_id,id,label,sort_order,adjustment_minor)`, `quotes(id,event_id,session_hash,version,expires_at,request_hash,items,subtotal_minor,currency,avoid_single,consumed_hold_id,consumed_idempotency_key)` oraz RPC `sb_quote_v2` i `sb_create_hold_v2`. `quotes.id` jest PK; `consumed_hold_id` jest unikalnym FK do holda, a oba pola consumed są jednocześnie null albo nie-null. Create blokuje quote `FOR UPDATE`. Obie funkcje walidują politykę w transakcji; idempotency hash v2 obejmuje token i pełne kanoniczne mapowanie fotel→typ. `sb_current_hold`, `sb_get_hold`, `sb_release_hold` i wersjonowane serializery zachowują DB snapshot legacy/v2.
6. Rozszerzyć oba eventy demo migracją. Najpierw uruchomić bazę izolowaną i testy wyścigów/zgodności; żadnej migracji produkcyjnej w tym przyroście bez osobnego polecenia.
7. Dodać testy domeny, klienta, API, SQL i browser QA zgodnie z AC.

### Główne pliki

- `src/data/event.ts`, `src/domain/fanSession.ts`, nowy moduł domeny typów biletów
- `src/App.tsx`, `src/components/Basket.tsx`, `src/components/LiveHoldPanel.tsx`
- `src/domain/liveHold.ts`, `src/integrations/seatHoldClient.ts`
- `src/server/holdApi.ts`, `src/server/holdStore.ts`, `api/holds.ts`
- nowa migracja w `database/` i `database/tests.sql`

## Ryzyka i otwarte pytania

- Nazwy i ceny są wyłącznie fixture demo; nie wolno przedstawiać ich jako polityki klubu.
- Zmiana kontraktu musi rozróżniać stary i nowy payload. Cicha zamiana `seatIds` na items grozi błędnym idempotency hash.
- JSON istniejących holdów nie może zostać przepisany. Parser restore musi wspierać stary item bez `ticketTypeId` jako zamknięty snapshot typu legacy.
- Quote token jest sekretem krótkotrwałym należącym do sesji: nie trafia do URL, logów ani localStorage. Po reloadzie aktywny hold odtwarza się jak dziś; niepotwierdzony quote nie jest wznawiany.
- Migracja jest addytywna i wdrażana przed klientem v2. Rollback klienta pozostawia v1 działające; rollback schematu nie jest wykonywany, dopóki istnieją quote/hold v2.
- Cleanup w ścieżce quote ma używać indeksu `expires_at` i nie może usuwać niewygasłych ani skonsumowanych rekordów potrzebnych do replay przed końcem retencji.
- Produkcyjna migracja i deploy są osobnymi, zastrzeżonymi decyzjami.

## Realizacja

Właściciel zatwierdził B5a i migrację 2026-11-25. Klient, kontrakt HTTP v2,
RPC, migracje i testy są zaimplementowane. Migracje zostały zastosowane w
`pnexqoyhazwlobzgdmzt`: oba wydarzenia mają po 38 078 miejsc, wersję 2,
odrębne polityki 1–10 / 2–6 i po trzy typy biletów. Produkcyjny smoke RPC
potwierdził quote 126,00 zł, atomowe create, replay tego samego holda i release.
RLS nowych tabel jest włączone bez polityk jako celowe deny-all; funkcje publiczne
v2 mają EXECUTE wyłącznie dla `service_role` i stały `search_path`.

Lokalne bramki: lint, typecheck, 214 testów źródeł + 1 test gotowego API i build
przeszły. Desktop 1440×900 i mobile 390×844 potwierdzają zmianę typu/ceny,
limit 2/6, cele 44 px, brak overflow i błędów konsoli. AC6 zamknięto po deployu
`ed2f128` na production: desktop oraz mobile przeszły wybór dwóch typów, quote
126,00 zł, hold, reload/recovery i release. Mobile zachował szerokość 390 px bez
overflow, kontrolki 44 px i zero błędów konsoli.
