# verybadmusic.com

A minimal, brutalist web player for DJ sets. Mixes are hosted on object storage
(Cloudflare R2) and stream **directly to the browser** (no server in the audio
path); a password-protected admin manages the catalog. Built with Next.js 16
(App Router), Tailwind v4 and shadcn/ui (base-nova). Ships with switchable visual
**skins** (terminal, cassette, editorial, manga, winamp, pac-man, matrix,
gameboy, …) and an orthogonal light/dark toggle.

## How it works

- **Player** – one native `<audio>` element skinned entirely with shadcn controls.
  Native media is what enables **AirPlay** (Safari/iOS) and the Remote Playback
  API (Chrome → Cast). Playback persists across pages via a React context
  (`components/player/player-provider.tsx`).
- **Streaming** – each mix has a public **Cloudflare R2** URL (e.g.
  `https://audio.verybadmusic.com/<file>.mp3`) that the `<audio>` element loads
  **directly**, with **no Vercel function or bandwidth** in the path. R2 has zero
  egress fees and supports HTTP Range, so seeking is free. The element
  deliberately does **not** set `crossOrigin` (browsers play cross-origin media
  in no-cors mode; nothing reads raw samples). **MP3 only** – `audio/mpeg` plays
  everywhere; WAV/AIFF served as `octet-stream` won't decode.
- **Uploads** – the admin uploads audio **straight to R2** from the browser via a
  short-lived presigned `PUT` (`lib/r2.ts`), so files never hit Vercel and there
  is no request-size limit.
- **Catalog** – mix metadata lives in **Upstash Redis (Vercel KV)** for fast,
  consistent reads/writes (`lib/catalog/store.ts`). **Cover images** go to
  **Vercel Blob**.
- **Themes & favourites** – skin + light/dark are stored client-side
  (`lib/theme.ts`); favourites are kept in `localStorage`
  (`components/use-favourites.ts`) and surface a heart toggle plus a catalog
  filter.
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
| `R2_ACCOUNT_ID` | Cloudflare account id (from the R2 S3 endpoint) |
| `R2_BUCKET` | R2 bucket name |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Bucket-scoped R2 API token (Object Read & Write) – server-only, used to presign uploads |
| `R2_PUBLIC_BASE_URL` | Public base for playback, e.g. `https://audio.verybadmusic.com` |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis (catalog). Injected when you connect the store on Vercel. |
| Blob credentials | Cover images. On Vercel, connecting a **public** Blob store provides `BLOB_STORE_ID` + OIDC auth; locally use a `BLOB_READ_WRITE_TOKEN`. |

See `.env.example`. The R2 secret is **server-only** (no `NEXT_PUBLIC_` prefix); the
browser only ever receives a time-limited presigned URL.

## Audio hosting (Cloudflare R2)

R2 has zero egress fees, supports Range, and serves objects over plain HTTPS – no
proxy, no Vercel bandwidth.

1. Create an R2 bucket.
2. Attach a **custom domain** (e.g. `audio.verybadmusic.com`) for a clean public
   URL. R2 custom domains require the DNS **zone on Cloudflare**, so the domain's
   nameservers must point at Cloudflare (the site itself can still be served by
   Vercel via DNS records in Cloudflare).
3. Create a **bucket-scoped API token** (R2 → *Manage API Tokens* → Object Read &
   Write, applied to that bucket). The result screen gives the Access Key ID,
   Secret Access Key and the S3 endpoint (which contains the account id). Put
   these in the `R2_*` env vars.
4. Add a **CORS policy** to the bucket so the browser can upload:

   ```json
   [
     {
       "AllowedOrigins": ["https://verybadmusic.com", "http://localhost:3000"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

5. Upload mixes via the admin (**"upload a file to r2"** in the mix editor) – or
   any S3 tool (Cyberduck, rclone) for very large batches.

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
pnpm test    # unit tests (vitest) – stream url, sessions, schema, player reducer, slug, format
pnpm lint    # eslint
pnpm build   # production build
```

> This is a **pnpm** repo – use `pnpm`, not `npm`.

## Deploying to Vercel

1. Import the repo (framework preset: **Next.js**, root `./`).
2. **Storage → connect Upstash Redis** (Pay As You Go) – injects `KV_REST_API_*`.
3. **Storage → connect a public Blob store** (cover images).
4. **Settings → Environment Variables** (Production + Preview): `ADMIN_USERNAME`,
   `ADMIN_PASSWORD`, `SESSION_SECRET`, and the five `R2_*` vars.
5. Deploy. Audio never touches Vercel – playback uses no functions or bandwidth.

## Managing mixes

Sign in at **`/vbm-admin`**. Add/edit each mix on its own page: **upload the audio
file to R2** (or paste an existing R2 URL; length is auto-detected in the
browser), drop in a cover (auto-resized to JPEG), tags, tracklist. New mixes land
at the top; reorder with the arrows. Listeners get tiles/list views with tag and
favourites filters.
