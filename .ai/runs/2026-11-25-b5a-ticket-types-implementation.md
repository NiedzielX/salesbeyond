---
started: 2026-11-25
ended: 2026-11-25
agent: root
spec: .ai/specs/2026-11-24-ticket-types-and-selection-policy.md
outcome: partial
---

# B5a — implementacja typów biletów i polityk wydarzenia

## Zadanie

Wdrożyć zatwierdzone B5a, zweryfikować klienta, API i migrację na izolowanej bazie, a następnie zastosować zatwierdzoną migrację w produkcyjnym schemacie `sb_hold`. Deploy aplikacji nie jest objęty zgodą.

## Przebieg

- Właściciel zatwierdził B5a i migrację 2026-11-25.
- Dodano eventowe typy `normalny`, `ulgowy`, `dziecko`, polityki 1–10 / 2–6,
  przypisanie typu per fotel, kompatybilny zapis sesji i katalogową sumę demo.
- Dodano osobny quote/create v2 z krótkim tokenem, dokładnym snapshotem
  fotel→typ→cena, replay idempotency, invalidacją quote i zachowaniem v1.
- Migracja dodaje prywatne `ticket_types` i `quotes`, serwerowe wyliczenie ceny,
  TTL/retencję, blokady w stałej kolejności i atomowe zużycie tokenu.
- Zastosowano migrację wydarzenia B oraz B5a w `pnexqoyhazwlobzgdmzt`.
  Dwa następcze indeksy pokryły klucze obce `quotes` i `seats`; nie zmieniano
  tabel innej aplikacji w schemacie `public`.
- Niezależny agent Luna nie znalazł blockerów ani findingów high/medium.

## Weryfikacja

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — 214 testów źródeł + 1 test skompilowanego endpointu, pass.
- `npm run build` — pass; pozostało wcześniejsze ostrzeżenie o dużym lazy chunku stadionu.
- PostgreSQL 17.6: migracja, re-run, zachowanie aktywnych holdów, retencja i testy
  wyścigów quote/create — pass.
- Lokalny browser 1440×900 i 390×844: event B, dwa miejsca, `dziecko` +
  `normalny`, 64/94 zł, razem 158 zł, limit 2/6, kontrolki 44 px, brak overflow
  i nieoczekiwanych błędów konsoli — pass.
- Supabase po migracji: A/B po 38 078 miejsc, version 2, sześć typów, RLS nowych
  tabel i execute v2 tylko dla `service_role` — pass.
- Rzeczywisty RPC: quote 126 zł → create → ten sam create zwrócił identyczny hold
  z `replayed: true` → release; testowe miejsca zwolniono — pass.
- Security/health advisors: brak błędów B5a. `rls_enabled_no_policy` dla prywatnego
  `sb_hold` jest zamierzonym deny-all. Nowe ostrzeżenia FK usunięto indeksami.

## Wynik

Kod i zatwierdzone migracje B5a są gotowe. Nie wykonano deployu aplikacji.
Pełne AC6 przez HTTP/UI production wymaga osobnej zgody na wdrożenie kodu v2.

## Lekcje

Token quote musi być unieważniany przy każdej zmianie foteli, typów lub reguły,
również gdy wcześniejsze żądanie jeszcze trwa; numer generacji chroni przed
przywróceniem spóźnionej odpowiedzi.
