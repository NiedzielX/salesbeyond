# Beyond na pasie za bramkami

[Obejrzane zbliżenie kontrolne CPU](advertising-detail.png) przedstawia jedną z dwóch lustrzanych reklam. Napis jest malowany na szarym podłożu, w stonowanym granatowym kolorze; pozostaje poza murawą i pierwszym rzędem.

`createBeyondAdvertising()` generuje jedną scaloną geometrię obu napisów. Środki: X±60.55m, Z±12m; Y=-.225 nad płytą Y=-.25. Szerokość jednego słowa około4.8m, wysokość na podłożu1.25m. Odstęp od trawy co najmniej.425m, od początku stopni.415m. Razem1030trójkątów, bez zmiany katalogu foteli, kamery, cen i wyboru.

Font pochodzi z zainstalowanego Three.js i jest parsowany lokalnie. Brak nowej zależności, zdalnego fontu lub tekstury. Model R3F i eksport CPU korzystają z tego samego helpera. Zbliżenie kontrolne ma kamerę [49,13,14] skierowaną na [60.55,-.225,12]; nie jest standardowym kadrem użytkownika.

Render wykonano Blendera/Cycles CPU. To nie screenshot aplikacji i nie potwierdza shaderów, klikania ani wydajności WebGL. Odbiór w przeglądarce pozostaje otwarty ze względu na wcześniejszą automatyczną odmowę dostępu.
