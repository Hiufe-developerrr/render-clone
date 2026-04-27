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

Serwer wystartuje domyślnie na:


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
