# Stan końcowy poza wyciszonym zegarem

Sekundowego odliczania nie należy umieszczać w aktywnym live regionie, bo czytnik ekranu otrzymałby serię zbędnych komunikatów. Jednocześnie wynik końcowy — wygaśnięcie lub zwolnienie — nie może pozostać wyłącznie w elemencie z `aria-live="off"`.

Wzorzec: zegar pozostaje wyciszony, a pojedynczy komunikat o przejściu do stanu terminalnego trafia do stabilnego `role="status"` z `aria-live="polite"`.
