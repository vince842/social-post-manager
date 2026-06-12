## Goal

Create a friendly, guardrailed web app that helps small businesses, sports clubs, and NFPs set up their brand once, then generate scheduled 3-post social campaigns through a wizard. All data flows from onboarding into the campaign previews via local state (no backend in this first pass).

## Scope (this plan)

Frontend-only, local state via React Context + `localStorage` for persistence. No Lovable Cloud yet — we can add auth, real social connections, and image uploads later when the user wants real publishing.

## Routes (TanStack Start, file-based)

```
src/routes/
  __root.tsx               # shared shell + BrandProvider
  index.tsx                # redirects to /onboarding or /dashboard based on state
  onboarding.tsx           # multi-step branding wizard (self-contained stepper)
  _app.tsx                 # layout with Sidebar + Outlet (guards: needs completed onboarding)
  _app.dashboard.tsx       # dashboard with "Create New Campaign" CTA + campaign list
  _app.campaigns.tsx       # campaigns list
  _app.campaigns.new.tsx   # 4-step Autopilot wizard
  _app.brand.tsx           # brand assets viewer/editor
  _app.calendar.tsx        # simple month grid showing scheduled posts
  _app.settings.tsx        # edit org profile, reset onboarding
```

## State Architecture

A single `WorkspaceProvider` in `src/lib/workspace-context.tsx` exposing:

- `organization`: `{ name, type, tone, primaryColor, secondaryColor, logoDataUrl, referenceUrl }`
- `connections`: `{ facebook, instagram, linkedin }` booleans
- `campaigns`: `Campaign[]` with `{ id, name, description, eventDate, posts: ScheduledPost[], status }`
- Actions: `completeOnboarding`, `addCampaign`, `updateCampaign`, `toggleConnection`, `reset`
- Persisted to `localStorage` under `autopilot.workspace.v1`

## Step-by-step build

### 1. Foundation

- Add `WorkspaceProvider` + types
- Wrap `<Outlet />` in `__root.tsx` with the provider
- Update `index.tsx` to redirect: onboarding incomplete → `/onboarding`, else `/dashboard`
- Tailwind tokens in `src/styles.css`: define a warm, friendly palette (soft off-white background, deep indigo primary, mint accent, generous radius). Add `--brand-primary` / `--brand-secondary` CSS vars that the campaign previews override inline from org state.

### 2. Onboarding wizard (`/onboarding`)

Single page with a `step` state (1–3), progress bar at top, Back / Continue footer.

- **Step 1 — Organization Profile**: Name input, Industry select (Small Business / Sports Club / NFP), Tone select (Professional / Energetic & Fun / Community-focused / Casual). Helper text under tone explaining each choice in plain language.
- **Step 2 — Visual Brand**: two `<input type="color">` pickers with live swatch preview, logo dropzone (stores as data URL in state — no backend needed), and/ or  a "Use a reference website" field: paste a URL, click "Pull brand colors". For this pass it deterministically derives two pleasant colors from the hostname (hash → HSL) and shows a friendly note: "We pulled a starter palette from your site — tweak below." This keeps it real-feeling without scraping.
- **Step 3 — Social Connections**: Three rows (Facebook / Instagram / LinkedIn) each with a brand icon, "Disconnected" badge, and Connect button. Clicking it shows a 600 ms spinner then flips to "Connected ✓" (mock).
- Finish → save state → `navigate({ to: '/dashboard' })`.

### 3. App shell (`_app.tsx`)

- Shadcn `Sidebar` with links: Campaigns, Brand Assets, Calendar, Settings.
- Top bar shows org name + logo, plus the "✨ Create New Campaign" primary button (also present on dashboard hero).
- Guard: if onboarding incomplete, redirect to `/onboarding`.

### 4. Dashboard (`_app.dashboard.tsx`)

- Welcome hero with org name + tone-aware greeting
- Big "✨ Create New Campaign" CTA → `/campaigns/new`
- Cards: Upcoming scheduled posts (from `campaigns`), Recent campaigns, Connection status summary
- Empty state encourages first campaign

### 5. Autopilot Campaign Wizard (`_app.campaigns.new.tsx`)

Local `step` state (1–4), progress bar, Back / Continue.

- **Step 1 — Goal Definition**: Campaign name, description textarea, date picker (Shadcn Popover + Calendar with `pointer-events-auto`). Preset chips: "Weekly Match Update", "Sausage Sizzle Fundraiser", "End of Season Sale", "Volunteer Call-Out", "Grand Opening" — clicking pre-fills name + description with tone-aware copy.
- **Step 2 — Proposed Plan**: Auto-compute three post dates from event date: T-3 Announcement, T-1 Reminder, Day-of Last Chance. Render as three timeline cards with date, post role, and a one-line angle. Allow toggling each post off.
- **Step 3 — Template Viewer**: 3-up grid of mock social cards. Each card:
  - Uses `organization.primaryColor` as background gradient, `secondaryColor` as accent
  - Shows org logo (or initials avatar fallback) + org name
  - Mock caption tailored by `(industry, tone, post role)` from a small copy matrix
  - Background image is a tinted placeholder (CSS gradient + subtle pattern; no external image deps)
  - Side `Sheet` drawer: click a card → drawer opens with fields for Header text, Caption, and a "Swap background" set of 4 preset gradients. Edits live-update the selected card.
- **Step 4 — Review & Schedule**: Summary card listing each post (date, role, header), the org brand strip, and a prominent "Approve & Schedule Autopilot" button. On click → save campaign with `status: 'scheduled'` → toast → redirect to `/dashboard`.

### 6. Supporting screens

- **Brand Assets**: read-only view of palette, logo, tone; "Edit brand" reopens onboarding step 2.
- **Calendar**: simple month grid; cells show dots for each scheduled post; click cell → list posts for that day. Pure local computation, no external calendar lib.
- **Settings**: edit org name/industry/tone, manage mock connections, "Reset workspace" button.

## Design notes

- Tone: friendly, reassuring, plain language. Each non-obvious control gets a one-line helper underneath (e.g., under Tone: "How should your posts sound? You can change this anytime.").
- Layout: generous spacing, rounded-2xl cards, soft shadows, single accent color for primary actions.
- Responsive: sidebar collapses to a top sheet on mobile; wizard steps stack vertically; preview grid becomes a single column.
- Accessibility: semantic headings per route, labels on every input, focus rings preserved, color picker has hex input fallback.

## Out of scope (call out to user after build)

- Real OAuth to Facebook/Instagram/LinkedIn
- Real scheduled publishing (would need Lovable Cloud + a cron job + provider APIs)
- AI-generated captions/images (easy follow-up via Lovable AI Gateway)
- Multi-user / team accounts

## Technical details

- State: React Context + `useReducer`, persisted to `localStorage` with a small `useEffect` hydrator; SSR-safe via `typeof window` guard.
- Routing: TanStack file-based; `_app.tsx` is the authenticated-ish layout that gates on onboarding completion.
- Forms: lightweight controlled inputs (no react-hook-form needed at this scale); zod-validate the campaign form before advancing steps.
- Date math: native `Date` + `date-fns` (already used by Shadcn Calendar).
- IDs: `crypto.randomUUID()`.
- No new heavy deps required.