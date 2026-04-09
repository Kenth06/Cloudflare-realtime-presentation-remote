# Real-Time Presentation Remote

## Overview

A full-stack presentation system with two synced views connected via WebSocket through a Cloudflare Agent (Durable Object). The presenter controls slides from their phone while the audience sees the presentation on a projector.

- **Display** (`/`) — Projector/big-screen view showing slide content
- **Remote** (`/remote`) — Mobile phone controller with speaker notes and timer

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers + Durable Objects |
| Agent Framework | Cloudflare Agents SDK (`agents@0.10.0`) |
| Frontend | React 19, Tailwind CSS v4, shadcn/ui (Luma theme) |
| Build | Vite 6 + `@cloudflare/vite-plugin` |
| Language | TypeScript 6 (strict mode) |
| Icons | lucide-react |
| Fonts | DM Sans + JetBrains Mono |

## Architecture

```
Display (/)  ←── WebSocket ──→  PresentationAgent  ←── WebSocket ──→  Remote (/remote)
  (projector)                    (Durable Object)                     (phone)
```

- The `PresentationAgent` holds all slide state in a single Durable Object instance named `"default"`
- `setState()` persists to SQLite and broadcasts to all connected clients automatically
- Both views connect via `useAgent()` from `agents/react` and receive state updates in real-time
- `@callable()` decorator (TC39 stage 3) exposes RPC methods: `next()`, `prev()`, `goTo(index)`

## Project Structure

```
src/
  server.ts                    — PresentationAgent Durable Object (RPC + state)
  client/
    main.tsx                   — React entry, routes / → Display, /remote → Remote
    index.css                  — shadcn Luma theme (oklch tokens, @theme inline)
    Display.tsx                — Projector view (slides, dots, nav, QR overlay)
    Remote.tsx                 — Phone remote (notes, timer, nav, swipe)
    useSlides.ts               — Shared hook wrapping useAgent() for state sync
    lib/
      utils.ts                 — cn() utility (clsx + tailwind-merge)
    components/ui/
      button.tsx               — shadcn Button (default/secondary/ghost/outline/icon)
      card.tsx                 — shadcn Card/CardContent
      badge.tsx                — shadcn Badge
```

## Key Files

### `src/server.ts`
- Exports `PresentationAgent extends Agent<Env, SlideState>`
- `initialState` seeds 8 demo slides about Cloudflare Agents
- `@callable()` methods: `next()`, `prev()`, `goTo(index)` — all clamp within bounds
- Default fetch handler: routes agent WebSocket requests, falls back to 404 (assets handled by Cloudflare SPA config)

### `src/client/useSlides.ts`
- `useAgent<SlideState>()` connects to agent `"PresentationAgent"`, instance `"default"`
- Tracks `connected` state via `onOpen`/`onClose`/`onError`
- Exposes: `state`, `currentSlide`, `slideNumber`, `totalSlides`, `isFirst`, `isLast`, `next`, `prev`, `goTo`

### `src/client/Display.tsx`
- Keyboard shortcuts: `ArrowRight`/`Space` → next, `ArrowLeft` → prev, `F` → fullscreen
- Bottom bar: slide dot indicators (active = pill), counter with arrow buttons, fullscreen toggle, QR code
- QR code click opens fullscreen overlay with large scannable QR + URL
- Slide transitions animate via key-based remount + CSS `animate-slide-in`

### `src/client/Remote.tsx`
- Timer: local `setInterval` with START/PAUSE toggle and reset button
- Swipe detection: `touchstart`/`touchend` with 50px threshold and 1.5x horizontal dominance
- Header: LIVE dot, TITLE label, slide counter, timer, START button
- Speaker notes in Card, warm accent cue card below
- Prev/Next buttons with `active:scale-[0.97]` touch feedback
- Safe area insets for iPhone notch/home bar

## Configuration

### `wrangler.jsonc`
- `main`: `src/server.ts`
- `compatibility_date`: `2025-04-01`
- `compatibility_flags`: `["nodejs_compat"]`
- `assets.not_found_handling`: `"single-page-application"` — serves `index.html` for `/remote` and other non-file routes
- Durable Objects binding: `PresentationAgent` → class `PresentationAgent`
- Migration: `new_sqlite_classes: ["PresentationAgent"]`

### `vite.config.ts`
- Plugins: `@tailwindcss/vite` (must come before `@cloudflare/vite-plugin`)
- `esbuild.target`: `"es2022"` — required for TC39 decorator transpilation in dev mode
- `resolve.alias`: `@` → `./src/client` (for shadcn `@/components/ui/...` imports)
- `appType`: `"spa"`

### `tsconfig.json`
- `baseUrl` + `paths` for `@/*` alias
- `ignoreDeprecations: "6.0"` (TypeScript 6 deprecated `baseUrl`)
- No `experimentalDecorators` — uses TC39 stage 3 decorators

## Design System

Uses **shadcn/ui Luma theme** (the official shadcn design system):
- `@import "shadcn/tailwind.css"` + `@custom-variant dark` + `@theme inline`
- oklch color tokens for all semantic colors (background, foreground, card, muted, border, etc.)
- Custom `--warm` token (`oklch(0.65 0.22 41)`) for orange accent (START button, cue card) — needed because shadcn's `chart-1` is blue in dark mode
- Dark mode by default (`<html class="dark">`)

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start local dev server (http://localhost:5173)
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build locally
npm run types        # Regenerate worker-configuration.d.ts
npx wrangler deploy  # Deploy to Cloudflare
```

## Important Notes

- **Vite 6, not 8**: Vite 8 (Rolldown) doesn't transpile TC39 `@callable()` decorators for the workerd dev runner. Pinned to Vite 6 which uses esbuild.
- **No raw WebSocket code**: All real-time communication uses Agents SDK abstractions (`useAgent`, `setState`, `@callable`)
- **SPA routing**: `/remote` works via `not_found_handling: "single-page-application"` in wrangler assets config. In dev, requires `Sec-Fetch-Mode: navigate` header (browsers send this automatically).
- **Single agent instance**: Both Display and Remote connect to the same instance named `"default"`, ensuring all clients share state.
- **State shape**: `{ currentSlide: number, slides: Slide[] }` where each `Slide` has `title`, `body`, and `speakerNotes`.

## Repository

- Remote: `https://github.com/Kenth06/-Real-time-Presentation-Remote.git`
- Branch: `main`
