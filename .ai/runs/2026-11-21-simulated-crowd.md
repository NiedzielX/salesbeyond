---
started: 2026-11-21
ended: 2026-11-21
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie
Zrealizować zleconą widownię C1–C5: ciemne siedzące sylwetki, przełącznik pustych/zapełnionych trybun i porównanie perspektywy za kibicem w poprzednim rzędzie. Zachować wybór, kamerę i serwerowe blokady.

## Przebieg
- Environment starting→ready; start clean,HEAD ce0d16f, baseline155+1/lint/typecheck/build z poprzedniego przyrostu.
- Nowa dostępność namespace przeglądarki nie zdejmuje wcześniejszej odmowy; brak ponowienia/obejścia.
- Root odpowiada za UI/scenę/miniaturę/eksport CPU i integrację. Ograniczony agent dostaje rzeczywisty izolowany worktree dla helpera geometrii/instancji i testów; niezależny agent robi read-only review.
- Luna/helper potwierdziła /workspace/worktrees/salesbeyond-crowd-instances, branchfeat/crowd-instances przed zapisem. Root przeczytał5158c1f i zintegrował jako6b28f2c, następnie sam poprawił wykryty regresją błąd tracenia oczekujących updateRanges i połączył tułów z głową.
- Własny przełącznik w App, domyślnie pusto; brak zmian reduktora/holdów/cen. Trwały logiczny Crowd śledzi źródła/cele także przy wyłączonej widowni, a jeden InstancedMesh powstaje tylko w trybie włączonym. Kliknięcia przez sylwetki dzięki pustemu raycast.
- Miniatura przeniesiona z useFrame przed onReady do layoutu po commit rodzica flying=false. Przełączenie widowni/resize odświeża obraz, nie zmieniając klucza nawigacji. Uaktualniono diagnostyki kamery do jawnego stanu przybycia rodzica.
- Obejrzano parę identycznych kadrów pusty/z kibicami z rzędu54 i panoramę CPU. Widać sylwetki przed kamerą; nie widać własnej postaci. Render używa wspólnej geometrii i kanonicznych pozycji, bez zewnętrznych modeli/fontów/zasobów.
- Read-only review Luny:bez potwierdzonej dalszej usterki w lifecycle, maskach, capture lub izolacji stanu; brak przeglądarkowego zaliczenia.

## Weryfikacja
- Root odtworzył błąd zakresów przed poprawką:1/1fail („pending matrix0was dropped”), po poprawce5/5crowd tests pass. Obejmuje też rzeczywisty promień Three z trafieniem bazowym i zerem trafień w widownię.
- Pełne lint/typecheck/test/build:exit0,160testów źródeł+1wyemitowanego API; build9.65s. Po dodaniu mocniejszej asercji raycast powtórzono focused5/5, bez zmian kodu produktu wymagających nowego buildu.
- Root sam uruchomił rzeczywisty Camera/Crowd w R3F/Drei/Three z atrapą renderera i StrictMode:57perspektyw wszystkich19bloków,295renderów,62odczyty; wszystkie aktywne odczyty ukrywają obserwatora. Tryby w locie/po locie, odtwarzanie źródeł, reducedmotion i reset:pass. Obydwa starsze programy kontroli kamery również pass po adaptacji kontraktu rodzica.
- Render Blendera CPU3kadrów, Python/eksport:pass. Widownia60tri/postać, jeden draw obiektu instancji; pomiar zapisania macierzy~91ms CPU. Nie jest to benchmarkWebGL.
- Przegląd React skill: prymitywne zależności kamery, brak nowych fetchy/deps, geometria lazy przy włączeniu, dostępne natywne przyciski i fokus. WebGL/UI/telefon C5 nadal pending z powodu wcześniejszej odmowy.

## Wynik
Sourcea46fba9 wdrożony production READY: `dpl_F1uwAg93QuwaoDeJWDPzq5utMxL8`, alias salesbeyond.vercel.app, aliasError=null. Lokalny manifest63plików418 497bajtów wiąże przesłany snapshot z commitem; zdalne meta nie zawiera GitSHA. Bez push/merge GitHub, migracji, nowych sekretów lub zmian infrastruktury.

HTTP200: HTML, index-C_kqyGo-.js z etykietami trybów, index-1YLUqx8G.css z crowd-controls, Stadium-DsxvC7kx.js z widownią i zachowaną reklamą Beyond, StadiumMap-CiZZRLpc.js. API status configured/service i inventory II-3/1998:200. Error/fatal ostatnie15min dla deploymentu:brak wpisów. Dowód `docs/qa-evidence/crowd-2026-11-21/http-proof.json`.

Kod C1–C4 i kontroler/C5 na CPU gotowe, pozostaje rzeczywisty odbiór obrazu, klikania, dotyku i płynności na desktopie/telefonie. Dlatego outcome partial, spec in-progress. Tymczasowy worktree usunięto dopiero po integracji i potwierdzeniu, że jedynym nieśledzonym plikiem jest własny symlink node_modules. Po końcowych zmianach samych dokumentów nie ponawiano bramek kodu.

## Lekcje
Dodano `.ai/lessons/2026-11-21-crowd-mask-and-preview.md`: zachowanie niewysłanych zakresów GPU i miniatura dopiero po commit maski przybycia.
