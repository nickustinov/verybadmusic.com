# verybadmusic.com

A minimal, brutalist web player for DJ sets. Audio lives on Google Drive and
streams straight to the browser; a password-protected admin manages the catalog.
Built with Next.js (App Router), Tailwind v4 and shadcn/ui (base-nova). Dark mode
by default.

## How it works

- **Player** – a single native `<audio>` element skinned entirely with shadcn
  controls. Native media is what makes **AirPlay** (Safari/iOS) and the Remote
  Playback API (Chrome → Cast) possible. Playback persists across views via a
  React context (`components/player/player-provider.tsx`).
- **Streaming** – audio plays directly from Google Drive (no Vercel bandwidth).
  Any Drive share link or file id is normalised in `lib/drive.ts` to
  `https://drive.google.com/uc?export=download&id=<id>&confirm=t`. The mix files
  must be shared "anyone with the link". If large-file seeking proves unreliable,
  swap `driveStreamUrl` for a Range-proxy route – it is the only Drive touch-point.
- **Storage** – the whole catalog is one public JSON document in Vercel Blob
  (`catalog.json`), cover images sit alongside it. Reads go straight to Blob each
  request so edits show up immediately; audio never passes through a function.
- **Auth** – username/password from env, exchanged for a signed httpOnly session
  cookie (`jose`). `proxy.ts` guards `/admin`.

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

Environment variables (`.env.local`):

| Variable | Purpose |
| --- | --- |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin login |
| `SESSION_SECRET` | Signs the session cookie (`openssl rand -base64 32`) |
| Blob credentials | See below – `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`, or a `BLOB_READ_WRITE_TOKEN` |

**Blob auth.** `@vercel/blob` v2 authenticates with OIDC: `BLOB_STORE_ID` plus a
`VERCEL_OIDC_TOKEN`. On Vercel both are present automatically once a Blob store
is connected – no static token needed. Locally, run
`vercel link && vercel env pull .env.local` to fetch the store id and a
short-lived OIDC token, or create a Read/Write token in the Blob store settings
and set `BLOB_READ_WRITE_TOKEN`. Without credentials the app still runs – the
catalog just reads as empty.

## Scripts

```bash
pnpm dev          # dev server
pnpm test         # unit tests (vitest) – drive parsing, sessions, schema, player reducer
pnpm lint         # eslint
pnpm build        # production build
```

## Deploying to Vercel

1. Import the repo; the framework preset is Next.js.
2. Create / connect a **Blob** store (Storage tab). This provisions
   `BLOB_STORE_ID` (+ a webhook key); the SDK authenticates via the auto-injected
   `VERCEL_OIDC_TOKEN`. No static `BLOB_READ_WRITE_TOKEN` is required.
3. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` in project env vars.
4. Deploy. The public pages stay light (functions only run for admin writes and
   the per-request catalog read); audio streams from Drive.

## Manual checks (browser only)

These need a real Drive mp3 and, for AirPlay, Safari/iOS:

- Sign in at `/admin`, add a mix with a public Drive URL + cover, confirm it
  appears on `/`.
- Toggle tiles/list and dark/light; play a mix, scrub, change volume.
- On macOS Safari / iOS the AirPlay button appears when a target is available.
