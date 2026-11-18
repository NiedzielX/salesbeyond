# SalesBeyond — Stadion 3D

Interaktywny prototyp modułu „Zobacz widok ze swojego miejsca”, inspirowany stadionem Lecha Poznań. React + TypeScript + Vite, Three.js / React Three Fiber, Drei i Tailwind CSS. Bez backendu i płatnych kluczy API.

## Uruchomienie

Wymagany Node.js 22.18+ (zalecany 24).

```sh
npm ci
npm run dev
```

Vite wypisze lokalny adres aplikacji. Produkcja:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm exec vite preview
```

Katalog `dist` można opublikować na dowolnym hostingu statycznym (np. Vercel). `npm run dev` jest jedyną komendą potrzebną do kolejnych uruchomień po instalacji.

## Implementacja i stan weryfikacji

Kontrole kodu i browser QA panelu przechodzą: 36 wyborów w rozmiarach 1440×900 i 390×844, ceny, powroty, klawiatura, modal i odświeżenie. Realny widok 3D i przeloty pozostają niezweryfikowane, ponieważ cloud Chromium ma niedostępny WebGL. Nie traktuj testów panelu jako odbioru sceny. Wyniki i zrzuty: `docs/QA.md`.

## Co zaimplementowano

- Proceduralna bryła stadionu: boisko z oznaczeniami, cztery trybuny, krzesełka, częściowo odkryty dach, kolumny i otoczenie.
- Orbitowanie i zoom; reset kamery, dopasowanie panoramy do proporcji ekranu, przełączanie dachu i pełny ekran.
- Trzy sektory demonstracyjne (101–103); hover oraz wybór w scenie i panelu.
- Każdy sektor ma 12 rzędów po 18 miejsc. Wybór rzędu, statusy miejsc i ceny demonstracyjne.
- Wybór miejsca w panelu lub kliknięciem siedziska/oparcia krzesełka 3D. Reset przywraca możliwość kliknięcia sektora.
- Przelot kamery (2,4 s) do poziomu oczu i karta biletu zgodna z wyborem. Orientacja interpolowana kwaternionem; przednie słupy są odsłaniane wraz z dachem przy wejściu na trybunę. Etykiety sektorów nie zasłaniają foteli.
- Powrót do wyboru bez przeładowania, 24-sekundowa wycieczka z możliwością przerwania.
- Interfejs po polsku, układ mobilny, przyciski dostępne z klawiatury oraz komunikat o błędzie WebGL i utracie kontekstu GPU. Modal utrzymuje fokus i zwraca go do przycisku po zamknięciu.

## Struktura i dodawanie sektorów

- `src/data/stadium.ts`: typy, definicje sektorów, stabilne identyfikatory miejsc, pozycje, ceny i deterministyczna dostępność.
- `src/components/Stadium.tsx`: geometria, instancjonowane krzesełka, interakcje i kontroler kamery.
- `src/App.tsx`: wybór, panel, bilet i automatyczna wycieczka.
- `src/styles.css`: warstwa wizualna i breakpointy.

Aby dodać sektor, rozszerz `SectorId` i listę `sectors` w pliku danych, przypisz jego `center` i cenę. Ta wersja pozycjonuje sektory na trybunie północnej. Dla innych trybun należy też rozszerzyć funkcję `getSeat` o orientację i współrzędne oraz punkty kamery w `Camera`. Testy sprawdzają spójność danych, unikalność identyfikatorów, ceny, dostępność i walidację parametrów.

## Zakres demonstracyjny

To uproszczona proceduralna interpretacja, nie zweryfikowany bliźniak cyfrowy. Oznaczenie „Demo koncepcyjne — dane poglądowe” jest stale widoczne. Numeracja sektorów, nazwy trybun, rzędy, dostępność i ceny są przykładowe. Perspektywa wynika z modelu 3D, ale nie gwarantuje dokładnego widoku z rzeczywistego fotela. Weryfikacja wymaga oficjalnych planów i konsultacji z klubem. Nie wykorzystano oficjalnego herbu ani zewnętrznych modeli lub zdjęć.

Na telefonie wybór miejsca przewija do sceny, a przy niedostępnym WebGL do podsumowania. Brak pełnego ekranu jest sygnalizowany komunikatem; nie blokuje wyboru miejsca.

Brak logowania, sprzedaży biletów, płatności, rezerwacji i integracji z systemem klubowym. WebGL i nowoczesna przeglądarka są wymagane. Interfejs używa fontów systemowych; nie pobiera fontów Google.

## Wspólny model miejsc i kamery

W `src/data/stadium.ts` obiekt `layout` określa wysokość i głębokość rzędów oraz rozstaw siedzeń. `getSeat()` zwraca środek siedziska; stopnie i instancje krzeseł korzystają z tych samych parametrów. Dekoracyjne krzesełka są pomijane w obszarze 648 miejsc demo. `src/domain/camera.ts` wyznacza oczy nad górną powierzchnią siedziska i interpolację lotu; rozglądanie zmienia kierunek, zachowując pozycję oczu. Kontroler usuwa starą bezwładność orbity przed lotem, a panorama oblicza dystans z kątów widzenia i rozmiaru bryły. `selection.ts` synchronizuje sektor, rząd i fotel. `tour.ts` anuluje wszystkie zaplanowane kroki przy ręcznej interakcji.

## Następne kroki

1. Walidacja bryły i orientacji trybun na podstawie planów stadionu.
2. Dokładniejsze rzędy, przejścia, narożniki i architektura dachu.
3. Profilowanie na fizycznych urządzeniach mobilnych i dopracowanie wydajności.
4. Dane oficjalne i dalszy rozwój oferty premium po uzgodnieniu zakresu.


## Lokalny renderer — wariant integracyjny

Po `npm run dev` otwórz adres wypisany przez Vite z `/?renderer=local`. Bez tego parametru pozostaje poprzednia scena do porównania. Wariant lokalny nie jest jeszcze odebranym zamiennikiem: przeglądarka testowa nie tworzy WebGL2, więc nie potwierdzono wyglądu sceny, rzeczywistego przelotu ani przechwytywania miniatury. Nie usunięto poprzedniego renderera.

Kierunek odpowiada blueprintowi: panorama całego stadionu → sektor → rząd → miejsce → ciągły przelot → perspektywa kibica → karta miejsca. Produkt jest kierowany do klubów piłkarskich; Enea Stadion jest pierwszym scenariuszem, bez deklaracji oficjalnej współpracy. Pozostaje uproszczoną koncepcją z danymi demonstracyjnymi.

Wariant używa naszego lokalnego chartu i własnej lekkiej bryły GLB generowanej w pamięci. Tylko 648 miejsc ma detal i interakcje; pozostałe trybuny są uproszczoną geometrią. Nie wymaga tworzenia wydarzenia, konta ani klucza do usługi. Sieć całej ścieżki na działającym GPU pozostaje do sprawdzenia — nie deklarujemy zweryfikowanego działania offline.

- `src/data/venueChart.ts`: profil pierwszego stadionu, sekcje/rzędy, mapowanie ID i fizyczny układ dla nowej sceny.
- `src/data/venueShell.ts`: własne trybuny, zadaszenie i otoczenie, bez zewnętrznych tekstur/modeli.
- `src/integrations/localScene.ts`: kompilacja sceny i kadr całej architektury.
- `src/integrations/localVenue.ts`: jeden właściciel nawigacji; reset i nowy wybór unieważniają wynik starego lotu.
- `src/components/LocalVenue.tsx`: montowanie, wybór w scenie, resize i sprzątanie zasobów.

Domena zachowuje stare ID, ceny i dostępność. W nowym rendererze współrzędne wynikają z lokalnego chartu (fizyczny rozstaw .62 m), a nie z demonstracyjnych XYZ starej sceny. Adapter tłumaczy je bez zmiany znaczenia fotela. Testy porównują rzeczywistą geometrię skompilowanej sceny z tym chartem.

Po potwierdzonym dotarciu kamera może zapisać miniaturę do karty z tej samej sceny. Przerwany lot jest odróżniany od dotarcia: wybrane miejsce pozostaje, obraz nie jest podstawiany, a przycisk pozwala ponowić przelot. Funkcje obrazu i przycisku wymagają jeszcze odbioru na działającym WebGL2. Szczegóły: `docs/LOCAL_RENDERER_QA.md`.
