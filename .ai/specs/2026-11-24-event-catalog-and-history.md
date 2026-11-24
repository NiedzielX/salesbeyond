---
status: in-progress
created: 2026-11-24
owner: NiedzielX
related:
  - .ai/specs/2026-11-21-seatlayer-feature-parity.md
  - docs/FAN_EXPERIENCE_ROADMAP.md
  - docs/SEAT_HOLD_CONTRACT.md
---

# B1 — katalog wydarzeń, izolacja wyboru i historia URL

## Problem

SalesBeyond prowadzi obecnie zawsze do jednego hardkodowanego wydarzenia `enea-demo`. Kibic nie może wybrać meczu, a `eventId` jest zapisany osobno w danych UI, hooku inventory i hooku holdów. Backend oraz baza już izolują inventory i holdy po `eventId`, ale frontend nie przekazuje dynamicznego wydarzenia. URL odwzorowuje fotel, lecz nie wydarzenie i nie obsługuje Back/Forward.

Kolejny feature powinien wykorzystać gotową ścieżkę stadionu i holdów, zamiast rozbudowywać wizualny polish MVP.

## Cel i zakres

Wprowadzić mały katalog dwóch jawnie demonstracyjnych wydarzeń na Enea Stadionie. Kibic wybiera wydarzenie, a następnie korzysta z niezmienionej ścieżki 2D/3D → grupa/koszyk → quote/hold. Każde wydarzenie ma osobny status, cennik demo, zapis lokalny, inventory i hold. URL pozwala otworzyć wydarzenie oraz opcjonalny fotel, a Back/Forward odtwarza właściwy event i jego wybór.

### Poza zakresem

- panel organizatora, tworzenie/edycja wydarzeń i import danych;
- oficjalni przeciwnicy, terminy, cennik lub nazwy handlowe klubu;
- płatności, zamówienia, bilety i checkout;
- różne stadiony lub różna geometria miejsc między wydarzeniami;
- sezonówki, pakiety wielomeczowe, presale i kody dostępu;
- zmiana domeny, hostingu, sekretów lub automatyczny deploy bez osobnego polecenia.

## Wymagania

### R1 — katalog demonstracyjny

- Istnieją dokładnie dwa lokalne wydarzenia na wspólnym katalogu 38 078 miejsc.
- Nazwy i daty są neutralnymi danymi demo, bez twierdzeń o oficjalnym terminarzu klubu.
- Każde wydarzenie ma stabilne `eventId`, tytuł, etykietę terminu demo, status, walutę PLN, regułę pojedynczych miejsc i funkcję ceny katalogowej.
- UI stale pokazuje `DANE DEMONSTRACYJNE`.

### R2 — wybór wydarzenia

- Nad filtrami pojawia się czytelny wybór wydarzenia z bieżącym tytułem, terminem i statusem.
- Zmiana eventu wraca do panoramy, ale odtwarza osobny zapis target eventu, jeśli istnieje.
- Przy aktywnym holdzie przełączenie wydarzenia jest zablokowane. UI wymaga najpierw zwolnienia lub zakończenia blokady, aby nie pozostawić aktywnego holda bez widocznego kontekstu.
- Ta sama blokada dotyczy `popstate` i ręcznie wpisanego URL-u prowadzącego do innego eventu. UI pozostaje przy evencie aktywnego holda, pokazuje komunikat i przez `replaceState` przywraca jego kanoniczny URL bez dodawania wpisu ani pętli historii. Po release/expiry nawigacja działa normalnie.
- Nieaktywny koszyk nie przecieka między wydarzeniami; powrót do eventu może odtworzyć wyłącznie jego własny zapis.

### R3 — jeden dynamiczny event context

- `eventId` i polityka wydarzenia pochodzą z jednego rekordu katalogu przekazanego do doświadczenia kibica.
- `useLiveHold`, `useSectionInventory`, reguły wyboru, etykieta eventu i ceny katalogowe korzystają z tego samego event context.
- Zmiana eventu unieważnia starsze odpowiedzi inventory, odłącza subskrypcje/timery poprzedniego flow holda i nie może nanieść snapshotu starego eventu na nowy. Disposal klienta nigdy sam nie zwalnia serwerowego holda; release pozostaje wyłącznie jawną, potwierdzoną operacją API.
- Geometria oraz kanoniczne seat ID pozostają wspólne; cena/status są kontekstem wydarzenia.

### R4 — izolacja serwera i danych

- Drugi event jest dodany migracją do prywatnego schematu `sb_hold` jako osobny rekord i osobny komplet kanonicznych miejsc. Powielenie rekordów jest świadomym kosztem obecnego modelu `(event_id, seat_id)`: aktywny blok wymaga pełnej migawki do walidacji, a każdy widoczny fotel ma pozostać wybieralny. Docelowe współdzielenie chartu i osobny pricebook są przyszłą zmianą modelu, nie częścią B1.
- Cena drugiego wydarzenia różni się w kontrolowany, udokumentowany sposób od pierwszego, aby browser test wykrywał przeciek kontekstu.
- Quote, hold, current, release i inventory zawsze używają wybranego `eventId`; odpowiedź innego eventu jest odrzucana jak dotychczas.
- Cookie sesji może posiadać osobne holdy per event zgodnie z istniejącym modelem bazy, ale UI pozwala przełączyć event dopiero bez aktywnego holda bieżącego eventu.
- Migracja jest addytywna i idempotentna; nie usuwa ani nie nadpisuje istniejących holdów `enea-demo`.

### R5 — URL, deep link i historia

- Kanoniczny URL używa `?event=<eventId>` oraz opcjonalnie `&seat=<seatId>`; zachowuje dozwolony `renderer=local`.
- Brak `event` otwiera domyślne `enea-demo`; nieznane lub zbyt długie ID daje domyślne wydarzenie i czytelny komunikat, bez żądania do backendu obcego eventu.
- Zmiana eventu tworzy wpis historii (`pushState`). Zmiana fotela wewnątrz eventu może nadal używać `replaceState`, aby nawigacja między sąsiadami nie zaśmiecała historii.
- `popstate` odtwarza wydarzenie i opcjonalny fotel z URL bez kopiowania koszyka między eventami i bez pętli `pushState`/`replaceState`.
- Link kopiowany do miejsca zawiera event i fotel.
- `?renderer=local&event=<inny>&seat=...` nie uruchamia obcego katalogu w historycznym rendererze. Adres jest kanonizowany przez `replaceState` do default eventu, a seat jest ponownie walidowany w katalogu legacy; niepasujący seat znika z URL i pojawia się komunikat.

### R6 — kompatybilność i komunikaty

- Stary link `?seat=<id>` nadal otwiera fotel w domyślnym `enea-demo`.
- Dotychczasowy zapis `salesbeyond:enea-demo:fan:v1:*` może być jednorazowo odczytany dla domyślnego eventu, ale nowe zapisy są wersjonowane i event-scoped. Zapis fan state zawiera tylko seat ID i preferencje. Osobny, event-scoped klucz flow holda może zawierać nieautorytatywny `holdId` pointer zgodnie z istniejącym kontraktem; nigdy ceny, statusy, session cookie ani token. Restore zawsze weryfikuje stan przez API `current`/`get`.
- Dwa runtime events katalogu i produkcyjnego demo pozostają `open`, aby oba przechodziły cały flow. Osobne syntetyczne fixtures testują `paused`, `closed` i `cancelled` bez dodawania trzeciego wydarzenia do UI/DB. Live inventory jest autorytatywne: `open → open`, a `paused|closed|cancelled → closed` w bieżącym `EventStatus`, co blokuje add/quote/create i zachowuje podgląd.
- Wszystkie komunikaty rozróżniają „cena katalogowa demo” od ceny potwierdzonej przez serwer.

## Kryteria akceptacji

### AC1 — katalog i UI

Na desktopie i 390×844 widoczne są dwa wydarzenia demo. Zmiana eventu aktualizuje tytuł/status/ceny bez poziomego overflow i bez błędów konsoli.

### AC2 — izolacja sesji

Dodanie miejsc do koszyka eventu A, przełączenie do B i powrót do A dowodzi: A i B mają osobne zapisane koszyki, żaden nie widzi koszyka drugiego, a powrót odtwarza właściwy. Nieznany/resetowany event nie nadpisuje storage default eventu. Fan state nie zawiera cen/statusów; flow holda może zawierać wyłącznie nieautorytatywny `holdId` pointer, nigdy cookie lub token sesji.

### AC3 — live inventory i ceny

Ten sam seat ID w A i B ma dwie kontrolowane ceny. Liczniki/tooltip mapy, ticket panelu, koszyk, quote i hold pokazują cenę właściwego eventu oraz walutę z live inventory; geometria 3D zachowuje to samo ID/status. W live mode fixture price nie zastępuje `priceMinor`/version serwera. Spóźniona odpowiedź inventory A po przełączeniu do B jest ignorowana.

### AC4 — holdy i blokada zmiany

W A można utworzyć hold i podczas aktywnego holda nie można przełączyć wydarzenia chooserem, Back/Forward ani ręcznym URL-em. UI/URL pozostają przy A, current hold nie znika i pojawia się komunikat. Po release przełączenie do B działa; quote/hold B ma `eventId=B`, a `current(A)` nie jest pokazywany w B. Konflikt miejsc pozostaje izolowany per event.

### AC5 — deep links i historia

Świeże konteksty otwierają: zwykły URL, `?seat=...`, `?event=B`, `?event=B&seat=...` i nieprawidłowy event. Sekwencja A+seat1 → seat2 (`replace`) → B+overview (`push`) → Back odtwarza A+seat2, a Forward B+overview. Refresh/deep link zachowuje event/seat, selection jest walidowany w jego katalogu, a koszyki pozostają prywatne i event-scoped.

### AC6 — kompatybilność i fallback

Stary link i dotychczasowy zapis default eventu działają. Brak WebGL pozostawia wybór eventu, plan 2D, koszyk i hold. `?renderer=local&event=B&seat=...` jest bezpiecznie kanonizowany do default eventu; seat pozostaje tylko jeśli istnieje w legacy chart, a Back/Forward nie może przywrócić niezgodnego katalogu.

### AC7 — jakość i wdrożenie

Lint, typecheck, pełne testy i build przechodzą. Browser QA obejmuje 1440×900 i emulowane 390×844, WebGL2 i fallback 2D. Migracja jest sprawdzona na izolowanej bazie przed zastosowaniem; produkcyjna migracja/deploy wymagają osobnej, jawnej autoryzacji właściciela.

## Projekt rozwiązania

1. `src/data/event.ts`: zastąpić pojedynczy fixture typowanym katalogiem, resolverem eventu i eventowym przeliczeniem katalogowych cen.
2. Nowy czysty moduł routingu event/seat: parsowanie, kanonizacja URL, decyzja push/replace i interpretacja `popstate`; testy bez React.
3. Wydzielić z `App.tsx` lekki właściciel wyboru eventu oraz `EventExperience` kluczowany `eventId`. Remount event experience gwarantuje disposal hooków i reducerów bez ręcznego czyszczenia kilkunastu stanów.
4. Sparametryzować `useFanSession`, `useLiveHold` i `useSectionInventory` przez event context. Klucze storage i flow holdów są event-scoped.
5. Dodać chooser oraz stan zablokowany podczas aktywnego holda; zachować polski UI i oznaczenia demo.
6. Dodać addytywną migrację drugiego wydarzenia i jego miejsc. Najpierw testy SQL na izolowanym PostgreSQL, potem — dopiero po osobnej zgodzie — produkcyjny Supabase.
7. Testy domenowe/hooków: routing, migracja storage, cross-event race, disposal, price/status/hold isolation.
8. Browser QA: desktop/mobile, WebGL2/fallback, deep links, history, koszyki i dwa eventy. Production QA dopiero po autoryzowanym deployu.

## Ryzyka i otwarte pytania

- Drugi fixture powiela 38 078 rekordów miejsc. Jest to akceptowalne dla demo, ale nie jest docelowym modelem współdzielenia chartu/pricebooku.
- Refaktor granicy `App`/`EventExperience` dotyka dużego komponentu; wymaga testów lifecycle i zachowania całego V3.
- `popstate` podczas aktywnego holda jest rozstrzygnięty przez R2/AC4: pozostawić bieżący event i `replaceState` jego kanonicznego URL-u, bez nowego wpisu historii.
- Drugi event i jego ceny są demonstracyjne. Bez źródła klubowego nie wolno przedstawiać ich jako terminarza lub cennika.
- Specyfikacja nie upoważnia do migracji produkcji ani deployu; te kroki pozostają zastrzeżone.

## Realizacja

Właściciel zatwierdził rozpoczęcie B1 poleceniem „ok, działajmy” 2026-11-24. Implementacja rozpoczęta; produkcyjna migracja i deploy nadal wymagają osobnego polecenia.

Implementacja lokalna zakończona: katalog, routing, chooser, event-scoped session/inventory/hold, historia i migracja eventu B przechodzą lint, typecheck, 199 testów domenowych/integracyjnych, build oraz QA desktop/mobile. W trakcie browser QA poprawiono rozjazd ID migracji, utratę ceny eventu przy kanonizacji selection i restore fotela przez Back. Produkcyjna baza nadal zawiera tylko `enea-demo`; B1 pozostaje `in-progress` do osobnej autoryzacji migracji i deployu.

## Niezależny przegląd

Świeży read-only review Luny wskazał cztery must-fix: historię podczas aktywnego holda, rozdzielenie statusów runtime/test, precyzyjny kontrakt storage/hold pointer oraz kanonizację historycznego renderera. Wszystkie włączono do R2/R5/R6 i AC2–AC6. Doprecyzowano też lifecycle disposal bez release, miejsca prezentacji ceny i dokładną sekwencję Back/Forward. Pełny drugi inventory pozostaje świadomym zakresem, ponieważ obecny live overlay waliduje komplet aktywnego bloku i każdy fotel obu wydarzeń ma przejść pełny flow.
