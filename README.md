# Arena + Chat MVP (Render Clone Repo)

Ten projekt zamienia wcześniejszy „render clone” w **MVP platformy chat + arena**:

- 💬 Chat z historią rozmów.
- 🧠 Prosta pamięć konwersacji (summary).
- 🗑️ Usuwanie czatów.
- 📎 Upload obrazów i wideo (base64 -> `/uploads`).
- ⚔️ Battle mode (A/B) z głosowaniem.
- 📱 Responsywny interfejs (desktop + mobile).

## Ważne

To jest **prototyp developerski** z pamięcią in-memory. Do produkcji należy dodać:

- Postgres/Redis,
- autoryzację,
- rate limiting,
- moderację treści,
- observability,
- polityki bezpieczeństwa i zgodność z ToS dostawców modeli.

## Run

```bash
npm install
npm run start
```

`npm run start` uruchamia teraz krok `prestart`, który automatycznie doinstaluje brakujące zależności (np. `express`), jeśli folder `node_modules` nie istnieje lub jest niekompletny.

Serwer wystartuje domyślnie na:

- `http://localhost:3000`

> Na Windows i w przeglądarce używaj `http://localhost:3000`, nie `http://0.0.0.0:3000`.

Opcjonalnie:

```bash
HOST=0.0.0.0 PORT=3000 npm run start
```

Gdy ustawisz `HOST=0.0.0.0`, to jest to adres bind serwera (nasłuch), a nie adres do wpisania w przeglądarce.

## Troubleshooting

### Konflikty merge (`<<<<<<<`, `=======`, `>>>>>>>`)

Jeśli w plikach zostały znaczniki konfliktu (np. po `git pull` / merge), to `npm run start` zatrzyma się z czytelnym błędem i listą plików.

Naprawa:

1. Otwórz plik wskazany w komunikacie (np. `README.md`).
2. Usuń znaczniki konfliktu:
   - `<<<<<<< ...`
   - `=======`
   - `>>>>>>> ...`
3. Zostaw finalną, jedną wersję treści i zapisz plik.
4. Uruchom ponownie: `npm run start`.

### `Cannot find module 'express'`

Jeśli zobaczysz błąd:

```txt
Error: Cannot find module 'express'
```

uruchom:

```bash
npm install
npm run start
```

albo po prostu ponownie `npm run start` (prestart sam spróbuje wykonać `npm install`).

## API (MVP)

- `GET /api/health`
- `GET /api/models`
- `GET /api/me/usage`
- `POST /api/chat/create`
- `GET /api/chat/list`
- `GET /api/chat/:id`
- `POST /api/chat/:id/message`
- `DELETE /api/chat/:id`
- `POST /api/upload`
- `POST /api/arena/start`
- `POST /api/arena/:id/vote`
