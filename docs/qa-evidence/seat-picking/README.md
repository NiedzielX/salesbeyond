# Wybór foteli — kontrola CPU

Pomiar Node z faktycznymi transformacjami 38 078 foteli / 76 156 instancji siedzisk i oparć, osiem promieni, mediana pięciu przebiegów po rozgrzewce. [Wynik](cpu-benchmark.json): domyślny raycast 10,75 ms i 90 628 rzeczywistych wywołań Mesh.raycast; indeks 0,38 ms i 8 wywołań; po 8 trafień. Budowa indeksów 378,8 ms. Licznik bazowy uwzględnia istniejące odrzucanie sektorów przez bounding sphere; nie jest teoretyczną liczbą wszystkich instancji.

Odtworzenie: `node --experimental-strip-types scripts/benchmark-seat-picking.mjs`. Testy seatPicking.test.ts porównują ID/odległości/punkty z Three dla prostych/narożnych foteli, promieni skośnych, transformowanego rodzica, stron materiału i near/far; sprawdzają cleanup oraz brak zmian macierzy na hover/kolor.

To dowód kosztu CPU i zgodności geometrii trafień. Nie jest pomiarem FPS, dotyku, opóźnienia przeglądarki, WebGL ani wyglądu. Odbiór faktycznej aplikacji pozostaje otwarty z powodu wcześniejszej blokady dostępu.
