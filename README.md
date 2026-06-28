# verybadmusic.com

A minimal, brutalist web player for DJ sets. Mixes live on Google Drive and
stream **directly to the browser** (no server in the audio path); a
password-protected admin manages the catalog. Built with Next.js 16 (App Router),
Tailwind v4 and shadcn/ui (base-nova). Follows the system theme, toggle in the
corner.

## How it works

- **Player** – one native `<audio>` element skinned entirely with shadcn controls.
  Native media is what enables **AirPlay** (Safari/iOS) and the Remote Playback
  API (Chrome → Cast). Playback persists across pages via a React context
  (`components/player/player-provider.tsx`).
- **Streaming** – audio streams **directly from the Google Drive API**
  (`www.googleapis.com/drive/v3/files/<id>?alt=media&key=…`), which sends CORS
  headers and supports Range, so the browser plays and seeks it with **no Vercel
  function or bandwidth**. It needs a referrer-restricted Drive API key
  (`NEXT_PUBLIC_DRIVE_API_KEY`) and files shared "anyone with the link". The whole
  Drive coupling is `lib/drive.ts`. **MP3 only** – Drive serves WAV/AIFF as
  `octet-stream`, which browsers won't decode.
- **Catalog** – mix metadata lives in **Upstash Redis (Vercel KV)** for fast,
  consistent reads/writes (`lib/catalog/store.ts`). **Cover images** go to
  **Vercel Blob**.
- **Sharing** – playing a mix updates the URL to `/m/<slug>` (History API, no
  reload). Opening that link loads the mix selected in the player and expands it;
  links unfurl with the cover + title.
- **Auth** – username/password from env, exchanged for a signed httpOnly session
  cookie (`jose`). `proxy.ts` (middleware) guards `/vbm-admin`.
- **SEO** – dynamic `sitemap.xml`, `robots.txt`, rich metadata, JSON-LD
  (`WebSite` + per-mix `MusicRecording`), and a branded OpenGraph image.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin login (`/vbm-admin`) |
| `SESSION_SECRET` | Signs the session cookie (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_DRIVE_API_KEY` | Referrer-restricted Google Drive API key (audio playback). No fallback – without it, playback won't work. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis (catalog). Injected when you connect the store on Vercel. |
| Blob credentials | Cover images. On Vercel, connecting a **public** Blob store provides `BLOB_STORE_ID` + OIDC auth; locally use a `BLOB_READ_WRITE_TOKEN`. |

See `.env.example`. The `NEXT_PUBLIC_` prefix on the Drive key is intentional – it
is a public, referrer-restricted browser key (like a Google Maps key), not a secret.

## Google Drive setup (one-time)

1. [Google Cloud Console](https://console.cloud.google.com) → create/select a
   project (no billing needed). **APIs & Services → Library → enable Google Drive API**.
2. **Credentials → Create credentials → API key**. Then **restrict** it:
   - **Application restrictions → Websites (HTTP referrers)**: add
     `https://verybadmusic.com/*`, `http://localhost:3000/*`,
     `https://*.vercel.app/*`.
   - **API restrictions → Google Drive API** only.
3. Put it in `NEXT_PUBLIC_DRIVE_API_KEY` (locally and on Vercel). `NEXT_PUBLIC_*`
   is baked in at build time, so **redeploy** after changing it.
4. Share each mix MP3 as **"Anyone with the link → Viewer"**.

The Drive API is **free** (no billing); limits are rate quotas (HTTP 429 if
exceeded) plus a per-file ~24h download-quota lockout if a single file is hammered.

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in the values
pnpm dev                     # http://localhost:3000
```

For Blob/KV locally, either paste tokens into `.env.local` or run
`vercel link && vercel env pull .env.local`.

## Scripts

```bash
pnpm dev     # dev server
pnpm test    # unit tests (vitest) – drive url, sessions, schema, player reducer, slug, format
pnpm lint    # eslint
pnpm build   # production build
```

## Deploying to Vercel

1. Import the repo (framework preset: **Next.js**, root `./`).
2. **Storage → connect Upstash Redis** (Pay As You Go) – injects `KV_REST_API_*`.
3. **Storage → connect a public Blob store** (cover images).
4. **Settings → Environment Variables** (Production + Preview): `ADMIN_USERNAME`,
   `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_DRIVE_API_KEY`.
5. Deploy. Audio never touches Vercel – playback uses no functions or bandwidth.

## Managing mixes

Sign in at **`/vbm-admin`**. Add/edit each mix on its own page: paste a Drive
share link (length is auto-detected in the browser), drop in a cover (auto-resized
to JPEG), tags, tracklist. New mixes land at the top; reorder with the arrows.
Listeners get tiles/list views with a one-click tag filter.
