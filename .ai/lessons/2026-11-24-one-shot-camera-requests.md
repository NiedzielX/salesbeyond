# Jednorazowe żądania kamery nie mogą odtwarzać się po remouncie

Żądanie sterujące kamerą oparte na rosnącym tokenie trzeba uznać za zużyte przed sprawdzeniem warunków wykonania. Dotyczy to także żądania otrzymanego podczas lotu, dla nieaktualnego fotela albo przed pełnym montażem kontrolera. Inaczej późniejszy render lub remount może niespodziewanie odtworzyć starą akcję.

Komponent montowany z istniejącym tokenem powinien przyjąć go jako wartość bazową, a nie wykonać historyczne żądanie. Test samej geometrii nie wystarcza: harness rzeczywistego kontrolera musi potwierdzić brak replayu po remouncie, stabilny pierwszy drag, brak przesunięcia oka oraz brak skutków ubocznych lotu, `onReady` i generowania miniatury.

Osobny root R3F może też zakończyć poprzedni lot po tym, jak rodzic przyjął już następny wybór, ale zanim nowe propsy dotrą do canvasa. Callback gotowości musi nieść generację nawigacji, a rodzic aktualizować bieżącą generację synchronicznie przy wyborze. Bez tego spóźnione `onReady` może przedwcześnie odblokować kontrolki i sprawić, że finalna miniatura nigdy nie powstanie.
