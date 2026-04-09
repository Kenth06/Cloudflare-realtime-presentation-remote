# Real-Time Presentation Remote

A full-stack presentation system with two synced views, built with Cloudflare Agents SDK, TypeScript, React, and Vite.

## Views

- **Display** (`/`) - Full-screen projector view with animated slide transitions, keyboard shortcuts, and QR code for the remote
- **Remote** (`/remote`) - Mobile-optimized controller with speaker notes, prev/next buttons, swipe navigation, and dark mode support

Both views connect to the same Cloudflare Agent instance via WebSocket. State changes sync instantly across all connected clients.

## Tech Stack

- **Runtime**: Cloudflare Workers + Durable Objects
- **Framework**: Cloudflare Agents SDK (`agents`)
- **Frontend**: React 19 + Vite
- **Build**: `@cloudflare/vite-plugin`
- **Language**: TypeScript (strict mode)

## Getting Started

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:5173` for the Display view and `http://localhost:5173/remote` for the phone Remote.

## Keyboard Shortcuts (Display)

| Key | Action |
|-----|--------|
| `Arrow Right` / `Space` | Next slide |
| `Arrow Left` | Previous slide |
| `F` | Toggle fullscreen |

## QR Code Tip

The Display view shows a small QR code in the bottom-left corner that links to `/remote`. Scan it with your phone to open the remote controller while presenting.

## Project Structure

```
src/
  server.ts          - Cloudflare Agent (Durable Object) with RPC methods
  client/
    main.tsx         - React entry point with client-side routing
    Display.tsx      - Projector/big-screen view
    Remote.tsx       - Phone remote view with speaker notes
    useSlides.ts     - Shared hook for Agent connection & state sync
```

## How It Works

1. The `PresentationAgent` is a Durable Object that holds the slide state
2. It exposes `next()`, `prev()`, and `goTo(index)` as callable RPC methods
3. Both views use the `useSlides()` hook which connects via WebSocket using `useAgent()`
4. When any client calls an RPC method, `setState()` persists to SQLite and broadcasts to all clients

## Deploy

```bash
npx wrangler deploy
```
