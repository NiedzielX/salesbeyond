# Symulowana widownia — kontrola geometrii i kontrolera

Obejrzane rendery CPU tego samego fotela w rzędzie54 blokuII-3:

- [Puste trybuny](authored-enea-crowdSeatEmpty.png)
- [Z kibicami](authored-enea-crowdSeat.png)
- [Panorama z widownią](authored-enea-crowdOverview.png)

Sylwetki w poprzedzających rzędach zmieniają widoczne fragmenty boiska. Własna postać obserwatora jest wyłączona. Geometria i pozycje pochodzą z tych samych helperów co aplikacja; uproszczone boisko i oświetlenie Blendera nie są dokładnym odtworzeniem R3F. To obrazy kontrolne CPU, nie screenshoty przeglądarki ani certyfikowany rzeczywisty widok.

60trójkątów na jedną sylwetkę: głowa, tułów i siedząca część ciała. Jedna geometria oraz InstancedMesh dla38 078foteli, bez odrębnych obiektów React na kibica. Razem2 284 680trójkątów widowni przy pełnym wariancie. Tryb domyślnie wyłączony; geometryczne instancje powstają dopiero po pierwszym włączeniu i są usuwane po wyłączeniu. Jednorazowe zapisanie macierzy miało około91ms w jednym pomiarzeNode na tym środowisku; nie jest to pomiar GPU, FPS ani telefonu.

Testy jednostkowe sprawdzają pełne38 078pozycji/kierunków, wysokość sylwetki, ignorowanie dostępności, ukrywanie/odtwarzanie obserwatora i kolejnych punktów startowych oraz zachowanie wszystkich oczekujących zakresów aktualizacji GPU. Prawdziwy promień Three przecina kontrolną sylwetkę przy standardowym raycast; wyłączony raycast widowni nie daje trafień.

Rzeczywiste komponenty Camera/Crowd zamontowano w reconcilerze R3F z atrapą renderera, prawdziwymi Three/Drei i StrictMode. [Wynik kontrolera](controller-proof.json) obejmuje57perspektyw pierwszych/środkowych/ostatnich rzędów wszystkich19bloków,295wywołań renderowania i62odczyty miniatur. Sprawdzono przełączanie podczas i po locie, brak resetu pozycji/orientacji, szybkie zmiany foteli, reduced-motion i reset. Miniatury są odczytywane po zastosowaniu docelowej maski, w wariancie aktualnie wybranym w UI. Własny avatar pozostał ukryty we wszystkich włączonych odczytach.

Odtworzenie z katalogu głównego repo:

```sh
node --experimental-strip-types scripts/export-authored-stadium.mjs /tmp/crowd-review.json
blender -b -t 4 --python scripts/render-authored-stadium.py -- /tmp/crowd-review.json /tmp/crowd-review crowdSeatEmpty crowdSeat crowdOverview
node --input-type=module < docs/qa-evidence/crowd-2026-11-21/probe-controller.mjs
```

Program kontrolera używa atrapy ciągu obrazu i sprawdza parametry/maski, nie piksele. Nie uruchamia przeglądarki, grafiki WebGL ani połączeń sieciowych; chwilowy moduł usuwa w finally. Może wypisać ostrzeżenie o dwóch wariantach ESM/CJS Three w tym harnessie.

**C5 pozostaje częściowo otwarte:** pełne porównanie rzeczywistego obrazu, dotyku/klawiatury, klikania i płynności na desktopie/telefonie wymaga WebGL. Wcześniejsza automatyczna odmowa przeglądarki nie została uznana za zdjętą i nie była obchodzona.
