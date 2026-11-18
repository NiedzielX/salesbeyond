# Lokalny przegląd demonstracji

Produkt dla klubów piłkarskich, pierwszy scenariusz inspirowany Enea Stadionem. Kierunek: panorama → sektor → rząd i fotel → płynny przelot → widok kibica → karta. Dane i ceny są poglądowe, bez sprzedaży i rezerwacji.

## Gotowy build bez instalowania zależności aplikacji
Lokalna paczka demonstracyjna zawiera `dist`, instrukcję i informację o rewizji źródła. Nie jest publikacją ani zaakceptowanym wydaniem MVP. Po rozpakowaniu w katalogu paczki:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

W przeglądarce otworzyć `http://127.0.0.1:4173/?renderer=local`. Bez parametru `renderer=local` ładuje się zachowana wcześniejsza scena porównawcza. Nie otwierać samego index.html przez file:// — moduły i lazy chunks potrzebują HTTP. Serwer obsługuje wyłącznie statyczne pliki, nie backend aplikacji.

Alternatywnie z repo: `npm ci && npm run dev`, następnie ten sam parametr w adresie Vite.

## Kolejność przeglądu
1. Panorama: cztery niebieskie trybuny, boisko, dach i czytelny wybór3 sektorów. Nie oceniać z CPU-renderów zamiast aplikacji.
2. Wybrać sektor102, rząd6, miejsce10. Sprawdzić przelot, poziom oczu, rozglądanie oraz kartę102/06/10 i85zł.
3. Przerwać lot przeciągnięciem i użyć ponowienia; zresetować w trakcie; zmienić10 miejsc bez reload. Nie akceptować mylącej miniatury ani deklaracji dotarcia po anulowaniu.
4. Przejść próbki sektorów101–103/rzędów1,6,12/pierwsze i ostatnie wolne miejsce oraz testy mobilne i klawiaturę z docs/LOCAL_RENDERER_QA.md.
5. Zweryfikować true WebGL lifecycle, reduced-motion, highlight i wszystkie requesty cold start. Brak obcego API, kont, kluczy i zewnętrznych zasobów wymaganych do działania jest kryterium do sprawdzenia, nie deklaracją już odebraną naGPU.

## Stan dowodów
Kod danych, geometrii, nawigacji, mostka i resource-owner ma43 przechodzące testy Node. Lint/typecheck/build i focused review zapisane w logu. Testy lifecycle stosują kontrolowane factories; nie są uruchomieniem prawdziwego React StrictMode ani GPU.

Dotychczasowy browser QA panelu obejmuje36 wyborów desktop/mobile i prawidłowy fallback. Odbiór rzeczywistej sceny, lotu, obrazu i requestów pozostaje otwarty: w cloud najpierw brakowało WebGL2, potem narzędzie sterowania kartą zwracało timeout. Nowy wariant nadal opt-in, specyfikacje in-progress. `docs/LOCAL_RENDERER_QA.md` opisuje bramki szczegółowo.

## Granica montowania runtime
Jeżeli mount zwróci handle, właściciel sesji sprząta go wraz z ukończonymi subskrypcjami przy błędzie lub unmount. Jeżeli zewnętrzny runtime alokuje wewnętrzne zasoby i rzuci wyjątek przed zwróceniem handle, wrapper nie ma API do ich zwolnienia. Nie stwierdzono takiej awarii; wymaga to rzeczywistego testu integracji. DOM kontenera jest czyszczony przez komponent.
