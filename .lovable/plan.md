# Scheduled Social Publishing

Right now the calendar is purely visual — `ScheduledPost` lives in `localStorage` via `workspace-context.tsx` and nothing actually fires when a post's `scheduledAt` arrives. To make the calendar the real master schedule and push posts to Facebook / Instagram at the right moment, we need three things: persistent storage, a recurring server-side worker, and a publishing provider that already handles the messy OAuth + platform APIs.

## Recommended approach: use a publishing provider (don't build FB/IG integration ourselves)

Building direct Facebook Graph + Instagram Graph integration means: Meta app review, Business verification, token refresh, Instagram Business account linking, media container polling, rate limits, and ongoing breakage every time Meta changes the API. Strongly recommend offloading this.

Best fits, in order:

1. **Ayrshare** (recommended) — REST API purpose-built for this. One endpoint to post to FB, IG, LinkedIn, X, TikTok, YouTube, Pinterest, Threads, Bluesky, Google Business, Reddit. Has native `scheduleDate` so we can either schedule on their side or trigger immediately from our cron. Cleanest fit.
2. **Postiz** (open source) — self-hostable scheduler. Free if you host it; more ops work.
3. **Buffer / Hootsuite API** — mature but heavier onboarding and pricier.
4. **Direct Meta Graph API** — only if you specifically want no third party. Much more work; not recommended for v1.

Plan below assumes **Ayrshare**. Swappable later — we'll wrap it behind one server function.

## Architecture

```text
Calendar (UI)
   │  create/edit ScheduledPost
   ▼
Lovable Cloud (Postgres)
   scheduled_posts ── status: draft | scheduled | publishing | published | failed
                      provider_post_id, error, attempts
   ▼
Cron (every 1 min) ── /api/public/cron/publish-due
   │  picks rows where scheduledAt <= now() AND status='scheduled'
   ▼
publishPost server fn ── Ayrshare API ── Facebook / Instagram
   │
   ▼
updates row: status, provider_post_id, error
```

## What we'll build

1. **Enable Lovable Cloud** (required for DB, auth, secrets, cron).
2. **Auth** — minimum email + Google sign-in. Needed so each user's social connections and posts are isolated. (This reverses the earlier "auth-free" decision; flagging explicitly.)
3. **DB schema** (with RLS + GRANTs):
   - `social_accounts` — user_id, platform (`facebook_page` | `instagram_business`), provider_profile_key (Ayrshare profile key), display_name, connected_at.
   - `scheduled_posts` — migrate today's localStorage shape: user_id, campaign_id, role, caption, media_url, platforms[], scheduled_at, status, provider_post_id, error, attempts, published_at.
   - Migrate existing `WorkspaceState` from localStorage on first sign-in.
4. **Ayrshare integration**:
   - Add `AYRSHARE_API_KEY` as a secret.
   - Use Ayrshare's User Profiles so each app user links their own FB Page / IG Business account through Ayrshare's hosted connect flow (one redirect, no Meta review on our side).
   - `connectSocialAccount` server fn → creates an Ayrshare profile, returns the connect URL.
5. **Publishing**:
   - `publishPost(postId)` server fn — protected, loads row, calls Ayrshare `/post` with caption + media + selected platforms, writes back result.
   - Public route `POST /api/public/cron/publish-due` — HMAC-verified, queries due rows, calls `publishPost` for each, with retry/backoff (max 3 attempts).
   - Schedule it with pg_cron every minute hitting the stable `project--{id}.lovable.app` URL.
6. **UI changes**:
   - Settings → "Connected Accounts": list `social_accounts`, "Connect Facebook Page", "Connect Instagram", disconnect.
   - Campaign / post editor: platform multi-select (FB, IG), required when status is `scheduled`.
   - Calendar: color-code by status (scheduled / published / failed), click to retry failed.
   - Toast + inline error on failure with the Ayrshare error message.
7. **Observability**: `post_events` table (post_id, event, payload, created_at) so users can see why something failed.

## Other systems worth adding (proposed, not built unless you say yes)

- **Media handling**: Lovable Cloud Storage bucket for uploaded images/video, so Ayrshare gets a stable public URL instead of a data URL. Almost required for IG.
- **Link shortener + UTM builder**: auto-append `utm_source=facebook&utm_campaign=<slug>` so the dashboard can later show real attribution.
- **Analytics pull-back**: nightly job that calls Ayrshare `/analytics/post` for each `published` row → store reach, likes, comments. Powers a real dashboard.
- **AI caption + hashtag assist**: Lovable AI Gateway (`google/gemini-2.5-flash`) to generate per-platform variants from one base caption (FB longer, IG hashtag-heavy).
- **Approval workflow**: optional `pending_approval` status + reviewer role using the `has_role` pattern, for orgs that need sign-off before posting.
- **Timezone correctness**: store `scheduled_at` as UTC, render in org timezone; today's code uses local `Date` which will misfire across DST / travel.
- **Notifications**: email (Resend) or in-app toast when a post publishes or fails.
- **Additional platforms via the same provider** at near-zero extra cost: LinkedIn Page, X, TikTok, YouTube Shorts, Threads, Pinterest, Google Business Profile.

## Decisions I need from you before building

1. **Provider**: Ayrshare (recommended, fastest), Postiz (open source, self-host), or build direct Meta integration ourselves?
2. **Auth**: OK to add email + Google sign-in now? (Required to safely store per-user social tokens.)
3. **Platform scope for v1**: just Facebook Page + Instagram Business, or include LinkedIn / X / TikTok in the first pass?
4. **Which extras above** (media storage, analytics pull-back, AI captions, approvals, timezone fix, notifications) should be in v1 vs. later?
