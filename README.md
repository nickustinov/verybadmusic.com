# verybadmusic.com

A minimal, brutalist web player for DJ sets. Mixes are hosted on object storage
(Cloudflare R2) and stream **directly to the browser** (no server in the audio
path); a password-protected admin manages the catalog. Built with Next.js 16
(App Router), Tailwind v4 and shadcn/ui (base-nova). Follows the system theme,
toggle in the corner.

## How it works

- **Player** – one native `<audio>` element skinned entirely with shadcn controls.
  Native media is what enables **AirPlay** (Safari/iOS) and the Remote Playback
  API (Chrome → Cast). Playback persists across pages via a React context
  (`components/player/player-provider.tsx`).
- **Streaming** – each mix has an audio URL that the `<audio>` element loads
  **directly**, with **no Vercel function or bandwidth** in the path. A source can
  be either a **direct URL** (a public Cloudflare R2 object, e.g.
  `https://audio.verybadmusic.com/<file>.mp3`) or a **Google Drive link/id**
  (resolved to the Drive API URL). `lib/drive.ts` (`resolveStreamUrl`) is the
  single resolver. The element deliberately does **not** set `crossOrigin`:
  browsers play cross-origin media in no-cors mode, and forcing CORS would break
  R2/Drive (their media endpoints send no `Access-Control-Allow-Origin`). Nothing
  reads raw samples, so CORS is never needed. **MP3 only** – `audio/mpeg` plays
  everywhere; WAV/AIFF served as `octet-stream` won't decode.
  - **Why R2** – Cloudflare R2 has **zero egress fees** and supports HTTP Range,
    so it's a reliable, free-bandwidth origin. Drive is supported as a legacy
    source but throttles a single file (~24h lockout) when it's hammered, so new
    mixes should go to R2.
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
| `NEXT_PUBLIC_DRIVE_API_KEY` | Referrer-restricted Google Drive API key. **Only needed for Drive-sourced mixes**; R2/direct-URL mixes don't use it. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis (catalog). Injected when you connect the store on Vercel. |
| Blob credentials | Cover images. On Vercel, connecting a **public** Blob store provides `BLOB_STORE_ID` + OIDC auth; locally use a `BLOB_READ_WRITE_TOKEN`. |

See `.env.example`. The `NEXT_PUBLIC_` prefix on the Drive key is intentional – it
is a public, referrer-restricted browser key (like a Google Maps key), not a secret.

## Audio hosting (Cloudflare R2)

The primary, recommended source. R2 has zero egress fees, supports Range, and
serves objects over plain HTTPS – no proxy, no Vercel bandwidth.

1. Create an R2 bucket and enable public access (a `pub-….r2.dev` URL works for
   testing; not for production).
2. For a clean URL, attach a **custom domain** (e.g. `audio.verybadmusic.com`).
   R2 custom domains require the DNS **zone on Cloudflare**, so the domain's
   nameservers must point at Cloudflare (the site itself can still be served by
   Vercel via DNS records in Cloudflare).
3. Upload each mix as `artist-title-date.mp3` (lowercase, hyphens – the key
   becomes the URL path). To let a collaborator upload, create a **scoped R2 API
   token** (Object Read & Write, that bucket only) and use any S3 tool
   (Cyberduck, rclone).
4. In the admin, paste the full object URL as the mix's audio URL.

## Google Drive setup (optional, legacy)

Only needed if you keep Drive-sourced mixes. New mixes should use R2 (above).

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
   `ADMIN_PASSWORD`, `SESSION_SECRET` (and `NEXT_PUBLIC_DRIVE_API_KEY` only if you
   still serve Drive-sourced mixes).
5. Deploy. Audio never touches Vercel – playback uses no functions or bandwidth.

## Managing mixes

Sign in at **`/vbm-admin`**. Add/edit each mix on its own page: paste the audio
URL – an R2 object URL or a Drive share link (length is auto-detected in the
browser) – drop in a cover (auto-resized to JPEG), tags, tracklist. New mixes
land at the top; reorder with the arrows. Listeners get tiles/list views with a
one-click tag filter.
