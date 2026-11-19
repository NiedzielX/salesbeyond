# Kontrakt dostępności i czasowej blokady miejsc

Status: propozycja do następnego etapu, **bez połączonej bazy i bez działającej rezerwacji**. Obecny produkt pozostaje demonstracyjny. Read-only API Vercel pokazało integrację Supabase Free, ale `projects=[]`; nie potwierdzono istniejącego połączonego zasobu dla SalesBeyond. Nie odczytywano sekretów ani nie tworzono usług.

## Proponowane wdrożenie

Vercel Functions przy istniejącym `salesbeyond`, transakcyjny Postgres w Supabase, projekt roboczy `salesbeyond-mvp`, region EU Frankfurt. Jeżeli istnieje już właściwy projekt, należy go połączyć zamiast tworzyć drugi. Wersje bibliotek i schema migracji wymagają przeglądu przed implementacją; obecny React/Vite/R3F pozostaje bez migracji frameworka. Nowy zasób, połączenie projektu i konfiguracja sekretów są następną odrębną operacją infrastrukturalną.

Pierwsze wdrożenie dotyczyłoby wyłącznie wspólnej dostępności i holdów na syntetycznym wydarzeniu demo. Nie wymaga udawania oficjalnych cen/siatki biletowej klubu ani podłączania płatności. Dane klubowe i rzeczywisty checkout pozostają odrębnymi integracjami.

## Minimalne dane

- `events`: ID wydarzenia, `open|paused|closed|cancelled`, waluta, wersja katalogu, limit miejsc i konfigurowany czas blokady. `sold-out` można wyznaczać z dostępności; jawne zamknięcie zawsze wygrywa.
- `event_seats`: klucz `(event_id, seat_id)`, blok/rząd/numer/kategoria, cena w groszach, `available|blocked|sold|closed`, wersja oraz para `active_hold_id` / `hold_expires_at`. Klient nie ustala ceny/statusu.
- `fan_sessions`: losowy sekret sesji wydawany w cookie HttpOnly/Secure/SameSite, w bazie wyłącznie hash. Brak danych osobowych w pierwszym demo. ID sesji podane przez klienta nie dowodzi własności.
- `seat_holds` i `seat_hold_items`: właściciel sesji, event, stan, data wygaśnięcia, niezmienne migawki cen/miejsc, klucz idempotencji i hash żądania. Wariant minimalny używa dostępu powiązanego z sesją, zamiast osobnego tokenu w localStorage/URL.

Kwoty są liczbami całkowitymi, czas UTC z zegara bazy. Limit koszyka klienta nie zastępuje limitu serwera.

## Operacje API

`GET /api/events/:eventId/inventory` zwraca kanoniczne ID, statusy, ceny, wersję i stan wydarzenia. Nigdy cudze sesje/identyfikatory właściciela/tokenu. Odczyt nie gwarantuje, że miejsce pozostanie wolne.

`POST /api/events/:eventId/holds` otrzymuje wyłącznie `seatIds`, `expectedCatalogVersion` i `idempotencyKey`; sesja pochodzi z cookie. Cała grupa zostaje zablokowana albo nic. Odpowiedź zawiera ID holda, `active`, termin wygaśnięcia, wersję, migawki pozycji i sumę. Błąd 409 ma jawne kody `held`, `unavailable`, `catalog_changed`, `event_closed` lub `idempotency_key_reused`; klient nie zamienia sam foteli ani nie akceptuje nowej ceny.

`GET /api/holds/:id` odczytuje wyłącznie własny hold i rzeczywisty stan/pozostały czas. `DELETE` zwalnia go idempotentnie. Własność jest sprawdzana przy każdym żądaniu, a obca sesja nie otrzymuje danych właściciela.

`POST /api/holds/:id/handoff` działa dopiero po osobnym skonfigurowaniu checkout. Do tego czasu nie ma aktywnego przycisku płatności ani fikcyjnego adresu. Hold nie jest zakupem.

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

Do ustalenia przed uruchomieniem: właściwy zasób Supabase, potwierdzenie planu/limitów, konfiguracja funkcji/regionu i sekretów, czas holda i wygaszania sesji. Płatności i dane rzeczywistego klubu nie należą do tego kroku provisioningowego.
