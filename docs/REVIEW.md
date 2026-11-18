# Lokalny przegląd demonstracji — aktualna rekonstrukcja

Aktualny kod źródeł: 06cd758. Domyślną scenę z modelem 38 078 miejsc otwiera się bez parametru renderer; przycisk „Plan 2D” uruchamia natywną mapę pełnego katalogu. Wariant `?renderer=local` i paczka 85e6977 opisana niżej są historycznym eksperymentem 648 miejsc. Nie są aktualną przebudową. Obecne dowody geometrii: [autorska Enea](qa-evidence/authored-enea/README.md); stan deploy i bramek: [log](../.ai/runs/2026-11-18-authored-enea-stadium.md).

## Bieżąca checklista odbioru

1. Otworzyć domyślną stronę na desktopie i telefonie: panorama ciągłej misy, łukowy dach, etykiety wszystkich bloków, odsłonięcie dachu i wybór narożników. Brak poziomego przewijania i błędów konsoli.
2. Wybrać bloki każdej trybuny i narożników, pierwszy/środkowy/ostatni rząd i fotel. Kadr od strony boiska, podświetlenie bloku/rzędu, lot oraz widok z oczu. Podgląd zajętego fotela nie dodaje go do koszyka.
3. Przełączyć 2D/3D z wybranym fotelem: te same ID i cena. Zoom/pan, wybór bloku i fotela w natywnym 2D, reset, przejście między rzędami.
4. Sprawdzić koszyk wielu miejsc, grupę w budżecie, limit 10, usuwanie i zmianę miejsca. Brak udawanej rezerwacji.
5. Przerwać i wznowić lot; sprawdzić miniaturę po dotarciu, klawiaturę, reduced-motion, resize i cold start. Zarejestrować rzeczywiste czasy/klatki na urządzeniu.

Status: 59/59 testów, lint/typecheck/build; odbiór tej checklisty niewykonany z powodu odrzucenia dostępu do przeglądarki przez automatyczną kontrolę. Nie ponawiać z innego kanału bez rzeczywistego przywrócenia dostępu.

---

# Historyczny przegląd eksperymentu 648 miejsc

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


## Paczka tego przyrostu

Rewizja źródeł:85e69777f9256b65b37cbc57728b4e750559aeb7. Lokalny plik: `/workspace/work/mvp-review/salesbeyond-mvp-review-85e6977.zip` (608338 bajtów). SHA256: `caf61319f959415f4fc66dc904ac82119559b343bd79c319382ce2dd0c293cd2`.

Archiwum odczytano ponownie i sprawdzono CRC wszystkich14 pozycji. Każdy z10 plikówdist serwowany przez tymczasowy lokalny serwer zwrócił HTTP200, zgodne bajty i właściwy typMIME JS/CSS. Nie wykonywano przy tym JavaScript ani WebGL; test potwierdza spójność paczki, nie kompletność odbioru aplikacji. Paczka nie aktualizuje publicznego repo ani hostingu.
