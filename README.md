# Lifey — MVP Shell

Mobile-first prototype of Lifey: an AI life companion. Home is glance-and-act,
Connect is the relationship, users only see modules they opt into.

## Run it

```bash
cd lifey
npm install       # first time only
npm run dev       # http://localhost:5173
```

Open in a browser and use device toolbar / narrow window for the mobile view
(the app caps its width to a phone frame automatically).

Production build: `npm run build` → `dist/`.

## What's built

- **5-tab bottom nav** — Home · Friends · Capture(+) · Connect · You. Capture is a
  center-button sheet, the rest are routes.
- **Home** — header (avatar→You, greeting, chat→Connect, bell), **Lifey Now**
  one-liner (tap → Connect seeded with that text), **widget grid** (add / remove /
  reorder / resize via **Edit Home**), **Today** (max 3, done/skip/snooze, no
  punishment), **This week** strip, **Friends** peek (2 lines + See all).
- **Widgets** — pulse, sleep, movement, food, tasks, friends, week, next. Small &
  Medium sizes. Off-module widgets never appear; no empty slots.
- **Pulse** = average of *active* modules only. Hidden modules don't count.
- **Connect** — one persistent thread. Header chat + Lifey Now + widget taps all
  land here. Thin context chip (Sleep on · Walk on · Bed ~10:30 · Prefers mornings),
  empty-state starter prompts, mock replies.
- **Capture** — quick sheet: module, "I went"/photo, 1–10 feeling slider, note.
  Writes a Score into the store; widgets refresh live. Doesn't open Connect.
- **You** — profile, **module toggles** (Sleep/Movement on by default), privacy
  default, privacy guarantees copy.

## Architecture

Clean component structure ready to swap mock data for real APIs:

```
src/
  types.ts               # full data model (User, Score, Quantity, Task, ...)
  store.ts               # Zustand store + Pulse/derived logic
  data/
    mock.ts              # all mock data (swap for API layer later)
    widgets.ts           # widget registry (which module each widget needs)
  lib/score.ts           # calm score→color scale, greeting, initials
  components/            # BottomNav, WidgetGrid, WidgetTile, Sparkline, HomeParts
  screens/               # HomeScreen, ConnectScreen, CaptureSheet, FriendsScreen, YouScreen
```

**To wire real data:** replace `data/mock.ts` with API calls and feed the same
shapes into the store. UI reads only from the store, so screens don't change.

## Design rules honored

Dark scan-friendly tiles, one number each, lots of air. Calm color scale
(muted → steady → strong), **no red/green pass-fail**, 5 = neutral not failure.
No calorie totals, no streak flames, no leaderboards, no charts-dashboard vibe.
Private by default; public profile never exposes raw numbers.

## Not built (per brief "Do not build")

Calorie totals, public leaderboards, streak flames, pie/balance-wheel on Home,
full calendar app, medical claims, a separate chatbot from Connect.
