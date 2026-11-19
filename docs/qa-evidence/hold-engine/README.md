# Dowód lokalnego silnika blokad

postgres-17.6.txt: wynik python3 scripts/test-holds-postgres.py, 2026-11-19. Rzeczywisty PostgreSQL i niezależne połączenia; nie mock ani procesowa Map. Obraz przypięty w skrypcie, kontener jednorazowy, sieć none, bez portów i trwałych danych. Test tworzy, sprawdza i usuwa wyłącznie własny kontener.

Nie potwierdza połączenia Supabase/Vercel, WebGL ani ścieżki użytkownika w przeglądarce. 112/112 testów JS wraz z lint/typecheck/build potwierdzono osobno w logu przebiegu.
