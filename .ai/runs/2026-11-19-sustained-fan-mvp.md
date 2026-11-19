---
started: 2026-11-19
ended: null
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie
Korekta właściciela: dotychczasowe drobne przyrosty i kończenie po każdym deploy nie spełniają oczekiwania ciągłej pracy. Zrealizować większy spójny etap pełnego doświadczenia kibica, z równoległymi ograniczonymi zadaniami agentów i integracją root. Nie obiecywać nieobserwowalnej pracy w tle po zakończeniu tury.

## Przebieg
- Start HEAD 0cfc3ee, czysty worktree. Zlecono Lunom: całościowy gap audit, algorytm reguł miejsc i jakość/interakcje domyślnej sceny. Read-only, bez współedycji i bez obchodzenia CUA.
- Odczytano aktualne lekcje i pliki kamery/tour. Czytane umiejętności create-a-backend i vercel-storage służą ustaleniu właściwej wspólnej warstwy dostępności, nie automatycznej instalacji usług.
- Weryfikacja zainstalowanych integracji Vercel wyłącznie read-only; bez odczytu sekretów/zmiany ustawień/provisioningu.

## Weryfikacja
- `npm run lint && npm run typecheck && npm test && npm run build`: exit 0. Finalnie 87/87 testów, 0 fail, 8,52 s; build 10,83 s, znane ostrzeżenie o dużych modułach. Brak nowych zależności.
- Zastosowano i zweryfikowano patche agentów: seatRules i testy picking. Root wychwycił błędne fixture testów (zajęte przed-ID i powtórzone numery), kwadratowe przeliczanie singletonów oraz błędne oczekiwanie jednej zmiany koloru, gdy zmieniają się dwa fotele. Poprawiono przed integracją, następnie testowano przeciw rzeczywistemu katalogowi.
- BVH zachowuje trafienia Three dla foteli prostych/narożnych, promieni skośnych, transformowanego rodzica, stron materiału i near/far. Dispose przywraca oryginalny raycast. Kolory aktualizują zmienione ID, a macierze nie zmieniają się przy hover/wyborze/koszyku.
- CPU benchmark 38 078 foteli / 76 156 instancji, 8 promieni: mediana 5 prób 10,75 → 0,38 ms; rzeczywiste wywołania Mesh.raycast 90 628 → 8; po 8 trafień, build indeksu 378,8 ms. Bazowy licznik uwzględnia culling bounding sphere. Nie jest to FPS/opóźnienie WebGL/telefonu. Skrypt i JSON w repo.
- Reguły: nowo izolowane single vs istniejące, fizyczne alejki/luki numerów/pionowe przerwy, cztery rzeczywiste narożniki, atomowość, snapshot ze zmianą dostępności, closed/sold-out, indeks wspólny między koszykami. Wyłączona preferencja zachowuje poprzedni wybór; usuwanie/podgląd nigdy nie są blokowane.
- Dwa bounded review integracji i niezależny finalny review bez must-fix. Root przyjął wskazany koszt indeksowania przy każdej zmianie koszyka: topologia katalogu jest teraz budowana raz i współdzielona przez kolejne evaluatory. Zauważoną niespójność liczników closed/sold-out naprawiono i dodano test.
- Własny review React: layout effects inicjalizują macierze/index raz, cleanup przywraca raycast, kolory mają osobny owner/delty; referencje katalogu/ID są stabilne. Browser QA nadal niewykonany z powodu poprzedniej odmowy automatycznej kontroli; nie ponawiano ani nie obchodzono kanału.
- `git diff --check`: exit 0.

## Wynik
Większy spójny etap łączy indeksowane interakcje R3F, stabilne instancje/kolory, politykę nowych singletonów, bramki wydarzenia, zgodne rekomendacje/dodatki/liczniki i zachowanie preferencji po refresh. Źródła przygotowane do wspólnego deploy. Nie kończono po patchu ani pojedynczym teście; zintegrowano obie części. Backend opisany w docs/SEAT_HOLD_CONTRACT.md jako niepołączona propozycja; Supabase Free integration projects=[] nie jest dowodem istniejącej połączonej bazy. Realne holdy wymagają zasobu i sekretów, bez prowizorycznej Map udającej rezerwacje.

## Lekcje
Uzupełniono istniejącą lekcję continuous-execution bez odkładania korekty właściciela.


## Publikacja i dalsza zależność
- Kod 4d285ecb155e9432d6b382c7c42499d64dd7dbe7, branch feat/local-stadium-renderer. Deploy istniejącego salesbeyond w n-b334: dpl_StLvWGDQioNU93VB78NZyoPhQZR8, salesbeyond-lrxjtxze9-n-b334.vercel.app, production build w toku.
- Snapshot 50 plików / 330 853 bajty. prepare-vercel-source.py sprawdził każdy plik względem git show SHA:path, bez env/attachments/dokumentów właściciela/historii/testów. API nie zwraca sourceCommit w meta, źródła potwierdza lokalny manifest. Bez push/merge i zmian ustawień usług/domen/sekretów.
- Po przygotowaniu konkretnego kontraktu następnej warstwy wysłano async pytanie: nowy Supabase Free salesbeyond-mvp EU Frankfurt + połączenie salesbeyond/n-b334 czy istniejąca baza. Wskazano AGENTS §6 zastrzegający nowe operacje infrastrukturalne dla właściciela; opublikowanie obecnego kodu jest już autoryzowane i trwa niezależnie. Odpowiedź nie jest zastępowana upływem czasu. Nie prowizjonowano bazy ani nie implementowano zależnego od tej decyzji wdrożenia.

## Ciąg dalszy — rzeczywisty silnik SQL i granica API
- 4d285ec opublikowany production READY; root HTML/main/CSS HTTP 200. Kontynuowano po deploy zamiast zamykać etap.
- Właściciel zatwierdził nowy Supabase Free, Frankfurt i połączenie salesbeyond/n-b334. Plan Free nadal disabled przez limit dwóch aktywnych projektów użytkownika. Nie wybrano płatnego planu ani nie zmodyfikowano innej aplikacji. Zasób supabase-cerise-bucket jest połączony z wine-nhlf.
- Dodano migrację service-role-only z RLS, transakcyjnymi all-or-nothing holdami, idempotencją, sesją cookie, zegarem DB, polityką singli, release i limiterem. Nie potrzebuje rozszerzeń ani nowego SDK. Adapter serwerowy waliduje host Supabase, używa 8 s timeout i nie ponawia mutacji.
- API Web Request/Response ogranicza body/Origin, bootstrapuje HttpOnly cookie przed tworzeniem, sanitizuje odpowiedzi/błędy i wymaga wspólnego limitera. Gateway Vercel jest wyłączony bez jawnej flagi SEAT_HOLDS_ENABLED=1 i wszystkich prywatnych zmiennych. Status configured nie jest health-checkiem DB. Transport klienta przygotowany, jeszcze bez widocznego flow holda.
- Niezależne review Luna SQL/API/client/runtime: bez konkretnego must-fix. Root sprawdził źródła i poprawił limity SQL, replay lifecycle, walidację enumów/odpowiedzi, snapshot argumentów klienta przed await i test fixture.
- Finalne npm run lint / typecheck / test / build: exit 0, 112/112 testów, build 10,88 s; dowody robocze hold-api-tests.log i hold-api-build.log. git diff --check exit 0.
- Rzeczywisty lokalny PostgreSQL 17.6: migracja, SQL/RLS fixture, pełny seed 38 078, odmowa podwójnego seedowania z zachowaniem aktywnego holda, konkurencyjne połączenia/rate quota i spóźniony release przeszły. Dwa błędy runnera naprawiono przed finalnym dowodem: czekanie na docelowy proces Postgres zamiast tymczasowego init oraz psql -qAt dla porównania liczby. Nie były to usterki silnika. Dowód w docs/qa-evidence/hold-engine.
- Vercel CLI 65.11.0 zainstalowany poza repo, wersja z 2026-11-03. Nowy device login zakończył się sukcesem. whoami i jawne project inspect potwierdziły niedzielx, N/n-b334, właściwe salesbeyond. Nie czytano magazynu poświadczeń. Brak linku cwd rozpoznany jawnie, bez automatycznego wyboru projektu.
- Właściciel zgłosił dostęp do organizacji Supabase „n”. Brak narzędzia Supabase w aktywnym katalogu; przygotowano oficjalny CLI 2.122.1 (2026-11-02) poza repo, własny SUPABASE_HOME, bez zmian HOME. Uruchomiono wyłącznie ręczne logowanie --no-browser; oczekuje jednorazowego kodu użytkownika. Nie użyto zablokowanej automatyzacji browser.
