---
date: 2026-11-20
area: fan-flow
status: active
source: niezależny audyt ścieżki grup i podglądu
---

## Kontekst
Propozycja grupy miała pozostać po obejrzeniu fotela, lecz klucz polityki zawierał updatedAt. Każdy odczyt dostępności usuwał ją z widoku. Po usunięciu znacznika czasu ujawnił się drugi problem: opuszczenie bloku usuwa jego overlay, a resolver ponownie zwraca dane demo.

## Reguła
Tożsamość propozycji i filtry użytkownika są niezależne od znacznika odczytu. Odświeżaj konkretne ID, ceny i statusy. Zachowaj ostatnią rzeczywistą obserwację; gdy resolver traci jej źródło i wraca do danych demonstracyjnych, pokaż stan wymagający aktualizacji i zablokuj dodanie do ponownego odczytu. Nie skracaj grupy i nie przywracaj znanego zajętego fotela jako wolnego. Rzeczywisty limit koszyka ma własny komunikat przed ogólną walidacją polityki.

Podgląd z listy jest jawnym żądaniem, nawet przy tym samym ID/view. Osobny licznik umożliwia powtórne kadrowanie/lot i post-render scroll/focus; polling nie zmienia tego licznika. Efekt nawigacji nie powinien kraść fokusu przy pierwszym montażu.

## Jak sprawdzić
Regresje refreshGroupProposal: niepowiązana zmiana, nowe ceny, zajęcie/brak, limit budżetu, utrata i odzyskanie źródła live. Regresja adaptera mapy: dwa jawne podglądy tego samego fotela centrują dwukrotnie, snapshot ceny nie centruje. Rzeczywista ścieżka UI pozostaje osobnym odbiorem.
