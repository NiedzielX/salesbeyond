---
date: 2026-11-17
area: product-and-process
status: active
source: wyraźne ustalenia właściciela w rozmowie 2026-11-17
---

## Kontekst
Właściciel zaakceptował funkcjonalne MVP, uproszczone 3D inspirowane Enea Stadionem i bardziej generyczne elementy. Fotorealistyczne kadry nie są konieczne. Następnie wskazał nowy AGENTS.generic.md oraz polecił stosować tańszy model agentom, gdzie to możliwe.

## Przyczyna
Wcześniejszy plan rozrastał się o fotorealizm, filmy i odwzorowanie obiektu ponad potrzeby MVP. Pierwszy AGENTS.md dotyczył innego produktu; nowy dokument zastępuje go jako źródło uniwersalnego procesu.

## Reguła
Aktualizacja zakresu 2026-11-18: właściciel wskazał „odwzorowanie całości” produktu referencyjnego i doprecyzował „Pełne doświadczenie kibica”. Trzy sektory i pojedyncza karta są wcześniejszym przyrostem, nie granicą docelowego MVP. Przygotuj pełny zakres kibica: cały koncepcyjny stadion, spójne 2D/3D, wielokrotny wybór i koszyk, ceny/filtry, reguły grupowego wyboru, perspektywa fotela i obsługa stanów dostępności. Edytor/panel organizatora wyłączono wprost. Backend niezbędny do rzeczywistych holdów lub checkout nie wynika z samego podglądu; rozdziel go jawnie od lokalnego demo i nie przedstawiaj symulacji jako blokady miejsca. Poniższy węższy wycinek opisuje historyczny zakres poprzednich specyfikacji, nie pełny nowy cel.

Realizuj ścieżkę stadion → sektor → rząd → miejsce → przelot → widok i proste podsumowanie. Zachowaj inspirację Enea Stadionem, ale nie wymagaj dokładnego bliźniaka. Nie dodawaj fotorealizmu, filmów AI, VIP, backendu ani płatności do MVP. Stosuj nowy AGENTS.md i deleguj ograniczone zadania tańszemu modelowi, sprawdzając samodzielnie jego ustalenia.

Właściciel doprecyzował 2026-11-18: znaleziony projekt to baza techniczna, natomiast blueprint nadal określa flow i kierunek wizualny. Produkt dla klubów piłkarskich, Enea jako pierwszy scenariusz. Wskazuj od razu konkretne ulepszenia z uzasadnieniem; nie kopiuj bezrefleksyjnie flow znalezionej biblioteki.

## Jak sprawdzić
Porównaj specyfikację i diff z powyższym zakresem; przejdź pełną ścieżkę wyboru. Sprawdź briefy pod-agentów i model użyty do audytu/review. Zgoda na tańsze modele nie oznacza zgody na słabszą weryfikację ani na publikację.
