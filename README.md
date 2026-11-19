# SalesBeyond — stadion dla kibica

Prototyp pełnego doświadczenia kibica: stadion → blok → rząd → miejsce → przelot → widok z fotela → koszyk demo. Pierwszy scenariusz to Enea Stadion. React + TypeScript + Vite, Three.js / React Three Fiber, Drei i Tailwind CSS; natywna mapa 2D korzysta z `@seatlayer/core@0.109.1`.

## Uruchomienie

Node.js 22.18+ (zalecany 24):

```sh
npm ci
npm run dev
```

Weryfikacja i produkcyjny build:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm exec vite preview
```

`dist` jest aplikacją statyczną. Podgląd: https://salesbeyond.vercel.app. Stan aktualnego przyrostu i wdrożenia: [log wyszukiwania kibica](.ai/runs/2026-11-18-fan-seat-search.md).

## Obecna implementacja

- Własna misa stadionu tworzona kodem: połączone zaokrąglone narożniki, zróżnicowane wysokości czterech trybun, dwa/trzy poziomy, przejścia, portale i ciągły łukowy dach membranowy z kratownicami. Boisko 105 × 68 m.
- Wspólny katalog **38 078 foteli w 19 blokach**. Każdy widoczny fotel ma ID i jest dostępny do podglądu także wtedy, gdy demonstracyjny status wyklucza dodanie do koszyka. Zachowano 648 wcześniejszych ID.
- Domyślny plan 2D używa rzeczywistego `createRenderer` biblioteki: zoom/pan, bloki, rzędy, podgląd i mapowanie na domenowe ID. W razie awarii jego inicjalizacji zostaje prostszy plan SVG. Po awarii WebGL można używać planu 2D.
- Domyślne 3D używa R3F i własnej geometrii. Instancjonowane siedziska/oparcia, podświetlenie całego bloku, wybór fotela, kadr bloku od strony boiska, lot 2,4 s i perspektywa oczu z tego samego modelu.
- Filtry ceny za osobę i dostępności, liczniki pasujących foteli dla całego stadionu, trybuny, bloku i rzędu. Fotele poza filtrem pozostają dostępne do podglądu, a filtr nie kasuje koszyka.
- Koszyk demo do 10 miejsc i propozycja grupy 2–6 obok siebie w budżecie. Propozycja pokazuje blok/rząd/numery/cenę/sumę przed osobnym obejrzeniem i dodaniem. W wybranym bloku wyszukuje tylko ten blok, bez alejek i foteli już w koszyku.
- Wszystkie ID koszyka są odtwarzane na domyślnej mapie 2D i oznaczane w 3D/SVG/panelu; aktywny podgląd zachowuje odrębne wyróżnienie. To wybór demonstracyjny, nie rezerwacja.
- Polski interfejs, wybór w panelu, reset, przełącznik dachu, wycieczka i miniatura z kamery po dotarciu. Nowe zachowanie wymaga jeszcze odbioru w działającej przeglądarce.

## Co pochodzi z biblioteki

Repo używa przypiętego skompilowanego pakietu przez jego publiczny kontrakt. **Nie przeniesiono całego produktu ani źródeł prywatnego silnika.** Natywny renderer 2D działa na naszym charcie, geometrii i identyfikatorach. UI, katalog, model 3D, kamera i koszyk są własne.

`/?renderer=local` zachowuje wcześniejszy eksperyment natywnego 3D z 648 miejscami. Nie jest nowym pełnym modelem i nie stanowi domyślnej ścieżki. Kod porównawczy: `venueChart.ts`, `venueShell.ts`, `src/integrations/localVenue.ts` i `LocalVenue.tsx`; [checklista](docs/LOCAL_RENDERER_QA.md).

## Wspólna geometria i miejsca

- `src/data/eneaLayout.ts`: rozstaw, profile poziomów, połączone proste/narożniki i powierzchnia dachu.
- `src/data/stadium.ts`: kanoniczne fotele, indeksy bloków/rzędów, statusy i kadry.
- `src/integrations/eneaModel.ts`: buforowa geometria architektury używana przez 3D i eksport kontrolny.
- `src/data/fullChart.ts`: chart 2D, jawne mapy ID i dokładne przesunięcia foteli, także w łukach.
- `src/integrations/nativeMap.ts`: cykl życia natywnej mapy i synchronizacja wyboru bez echa zdarzeń.
- `src/components/Stadium.tsx`: instancje foteli, interakcje i kamera; `StadiumMap.tsx`: plan 2D i fallback.
- `src/domain`: kamera, wybór, wycieczka i koszyk. `App.tsx`: wspólny stan i interfejs.

## Weryfikacja i ograniczenia

Lint/typecheck/build i 65 testów przechodzą. Testy obejmują rzeczywisty kompilator chartu i wszystkie 38 078 ID/pozycji, ciągłość dachu, podparcie foteli przez geometrię, kadry w różnych proporcjach i kontrakty zdarzeń mapy. [Obejrzane kontrolne rendery CPU](docs/qa-evidence/authored-enea/README.md) pokazują geometrię; nie są zrzutami aplikacji ani dowodem działania WebGL.

Odbiór obecnego 2D/3D i koszyka na desktopie/telefonie pozostaje otwarty: automatyczna kontrola odrzuciła otwarcie przeglądarki z powodu nierozwiązanej wcześniejszej blokady dostępu. Nie używano innego kanału jako obejścia. Historyczne testy starego panelu w `docs/QA.md` nie są odbiorem tego przyrostu.

To autorska rekonstrukcja inspirowana Eneą, **nie zweryfikowany skan ani oficjalna siatka miejsc**. Nie wymaga pliku BLEND/GLB od użytkownika ani zakupu modelu. Ceny, dostępność i numeracja są poglądowe. Brak rzeczywistych holdów, logowania, płatności i połączenia z systemem klubowym; koszyk nie rezerwuje miejsc.

Dalsze prace: [plan doświadczenia kibica](docs/FAN_EXPERIENCE_ROADMAP.md), [plan wykonawczy](.ai/EXECUTION_PLAN.md), [zatwierdzona specyfikacja](.ai/specs/2026-11-17-functional-stadium-mvp.md).
