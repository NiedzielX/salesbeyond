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
