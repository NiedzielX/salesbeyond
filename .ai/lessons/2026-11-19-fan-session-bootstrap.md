---
date: 2026-11-19
area: fan-session
status: active
source: implementacja i niezależny review odtwarzania wyboru
---

## Kontekst
Koszyk demo i ostatni podgląd są odtwarzane z localStorage, a link do fotela ma pierwszeństwo wejścia. Ceny i statusy pozostają kanonicznymi danymi katalogu.

## Przyczyna
Efekt zapisujący domyślny koszyk przed odczytem usuwa poprzedni wybór. Odczyt rzucający wyjątek i następujący po nim zapis pustego stanu ma ten sam skutek. Stały parametr seat w adresie może po odświeżeniu nadpisać późniejszą nawigację.

## Reguła
Odtwarzaj w lazy bootstrap przed inicjalizacją reducerów i pierwszym efektem zapisu. Po błędzie odczytu wyłącz zapis dla tego mount. Zapisuj ID/preferencje, odtwarzaj kanoniczne ceny/statusy i oddziel wersje/zakresy kluczy. Zajętego fotela nie przywracaj do koszyka, ale pozwól obejrzeć go jako podgląd. Synchronizuj deep link z dalszym wyborem i usuwaj seat po wyjściu do panoramy. Nie uznawaj lokalnego zapisu za rezerwację ani świeży odczyt dostępności serwera.

## Jak sprawdzić
Testy fanSession.test.ts i review useFanSession/App: clear/remove+reload, błędy odczytu/zapisu, stare ID/ceny/statusy, pełny/legacy i zmiana fotela po otwarciu linku. Właściwy lifecycle React i clipboard wymagają osobnego browser QA.

## Uzupełnienie: hold serwera bez lokalnego storage
`localStorage` jest tylko opcjonalnym wskaźnikiem pomagającym odtworzyć hold; źródłem własności pozostaje sesja HttpOnly i serwerowe `current(eventId)`. Osobno chronić samo pobranie `window.localStorage` oraz późniejsze operacje storage. Błąd lokalnej trwałości nie może wpadać do wspólnej obsługi błędu statusu usługi ani wyłączać quote/hold/release. Regresja hooka ma zwracać aktywny hold przy rzucającym getterze storage, a osobny przypadek ma potwierdzać `unavailable` po faktycznym odrzuceniu `status()`.
