# TCA-only deployment (`tca.renegade.fi`)

This guide deploys the `renegade-frontend` repo as a TCA-only build to the
`tca.renegade.fi` subdomain. The same source tree powers both the full app
(`app.renegade.fi`) and the TCA-only build, gated by the
`NEXT_PUBLIC_TCA_ONLY_MODE` env var.

## What the flag does

When `NEXT_PUBLIC_TCA_ONLY_MODE=true`:

1. **Middleware** (`middleware.ts`)
   - `/` is rewritten to `/tca` (URL stays at `/`).
   - `/tca`, `/tca/*`, `/api/*` pass through.
   - All other paths return HTTP 404.
2. **Root layout** (`app/layout.tsx`)
   - Drops `Header`, `Footer`, `WalletSidebar`, `Faucet`, banners, toasters,
     query devtools, wrong-network modal, Zendesk widget.
   - Drops the `WagmiProvider`, `SolanaProvider`, `ServerStoreProvider`,
     `ClientStoreProvider`, `WasmProvider`, `SidebarProvider`.
   - Keeps `ThemeProvider`, `TooltipProvider`, `LazyDatadog`, `Analytics`.

When the flag is unset or `false`, the existing behavior is unchanged.

## One-time Vercel setup

### 1. Create a second Vercel project

The TCA build is a separate Vercel project so its env vars, domain, and
deployment hooks are isolated from the main app.

1. In the Vercel dashboard: **Add New → Project**.
2. Select the same Git repository as the main `renegade-frontend` project.
3. Project name: `renegade-frontend-tca` (or similar).
4. **Framework Preset:** Next.js (auto-detected).
5. **Root Directory:** repository root (do not change).
6. **Build & Output Settings:** leave at defaults.
7. Do **not** click Deploy yet — add env vars first (step 2).

### 2. Set environment variables

In **Project Settings → Environment Variables**, add the following for all
three environments (Production, Preview, Development). Mirror values from
the main `renegade-frontend` project unless noted otherwise.

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_TCA_ONLY_MODE` | `true` | **TCA-only.** Required to enable the flag. |
| `NEXT_PUBLIC_SITE_URL` | `https://tca.renegade.fi` | TCA-specific. |
| `NEXT_PUBLIC_CHAIN_ENVIRONMENT` | `mainnet` | Must match the data the TCA simulator queries. |
| `NEXT_PUBLIC_ARBITRUM_TOKEN_MAPPING` | (copy from main project) | |
| `NEXT_PUBLIC_BASE_TOKEN_MAPPING` | (copy from main project) | |
| `NEXT_PUBLIC_ARBITRUM_DEPLOY_BLOCK` | (copy from main project) | |
| `NEXT_PUBLIC_BASE_DEPLOY_BLOCK` | (copy from main project) | |
| `NEXT_PUBLIC_DATADOG_APPLICATION_ID` | (copy or create new RUM app) | A separate RUM app is recommended so TCA traffic is isolated. |
| `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN` | (matches the RUM app above) | |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | (copy from main project) | Unused at runtime but required by the env schema. |

Any server-side env vars used by the TCA server actions or `/api` proxies must
also be copied — check the main project's env list and replicate any not
listed above.

### 3. Disable crons on this project

`vercel.json` declares cron jobs (volume backfill, darkpool-flow). These are
not needed on the TCA build.

- **Project Settings → Cron Jobs → Disable** for the TCA project.

### 4. First deploy

1. Trigger the initial deployment (Deployments → Redeploy, or push a commit).
2. Watch the build log:
   - Build should succeed; no env validation errors.
   - The compiled `middleware.ts` should appear in the output.
3. Open the Vercel-provided preview URL (e.g.
   `renegade-frontend-tca.vercel.app`).
4. **Smoke test the build** (see "Smoke test" below).

### 5. Attach the custom domain

1. **Project Settings → Domains → Add Domain.**
2. Enter `tca.renegade.fi`. Vercel will display required DNS records.
3. In the DNS provider for `renegade.fi`:
   - Add a **CNAME** record for `tca` pointing to `cname.vercel-dns.com`.
   - (Or A record `76.76.21.21` if CNAME is not supported at that level.)
4. Wait for DNS propagation (usually <5 min, up to 24h).
5. Vercel auto-issues a TLS cert; verify the green check next to the domain.
6. Visit `https://tca.renegade.fi`. The TCA page should load at `/`.

## Smoke test (run after every deploy)

| Path | Expected |
| --- | --- |
| `https://tca.renegade.fi/` | TCA page renders, URL stays at `/`. |
| `https://tca.renegade.fi/tca` | TCA page renders (same content). |
| `https://tca.renegade.fi/trade/WETH` | HTTP 404. |
| `https://tca.renegade.fi/orders` | HTTP 404. |
| `https://tca.renegade.fi/assets` | HTTP 404. |
| `https://tca.renegade.fi/rampv2` | HTTP 404. |
| `https://tca.renegade.fi/api/health` (or any working `/api/*` route) | Passes through to the API handler. |
| Visual | No header bar, no footer, no wallet sidebar/connect button. |
| DevTools network | No WalletConnect, no `eth_*` RPC, no wagmi handshakes. |

`curl -I https://tca.renegade.fi/trade/WETH` should return `HTTP/2 404`.

## Local verification

```bash
cd renegade-frontend
NEXT_PUBLIC_TCA_ONLY_MODE=true pnpm dev
# → visit http://localhost:3000  (should render TCA)
# → visit http://localhost:3000/trade/WETH  (should 404)

# And confirm the standard build is unaffected:
pnpm dev
# → visit http://localhost:3000  (normal homepage / trade UI)
```

## Updating the deployment

Both Vercel projects share the same Git repo and branch. A push to `main`
triggers a build on **both** projects in parallel:

- Main project builds with `NEXT_PUBLIC_TCA_ONLY_MODE` unset → full app.
- TCA project builds with `NEXT_PUBLIC_TCA_ONLY_MODE=true` → TCA-only app.

No manual coordination needed.

## Rollback

To roll back TCA without touching the main app:

1. Vercel dashboard → TCA project → Deployments.
2. Find the last known-good deployment → **Promote to Production**.

To temporarily disable TCA-only behavior on the TCA project (e.g. for
debugging), unset `NEXT_PUBLIC_TCA_ONLY_MODE` in env vars and redeploy. The
TCA project will then serve the full app at `tca.renegade.fi`. Set it back
to `true` and redeploy to restore.

## Notes for future maintainers

- The flag is read at build time for the client bundle and at runtime for
  middleware/server components. Changing the env var requires a redeploy.
- The middleware matcher in `middleware.ts` skips Next.js internals and
  common static asset extensions; adjust if new asset types are introduced.
- If a new page is added under `/tca`, it works automatically — both the
  middleware allow-list and the layout are agnostic to TCA sub-routes.
- If the TCA page begins requiring wallet hooks or app state, revert the
  provider-stripping in `app/layout.tsx`'s TCA-only branch.
