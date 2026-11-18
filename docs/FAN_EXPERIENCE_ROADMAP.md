# Pełne doświadczenie kibica — SalesBeyond / Enea

Zakres wskazany przez właściciela 2026-11-18: pełne doświadczenie kibica na poziomie produktu referencyjnego, własny wygląd SalesBeyond, kluby piłkarskie i Enea jako pierwszy cel. Edytor obiektów i panel organizatora są wyłączone. Poprzednie648 miejsc to wcześniejszy przyrost, nie całość docelowego MVP.

## Kolejność i stan
| Etap | Rezultat | Stan |
|---|---|---|
| 1 | Każdy fotel obecnego modelu wybieralny do podglądu; jeden katalog dla panelu i sceny | Kod:7614 foteli,4 trybuny,15 bloków; brak nowych dekoracyjnych krzeseł bez ID |
| 2 | Spójne2D/3D, zoom/pan, identyczne ID i wybór; fallback bez WebGL | Kod: lazy SVG2D, szczegóły dopiero dla aktywnego sektora; przy awarii3D działa plan |
| 3 | Koszyk wielu miejsc i dobór grupy w budżecie | Kod: limit10, deduplikacja, ceny z katalogu, atomowe dodanie; grupa nie przechodzi przez zajęte miejsca/alejkę; podsumowanie demo |
| 4 | Rzeczywisty model Enei zamiast obecnej generycznej bryły | Blocked: potrzebne pobrane/udostępnione pliki modelu wskazanego przez właściciela; sam link to oferta |
| 5 | Kalibracja modelu i warstwy miejsc | Po4: boisko/skala/poziomy/obrót, dopasowane rzędy i punkty oczu. Obecnych przykładowych ID nie podawać jako oficjalnych miejsc Enei |
| 6 | Docelowe kategorie/ceny, filtry, reguły wyboru i stany wydarzenia | Do implementacji: kategorie i ulgi wymagają danych, reguły liczby miejsc/pozostawiania pojedynczego fotela, sold-out/closed, zmiany dostępności |
| 7 | Rzeczywista dostępność, hold/wygaśnięcie/wznowienie/konflikt, checkout handoff | Wymaga serwera i trwałego magazynu. Koszyk przeglądarkowy nie blokuje foteli; nie imitować rezerwacji ani kupna |
| 8 | Odbiór całego flow na dużym ekranie i telefonie | Część poprzedniego panelu sprawdzona historycznie; nowe2D/koszyk/pełny katalog oraz rzeczywisty WebGL jeszcze nieodebrane |
| 9 | Docelowe MVP pod stałym linkiem | Po4–8. Sam deploy/budowa nie zamyka pełnego celu |

## Model wizualny i miejsca to oddzielne warstwy
Właściciel wskazał [Enea Stadium Photogrammetry Digital Twin](https://www.cgtrader.com/3d-models/sports/game/enea-stadium-lech-poznan-photogrammetry-digital-twin-environment). Oferta podaje199.99USD,4,441,206 polygonów i glTF716MB; dostępne również BLEND202MB/FBX167MB. To informacja sprzedawcy, nie wynik inspekcji pliku. Obejrzano publiczny podgląd: membranowy dach i bryła Enei różnią się zasadniczo od obecnej sceny. Nie kupiono ani nie pobrano właściwego modelu. Licencja oferty jest niestandardowa — nie zakładać automatycznie warunków webowego udostępnienia modelu.

Plan integracji po otrzymaniu plików:
1. Inspekcja faktycznej geometrii, tekstur i widoczności pod dachem; sam opis fotogrametrii nie dowodzi jakości widoku z fotela ani obecności semantycznych danych miejsc.
2. Wycięcie otoczenia zbędnego dla doświadczenia kibica, optymalizacja siatki, materiały/tekstury i eksportGLB w wariantach jakości. Rozmiar i jakość ustalić pomiarem, nie gwarantować z góry.
3. Kalibracja względem boiska i układu trybun; wspólny transform modelu i katalogu. Warstwa wyboru/punktów oczu nie może zgadywać pozycji wyłącznie z numeru miejsca.
4. Dobór warstwy modelu/occlusion i osobnej lekkiej warstwy wybieralnych miejsc. Fotogrametryczny skan nie jest bazą biletową.
5. Porównanie panoramy, charakterystycznego dachu i widoków z każdej trybuny na właściwej scenie WebGL. Nie nazywać generycznego modelu ani niezweryfikowanej nakładki cyfrowym bliźniakiem.

## Oparcie funkcjonalne
Oficjalny [SeatPicker](https://docs.seatlayer.io/buyer-sdk/seat-picker/) obejmuje mapę, wiele miejsc, tray, dobór grup, 2D/3D i handoff; [przewodnik3D](https://docs.seatlayer.io/buyer-sdk/add-3d-seat-view/) wymaga wspólnego chartu i pełnego fallbacku2D. To punkt porównania zachowania, nie deklaracja osiągniętej równoważności. W obecnym pakiecie istnieje lokalny publiczny kontrakt renderera/picker/transport; nie odtwarzamy prywatnych źródeł. Eksperymentalny `?renderer=local` zachowuje poprzednie648 miejsc do porównania; pełny katalog tego przyrostu dotyczy domyślnej sceny.

## Obecne ograniczenia
Łącznie52 testy, lint/typecheck/build i read-only review nie zastępują odbioru przeglądarkowego. Przeglądarka była automatycznie zablokowana limitem; nie podejmowano obejścia. Dane dostępności/cen są deterministycznym demo. Brak trwałych holdów, płatności i rzeczywistego planu wszystkich43tys. miejsc Enei. Zakres4–9 pozostaje otwarty.


## Wdrożenie obecnego przyrostu
Kod942fed8 opublikowany na [salesbeyond.vercel.app](https://salesbeyond.vercel.app), production, READY. Potwierdzono HTML/JS/CSS i lazy moduły HTTP200. Nie zastępuje to odbioru nowych interakcji ani nie oznacza podłączenia skanu Enei. Nie wykonano push/scalenia GitHub; wdrożono zweryfikowany lokalny snapshot przez API.
