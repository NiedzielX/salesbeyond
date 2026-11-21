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

## Problem i zasady evidence

SalesBeyond używa przypiętego @seatlayer/core 0.109.1 public API do natywnego planu 2D. Własny produkt służy kibicom piłkarskim i klubom; Enea Stadion, autorska niegeodezyjna rekonstrukcja, stadionowy blueprint i widok z fotela wyznaczają kierunek. Domyślne 3D, interfejs, katalog, model venue i serwer holdów są osobną implementacją SalesBeyond. Plan obejmuje publicznie opisane rodziny funkcji SeatLayer; nie zakłada kopiowania prywatnego silnika ani nie twierdzi, że zna jego prywatną implementację. Zachowujemy własny design i poprawiamy football fan UX zamiast kopiować inne venue/flow.

Dowody są rozdzielone: **kod repo** oznacza implementację/testy źródła, nie browser acceptance; **publiczne docs/feature list** oznaczają opis producenta, nie niezależną walidację runtime; **publiczne repo** potwierdza istnienie/dokumentowany cel kodu, nie zachowanie pakietu; **niepotwierdzone** oznacza, że dalsze twierdzenie trzeba sprawdzić przed decyzją.

Oficjalne źródła główne: [SeatLayer Features](https://seatlayer.io/features/), [web SDK](https://docs.seatlayer.io/buyer-sdk/web/), [3D seat map](https://seatlayer.io/3d-seat-map/), [3D SDK guide](https://docs.seatlayer.io/buyer-sdk/add-3d-seat-view/), [product model](https://docs.seatlayer.io/start/product-model/), [publiczna organizacja GitHub](https://github.com/seatlayer). Uzupełniające docs: [buyer analytics](https://docs.seatlayer.io/buyer-sdk/analytics/), [customization](https://docs.seatlayer.io/customization/buyer-experience/), [pricing/offers](https://docs.seatlayer.io/platform/ticket-pricing-and-offers/), [groups and GA](https://docs.seatlayer.io/integrations/groups-and-ga/), [WordPress](https://docs.seatlayer.io/integrations/wordpress/), [iframe](https://docs.seatlayer.io/integrations/iframe/), [CRM/registration tools](https://docs.seatlayer.io/integrations/registration-tools/), [seasons](https://docs.seatlayer.io/integrations/seasons/), [performance groups](https://docs.seatlayer.io/integrations/performance-groups/), [webhook delivery](https://docs.seatlayer.io/webhooks/delivery-and-retries/), [events API](https://docs.seatlayer.io/server-api/events/).

## Cel i zakres

Najpierw domknąć i odebrać wcześniej zatwierdzone pełne doświadczenie kibica: stadion → sektor → rząd → fotel → podgląd → koszyk → demo hold/recovery. Istniejąca zatwierdzona specyfikacja i roadmapa wystarczają dla tych A-workpackages; nie wymagaj nowej draft spec tylko dlatego, że zaakceptowana funkcja nie jest jeszcze odebrana. Bugfixy w tym zakresie przechodzą te same kryteria istniejącej specyfikacji.

Nowe buyer capability oznaczono B; rozbudowę ticketing/admin/B2B oznaczono C. B i C są propozycjami zakresu, nie zgodą na implementację. Przed ich kodem wymagane jest zatwierdzenie właściciela i osobna specyfikacja. Editor i panel organizatora pozostają poza MVP zgodnie z wcześniejszą decyzją. Nie usuwać wymaganych notices ani obecnej zależności SeatLayer bez osobnego uzgodnienia.

Publiczna lista Features pokazuje 51 zdolności/statusów. Pokrycie rodzin: Designer/chart/import/templates → M15; buyer 2D/categories/accessibility → M1/M4/M9; 3D/navigation/media → M2/M3/M10; selection/hold/access → M4–M6/M16; mobile/localization/theme/analytics → M7/M11; SDK/API/webhooks/CMS → M13/M19; organizer/hosted/channel/CRM → M14/M17/M18/M20/M23; seasons/performance → M21; AI/MCP/agent docs → M22; test mode/workspaces → M16; groups/GA → M12. Dla twierdzeń sprawdzić aktualne źródło pod wierszem i konkretne SDK/wersję przed wdrożeniem.

## Macierz funkcji i pokrycia

A = zaakceptowany fan MVP (wdrożenie/QA/naprawy); B = nowa buyer capability; C = nowa platforma/operator. Mapa opisuje funkcję i jej właściwy workpackage. Workpackage backlog niżej definiuje kolejność, zależności, prawdopodobne pliki, kryteria i model.

| ID | Publicznie opisane SeatLayer feature + źródło | Stan/gap SalesBeyond, bez nadinterpretacji | Pakiet |
|---|---|---|---|
| M1 | Wspólny chart 2D/3D, exact-seat selection, live availability: [web SDK](https://docs.seatlayer.io/buyer-sdk/web/), [3D](https://seatlayer.io/3d-seat-map/) | Kod: 38 078 ID/19 bloków, publiczny createRenderer w 2D, SVG fallback; domyślne 3D R3F. Live inventory pobierane jest dla aktywnego bloku; reszta katalogu pozostaje demo, a zmianie bloku towarzyszy reset overlayu. Cały ekranowy flow nieodebrany. | A1, A2 |
| M2 | 3D venue, orbit/pan/zoom, tiers, locator: [3D](https://seatlayer.io/3d-seat-map/) | Własna scena football/Enea: cztery trybuny, narożniki, dach, POV; kamera ma row-focused framing i sector-bounded-pan. Testy obecne, brak browser visual acceptance. Lazy imports dzielą moduły Stadium/Map; aplikacja startuje z wybraną 3D powierzchnią, więc nie twierdzić, że scena 3D ładuje się dopiero po kliknięciu. | A1, A3 |
| M3 | 3D seat view oraz chart/media-sourced panoramas: [3D](https://seatlayer.io/3d-seat-map/), [media buyer view](https://docs.seatlayer.io/buyer-sdk/3d-view/) | Kod: lot, stały punkt widzenia, miniatura z geometrii. Brak fotografii/360° assetów; screenshot geometrii nie jest panoramą. | A1; B4 |
| M4 | Ticket categories, best-available groups, min/consecutive/no-orphan rules: [Features](https://seatlayer.io/features/), [SeatPicker API](https://docs.seatlayer.io/buyer-sdk/seat-picker/), [ticket offers](https://docs.seatlayer.io/platform/ticket-pricing-and-offers/) | Kod: lokalny filtr, group suggestion 2–6 sąsiadujących, limit 10 i opcjonalne no-orphan. Grupa do obejrzenia/dodania wymaga akcji użytkownika; to nie jest serwerowe best-available hold. Nie ma ogólnej reguły minimum wyboru ani ticket category. Ceny to demo. | A2; B5 |
| M5 | Temporary holds, visible timer, recovery; optional release-on-leave: [web SDK](https://docs.seatlayer.io/buyer-sdk/web/) | Kod: własny demo hold API, expiry, release, recovery i konflikt potwierdzone backendowo; pełna UI ścieżka nieodebrana. Obecny hold przeżywa opuszczenie pickera do TTL; opcjonalnego release-on-leave nie ma. Nie jest to final booking ani model prywatnych hold sessions SeatLayer. Known live snapshot dotyczy aktywnej sekcji; inne sektory są demo, a błąd refreshu zachowuje poprzedni znany snapshot tego samego bloku. | A2; C2 |
| M6 | Scoped access, exact-seat checkout handoff, URL callbacks, session restoration: [web SDK](https://docs.seatlayer.io/buyer-sdk/web/), [3D guide](https://docs.seatlayer.io/buyer-sdk/add-3d-seat-view/) | Kod: jawny ?seat= odtwarza podgląd; aktualizacja adresu używa history.replaceState; storage zapisuje ID/preferencje, nie cudzy koszyk. Brak popstate/back-forward. Przykład docs synchronizuje callbackiem host route; nie obiecuje automatycznego routingu SDK. | A2 open/reload/privacy; B1 route/history |
| M7 | Responsive, mobile, keyboard, reduced motion, WebGL 2D fallback: [3D](https://seatlayer.io/3d-seat-map/), [customization](https://docs.seatlayer.io/customization/buyer-experience/) | Kod: polski UI, focus/ARIA/fullscreen/reduced motion/fallback; aktualny ekran dotykowy/desktop nieodebrany. Publiczna strona producenta wymienia próg 3D dla telefonów 30k; chart SalesBeyond ma 38 078, więc ta marketingowa liczba nie jest limitem/targetem naszej aplikacji. | A3 |
| M8 | Event status and lifecycle: [Events API](https://docs.seatlayer.io/server-api/events/) | Kod: UI i hold hook przypięte do enea-demo; brak event selector. Nasze UI EventStatus open/closed/sold-out różni się od API inventory open/paused/closed/cancelled. SeatLayer event lifecycle active/archived/deleted i meta.salesState live/paused/ended to osobne pola, nie równoważne powyższym enumom. | A2 bieżące demo; B1 multi-event |
| M9 | Accessibility types/bays and buyer filters: [Features](https://seatlayer.io/features/), [groups and GA](https://docs.seatlayer.io/integrations/groups-and-ga/) | Typ Seat w katalogu nie ma typu dostępności; demo zawiera zwykłe miejsca. Brakuje prawdziwego źródła accessible bay/seat. | B2 |
| M10 | Next/previous seat, recenter, 360° photo fallback: [3D](https://seatlayer.io/3d-seat-map/) | Brak next/previous i osobnego recenter w perspektywie fotela; reset do panoramy już istnieje. Brak uploaded imagery. | B3 navigation; B4 media |
| M11 | Theme, currency, tiers, localization and buyer analytics: [customization](https://docs.seatlayer.io/customization/buyer-experience/), [pricing](https://docs.seatlayer.io/platform/ticket-pricing-and-offers/), [localization](https://docs.seatlayer.io/customization/localization/), [analytics](https://docs.seatlayer.io/buyer-sdk/analytics/) | Polski interfejs i demo PLN istnieją; brak locale/theme API, real ticket-tier pricebook i buyer analytics callbacks. Locale formatting nie zmienia waluty/ceny. | B5 |
| M12 | Mixed reserved seating + tables/GA capacity; pure-GA excluded: [groups & GA](https://docs.seatlayer.io/integrations/groups-and-ga/) | SalesBeyond ma wyłącznie siedzące miejsca; group-finder nie oznacza stołów ani GA. | C1/C2 |
| M13 | Web/native client SDKs; seven server SDK families and REST/OpenAPI: [client SDKs](https://docs.seatlayer.io/buyer-sdk/), [server SDKs](https://docs.seatlayer.io/server-sdk/), [GitHub](https://github.com/seatlayer) | Public sources enumerate web JS/React/Vue/Angular, WordPress, Flutter, React Native, iOS, Android and server SDKs Node.js, Python, PHP, Java, Go, Ruby, .NET + REST. SalesBeyond jest pojedynczą React aplikacją i własnym same-origin API; nie jest wieloplatformowym SDK. | C2/C3 |
| M14 | Trusted backend holds→booking vs hosted checkout, orders, payments, tickets, email/refunds: [product model](https://docs.seatlayer.io/start/product-model/), [hosted checkout](https://docs.seatlayer.io/sell/hosted-checkout/) | Demo hold istnieje; brak komercyjnego booking, payment, ticket fulfilment/email/refunds. Rozdzielić SDK handoff do cudzego checkout od hosted ticketing. | C2; C4 |
| M15 | Venue Designer, rows/sections/curves/floors/tables/categories, accessibility, imports/templates, validation, revisions/publish: [Features](https://seatlayer.io/features/), [product model](https://docs.seatlayer.io/start/product-model/) | Chart Enea jest utrzymywany w kodzie/fixture; brak edytora, importerów, draft/review/publish lub revision rollback. | C1 |
| M16 | Accounts, workspaces/tenant isolation, test mode, scoped sessions: [product model](https://docs.seatlayer.io/start/product-model/), [Features](https://seatlayer.io/features/) | Jeden demo event/venue i cookie-scoped hold session, bez kont organizerów, tenant auth lub test/live environments. | C0 prerequisite |
| M17 | Control Room/live board, blocks/releases, Box Office, door/check-in, tickets/reports: [Features](https://seatlayer.io/features/), [product model](https://docs.seatlayer.io/start/product-model/) | Tylko buyer view wybranej sekcji i własnego holda; brak staff, orders, ticket issuance, counter lub scans. | C5 |
| M18 | Sales channels, allocations, audience prices, partners, private invites/release: [Features](https://seatlayer.io/features/), [product model](https://docs.seatlayer.io/start/product-model/) | Brak presale/partner allocations, channel auth i ceny per audience. | C6 |
| M19 | WordPress and hosted iframe integrations: [WordPress](https://docs.seatlayer.io/integrations/wordpress/), [iframe](https://docs.seatlayer.io/integrations/iframe/) | Brak CMS package, reusable embed contract, host callback, origin/resize contract. Przyszły embed powinien wspierać football club tenants i konfigurację klubu; nie kopiować public-facing SeatLayer branding/organizer journey. | C3 |
| M20 | CRM/registration guest lists, invite and signed seat-choice writeback: [registration tools](https://docs.seatlayer.io/integrations/registration-tools/) | Brak guests API, registration/CRM sync, invites, signed writeback. | C7 |
| M21 | Performance Groups and renewable multi-event Seasons: [performance groups](https://docs.seatlayer.io/integrations/performance-groups/), [seasons](https://docs.seatlayer.io/integrations/seasons/) | Pojedynczy event demo, bez atomic multi-performance choice, rights or renewals. SDK/platform support differs by product/version. | C8 |
| M22 | Designer Copilot/MCP, opt-in buyer WebMCP; buyer has no payment tool: [Features](https://seatlayer.io/features/) | Brak agent tools; deterministic GroupFinder nie jest AI. | C9 |
| M23 | Embedded Designer and SeatManager: [Features](https://seatlayer.io/features/), [product model](https://docs.seatlayer.io/start/product-model/) | Brak embed operator UI; wymaga workspace/auth boundary. | C3/C5 |
| M24 | Performance/language/scale/price claims: [Features](https://seatlayer.io/features/), [3D](https://seatlayer.io/3d-seat-map/) | Claims on marketing/docs are not independent measurements. Do not inherit SeatLayer’s numbers as acceptance goals. | Informative; no parity promise |

## Wykonywalny backlog

Model guideline: **Luna** for bounded research, docs, straightforward tests/isolated implementation; **Sol** for camera/3D, performance, security, concurrency and cross-module implementation; **root** owns architecture/integration and checks actual worktree diff, quality gates and review. Fresh independent reviewer audits specs before owner approval. At most 3 open PRs. Brief every agent with absolute worktree, required top-level/branch confirmation before writes, no push/PR, root verifies actual status/diff. Avoid agent overhead for one-file work.

### A — previously approved fan MVP: execute under the existing spec and roadmap

| WP | Result, likely modules and dependency | Acceptance / verification | Model |
|---|---|---|---|
| A1 | Odebrać i poprawić własną football fan UX: stadion Enea inspirowany blueprintem, cztery trybuny/narożniki/dach, panorama, 2D↔3D, wybrane miejsce i crowd. Likely: App, Stadium, StadiumMap, cameraControls, camera domain, eneaModel, Crowd. Includes current V1/V2/C5 work and recent root camera/layout fixes; do not reopen already-implemented sector pan/row framing without contrary browser evidence. | Scenario matrix: overview, near/far/upper/corner sectors, first/middle/last seats, seat change, roof, crowd empty/full. Same seat IDs in chart and scene; screenshot and browser console evidence for target desktop/mobile. Existing domain/render tests + actual browser observation. Zachować własny SalesBeyond look/UX; Enea is first model, not official exact twin. | Sol for scene/perf bug; Luna for checklist or isolated test; root integration. |
| A2 | Odebrać selection→basket→quote/hold/countdown/reload/release, groups, active-section inventory refresh, seat link and privacy. Likely: App, GroupFinder, Basket, LiveHoldPanel, useLiveHold, useSectionInventory, fanSession, seatRules, seatHoldClient, holdApi. Depends on A1 only for unified scene; service proof exists. | Two-session conflict; status/price/ID consistent across panel/2D/3D/hold. Only selected section is live; other blocks clearly remain demo; refresh failure keeps last known snapshot for that same block and block changes cannot leak stale state. Group suggestion has no add side effect; reload recovers session-owned hold; release/expiry clear it. Open ?seat= link in clean context; own basket stays private; local storage contains no price/status/hold credential. Test services + full browser flow. Back/forward is not an acceptance criterion of this approved workpackage. | Luna for narrow domain/test; Sol for transaction/security/race; root integration. |
| A3 | Odebrać 390×844 and 1440×900, keyboard/touch/focus/reduced-motion/fullscreen/WebGL failure; capture performance baseline before optimization. Likely: styles, App, scene/camera controls, fullscreen, contextLoss. Depends on A1/A2. | No horizontal overflow; pick/list/group/hold/release works by touch and keyboard; reduced-motion affects camera; fallback keeps 2D; record load-ready, frame-time and memory on named browser/device. Optimize only measured bottlenecks. Browser proof/screenshots required; CPU tests do not prove GPU. | Luna for QA checklist; Sol for measured WebGL perf/accessibility engineering; root gate. |

Acceptance for A is met only when every required criterion is proven. If a browser gate remains unavailable, report the exact criteria as **blocked/partial**; never call the package done based on green code tests or deploy status.

### B — additional buyer features, after owner-approved scope and individual spec

| WP | Deliverable, likely modules, dependencies | Acceptance / verification | Model |
|---|---|---|---|
| B1 | Event catalog/chooser plus browser history/deeplink routing. Likely new event catalog/router state plus App/useSectionInventory/useLiveHold/fanSession changes. Depends on approved event data/source contract; current UI is hardcoded to enea-demo and has no selector. | Two fixtures/events with separated chart, event status, price and hold IDs. Host route changes/back/forward restore event and seat safely without persisting another user’s basket. Cross-event isolation tests + browser history QA. | Luna requirements/tests; Sol for cross-module state; root. |
| B2 | Accessible seats and wheelchair bays in chart/domain/filters. Likely Seat type, venueChart/fullChart, selection/search/map/3D labels. Requires authoritative venue accessibility data and owner approval. | Distinct bays are not fake seats; labels/filter/legend match authoritative chart, accessible in 2D/3D and keyboard/screen reader. Mapping/contract/accessibility tests. | Sol for model integration, Luna for test matrix; root. |
| B3 | Next/previous seat, recenter-to-pitch, 3D interaction extras. Likely Stadium/cameraControls/camera domain and App accessible controls. Depends on A1 camera QA. | Adjacent seat navigation follows row/aisle rules and updates canonical seat; recenter sets intended aim without translating eye point. Test camera controller + browser keyboard/touch. | Sol. |
| B4 | Venue/section/row/seat photos or 360° media with nearest-scope fallback. Likely media manifest/storage adapter, Stadium view and seat preview. Depends on license/asset source, A1 and approval. | Resolve nearest authorized asset; fall back to live geometry; label whether image/photo/simulation; no unlicensed uploads. Asset resolution tests + browser orientation/performance. | Luna for bounded resolver; Sol for renderer integration; root. |
| B5 | Buyer theme, localization, real ticket categories/currency, selection policies and opt-in analytics. Dzielić na rozłączne podzadania: prezentacja, ceny/reguły oraz telemetria. Likely design tokens/strings, pricing adapter, event types and telemetry boundary. Depends on owner market selection and server price authority. | Min/max/consecutive/no-orphan policies agree between client and server; boundary tests cover empty selection, minimum−1/minimum/maximum/maximum+1, aisle breaks, occupied gaps and atomic group addition. Price formatting does not alter canonical amount/currency; no mixed currency; contrast/long translations/RTL where supported; analytics is opt-in and contains no buyer sensitive data. Formatting, API, privacy tests. | Luna for translation/formatter; Sol for price and telemetry security; root. |

### C — ticketing platform and organizer functionality, not currently approved

Start only after a separate product decision identifies the operating model.

| WP | Deliverable, likely modules, dependencies | Acceptance / verification | Model |
|---|---|---|---|
| C0 | Identity, tenant/workspace authorization, test/live environments, capability and scoped-session model. New auth/backend modules. Prerequisite for every C feature. | Cross-tenant denial, role boundaries, token expiry/revocation/origin scope, environment isolation; threat-model and security review. | Sol; independent security review; root. |
| C1 | Chart authoring, imports/templates, pricing/category configuration, validation, immutable revisions and reviewed publish. New organizer domain/editor/API; depends C0 and source-of-truth decision. | Draft→validate→preview→authorized publish; preserve canonical IDs and round-trip positions; invalid/published rollback and audit tests. | Sol for data model/security; Luna for import/test fixture; root. |
| C2 | Live inventory service, hold policy including optional release-on-leave, trusted booking, REST/server SDK, signed retried webhooks. Depends C0 and C1/event contract. | Atomic conflicts, idempotency, price/version authority, mixed seat/GA capacity without oversell, hold→server booking only after order/payment decision, webhook signature/replay safety. Leave-and-release jest jawną opcją sesji: zaplanować sygnał opuszczenia, bezpieczne/idempotentne zwolnienie i test utraty sygnału; TTL pozostaje zabezpieczeniem. Obecnego recovery nie zmieniać bez decyzji. Isolated DB concurrency + HTTP contract tests. | Sol; independent transaction/security review; root. |
| C3 | Public buyer SDK/headless/embed API, iframe/WordPress/CMS integrations, Embedded Designer/SeatManager transport boundary. Future club embed should support signed football-club tenants and configurable club presentation. Depends C0 and, by feature, C1/C2. | Versioned SDK contract, host resize/theme/locale/callbacks, origin/CSP and scoped session, compatible sample club host and lifecycle tests. Build a better football-fan flow using our own UI; do not copy SeatLayer branding or organizer journey. | Sol for API design; Luna for docs/sample matrix; root. |
| C4 | Hosted event pages, payment gateway, checkout, orders, ticket QR/PDF/email/refunds and custom domain. Depends C0/C1/C2 plus owner-selected merchant/payment model. | Payment sandbox E2E only; order/book/ticket reconciliation, refund/cancel, webhook idempotency, domain lifecycle/security. No live payment without separate authorization. | Sol; independent financial/security review; root. |
| C5 | Control Room/live operations, block/release, staff tools, box office, door scan, sales reports/exports. Live board/blocks/inventory reports: zależą C0/C2, działają samodzielnie lub embedded przez C3. Kasa i wejścia: dodatkowo wymagają C4 albo zweryfikowanego kontraktu hosta wystawiającego zamówienia/bilety. | Najpierw niezależny control-plane: role/audit, block/release, inventory totals i embed SeatManager z C3. Po integracji emitenta biletów: same inventory across web/counter, QR duplicate/invalid check-in, report/order reconciliation, operator recovery; staging tests. | Sol; root. |
| C6 | Public/presale/partner/box-office channels, allocations, audience pricing/invites/release. Depends C0/C2/C5. | Combined allocation cannot oversell; auth and canonical price scope; auditable release schedule; multi-channel race tests. | Sol; root. |
| C7 | CRM/registration guest lists, invitations, signed seat-choice writeback. Depends C0/C2/webhook contract. | Idempotent guest import, authorization for private links, signed writeback, replay safety; integration contract tests. | Luna for bounded integration docs/tests; Sol for auth; root. |
| C8 | Atomic multi-performance seat groups and renewable same-seat seasons. Depends C1/C2 and supported client/server selection. | Same-seat/allocation rules across events, renewal rights/deadlines/amendments, expiry/conflict and report reconciliation. Test each supported client/version separately. | Sol; independent inventory review; root. |
| C9 | Opt-in Designer Copilot/MCP and buyer WebMCP. Depends C0 permissions, C1 chart edit draft flow and C2 buyer inventory. | Capabilities explicit; buyer tools can read/find/select and optional hold but cannot checkout/pay; organizer writes remain human-reviewed drafts; permission/abuse tests. | Sol; independent security review; root. |

## Źródła referencyjne i granice twierdzeń

- Features page advertises 51 feature/status entries; linked official docs describe selection rules (minimum, consecutive, no-orphan), scoped sessions/optional release-on-leave, test mode, WebMCP/optional hold, ticket tiers, accessibility, tables/GA, custom pricing/currency/theme/locales, buyer analytics, CMS/iframe, guest/CRM integrations, webhooks, seasons and performance groups.
- Public docs distinguish SeatLayer’s SDK handoff (trusted server confirms booking; host retains checkout/payments) from its hosted ticketing product. The two are separate C2/C4 packages.
- Product values can differ by client, version, account enablement, phone capability and current documentation. Re-check release/support evidence before choosing a dependency. A marketing scale number is never a SalesBeyond target without measurement.
- The vendor 3D guide’s URL example mirrors SDK callbacks into the host route. Browser Back/Forward in the public demo is not automatic router behavior in our app. Current SalesBeyond uses replaceState and mount-time ?seat restoration only.
- Our UI event policy is not SeatLayer event metadata. Map status explicitly if a future real event source is approved.

## Model and parallel work rules

Use Luna for public-source research, bounded QA matrices, routine test/design/documentation and small isolated code; use Sol for complex camera/3D/performance, API/security/concurrency and cross-module work. Root owns architecture and integration, verifies actual worktree status/diff and runs project gates. A delegated report is input, not proof. Use separate worktrees/specs for parallel implementation; confirm absolute top-level and branch before writes. No push/PR from agents. Keep at most 3 open PRs. Do not estimate hours without team and device baselines.

## Wymagania i kryteria akceptacji planu

- **R1 — katalog:** objąć główne publicznie opisane buyer, ticketing, SDK/API, organizer, operator i AI feature families, z bezpośrednimi źródłami.
- **R2 — dowody:** odróżnić publiczne claims od lokalnego kodu; nazwać elementy zaimplementowane, brakujące i czekające na UI/device acceptance.
- **R3 — backlog:** każdy obszar ma wykonalny package ID, rezultat, prawdopodobne moduły, dependencies, AC, sposób testu i oszczędny wybór modelu.
- **R4 — approved fan scope:** realizować zatwierdzone pełne doświadczenie kibica bez redundantnej nowej specyfikacji. Naprawy bieżącego UX pozostają w A.
- **R5 — nowy scope:** checkout/payment, editor/admin i nowe buyer/platform features wymagają odrębnej decyzji właściciela; nie wynikają automatycznie z „feature parity”.
- **R6 — completion evidence:** brak wymaganego browser/device dowodu oznacza partial/blocked, nie done.
- **R7 — granice:** nie kopiować niepublicznego kodu, nie usuwać notices/dependency, nie publikować ani nie zmieniać konta/infrastruktury.

- **AC1 (R1):** Każda rodzina z publicznego katalogu ma matrix ID, direct URL i pokrycie w backlogu.
- **AC2 (R2):** Fakty lokalne odpowiadają źródłom: single hardcoded enea-demo (brak event selector); storage i mount ?seat restoration istnieją; URL aktualizuje replaceState; brak popstate/back-forward; lazy imports dzielą bundle, ale default 3D startuje na wybranej powierzchni; camera sector-bounded pan/row framing są w kodzie; browser acceptance nadal pending.
- **AC3 (R2/R3):** Każdy wiersz oddziela implementację, nieodebrany UI, brakujący scope i vendor claim; workpackage ma dependencies, acceptance/test i model.
- **AC4 (R4):** Full fan journey i aktualny Enea/football UX mają actionable A tasks pod zatwierdzonym scope.
- **AC5 (R5):** B/C pozostają propozycjami do owner approval; payments/editor/admin nie są milcząco zatwierdzone.
- **AC6 (R6):** Pakiet jest done tylko gdy wszystkie wymagane kryteria są udowodnione; brak browser/device proof raportuje się blocked/partial.
- **AC7 (R7):** Nie ma polecenia kopiować prywatny silnik ani usuwać notices/dependency, publikować albo zmieniać infrastrukturę.

Review linked sources and repo evidence before presenting for approval. Do not run application tests for this planning-only revision. Independent reviewer must review this draft; author never sets status approved.

## Ryzyka i otwarte pytania

- SeatLayer’s feature list and supported SDK/version catalog change. Re-check current docs/release per chosen feature.
- Product owner has not authorized B/C expansion. In particular, full commercial ticketing, payment, accounts, organizer editor, ops, B2B SDK, channels, CRM, seasons and agent tools remain unapproved.
- Browser evidence for A is separate from service/test/deploy evidence; earlier browser access restriction remains separate and must not be bypassed.

## Niezależny przegląd

Przeprowadzono niezależny przegląd w świeżej sesji Sol, osobnej od autorskiej Luny. Rewizja `308b235` poprawiła nieprawdziwe deklaracje event/history/lazy, uzupełniła katalog i wykonalny backlog. Root dopisał po rechecku jawne reguły minimum/consecutive, opcję release-on-leave i niezależność Control Room od hosted checkout oraz źródła M24. Końcowy niezależny recheck zmian root: brak pozostałych must-fix, draft gotowy do przeglądu właściciela. `git diff --check` passed. Status pozostaje draft; właściciel zatwierdza nowy zakres.

## Realizacja

### Research/draft revision 2026-11-21

- Public source families checked in official Features/docs and public GitHub org; see links above.
- Local status checked in README, PROJECT, FAN_EXPERIENCE_ROADMAP, approved MVP spec, App, fanSession, event fixture, nativeMap, seatHoldClient and hold API. Follow-up corrected event/history/lazy/camera claims against source.
- Scope: documentation only; no application tests/browser QA run here. This is not an assertion that A workpackages have passed.
