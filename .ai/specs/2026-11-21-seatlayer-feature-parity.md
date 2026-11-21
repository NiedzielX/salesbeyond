---
status: draft
created: 2026-11-21
owner: NiedzielX
related:
  - .ai/specs/2026-11-17-functional-stadium-mvp.md
  - docs/FAN_EXPERIENCE_ROADMAP.md
  - docs/PROJECT.md
  - .ai/runs/2026-11-21-seatlayer-parity-agent.md
---

# Plan funkcji referencyjnych SeatLayer

## Problem

Właściciel chce planu obejmującego katalog funkcji SeatLayer oraz dalszy rozwój SalesBeyond. SalesBeyond już używa przypiętego `@seatlayer/core@0.109.1` publicznego API do natywnego planu 2D, ale własny model 3D, przepływ kibica, API holdów i UI są osobnymi elementami projektu. Publiczna oferta SeatLayer obejmuje znacznie szerszy produkt: SDK, kanały sprzedaży, narzędzia organizatora, checkout, operacje wydarzenia i usługi dla wielu klientów.

Plan rozróżnia cztery poziomy dowodów:

- **Kod repo** — stan potwierdzony przez lokalne źródła/testy. To dowód implementacji, nie odbioru wizualnego ani działającej ścieżki w przeglądarce.
- **Publiczne docs SeatLayer** — funkcja opisana w oficjalnych dokumentach; nie jest niezależnym audytem działającego produktu.
- **Publiczne repo SeatLayer** — istnienie i deklarowany cel opublikowanego repozytorium; sam landing/README repo nie dowodzi zachowania pakietu w runtime.
- **Niepotwierdzone** — publiczne źródła nie wystarczą do nazwania zachowania lub gwarancji; nie planować jako faktu bez dalszego potwierdzenia.

Katalog źródeł jest stanem publicznym sprawdzonym 2026-11-21, a nie gwarancją kompletności przyszłych wydań. Marketingowe opisy wydajności, dostępności, języków, integracji i skali traktujemy jako twierdzenia SeatLayer; nie przenosimy ich automatycznie na SalesBeyond ani nie deklarujemy ich jako zweryfikowane.

## Cel i zakres

Przygotować kolejność i kryteria do samodzielnego, wyróżnionego SalesBeyond produktu, który pokrywa istotne publicznie opisane funkcje seat-picking i ticketing-platform SeatLayer, zachowując istniejący wygląd i model Enea. Najpierw doprowadzić istniejący pełny fan journey do rzeczywistego odbioru; następnie rozważać produktowe luki. Nie planować kopiowania prywatnego silnika SeatLayer ani usuwania obecnej zależności/należytych notices.

### Poza zatwierdzonym MVP — decyzja właściciela wymagana przed implementacją

- Płatności, finalizacja zakupu, wystawianie biletów, refundy, konta i obsługa produkcyjnej sprzedaży.
- Zarządzanie chartem przez klub: designer/editor, publikowanie, dashboard operacyjny, box office, kontrola wejść, raporty, role, kanały i partnerzy.
- SaaS/multitenancy, white-label embed jako produkt B2B, obce SDK/platformy/rynki, pakiety sezonowe i wielowydarzeniowe, AI organizer/buyer tools.
- Użycie dowolnego dodatkowego pakietu SeatLayer poza obecnym przypiętym publicznym API. Każda zmiana zależności podlega osobnej specyfikacji i przeglądowi licencji/wiekowi release.

Edytor i panel organizatora są poza MVP zgodnie z wcześniejszym zakresem właściciela. Najnowsze polecenie „wszystkie funkcjonalności” uzasadnia ich opis w katalogu i opcję fazy przyszłej, ale nie jest milczącą zgodą na zmianę produktowego zakresu.

## Katalog źródłowy i poziom potwierdzenia

Oficjalny punkt odniesienia to [SeatLayer Features](https://seatlayer.io/features/), [web SDK docs](https://docs.seatlayer.io/buyer-sdk/web/), [3D seat map](https://seatlayer.io/3d-seat-map/), [3D SDK guide](https://docs.seatlayer.io/buyer-sdk/add-3d-seat-view/), [product model](https://docs.seatlayer.io/start/product-model/) i [publiczna organizacja GitHub](https://github.com/seatlayer). Docs opisują gotowy picker/mapę/3D, hold i granicę checkout; strona funkcji opisuje Designer, organizer ops, kanały, SDK, webhooki, AI i hosted ticketing. GitHub publicznie kataloguje klienta web/mobile oraz serwerowe SDK. W razie sprzeczności szczegóły integracji należy sprawdzać w aktualnej wersji docs/release, nie ekstrapolować z nazwy pakietu.

## Macierz parytetu i realizacji

Priorytet: **P0** = pełny, wcześniej uzgodniony scenariusz kibica/odbiór; **P1** = uzupełnienie fan pickera przed produkcyjnym use-case; **P2** = platforma sprzedaży/organizatora, wyłącznie po zatwierdzeniu nowego zakresu. Kolumna „Stan SalesBeyond” mówi o kodzie, a nie o odbiorze end-to-end.

| Funkcja (publiczny opis SeatLayer) | Źródło i dowód | Stan SalesBeyond / konkretna luka | Priorytet, zależności | Kryterium akceptacji i sposób sprawdzenia |
|---|---|---|---|---|
| Jedna lista miejsc, chart 2D, statusy, wybór dokładnego miejsca | [Web SDK](https://docs.seatlayer.io/buyer-sdk/web/), [features](https://seatlayer.io/features/) — public docs | **Kod repo:** pełny chart 38 078 foteli/19 bloków; wspólny wybór, natywny 2D oraz SVG fallback. Stany demonstracyjne i event/sekcja z usługą są implementowane przez SalesBeyond, nie przez silnik 2D. | P0. Zależy od P0 odbioru całej ścieżki. | W przeglądarce sprawdzić wybrany ID/cenę/status w panelu, mapie, 3D, koszyku, holdzie i po reloadzie. Sprawdzić rozjazd między odczytaną sekcją live a resztą demo. Testy obecnych mapowań + browser QA; nie uznawać samych testów chart compiler za odbiór UI. |
| Plan ↔ widok 3D i seat-view | [3D feature](https://seatlayer.io/3d-seat-map/), [3D guide](https://docs.seatlayer.io/buyer-sdk/add-3d-seat-view/) — public docs | **Kod repo:** 2D używa `createRenderer` z przypiętego `@seatlayer/core`; domyślne 3D to nasze R3F, 38 078 miejsc, własny model/kamera, a `?renderer=local` to historyczny wariant 648. Lot, widok fotela, dach, miniatura i sympatyczne 2D fallback istnieją. **Gap:** brak bieżącego odbioru WebGL i mobile; feature docs zawierają szczegóły niezrealizowane lub nieweryfikowane (ładowanie 3D tylko na żądanie, sąsiedni fotel strzałkami, 360° pan/pinch, własne fotografie). | P0. Najpierw odbiór przeglądarkowy; potomne optymalizacje dopiero po pomiarze. | Obejrzeć panoramę, cały blok, lot i stałą perspektywę na fotelu, kamerę w przeglądarce desktop/mobile, 2D przy braku WebGL. Jeśli zatwierdzone: strzałki poprzedni/następny fotel oraz recenter muszą zmieniać/pokazywać ID bez resetu chartu. Oceniać WebGL na realnym ekranie i reduced motion; testy domenowe uzupełniają, nie zastępują. |
| Orbit/pan/zoom, locate section→row→seat, etykiety i selekcja z 3D | [3D feature](https://seatlayer.io/3d-seat-map/) — public docs | **Kod repo:** wybór bloku i fotela w scenie, interakcje kamery, skupianie/lot do fotela; wszystkie ID wspólne. **Gap do odbioru:** dokładny locator 3-stopniowy i czytelność numerów 3D, gesty mysz/dotyk oraz focus na dużym chart nie są potwierdzone end-to-end. | P0/P1. Zależne od odbioru desktop/mob. | Dla próbki przedniego/środkowego/górnego/narożnego bloku wejść przez panel i scenę do tego samego ID; sprawdzić zoom/pan/reset i mobile pinch/tap. Zapisać każdy zaobserwowany problem i zrzuty w osobnym QA. |
| Ceny, kategorie, filtry i best available/grupy | [Features](https://seatlayer.io/features/) — public docs | **Kod repo:** filtry ceny/statusu, liczniki, grupy 2–6 obok siebie w rzędzie/bloku, budżet, atomowe dodanie, limit 10 i „nie zostawiaj singli”. Dane są poglądowe, z usługą tylko aktywnej sekcji. **Gap:** brak weryfikacji ścieżki w działającej przeglądarce i brak wyszukiwania prawdziwej ceny/wyboru zewnętrznego cennika. | P0 odbiór, P1 rozszerzenie katalogu kategorii. | Obejrzeć grupę z wynikami/bez wyników, filtr/cenę, istniejący koszyk, luki/alejki, aktywny hold i polling. ID, ceny i suma muszą zostać spójne, a brak fresh inventory pokazać jasno. Testy reguł + scenariusze manualne. |
| Accessible seat types i filtr dostępności; wiele poziomów | [Features](https://seatlayer.io/features/) — public docs claim: typy dostępności i bay dla wózka jako odrębne od foteli; buyer filter | **Kod repo:** brak znaku wheelchair/accessibility/ticket-type w typie rekordu `Seat`/katalogu lub UI; stosowane są standardowe miejsca i standardowa cena. **Gap:** model danych, chart, nawigacja/filtrowanie i informacja o miejscach dostępnych; nie należy mieszać bay z fikcyjnym fotelem. | P1. Wymaga źródła prawdziwych danych/zakresu od właściciela oraz kontraktu chartu/API. | Jeśli zatwierdzone i dostarczono dane: oddzielne typy dostępności i bay, dokładne etykiety/filtr/legendę; testy mapowania 2D/3D/API, klawiatury i czytnika ekranu. Bez danych geometrycznych oznaczyć jako niewspierane, nie zgadywać. |
| Responsive picker, mobile fullscreen, keyboard/reduced-motion; wiele języków | [Features](https://seatlayer.io/features/), [3D feature](https://seatlayer.io/3d-seat-map/) — public docs claims: responsywność, dostępność mobile i language pack | **Kod repo:** polski interfejs, focus/ARIA, fullscreen, reduced motion w kamerze oraz layout mobile istnieją. **Gap:** QA przeglądarkowe zablokowane, szczególnie dotyk/ekrany; brak udokumentowanej lokalizacji wielu języków/selector. Publiczne twierdzenie o 43 językach nie jest naszym kryterium. | P0 pełna QA; P1 dodatkowe locale tylko po decyzji rynku. | Zgodnie z projektem: 390×844 i 1440×900, dotyk/klawiatura, bez overflow; test czytnika ekranu dla najważniejszych kontrolek, reduced-motion, utraty WebGL i focus retention. Lista locale po decyzji; brak obietnic zasięgu bez ręcznej weryfikacji. |
| Temporary hold, expiry, conflict, recovery, shared live inventory | [Web SDK](https://docs.seatlayer.io/buyer-sdk/web/), [product model](https://docs.seatlayer.io/start/product-model/) — public docs | **Kod repo:** własna transakcyjna usługa demo holdów Supabase/Vercel, cena/wersja, sesja HttpOnly, wygaśnięcie, release/reload, conflict i odczyt live sekcji. Nie jest to SeatLayer booking backend ani system produkcyjny ticketing. Działająca usługa ma dowody HTTP; cały UI flow nie odebrany. | P0 QA całego flow. Każda migracja komercyjna/infrastrukturalna osobno P2 i owner-approved. | Przeglądarkowy scenariusz: quote/confirm/reload/countdown/expiry/release + druga sesja, race conflict i spójność holda w 2D/3D/panelu. Weryfikować HTTP/Postgres concurrency; UI status nadal oczekuje realnego QA. Nie łączyć holda z zakupem. |
| 360° zdjęcia/panoramy z poziomu miejsca/rzędu/bloku/piętra/obiektu | [3D feature](https://seatlayer.io/3d-seat-map/) — public docs claim, media zastępują render 3D tam, gdzie są | **Kod repo:** miniatura z renderer screenshot po dotarciu; brak uploadu/originalnych fotografii/panoram i priorytetów fallback. To wstępny obraz geometrii, nie 360° asset. | P1 po odbiorze 3D; asset/licencja oraz storage/metadata wymagają decyzji. | Jeśli zatwierdzone: fixture scenariusze seat→row→section→venue image, najbliższy asset/fallback 3D, prawidłowa orientacja na mobile, prywatność i licencja assetów. Nie opisywać geometrycznej miniatury jako fotografii. |
| Event switch / wiele eventów; prosta widoczność/sprzedaż statusu open, paused, closed, cancelled | [Product model](https://docs.seatlayer.io/start/product-model/), [web SDK](https://docs.seatlayer.io/buyer-sdk/web/) — public docs | **Kod repo:** model przykładowego eventu, selector/status oraz API holda per event istnieją; wejściowe UI używa demo fixture, nie pełnego katalogu wydarzeń/importu eventów. | P1 fan app; event list może wymagać połączenia prawdziwego katalogu. | Dla co najmniej 2 eventów pokazane chart/prices/inventory są rozdzielone, URL/deep link jednoznaczny, status blokuje hold, a podgląd nadal działa; odrębne testy event scope/race. |
| Shareable exact-seat route / preserve buyer flow | [3D SDK guide](https://docs.seatlayer.io/buyer-sdk/add-3d-seat-view/) — public docs describes route restore via callback | **Kod repo:** URL seat link, back/forward i lokalne wznowienie ID/preferences istnieją; tożsamość host app i link nie zawierają cudzej sesji/koszyka. **Gap:** brak pełnego QA linku w mobile/real browser, brak journey event/campaign. | P0 browser QA. | Kopiuj/otwórz link w czystym kontekście, zachowaj wyłącznie dokładny dozwolony ID/podgląd; historia wstecz/dalej odtwarza stan, koszyk odbiorcy pozostaje jego, nieznany event/seat bez crasha. |
| Embed buyer picker and SDK/headless integration | [Web SDK docs](https://docs.seatlayer.io/buyer-sdk/web/), [GitHub org](https://github.com/seatlayer) — public documented surfaces/packages | **Kod repo:** aplikacja pełnoekranowa SalesBeyond, własny same-origin API. Nie ma osobnego embed contract, external consumer SDK, framework wrapper, versioned public API or host callbacks. | P2 — nowy produkt B2B i osobny zakres. | Dopiero po zatwierdzeniu: versioned public API, origin/resize/theme/router/checkout callback contracts; sample host app + integration tests, backward compatibility, docs. Nie zakładać istniejącego React componentu na podstawie użycia `@seatlayer/core`. |
| Ticket checkout, booking, payment gateway, tickets, email and refunds | [Features](https://seatlayer.io/features/), [product model](https://docs.seatlayer.io/start/product-model/) — official product claims, public boundary says SDK buyers keep their own checkout/payment/orders/delivery | **Kod repo:** wybór/podsumowanie demo i hold; jawnie nie ma checkout/payments/ticket fulfilment/refundów. | P2 i wymaga zatwierdzenia zakresu, operatora biletów oraz integracji finansowej. | Wymaga osobnej specyfikacji, audytu bezpieczeństwa i compliance; testy idempotencji, payment webhook/reconciliation/refund, ticket issuance/QR/receipt, cancellation; w stagingu/test mode przed jakimkolwiek realnym przepływem. Plan nie stanowi zgody na transakcje. |
| Platform API: REST/server SDK, webhook signing/retry/replay, JavaScript/mobile clients | [SeatLayer GitHub](https://github.com/seatlayer), [features](https://seatlayer.io/features/) — public package catalog/claims | **Kod repo:** nasze własne Supabase API i internal types; używamy tylko publicznego, niskopoziomowego `@seatlayer/core` chart/layout/render API. Nie implementujemy ani nie posiadamy obcego API/SDK/webhook contract. | P2, tylko po decyzji o integracji/partnerstwie/konkurencyjnym B2B SDK. | Wykonać inventory aktualnych oficjalnych kontraktów przed decyzją. Dla własnego API: wersjonowanie, HMAC/webhook retries/idempotency, authz, event isolation; contract tests i mock server. Nie kopiować niepublicznego zachowania. |
| Chart Designer: sections/rows/arc/tier/floor/tables/booths/GA, price categories, accessibility, validation, draft/review/publish, templates/import/trace | [Features](https://seatlayer.io/features/), [product model](https://docs.seatlayer.io/start/product-model/) — public docs | **Kod repo:** chart naszego Enea modelu jest kodem/fixture; brak wizualnego chart edytora, draft/publish/revision workflow, importu planu, generatora template lub narzędzi walidacji operatora. Zmiana layoutu wymaga prac w repozytorium. | P2 — jawnie poza MVP z 2026-11-17. | Właściciel najpierw określa administratorów, źródło chartu, role i publikację. Potem osobna spec: draft→walidacja→preview→owner-reviewed publish, bez nieautoryzowanych zmian dostępnego eventu; test importu/roundtrip/pozycji wszystkich seat ID/rollback revision. |
| Control Room/live board, block/release/house holds, category/channel management, reporting/export | [Features](https://seatlayer.io/features/), [product model](https://docs.seatlayer.io/start/product-model/) — public docs | **Kod repo:** panel kibica widzi dostępność wybranej sekcji oraz własny hold; nie ma staff role, globalnego dashboardu, blokowania/kategorii raportowania ani eksportu. | P2 — organizer/admin poza zatwierdzonym MVP. | W osobnym zakresie: autoryzacja staff/operatora, read-only vs mutation roles, write audit log, block/release guards, live totals reconciled to inventory, export privacy; testy cross-tenant denial i audit trail. |
| Box office, door/check-in, QR/per-seat tickets, sales & aggregate reports | [Features](https://seatlayer.io/features/) — public product description | **Kod repo:** brak order/ticket issue, counter sale, credential scan/check-in, live sale reporting. | P2, zatwierdzenie właściciela i operacyjnego partnera wymagane. | End-to-end tylko w dedykowanym stagingu: walk-up order ↔ same inventory; scan/idempotency/re-entry policy; ticket revoke/refund; report sums reconcile; operator/device error recovery. |
| Channels/partner allocations, audience pricing, invites/private links, schedule release | [Features](https://seatlayer.io/features/), [product model](https://docs.seatlayer.io/start/product-model/) — public docs | **Kod repo:** reguły statusu eventu demo, brak członkostwa, presale/partner allocations, access token/roles, channel pricing czy invite flows. | P2; zależne od auth, event/catalog, operator controls i checkout. | Osobny access-control model; public/member/partner/box-office test matrix, allocation cannot oversell combined stock, forged/reused token denied, audit release time, prices canonicalized by server. |
| Organizer dashboards, workspace/multi-tenant isolation, embedded Designer/Control Room, custom domain/hosted event pages | [Product model](https://docs.seatlayer.io/start/product-model/), [features](https://seatlayer.io/features/) — public docs claims | **Kod repo:** pojedyncza aplikacja i jedna koncepcyjna venue; brak tenant/workspace, admin, own-domain/hosted checkout. | P2 i nowy produkt/operacje, nie MVP. | Najpierw decyzja B2B vs self-hosted/white label. Jeśli wybrano: tenant isolation test, capability-based short-lived embedded session, origin scoping, workspace ownership checks, custom-domain lifecycle, data export/retention review. |
| Performance Groups / fixed multi-date runs, renewable seat seasons/renewals | [Web SDK docs](https://docs.seatlayer.io/buyer-sdk/web/), [product model](https://docs.seatlayer.io/start/product-model/) — docs nav/model describes these surfaces | **Kod repo:** jeden event demo, bez rezerwacji abonamentowych, przypisania miejsca across dates, rights/renewal. | P2; oddzielny product option requiring owner approval. | Spec osobno: immutable dates/seats, incumbency/renewal/amendment lifecycle, availability/conflict behavior and refunds; reconcile all events to same stable seat IDs and server booking. Verify actual package/platform support per release before selection. |
| AI/agent features: chart copilot/MCP, buyer WebMCP | [Features](https://seatlayer.io/features/) — public docs claims and product surfaces | **Kod repo:** brak organizer AI, MCP, buyer WebMCP. Existing user-facing group finder does not imply AI. | P2/opcjonalne; after core product and access model. | Only opt-in, explicit capabilities; buyer tool can inspect/find/select only and never charge/commit on own. Every edit becomes draft awaiting human publishing. Add permission tests and tool contract, data-minimization review. |

## Zatwierdzony zakres i kolejność planu

### Etap A — P0: dowieźć i odebrać obecne pełne doświadczenie kibica

Bez dodawania nowego backendu lub produktu: odblokować właściwą procedurą możliwość niezależnego browser QA (bez obchodzenia wcześniejszej odmowy), odebrać działający UI na 390×844 i 1440×900, keyboard/touch, pełny chart 2D, R3F 3D, wybór fotela, seat link, filtry/grupę/koszyk/hold/recovery/release i stany błędów. Obejrzeć widownię empty/full, stadion/perspektywy, fallback i rzeczywiste WebGL. Utrzymać otwarty status, gdy real browser evidence nie istnieje. Zmierzyć bottlenecks przed proponowaniem optymalizacji; nie przyjmować CPU testu jako GPU/browser proof.

**Gotowe gdy:** wszystkie scenariusze V1–V5 z `docs/FAN_EXPERIENCE_ROADMAP.md` mają dowód albo konkretną blokadę/otwarte AC; dane demo i ograniczenia są czytelne; żadna ścieżka holda nie sugeruje zakupu.

### Etap B — P1: buyer-facing gaps po odrębnym review i zatwierdzeniu

Wybrać tylko udokumentowane luki potrzebne dla fan journey: event selector/multi-event; buyer accessibility categories (wyłącznie z poprawnym katalogiem miejsc); wygodny next/previous seat locator; 360° media fallback, gdy dostępne legalne assety; locale; lazy-loading 3D/scope graficzne; poprawa touch/keyboard. Każda luka otrzymuje własne draft SDD, testowalne AC i dowody. Nie dodawać danych zmyślonych ani nie oznaczać zwykłej miniatury jako 360°/zdjęcia.

### Etap C — P2: rozszerzenie do rzeczywistej platformy sprzedaży, opcjonalne

Przed startem właściciel wybiera jedną ścieżkę: (a) pozostajemy demonstratorem fan experience; (b) własny produkcyjny checkout/ticketing; (c) SDK/white-label B2B; (d) Hosted event management z panelem. Opcje (b)–(d) wymagają osobnej specyfikacji produktu, modelu operacyjnego, autoryzacji, danych, płatności oraz przeglądu prawnego/bezpieczeństwa. Nie wdrażać ich jako niejawnej konsekwencji „feature parity”.

### Etap D — P2: organizer/admin, tylko na wyraźne polecenie

Zaplanować chart authoring/revisions/publishing, workspace/roles, Control Room, allocation, box office, check-in/tickets/reports oraz AI jako odrębne domeny i osobne specyfikacje. Preferować wydzielone moduły usług/backendu zamiast rozrostu `App.tsx`. Najpierw rozstrzygnąć kto zarządza miejscami i który jest system źródłowy. Utrzymać testy dla tenant isolation i security. Wcześniej zatwierdzony brak editor/admin nadal obowiązuje.

## Gotowe zadania do następnych przyrostów

1. **Niezależny review tego draftu (read-only, Luna lub Sol).** Przejrzeć linki i wiersze matrix; wskazać źródła zbyt niepewne, duplicate/omitted feature groups, AC bez mierzalnego dowodu. Nie zmieniać statusu na approved.
2. **QA access/gating review (Sol).** W osobnym zadaniu, zachowując poprzednie browser-access refusal, ustalić jedynie dozwolony/przejrzysty sposób na niezależny odbiór host UI; brak obchodzenia środowiska i brak deklaracji pass bez ekranów. Root zatwierdza/wybiera mechanizm.
3. **P0 test-plan/spec draft (Luna, ograniczony do fan flow).** Powiązać istniejące AC z faktycznymi plikami: `src/App.tsx`, `src/components/StadiumMap.tsx`, `src/components/Stadium.tsx`, `src/domain/*`, `src/integrations/nativeMap.ts`, `src/integrations/seatHoldClient.ts`, `src/server/holdApi.ts`; uzupełnić manual QA kryteriami/artefaktami. Bez edycji aplikacji i bez uruchamiania browser przez niedozwolone kanały.
4. **Performance profile design (Luna).** Zaprojektować powtarzalny pomiar cold/warm load, chart ready, GPU frame-time i pamięci na reprezentatywnych urządzeniach/38 078 seats; bez benchmark claim przed fizycznym/browser pomiarem. Najpierw gromadzić baseline, potem osobna rekomendacja optymalizacji.
5. **P1 requirements decision (root/właściciel).** Zatwierdzić czy produkt ma pozostać single-event fan demo czy potrzebuje event catalog, accessibility types lub zdjęć 360°. Dopóki brak decyzji i realnych źródeł danych, nie implementować braków.
6. **P2 product boundary question (właściciel).** Dopiero po ukończeniu P0 ustalić, czy celem ma być sam fan journey, własny checkout, B2B SDK, czy panel organizatora; każda odpowiedź uruchamia osobną specyfikację.

## Budżet modeli, równoległość i review

- **gpt-6-luna:** ograniczone research/porównanie docs, matrix-row audit, test plan, read-only review i proste niezależne testy/czyste implementacje z własnym briefem. W tym zadaniu Luna odpowiada za research i draft planu.
- **gpt-6-sol:** złożone przepływy kamer/3D, wydajność, race/transaction/security oraz cross-module implementacje i autonomiczne debugowanie. Nie płacić kosztu Sol za prosty czytelniczy research.
- **Root:** właściciel integracji architektury i decyzji zakresu, sprawdza rzeczywisty git diff/lokalizację każdego zadania, uruchamia wymagane bramki i scala logiczne wyniki; delegowane raporty są wskazówkami, nie dowodem.
- Prace implementacyjne równoleglić wyłącznie po osobnych worktree/specyfikacjach i rozłącznych zakresach; root odpowiada za wspólne pliki sceny i aplikacji. Nie przekraczać limitu 3 oczekujących PR. Nie uruchamiać sub-agentów na drobne zadania, jeśli ich koszt przewyższa podział pracy.
- Nie podawać estymacji godzin bez danych o zespole i testach. Każdy przyrost zaczyna się od ryzyk/dependencies i AC, a kończy wynikiem testów/browser proof lub jawnie określoną blokadą.

## Kryteria akceptacji tego planu

- **AC1:** Każda publicznie potwierdzona główna rodzina SeatLayer (buyer map/selection, 3D/seat view, holds/booking boundary, client/server SDK, organizer/chart editor, operator tools, sales channels, hosted checkout/tickets, seasons/performance groups, AI) jest w macierzy z bezpośrednim source URL i statusem SalesBeyond.
- **AC2:** Każdy gap odróżnia brak kodu od istniejącego, ale nieodebranego kodu. Dowody repo wskazują pliki/README/roadmap; publiczne marketing claims są nazwane jako claims.
- **AC3:** Każdy wiersz matrix ma priorytet, dependency/owner gate, sprawdzalne kryterium akceptacji i sposób testu.
- **AC4:** Fazy respektują ustalony full fan experience, bez twierdzenia że to już accepted/closed; payment/organizer/editor/production features są odłożone do jawnego owner approval.
- **AC5:** Plan nie zaleca kopiowania kodu prywatnego silnika, usuwania `@seatlayer/core`, pozbycia się notice ani publikacji/zmian infrastruktury.
- **AC6:** Jest wskazany tani model dla ograniczonego researchu i droższy model tylko dla trudnej implementacji/security; każdy zakres przegląda root i niezależny reviewer przed zatwierdzeniem specyfikacji.

## Weryfikacja planu

- Przeczytać całą macierz względem powyższych źródeł i lokalnych README/types/API; sprawdzić trafność source URLs oraz czy cytowane źródło bezpośrednio wspiera komórkę.
- Review od świeżej sesji przed przedstawieniem do akceptacji, zgodnie z `AGENTS.md`; agent autorski nie zatwierdza własnego draftu.
- Nie uruchamiać testów aplikacji ani nie używać przeglądarki dla niniejszego dokumentacyjnego zadania. Przyszłe testy zostaną określone w osobnych implementacyjnych specs.

## Ryzyka i otwarte pytania

- Strona SeatLayer stale publikuje feature statusy; katalog może zmienić się po 2026-11-21. Przed implementacją zweryfikować właściwe public docs/API/release jeszcze raz.
- Public docs opisują kilka pakietów/platform, ale nie oznacza to, że funkcje dostępne są na wszystkich klientach czy kontach. Matrix mówi „publiczny opis” i wymaga weryfikacji wersji/support przed podjęciem decyzji.
- Brak niezależnej QA przeglądarkowej SalesBeyond w bieżącym zakresie. Nie wolno traktować dokumentacji ani build/test jako browser acceptance.
- Właściciel musi później rozstrzygnąć produktowe P1/P2 (czy projekt zostaje fan demo, czy staje się systemem ticketing/B2B). Powyższy plan to draft, nie zatwierdzenie nowego scope.

## Niezależny przegląd

Oczekuje na świeży review. Właściciel zatwierdza specyfikację; autor draftu nie zmienia statusu na `approved`.

## Realizacja

### Research i draft 2026-11-21

- Publiczne źródła wyszukane i przeczytane: `seatlayer.io/features/`, `seatlayer.io/3d-seat-map/`, `docs.seatlayer.io/buyer-sdk/web/`, `docs.seatlayer.io/buyer-sdk/add-3d-seat-view/`, `docs.seatlayer.io/start/product-model/`, `github.com/seatlayer` oraz publiczne opis repo `seatlayer/seatlayer-sdk`.
- Lokalny dowód bieżącego stanu: `README.md`, `docs/PROJECT.md`, `docs/FAN_EXPERIENCE_ROADMAP.md`, `.ai/specs/2026-11-17-functional-stadium-mvp.md`, `src/data/fullChart.ts`, `src/integrations/nativeMap.ts`, `src/server/holdApi.ts`, `src/integrations/seatHoldClient.ts`, `src/App.tsx`.
- Status: draft. Nie zmieniono kodu; brak browser QA/testi aplikacji w zakresie tego planowania.
