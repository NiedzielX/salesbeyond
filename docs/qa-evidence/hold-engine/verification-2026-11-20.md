# Weryfikacja ścieżki kibica — 2026-11-20

Historia: kibic wybiera fotel w widoku 2D/3D, odczytuje aktualny stan wybranego bloku, sprawdza cenę grupy, potwierdza czasową blokadę i może ją odzyskać lub zwolnić.

| Granica | Stan | Dowód |
|---|---|---|
| Dokument i moduły frontend | HTTPpotwierdzony | Root200, index-H9J_v_um.js, index-C_4H_pUx.css, Stadium-DAWnXRiu.js i StadiumMap-Bgl448mN.js HTTP200/właściweMIME |
| Interakcja React/WebGL | Nieodebrana | Wcześniejsza automatyczna odmowa dostępu do przeglądarki pozostaje nierozwiązana. Nie ponawiano kanału ani nie obchodzono przez inne narzędzie |
| Klient → API | Kontraktpotwierdzony | Testy walidacji/binding/current/cookie/idempotencji i timeout; realny HTTPtest dwóch sesji |
| API → Supabase | Rzeczywistypass | Status200/configuredtrue, inventory101200/216foteli, II-3 200/1998foteli/rzędy1–54, summary200/19bloków/38078foteli |
| Transakcja i właściciel | Rzeczywistypass | Wyścig2sesji jednejgrupy: dokładnie201+409; retryten samID, foreignGET/DELETE404, release, current odzyskujebezIDlokalnego; releasedcurrent404; brakmintowaniacookie wcurrent |
| Odpowiedź → readmodel i adaptery | Testypassed | Walidacja pełnegobloku, sekwencje, atomowyversionbump, reguły/grupy/wycena, delty2D/3D/ownedheld; brak zmianmacierzy |
| Odpowiedź → rzeczywisty obraz | Nieodebrana | TestyCPU/adapterów nie zastępują zachowania aplikacji na desktopie i telefonie |

Pełne lint/typecheck/test/build: exit0; 147testów źródeł +1 emittedJS smoke, build10,84s. Dodatkowe testy PostgreSQL17.6 obejmują migracje, RLS/granty, pełny seed, idempotencję, wyścigi, limit oraz expiry/staryrelease. Dowody sąsiednie w tym katalogu.

Wdrożony kod: 91272b34bc238b64c9d8a15949164732f56d8dc8, deployment dpl_8aZroMHhuiCFb7wKxU5NLo4FHwh1, production READY, salesbeyond.vercel.app. Sourceverified przez lokalny prepare-vercel-source manifest, nie przez Gitmetadane API (meta puste). Brak push/merge doGitHub w tymprzebiegu. Nagłówek funkcji zawiera fra1:iad1::fra1, metadane deployments.regions nadal iad1; zapisano rozbieżność bez zmiany ustawień całegoprojektu.

Dostępność w UI: aktualizowany tylko wybranyblok (15s/focus/manual/holdlifecycle). Pozostałe bloki pozostają jawnym katalogiemdemo. Odczyt nie jest gwarancją miejsca — potwierdza je wyłącznie transakcja create_hold. Ceny/wydarzenie są syntetyczne, brakpłatności i oficjalnego biletu.

Znaleziony wcześniejszy błąd emitted .ts importu naprawiono przez rewriteRelativeImportExtensions i rzeczywisty statusHTTP200. Full-story verification pozostaje częściowa przez nieodebraną granicę przeglądarki, nie przez bazę/API.
