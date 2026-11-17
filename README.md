# SalesBeyond — Stadion 3D

Interaktywny prototyp modułu „Zobacz widok ze swojego miejsca”, inspirowany stadionem Lecha Poznań. React + TypeScript + Vite, Three.js / React Three Fiber, Drei i Tailwind CSS. Bez backendu i płatnych kluczy API.

## Uruchomienie

Wymagany Node.js 22.18+ (zalecany 24).

```sh
npm install
npm run dev
```

Vite wypisze lokalny adres aplikacji. Produkcja:

```sh
npm run typecheck
npm test
npm run build
npm exec vite preview
```

Katalog `dist` można opublikować na dowolnym hostingu statycznym (np. Vercel). `npm run dev` jest jedyną komendą potrzebną do kolejnych uruchomień po instalacji.

## Co działa

- Proceduralna bryła stadionu: boisko z oznaczeniami, cztery trybuny, krzesełka, częściowo odkryty dach, kolumny i otoczenie.
- Orbitowanie i zoom; reset kamery, przełączanie dachu i pełny ekran.
- Trzy sektory demonstracyjne (101–103); hover oraz wybór w scenie i panelu.
- Każdy sektor ma 12 rzędów po 18 miejsc. Wybór rzędu, statusy miejsc i ceny demonstracyjne.
- Wybór miejsca w panelu lub kliknięciem w wyróżnione krzesełko 3D.
- Przelot kamery (2,4 s) do poziomu oczu i karta biletu zgodna z wyborem.
- Powrót do wyboru bez przeładowania, 24-sekundowa wycieczka z możliwością przerwania.
- Interfejs po polsku, układ mobilny, przyciski dostępne z klawiatury oraz komunikat o błędzie WebGL.

## Struktura i dodawanie sektorów

- `src/data/stadium.ts`: typy, definicje sektorów, stabilne identyfikatory miejsc, pozycje, ceny i deterministyczna dostępność.
- `src/components/Stadium.tsx`: geometria, instancjonowane krzesełka, interakcje i kontroler kamery.
- `src/App.tsx`: wybór, panel, bilet i automatyczna wycieczka.
- `src/styles.css`: warstwa wizualna i breakpointy.

Aby dodać sektor, rozszerz `SectorId` i listę `sectors` w pliku danych, przypisz jego `center` i cenę. Ta wersja pozycjonuje sektory na trybunie północnej. Dla innych trybun należy też rozszerzyć funkcję `getSeat` o orientację i współrzędne oraz punkty kamery w `Camera`. Testy sprawdzają spójność danych, unikalność identyfikatorów, ceny, dostępność i walidację parametrów.

## Zakres demonstracyjny

To uproszczona proceduralna interpretacja, nie zweryfikowany bliźniak cyfrowy. Oznaczenie „Demo koncepcyjne — dane poglądowe” jest stale widoczne. Numeracja sektorów, nazwy trybun, rzędy, dostępność i ceny są przykładowe. Perspektywa wynika z modelu 3D, ale nie gwarantuje dokładnego widoku z rzeczywistego fotela. Weryfikacja wymaga oficjalnych planów i konsultacji z klubem. Nie wykorzystano oficjalnego herbu ani zewnętrznych modeli lub zdjęć.

Brak logowania, sprzedaży biletów, płatności, rezerwacji i integracji z systemem klubowym. WebGL i nowoczesna przeglądarka są wymagane. Fonty Google są opcjonalne: bez sieci stosowany jest font systemowy.

## Następne kroki

1. Walidacja bryły i orientacji trybun na podstawie planów stadionu.
2. Dokładniejsze rzędy, przejścia, narożniki i architektura dachu.
3. Profilowanie na fizycznych urządzeniach mobilnych i dopracowanie wydajności.
4. Dane oficjalne i dalszy rozwój oferty premium po uzgodnieniu zakresu.
