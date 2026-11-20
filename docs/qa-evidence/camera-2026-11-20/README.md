# Kontroler kamery — rzeczywiste R3F/Drei, renderer CPU

Zgłoszenie właściciela było zasłyszane i nie zawierało konkretnego fotela ani fazy. Nie odtworzono końcowej pozycji pod murawą. Odtworzono natomiast przecinanie widocznych stopni przy lotach między fotelami oraz pozostawionej membrany przy podejściu z panoramy.

Na trasie `I-1-46-29` → `101-1-10` rzeczywisty komponent Camera zamontowany w zainstalowanym reconcilerze R3F, z prawdziwymi Drei/OrbitControls i Three, miał15przecięć stopni przed poprawką i0po niej na144klatkach. Punkt końcowy w obu próbach wynosił[-35.71,2.76,43]. Poprawka odchyla X/Z w stronę boiska; nie podnosi ani nie obniża profilu Y i zachowuje czas2.4s.

Osobny przebieg272renderów sprawdził bezpośredni fotel, zmianę proporcji900×555→350×550, nowe dane tego samego ID i szybkie przerwanie kolejnych przelotów. Ta sama kamera zachowała punkt oczu2.76, kierunek na boisko i wyłączoną orbitę po dotarciu.

Root przeczytał oba programy i sam uruchomił je ponownie na zintegrowanym kodzie. Wyniki: [controller-proof.json](controller-proof.json). Testy domenowe w repo utrwalają cztery trasy względem rzeczywistej geometrii oraz podejście panorama→III-3-1-29. Dodatkowo dach/frame są pomijane w czasie lotu i wracają zgodnie z preferencją oraz przekrojem po dotarciu; zaznaczenie/ceny/ID pozostają bez zmian.

Programy diagnostyczne należy uruchamiać **z katalogu głównego repo przez stdin**, żeby importy i pakiety rozwiązywały się względem źródeł:

```sh
node --input-type=module < docs/qa-evidence/camera-2026-11-20/probe-intrusion.mjs
node --input-type=module < docs/qa-evidence/camera-2026-11-20/probe-lifecycle.mjs
```

Pierwszy porównuje historyczny commit9f36318 z bieżącymi plikami, więc wymaga tego commita w lokalnej historii Git. Skrypty tworzą chwilowy moduł testowy w katalogu głównym i usuwają go w finally; nie uruchamiają serwera, przeglądarki, silnika WebGL ani połączenia sieciowego. Atrapa renderera zapisuje wyłącznie parametry kamery, a atrapowy ciąg obrazu nie stanowi screenshotu. Zależności mogą wypisać ostrzeżenie o ESM/CJS Three w tym harnessie.

**To test komponentu i geometrii na CPU, nie odbiór obrazu lub telefonu.** Rzeczywista płynność, wygląd i zgłoszony nieprecyzyjny objaw wymagają osobnego odbioru UI/WebGL; wcześniejszej odmowy przeglądarki nie obchodzono.
