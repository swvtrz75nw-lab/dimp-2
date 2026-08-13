# DIMP Frontend

A React chat interface for the **PMI DIMP Price Simulator Agent**. Streams responses token-by-token from the FastAPI backend over SSE.

---

## Preview

The UI consists of:
- **Sidebar** — logo, new chat button, recent chat history
- **Chat panel** — streaming message bubbles with markdown rendering
- **Welcome screen** — shown when no messages exist, with a price analytics icon

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 |
| Build tool | Vite |
| Markdown | react-markdown |
| Styling | Plain CSS |
| Container | Nginx (port 6000) |


---

## Project Structure

```
dimp-sample-frontend/
├── public/
│   └── pmi_logo.png
├── src/
│   ├── services/
│   │   └── api.js          # SSE fetch logic
│   ├── App.jsx             # Root layout
│   ├── App.css
│   ├── Chat.jsx            # Chat panel + streaming logic
│   ├── Chat.css
│   ├── Sidebar.jsx         # Left nav
│   ├── Sidebar.css
│   ├── index.css           # Global styles
│   └── main.jsx            # React entry point
├── docker/
│   ├── nginx/              # Nginx config
│   └── entrypoint.sh
├── .env                    # Environment variables
├── Dockerfile
├── index.html
├── package.json
└── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Configure environment

Edit `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Point this to wherever the FastAPI backend is running.

### Run in development

```bash
npm start
```

Opens at `http://localhost:5173`

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

---

## API Integration

All chat requests go through `src/services/api.js`.

| Backend endpoint | Method | Purpose |
|---|---|---|
| `/api/dimp-simulator-agent/chat` | POST | Send message, receive SSE stream |
| `/api/dimp-simulator-agent/v1/health` | GET | Health check |

### Request payload

```json
{
  "message": "What is the price forecast for Q3?",
  "session_id": "user-abc123"
}
```

### SSE event types

| `type` | Description |
|---|---|
| `text` | Streamed token from the model — append to display |
| `thinking` | Model reasoning tokens (if supported by model) |
| `tool_call` | Model decided to call a tool |
| `tool_result` | Tool executed, result returned |
| `iteration` | ReAct loop fed tool results back to model |
| `error` | Max iterations reached or server error |

### How the frontend handles streaming

```js
if (parsed.type === 'text') {
    bufferRef.current[botMsgId] += parsed.content;  // accumulate
    startFlush(botMsgId);                            // render at ~60fps
}
```

Text chunks are buffered and flushed at 60fps for a smooth typing effect. The stream closing naturally signals the end of the response.

---

## Docker

### Build

```bash
docker build -t dimp-sample-frontend .
```

### Run

```bash
docker run -p 6000:6000 dimp-sample-frontend
```

Opens at `http://localhost:6000`

### Environment variable at runtime

The `entrypoint.sh` injects `VITE_API_BASE_URL` at container start, so you can override it without rebuilding:

```bash
docker run -p 6000:6000 -e VITE_API_BASE_URL=https://your-backend.com dimp-sample-frontend
```

---

## Session Management

Sessions are managed server-side. The frontend generates a `session_id` (UUID) on the first message of each chat and reuses it for subsequent messages in the same conversation. Clicking **+ New Chat** resets the session.

---

## Backend

See the backend README at `../dimp-chat-backend/README.md` for setup instructions.
