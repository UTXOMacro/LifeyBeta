# Lifey — Memory & Data Retention Policy

_Status: **DRAFT for Lance/Ryan review**. Captured 2026-10-06._
_This is the source of truth for how Lifey remembers conversations, what it keeps,
how long, and the controls the user has. It drives the storage seam
(`src/lib/data/`) — build to this spec, not around it._

---

## 0. Why this doc exists

The Lifey tab lets people just talk. The moment a product remembers what you
said, retention becomes a trust decision, not a technical default. The PRD is
explicit:

- Memory of goals, preferences, routines, constraints, circumstances — **with
  user control, review, correction, and deletion** (MVP-Critical).
- **Confirm meaningful learned facts before** locking them into the profile.
- **Privacy: memory control, data/connection control** (MVP-Critical).
- Safety data (allergies, health considerations) **always overrides convenience**
  and must never be "learned around."

This doc turns those rules into concrete defaults and windows.

---

## 1. The two layers of memory (keep these separate)

Lifey remembers at two different altitudes. They have **different lifetimes and
different controls**. Conflating them is the main thing to avoid.

### Layer A — Raw conversation history

The literal chat threads: every message, in order, grouped by recency in the
history drawer (Today / Yesterday / Previous 7 days / Earlier). Searchable,
reopenable with full context.

- **Purpose:** let the user scroll back and pick up where they left off.
- **Analogy:** your text-message history.

### Layer B — Distilled long-term memory ("What Lifey remembers")

The *facts* Lifey extracts from conversations: goals, preferences, routines,
constraints, "bed ~10:30", "prefers mornings", "don't count every bite." This is
what actually feeds coaching and the Pulse model. Shown in the "What Lifey
remembers" panel and editable on the **Me** tab.

- **Purpose:** so the user never has to re-explain themselves.
- **Analogy:** what a good coach carries in their head about you.

> **Rule:** Deleting a raw chat (Layer A) does **not** automatically delete facts
> already distilled from it (Layer B), because the user may still want Lifey to
> know "I'm vegetarian" even after deleting the chat where they said it. The
> reverse is also true: deleting a fact (Layer B) does not delete the chat.
> Both are independently user-controllable, and this is explained in-product.

---

## 2. Retention windows (defaults)

| Data | Default retention | User can change? | Notes |
|---|---|---|---|
| **Raw chats** (Layer A) | Kept until the user deletes | Yes — optional auto-expiry | Default is "keep forever," like most chat apps. User may opt into "forget chats older than N days." |
| **Distilled memory** (Layer B) | Kept while relevant | Yes — edit/delete any item anytime | No hard clock. Stale facts are *re-confirmed*, not silently kept forever (see §4). |
| **Safety-critical data** (allergies, intolerances, health considerations, treatments) | Persists until the user changes it | Yes — edit/delete, but with a confirm step | **Never auto-expires.** Safety outranks tidiness. Removing one asks "Are you sure? Lifey will stop accounting for this." |
| **Signals / scores feeding Pulse** | Rolling window sufficient for trends | Partially | Pulse only needs recent history; see §5. Raw old scores can be thinned without losing the trend. |
| **Deleted items** | Purged within 30 days | No | Soft-delete grace period for "undo," then hard-purge from backups. |
| **Account deletion** | All data purged within 30 days | — | Full erasure incl. backups. Export offered first. |

### Proposed auto-expiry presets (opt-in, off by default)

The user sets this once in **Me → Privacy**:

- **Keep everything** (default)
- **Forget raw chats after 90 days**
- **Forget raw chats after 30 days**
- **Forget raw chats after each session** (ephemeral mode — Layer B still learns
  unless the user also turns off learning)

> Auto-expiry only ever affects **Layer A (raw chats)**. It never silently drops
> distilled facts or safety data — those require an explicit user action.

---

## 3. What gets remembered vs. confirmed (the "don't assume" rule)

Not everything said becomes a stored fact. The PRD requires distinguishing **what
the user said**, **what a source measured**, and **what Lifey inferred** — and
confirming meaningful inferences before treating them as profile.

| Statement type | What Lifey does |
|---|---|
| Casual talk ("ugh, rough day") | Stays in the raw chat only. Not distilled. |
| Clear durable preference ("I prefer mornings") | Distilled to Layer B, shown in "What Lifey remembers." Low-stakes, no confirm needed. |
| Meaningful inference ("sounds like you're cutting dairy?") | **Confirm before saving.** "Want me to remember that?" |
| Safety-critical ("I'm allergic to peanuts") | Confirmed, stored as safety data, flagged so it can never be learned around. |

Every distilled fact carries its **provenance** (said / measured / inferred) and
its **source** (which chat / which connected device), so the user can always see
*why* Lifey believes something — and correct it.

---

## 4. Freshness & re-confirmation (instead of silent forever-keeping)

Distilled facts don't expire on a timer, but they don't ossify either:

- Facts carry a **last-confirmed date**.
- When a fact is old or looks contradicted by recent behavior, Lifey **asks**
  rather than assuming: "A while back you preferred mornings — still true?"
- Confirming refreshes the date; correcting updates the fact; dismissing removes it.

This keeps memory useful without turning it into a permanent record the user
can't influence. It also serves the PRD's "the longer Lifey knows you, the less
you should have to explain yourself" — memory stays *accurate*, not just *large*.

---

## 5. Pulse / signals retention

Pulse only needs enough history to show trends (the history view goes to 30 days).

- **Keep per-day signals** for the trend window the product shows (currently up to
  30 days at full resolution).
- **Older than that:** may be downsampled (e.g. keep daily Pulse values, thin the
  individual raw signals) so long-term trends survive without storing every
  message-derived data point forever.
- Deleting a raw chat removes its messages; any Pulse signal already derived from
  it stays unless the user also clears signals (shown transparently in Pulse
  History, which already labels each signal's source).

---

## 6. User controls (all MVP-Critical per PRD)

These must exist in the shipping product, surfaced under **Me → Privacy** and the
"What Lifey remembers" panel:

1. **Review** — see all raw chats (history drawer) and all distilled facts (memory
   panel), each with provenance + source + last-confirmed date.
2. **Correct** — edit any distilled fact inline.
3. **Delete** — delete a single chat, a single fact, or clear a category.
4. **Export** — download everything (chats + facts + signals) in a portable format.
5. **Delete everything** — account + all data, purged within 30 days.
6. **Retention setting** — choose the auto-expiry preset (§2).
7. **Pause learning** — a "don't remember this chat" / incognito toggle so a
   conversation happens with no distillation into Layer B.

---

## 7. Storage & security intent (for the data seam)

Non-negotiable when the storage seam (`src/lib/data/`) graduates from in-memory
to real persistence:

- **Prototype now:** in-memory only (resets on refresh). No PII persisted beyond
  the beta-password flag. _This is the current state — nothing above is live yet._
- **Demo persistence:** `localStorage` behind the data interface, so chats survive
  refresh for testing. Clearly labeled as device-local, not synced.
- **Production:** server-side store (Postgres per locked stack decision),
  encrypted at rest, scoped per user, with the soft-delete + purge pipeline.
- Conversations and distilled memory are **private by default** and never appear
  on any public profile or social surface (social is Post-MVP regardless).
- Secrets / keys never client-side; AI calls routed server-side so raw chat
  content isn't exposed to third parties beyond the model provider under contract.

---

## 8. Plain-language version (for the app itself)

What we'd actually tell the user, in Lifey's calm voice:

> **Your conversations stay yours.** I keep our chats so you can scroll back and
> so I don't make you repeat yourself. You can search them, delete any of them,
> or set me to forget older chats automatically. The things I learn about you —
> your goals, what you like, what to avoid — you can see and edit anytime on your
> **Me** tab, and I'll check with you before I assume anything that matters.
> Anything about your health or allergies, I keep until *you* change it. You can
> export everything or delete it all, whenever you want.

---

## Open decisions for Lance/Ryan

1. **Default raw-chat retention:** keep-forever (proposed) vs. a default expiry?
2. **Auto-expiry presets:** are 90 / 30 / per-session the right options?
3. **Purge grace period:** 30 days (proposed) — longer/shorter?
4. **Incognito / pause-learning:** in MVP, or MVP-Low?
5. **Export format:** JSON (dev-friendly) + a human-readable PDF/HTML? Which for MVP?

_Once these are settled, this doc becomes the build spec for the storage seam._
