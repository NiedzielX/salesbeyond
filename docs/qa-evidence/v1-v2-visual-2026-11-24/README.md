# V1/V2 — produkcyjny odbiór wizualny

Data: 2026-11-24  
Deployment: <https://salesbeyond.vercel.app/>  
Zakres: proceduralne MVP Enea-like, bez deklaracji oficjalnego lub fotogrametrycznego cyfrowego bliźniaka.

## Wynik

- Osiem reprezentatywnych kadrów sceny działa w WebGL2 bez błędów aplikacji.
- Panorama pokazuje cztery trybuny, połączone narożniki, pełną białą membranę i boisko.
- Sześć kontrolowanych perspektyw zachowuje murawę i lokalny przekrój dachu; rząd 1 pozostaje nad boiskiem.
- Desktop 1440×900 i emulacja dotykowa 390×844 nie mają poziomego overflow.
- Dodatkowe pełne kadry UI oraz `ui-verification.json` łączą obraz z dokładnym sektorem, rzędem, miejscem i oznaczeniem danych demo.

## Pliki

- `verification.json` — techniczna macierz ośmiu kadrów i ręczna ocena każdego obrazu.
- `ui-verification.json` — odczyt live-region i ticketu dla rzędu 1, narożnika i telefonu.
- `probe-visual-matrix.mjs`, `probe-ui-evidence.mjs` — powtarzalne skrypty produkcyjne.
- `*.png` — obrazy sceny i pełnego komponentu doświadczenia.

## Jawne różnice do polishu

- Niski kontrast białej membrany z jasnym tłem panoramy.
- Gęste etykiety sektorów w mobilnej panoramie.
- Mocno widoczna pionowa tablica Beyond z dolnego rzędu, bez zasłaniania murawy.
