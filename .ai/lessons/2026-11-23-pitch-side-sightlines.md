---
date: 2026-11-23
area: stadium-branding
status: active
source: production WebGL acceptance
---

# Sprawdzaj reklamy promieniem z pierwszego rzędu

## Kontekst

Panel Beyond był poprawnie pionowy i poza murawą, ale pełna nieprzezroczysta bryła za bramką przecinała widok z pierwszego rzędu do pobliskiej części boiska. Kontrolny render samej reklamy i test braku nakładania na murawę tego nie wykryły.

## Przyczyna

Położenie obiektu poza boiskiem nie gwarantuje wolnej linii widzenia. Niski punkt oka i bliski panel mogą zasłaniać murawę, mimo że centralny kierunek kamery przechodzi nad panelem.

## Reguła

Dla nieprzezroczystych reklam i elementów pitch-side testuj odcinki od rzeczywistych oczu pierwszego rzędu do bliskich punktów murawy po obu stronach stadionu. Nie uznawaj samej projekcji NDC ani braku kolizji z boiskiem za dowód niezasłaniania.

## Jak sprawdzić

Użyj kanonicznego fotela, `eyePosition()` i ograniczonego długością raycastu do reprezentatywnego punktu murawy. Test ma najpierw reprodukować przecięcie, a potem przejść po korekcie; obejrzyj też rzeczywisty POV WebGL.
