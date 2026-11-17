---
started: 2026-11-17T23:14:45.059076+01:00
ended: 2026-11-17T23:26:57+01:00
agent: Codex
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

## Zadanie
Odbiór w prawdziwej przeglądarce po jawnej zgodzie właściciela na lokalny Vite zamiast managed preview.

## Przebieg
- Reprodukcja: lokalna strona po otwarciu natychmiast przechodziła w BRAK 3D, bez błędu WebGL w konsoli. Canvas fallback jest zawsze montowany jako dzieci canvas; efekt Unavailable wywoływał onUnavailable niezależnie od wsparcia grafiki. Usunięto powiadomienie z fallbacku HTML; błędy renderer obsługuje nadal Boundary, utratę kontekstu listener.
- Właściciel zezwolił na lokalny serwer Vite i samodzielne wykonywanie rekomendowanych poprawek w zatwierdzonym zakresie. Brak zgody na publikację/scalenie.

## Weryfikacja
- Vite lokalnie 5173: uruchomiony, strona otwarta w cloud Chromium; jawna zgoda właściciela na wyjątek od managed preview.
- Browser QA: desktop 1440×900 i telefon 390×844, wymiary odczytane z DOM; zmieniono normalny rozmiar okna i zoom. DevTools zablokowane, nie obchodzono polityki.
- 36 wyborów: 18 w każdym rozmiarze; sektory 101/102/103, rzędy 1/6/12, pierwsze/ostatnie dostępne miejsca. Dane i ceny zgodne, powrót zachowuje rząd.
- Co najmniej 6 resetów panoramy i 36 zmian bez reload; dodatkowo reload i ponowny wybór 101/6/1 poprawne.
- Klawiatura: Home/End/strzałki na rzędzie, Enter wybiera i wraca. Modal: Shift+Tab z Zamknij przechodzi do Odkrywaj stadion, Tab wraca, Escape zamyka i przywraca fokus O projekcie.
- Szerokość dokumentu 1421 ≤ 1440 i 380 ≤ 390; brak poziomego overflow. Przy mobile fallback panelTop 91 px po wyborze, podsumowanie widoczne.
- Obejrzano i zapisano zrzuty docs/qa-evidence/desktop-1440x900.jpg oraz mobile-390x844.jpg.
- W konsoli po naprawie rzeczywisty błąd tworzenia WebGL: GL_VENDOR/GL_RENDERER Disabled, BindToCurrentSequence failed. Są także błędy rozszerzenia browser metadata; nie raportujemy czystej konsoli.
- Próba otwarcia chrome://gpu została odrzucona przez politykę URL narzędzia. Nie próbowano dostępu pośredniego ani alternatywnej powierzchni do tej diagnostyki. DevTools również zablokowane przez organizację; do testu rozmiarów wykorzystano normalne okno, bez odblokowywania narzędzi.
- Końcowe npm run lint/typecheck/test/build: wszystkie exit 0, 20/20 testów, 2255 modułów, JS 1197,15 kB/gzip 339,80 kB. Znane ostrzeżenie bundle >500 kB.
- Niezależny review gpt-6.2-sol potwierdził źródło błędu fallback w R3F i zachowanie Boundary/contextLost; rekomendację neutralnej treści wdrożono. Integrator wykonał browser QA i bramki samodzielnie. Reviewer dodatkowo sprawdził 3/3 testy kontrolera.
- git diff --check: exit 0.


## Wynik
Commit kodu 8d355e6: usunięte przedwczesne wyłączenie sceny i sklejanie mobilnych nagłówków. Browser QA panelu/fallbacku zaliczone; widok stadionu, raycast foteli, wizualne przeloty i autotour nadal niezweryfikowane z powodu braku WebGL w cloud. Spec pozostaje in-progress, bez udawania pełnego MVP acceptance. Serwer lokalny pozostawiono uruchomiony i tab oznaczono deliverable; brak publikacji, push i scalenia. Zgoda na Vite i samodzielne poprawki zapisana w aktualizacji istniejącej lekcji, nie będzie ponownie pytana.

## Lekcje
- .ai/lessons/2026-11-17-canvas-fallback-effects.md — mount fallbacku nie oznacza braku WebGL.
- Zaktualizowano .ai/lessons/2026-11-17-preview-qa-limit.md o zgodę właściciela i preferencję wykonywania rekomendacji bez drobnych pytań.
