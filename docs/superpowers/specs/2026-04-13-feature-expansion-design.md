# Feature Expansion Design

## Overview

Six features grouped into three sub-projects (A, B, C), built in order due to dependencies.

## Sub-project A: Presence & Synced Timer

### A1: Viewer Count

**Server (`server.ts`):**
- Add `viewers: number` to `SlideState` (default `0`)
- Override `onConnect()`: increment viewers, `setState()`
- Override `onClose()`: decrement viewers, `setState()`

**Client:**
- Display: show viewer count badge in bottom bar
- Remote: show viewer count in header next to LIVE dot

### A2: Server-Side Synced Timer

**Server (`server.ts`):**
- Add to `SlideState`:
  - `timerStartedAt: number | null` — epoch ms when timer was started
  - `timerPausedElapsed: number` — accumulated ms from previous runs
  - `timerRunning: boolean`
- New `@callable()` methods:
  - `startTimer()` — sets `timerStartedAt = Date.now()`, `timerRunning = true`
  - `pauseTimer()` — accumulates elapsed into `timerPausedElapsed`, clears `timerStartedAt`, sets `timerRunning = false`
  - `resetTimer()` — zeros all timer fields

**Client (`Remote.tsx`):**
- Remove local `timerSeconds`, `timerRunning`, `intervalRef` state
- Derive display time from server state: `paused ? pausedElapsed : pausedElapsed + (Date.now() - timerStartedAt)`
- Local `requestAnimationFrame` loop for smooth display updates when running
- Timer buttons call server RPC instead of toggling local state

**Client (`Display.tsx`):**
- Optionally show timer in bottom bar (presenter can see elapsed time on big screen too)

## Sub-project B: Multi-Presentation & Persistence

### B1: Multi-Presentation Routing

**URL scheme:**
- `/?p=<id>` — Display for presentation `id`
- `/remote?p=<id>` — Remote for presentation `id`
- `/editor?p=<id>` — Slide editor for presentation `id`
- `/` (no `?p=`) — Landing page to create/join

**Client (`main.tsx`):**
- Parse `?p=` from `window.location.search`
- If no `p` param on `/` → render `<Landing />`
- Pass `presentationId` as prop to Display, Remote, Editor

**Client (`useSlides.ts`):**
- Accept `instanceName: string` parameter (defaults to `"default"` for backwards compat)
- Pass to `useAgent({ name: instanceName })`

**New component: `Landing.tsx`:**
- "Create Presentation" button → generates `crypto.randomUUID().slice(0,8)`, navigates to `/?p=<id>`
- Shows QR code for the created presentation
- Input field to join existing presentation by ID

### B2: Persistent Presentations (Metadata)

**Server (`server.ts`):**
- Add `presentationName: string` to `SlideState`
- `@callable() renamePresentation(name: string)` — updates `presentationName`
- `onStart()` lifecycle — create metadata table if needed:
  ```sql
  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  )
  ```
- Store presentation name and creation date in metadata table

**Note:** Each Durable Object instance IS a presentation. The instance name (`?p=<id>`) is the presentation ID. No global registry needed for v1 — the user shares the URL.

## Sub-project C: Slide Editor & AI Generation

### C1: Slide Editor Form

**New component: `Editor.tsx`:**
- Route: `/editor?p=<id>`
- Uses `useSlides(presentationId)` to get current slides
- Form UI per slide: title input, body textarea, speaker notes textarea
- Add slide button (appends empty slide)
- Remove slide button (with confirmation)
- Reorder: up/down arrow buttons per slide
- "Save" button calls `loadSlides()` with the edited array
- "Back to Remote" link

### C2: AI Slide Generation

**Infrastructure (`wrangler.jsonc`):**
- Add Workers AI binding: `{ "binding": "AI", "ai": {} }` (or however it's configured)

**Server (`server.ts`):**
- New `@callable() generateSlides(topic: string, slideCount: number)`
- Calls Workers AI (e.g. `@cf/meta/llama-3.1-70b-instruct`) with a structured prompt
- Prompt asks for JSON array of `{title, body, speakerNotes}`
- Parses response and calls `this.setState()` with generated slides

**Client:**
- Add "Generate with AI" button in the slide loader modal and/or editor
- Simple form: topic input + slide count selector
- Calls `agent.call("generateSlides", [topic, count])`
- Loading state while generating

## Expanded State Shape

```typescript
export interface SlideState {
  currentSlide: number;
  slides: Slide[];
  // A1: presence
  viewers: number;
  // A2: synced timer
  timerStartedAt: number | null;
  timerPausedElapsed: number;
  timerRunning: boolean;
  // B2: metadata
  presentationName: string;
}
```

## New/Modified Files

| File | Change |
|------|--------|
| `src/server.ts` | State expansion, lifecycle hooks, timer RPCs, AI generation |
| `src/client/useSlides.ts` | Accept `instanceName` param |
| `src/client/main.tsx` | Parse `?p=`, route to Landing/Editor |
| `src/client/Display.tsx` | Show viewers badge, optional timer |
| `src/client/Remote.tsx` | Server timer, viewers count, AI generate button |
| `src/client/Landing.tsx` | **New** — create/join presentation |
| `src/client/Editor.tsx` | **New** — form-based slide editor |
| `wrangler.jsonc` | Add AI binding |

## Implementation Order

1. A1: Viewer count (server + both clients)
2. A2: Synced timer (server + Remote refactor)
3. B1: Multi-presentation routing (main.tsx + useSlides + Landing)
4. B2: Presentation metadata (server SQL + rename RPC)
5. C1: Slide editor (new Editor component)
6. C2: AI generation (wrangler binding + server RPC + UI button)
