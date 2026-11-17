# Projekt — SalesBeyond Stadium MVP

Status: rozpoznanie na podstawie plików repozytorium i ustaleń właściciela; do potwierdzenia przed implementacją nowej specyfikacji. Stan kodu: 3d3c307.

| Pole | Wartość |
|---|---|
| Cel produktu, użytkownicy | Demo dla przedstawicieli klubu i kibiców: wybrać sektor, rząd i miejsce, płynnie przejść do widoku z fotela. Uproszczone 3D inspirowane Enea Stadionem, dopuszczalne generyczne elementy. |
| Stos i wersje | TypeScript 5.9.3, React/React DOM 19.3.1, Vite 7.3.8, Three.js 0.181.2, R3F 9.8.2, Drei 10.7.9, Tailwind 4.3.5. Testy: node:test. Wersje odczytane z package-lock.json; manifest nadal ma zakresy ^/~. Brak bazy i backendu. |
| Polecenia | Instalacja odtwarzalna: npm ci. Lint: BRAK skryptu i konfiguracji. Typecheck: npm run typecheck. Testy: npm test. Build: npm run build. Start: npm run dev. Skan sekretów: brak skryptu. |
| Struktura i granice | src/data/stadium.ts — dane domenowe i pozycje; src/components/Stadium.tsx — geometria, kamera i scena; src/App.tsx — stan wyboru/UI/tour; src/styles.css — styl; src/data/stadium.test.ts — testy danych. |
| Architektura | Istniejące zależności: UI i scena → dane; dane nie importują UI ani Three.js. Brak monorepo i API. Zalecenie dla MVP: wspólne obliczenia miejsc dla sceny i kamery, jeden kontroler kamery. |
| Niezmienniki | Dane demonstracyjne i jawne oznaczenie; brak sprzedaży i płatności; wybór sceny, panelu, widoku i podsumowania spójny. Brak obietnicy dokładności realnego fotela. Nie kupować assetów. |
| Dane wrażliwe / wymogi | Kod nie zawiera formularzy ani mechanizmu trwałego zapisu danych osobowych. Logowanie prywatnego hostingu realizuje platforma Sites; repo nie implementuje własnego logowania. index.html korzysta z zewnętrznych Google Fonts. Brak deklaracji zgodności prawnej — wykracza poza obecne MVP. |
| Środowiska i hosting | Dev: Vite. Build statyczny: dist. Hosting istniejący: prywatny Sites; vercel.json zawiera alternatywną konfigurację. Dalsza publikacja tylko na wyraźne polecenie właściciela. Właściciel: użytkownik; aplikacja nie wymaga kluczy API ani sekretów runtime. |
| Stan wyjściowy | npm ci: OK; typecheck: OK; npm test: 4/4; build: OK z ostrzeżeniem o paczce JS 1190,59 kB (gzip 337,37 kB). npm run lint: exit 1, brak skryptu. Brak CI w drzewie. Browser QA: nie sprawdzono w tym rozpoznaniu; poprzednia wersja również nie ma potwierdzonej kontroli. |

## Ustalenia od właściciela

- Priorytet: funkcjonalne MVP; dopuszczalna generyczna bryła z inspiracją Enea Stadionem.
- Poza zakresem: fotorealistyczne obrazy, filmy AI, maski do postprodukcji, VIP, backend, rezerwacje i płatności.
- Istniejący autotour może pozostać; nie uzasadnia rozszerzania zakresu.
- Tańsze modele do ograniczonych zadań; integrator weryfikuje ich wyniki.
- Specyfikację zatwierdza właściciel; zgoda na wykonanie planu nie zatwierdza automatycznie nieprzedstawionego dokumentu.

## Propozycje wymagające zatwierdzenia ze specyfikacją

1. Zachować obecny stos i node:test. Przypiąć istniejące zależności do wersji z lockfile, bez ich aktualizacji.
2. Do lintu użyć lokalnego TypeScript ESLint (dokładne wersje sprawdzone przed dodaniem, wydania starsze niż 14 dni). Alternatywa: pozostawić lint jawnie niedostępny; nie udawać, że typecheck zastępuje lint.
3. Pracować na gałęziach i przygotowywać zmiany do review; nie scalać ani ponownie publikować bez osobnego zlecenia.

Nie są potrzebne pytania o dane klientów lub integracje: nie wchodzą do MVP. Brak ustalonej konwencji etykiet i PR — stosować zwięzły opis celu, spec/log, dowody weryfikacji, ryzyka; nie dodawać nieistniejących etykiet.
