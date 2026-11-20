# Kontrakt dostępności i czasowej blokady miejsc

Status: **Supabase i Vercel połączone; realne blokady demo działają przez API**. Właściciel 2026-11-20 wybrał osobny prywatny schemat sb_hold w istniejącym supabase-cerise-bucket (pnexqoyhazwlobzgdmzt, Frankfurt). Tabele aplikacji wine nie zostały zmienione. Nowy projekt Free nie powstał przez limit konta; wybrany zasób pozostaje Free. Publiczne API potwierdziło wyścig dwóch sesji, ceny, idempotencję, własność i release. Panel React opublikowany i połączony z usługą; wygląd WebGL i interakcje w przeglądarce nieodebrane.

## Docelowe wdrożenie

Vercel Functions przy istniejącym `salesbeyond`, transakcyjny Postgres w Supabase, osobny schemat sb_hold w zatwierdzonym supabase-cerise-bucket, region EU Frankfurt. Funkcja Vercel również w fra1. Migracja database/001-seat-holds.sql i adapter bez nowej zależności zostały przejrzane; obecny React/Vite/R3F pozostaje bez migracji frameworka. Właściciel autoryzował nowy zasób Free, połączenie projektu i prywatne zmienne. Ograniczenie planu ani brak sesji nie pozwalają automatycznie wybrać płatnej bazy lub modyfikować innych aplikacji.

Pierwsze wdrożenie dotyczyłoby wyłącznie wspólnej dostępności i holdów na syntetycznym wydarzeniu demo. Nie wymaga udawania oficjalnych cen/siatki biletowej klubu ani podłączania płatności. Dane klubowe i rzeczywisty checkout pozostają odrębnymi integracjami.

## Minimalne dane

- `sb_hold.events`: ID wydarzenia, `open|paused|closed|cancelled`, waluta, wersja katalogu, limit miejsc i konfigurowany czas blokady. `sold-out` można wyznaczać z dostępności; jawne zamknięcie zawsze wygrywa.
- `sb_hold.seats`: klucz `(event_id, seat_id)`, blok/rząd/numer/kategoria, cena w groszach, `available|blocked|sold|closed`, wersja oraz para `active_hold` / `expires_at`. Klient nie ustala ceny/statusu.
- Sesja: losowy sekret 32-bajtowy w cookie __Host-salesbeyond_fan (HttpOnly/Secure/SameSite=Lax, 24 h); w bazie wyłącznie SHA-256. Nie ma osobnej tabeli sesji ani tokenu w localStorage/URL. Oddzielny GET ustanawia cookie przed pierwszą mutacją.
- `sb_hold.holds` z niezmienną listą items JSONB: właściciel sesji, event, stan, data wygaśnięcia, niezmienne migawki cen/miejsc, klucz idempotencji i hash żądania. Wariant minimalny używa dostępu powiązanego z sesją, zamiast osobnego tokenu w localStorage/URL.

Kwoty są liczbami całkowitymi, czas UTC z zegara bazy. Limit koszyka klienta nie zastępuje limitu serwera.

## Operacje API

Na Vercel jeden endpoint `/api/seat-api` mapuje parametr `op` na poniższe operacje: `status`, `session`, `inventory`, `create`, `current`, `hold`. `eventId`, `sectionId` lub `holdId` są parametrami query; create używa POST, odczyt holda GET, zwolnienie DELETE. `GET ?op=status` pokazuje wyłącznie configured/mode, nie potwierdza zdrowia bazy. Wyłączona konfiguracja zwraca dla operacji hold/inventory HTTP 503 backend_not_configured.

`GET ?op=current&eventId=enea-demo` zwraca tylko aktywną blokadę istniejącej sesji cookie, bez tworzenia cookie. Brak sesji to 401, brak własnego holda 404. Pozwala odzyskać commit po utracie odpowiedzi i reload, nawet jeśli nie zapisano ID.

`GET ?op=session` ustanawia sesję bez zwracania sekretu. Same-origin credentials są obowiązkowe. Mutacje wymagają dokładnego Origin aplikacji. Ciało JSON ma limit 8 KB. Współdzielony bucket ogranicza tworzenie do 20 żądań/min na HMAC adresu klienta zaufanego przez Vercel; brak konfiguracji lub awaria nie pozwalają pominąć limitera.


`GET /api/events/:eventId/inventory` bez sectionId zwraca krótkie podsumowanie sekcji, wersję i stan wydarzenia; z sectionId zwraca kanoniczne ID, statusy i ceny tego bloku. Nigdy cudze sesje/identyfikatory właściciela/tokenu. Odczyt nie gwarantuje, że miejsce pozostanie wolne.

`POST /api/events/:eventId/holds` otrzymuje wyłącznie `seatIds`, `expectedCatalogVersion` i `idempotencyKey` i opcjonalne `avoidSingle`; sesja pochodzi z cookie. Cała grupa zostaje zablokowana albo nic. Odpowiedź zawiera ID holda, `active`, termin wygaśnięcia, wersję, migawki pozycji i sumę. Błąd 409 ma jawne kody `held`, `unavailable`, `catalog_changed`, `event_closed` lub `idempotency_key_reused`; klient nie zamienia sam foteli ani nie akceptuje nowej ceny.

`GET /api/holds/:id` odczytuje wyłącznie własny hold i rzeczywisty stan/pozostały czas. `DELETE` zwalnia go idempotentnie. Własność jest sprawdzana przy każdym żądaniu, a obca sesja nie otrzymuje danych właściciela.

`POST /api/holds/:id/handoff` pozostaje poza obecną implementacją i wymaga osobnego skonfigurowania checkout. Do tego czasu nie ma aktywnego przycisku płatności ani fikcyjnego adresu. Hold nie jest zakupem.

## Atomowość i wyścigi

1. Zweryfikować sesję, origin/CSRF, format/rozmiar, limit i event. W transakcji zablokować wersję eventu przed oceną cen/reguł. Operacje administracyjne muszą używać zgodnego porządku blokad.
2. Serializować ten sam klucz idempotencji dla `(sesja,event,key)`. Identyczne ponowienie zwraca ten sam hold i jego bieżący stan; ten sam klucz dla innej listy/wersji daje konflikt.
3. Blokować żądane wiersze miejsc w stałej kolejności ID. Dopiero pod blokadą sprawdzić każde miejsce, cenę, wersję i politykę. Wszystkie zapisy są w jednej transakcji.
4. Wygasły wskaźnik miejsca może być zastąpiony po sprawdzeniu terminu przez bazę. Tworzenie nowego holda nie musi modyfikować starego rekordu holda ani blokować innych jego miejsc. Pozwala to uniknąć krzyżowych blokad starych grup.
5. Release/cleanup najpierw ustalają listę pozycji, potem blokują miejsca w tej samej kolejności, następnie własny hold i ponownie weryfikują stan. Czyszczą tylko wskaźniki nadal należące do tego holda. Stary cleanup nie może usunąć nowszej blokady.
6. Wygaśnięcie wynika z czasu, a nie punktualności crona. Odczyt po terminie nie może zgłosić aktywnej rezerwacji tylko dlatego, że housekeeping jeszcze nie zmienił rekordu.

Przegląd SQL musi potwierdzić porządek blokad wszystkich ścieżek, nie tylko create. Brak publicznych zapisów do tabel/RPC; tylko zaufana funkcja serwera z ograniczonymi uprawnieniami, RLS jako dodatkowa ochrona. Klucze serwisowe nie trafiają do Vite, logów ani plików review.

## Integracja klienta i kryteria dowodu

Lokalny koszyk zostaje wyborem ID. Dopiero odpowiedź serwera przełącza UI na hold i uruchamia zegar oparty o termin serwera. Po refresh klient pyta serwer o własny hold; zapis lokalny nie dowodzi jego istnienia. Po konflikcie/wygaśnięciu usuwa deklarację holda, zachowuje możliwe do ponownego wybrania ID i pokazuje przyczynę. Bez cichej zamiany ceny/miejsca.

Przed nazwaniem tego działającą rezerwacją wymagane są testy na rzeczywistej izolowanej bazie: dwa równoległe żądania jednego fotela (dokładnie jeden sukces), konflikt jednego elementu grupy (zero częściowych zapisów), idempotencja, obca sesja, zmiana wersji/ceny, wygaśnięcie i nowy hold, spóźniony cleanup, release, event zamknięty, limit oraz próby bezpośredniego zapisu przez anon. Do tego odbiór desktop/mobile i test uprawnień. Sam klient/testy w pamięci nie spełniają tych kryteriów.

## Uruchomienie i dowód

1. Wybrać zatwierdzony zasób Free we Frankfurcie i potwierdzić jego tożsamość/plan. Wykonać migrację jednokrotnie w pustym docelowym schemacie. Nie używać migracji jako bezpiecznego resetu istniejącej bazy.
2. `node scripts/export-demo-inventory.mjs` generuje transakcyjny seed wszystkich 38 078 kanonicznych foteli z fizycznymi ciągami rzędów. Zapis odmawia, jeśli event enea-demo już istnieje; nie nadpisuje aktywnych holdów. Początkowo niedostępne fotele są blocked, bez deklarowania rzeczywistej sprzedaży. Domyślny hold 600 s, maksymalnie 10 miejsc.
3. Skonfigurować wyłącznie po stronie serwera SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HOLD_RATE_LIMIT_SECRET (losowy, co najmniej 32 znaki) oraz APP_ORIGIN. Nie stosować prefiksu VITE_. Dopiero po testach bazy ustawić SEAT_HOLDS_ENABLED=1 i wdrożyć funkcję ponownie. `.env.example` zawiera tylko puste pola i flagę 0.
4. Zweryfikować publiczny endpoint, własność pomiędzy dwiema sesjami, współbieżność, release i expiry w docelowej usłudze. Panel React najpierw sprawdza autorytatywne ceny/dostępność wybranych bloków, następnie wymaga osobnego potwierdzenia holda. localStorage przechowuje wyłącznie holdId. Niepewne create zachowuje ten sam klucz w pamięci i blokuje zmianę koszyka; po reload odczyt current odzyskuje hold własnej sesji. Aktywny blok odświeża dostępność co15s oraz nafocus/ręcznie/po zmianieholda. Ta sama kompletna migawka zasila panel, ceny/liczniki/reguły/grupy i kolory/statusy2D/R3F/SVG. Pozostałe bloki nadal opisuje katalogdemo; nie deklarujemy odczytu całego stadionu przy każdympollu. Widokpozostajepodglądem; tylko transakcyjnyholdgwarantuje blokadę.
5. Zaplanować retencję historycznych holdów i bucketów. Ważność wynika z zegara DB; retencja nie może usuwać bieżących wskaźników. Obecny przyrost nie instaluje crona ani harmonogramu czyszczenia.

`python3 scripts/test-holds-postgres.py` używa przypiętego PostgreSQL 17.6 w jednorazowym kontenerze Docker bez portów, sieci i trwałych wolumenów. Potwierdzono SQL, uprawnienia anon/RLS, pełny seed i odmowę jego powtórzenia z zachowaniem holda, prawdziwe równoległe połączenia dla jednego fotela/polityki singletonów/jednej sesji/idempotencji oraz współdzielonego limitera. Zastąpienie wygasłego holda działa również przy zablokowanym starym rekordzie; spóźniony release zachowuje nowy wskaźnik. Dowód: docs/qa-evidence/hold-engine/postgres-17.6.txt. To nie jest weryfikacja chmury ani browser QA. Płatności i oficjalne dane klubu pozostają poza tym etapem.


## Bezpieczeństwo współdzielonego projektu
Przed migracją potwierdzono brak kolizji nazw, po migracji service_role EXECUTE=true, anon/authenticated=false dla sześciu RPC. Cztery prywatne tabele mają RLS i celowo brak polityk bezpośredniego dostępu. Wspólna baza nadal zawiera istniejące 19 tabel public aplikacji wine z RLS off i grantami anon SELECT/INSERT; właściciel został poinformowany. Nie poprawiano automatycznie cudzych polityk. Wymaga to osobnego przeglądu aplikacji wine: https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public . Nie jest to ostrzeżenie o tabelach SalesBeyond.
