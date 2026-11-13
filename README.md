# FPL Analytics

A personal Fantasy Premier League analytics dashboard for **team 6906082**.

It pulls live data from the official Fantasy Premier League API, joins it with published model projections, and keeps actual figures and modelled figures visually distinct throughout.

> Not affiliated with the Premier League or the Fantasy Premier League.
> Built for personal use — no credentials are required, stored or transmitted.

---

## For non-developers

**What this is.** A private dashboard for managing my own Fantasy Premier League
team. It answers three questions every week: who should start, who should
wear the captain's armband, and who should I swap in?

**What it shows.** My actual squad on a pitch, the season so far, every player
in the Premier League ranked by how many points they're expected to score next
gameweek, and a planner that shows what a swap would cost me in money and
points before I commit it.

**Where the numbers come from.** Two public sources:

- The **official Fantasy Premier League API** for everything that has actually
  happened — my picks, player prices, points scored, fixtures and my rank.
- **[Sideline Quant](https://sidelinequant.com)** for what is *expected* to
  happen — projected points, how likely a player is to start, and a realistic
  best-case and worst-case range.

**Actual and predicted are always visibly different.** Predicted figures are
marked `Model` and shown in a different colour; actual figures are marked
`FPL`. A green number means "this went well", a red one means "this went
badly", and neither is used for a prediction.

**It costs nothing and needs no sign-up.** No API keys, no database, no
accounts. If the live data can't be reached, a saved snapshot is shown instead
and the interface says so.

**Try it:** <https://01-fpl-dash.vercel.app/>

The rest of this README is about running it yourself.

---

## Features

| Page | What it does |
| --- | --- |
| **Team Overview** | Live squad on a portrait pitch with the bench pinned below, expected points with a captain/vice-captain selector you can override, full squad table and season charts |
| **Expected Points** | Every player ranked by projected points, split into goalkeepers, defenders, midfielders and attackers, with FPL's own expected points alongside |
| **Transfer Planner** | Model a swap, see the financial and expected-points impact, and stage multiple transfers that simulate together |
| **About** | What the app is, where the data comes from, releases and what is planned next |

---

## Data sources

Both sources are public. Nothing needs to be configured.

| Source | Used for | Link |
| --- | --- | --- |
| Fantasy Premier League API | Squad picks, player prices and statistics, clubs, fixtures, gameweek history and rank | <https://fantasy.premierleague.com/api/> |
| [Sideline Quant](https://sidelinequant.com) | Expected points, expected minutes, start probability, and simulated floor and ceiling | <https://sidelinequant.com/data/latest.json> |

Sideline Quant projections are licensed **CC BY 4.0** and are credited throughout the interface.

### How the two are joined

Sideline Quant rows carry the FPL element id, so projections join directly onto official player data with no name matching. Rows are published at *fixture* grain, so a double gameweek produces two rows per player:

- `xP` and `e_mins` are per fixture and are **summed**
- `gw_p10`, `gw_p90` and `gw_sigma` are already gameweek totals and are **not** summed
- `p_start` is per fixture and compounds across fixtures (`1 − Π(1 − p)`)

Prices are taken from FPL, which is authoritative — the two feeds refresh independently and can differ by 10p for a player whose price has just crossed a change point.

---

## Requirements

- **Node.js 20.9 or newer** — Next.js 16 requires it
- No API keys, accounts or environment variables

---

## Getting started

```bash
# 1. Get the code
git clone https://github.com/aitkendj/fpl-dash.git
cd fpl-dash

# 2. Download the dependencies (~400 packages, takes about 10 seconds)
npm install

# 3. Start the development server
npm run dev
```

Open <http://localhost:3000>.

Two things worth knowing:

- **Run the commands from inside the project folder.** `npm install` reads the
  `package.json` in the current directory to work out what to download — that
  file lists every dependency with the version range to use. The
  `package-lock.json` alongside it pins the exact resolved versions and
  integrity hashes, so everyone ends up with an identical dependency tree.
  If the terminal is pointed somewhere else, npm walks *up* the directory
  tree looking for a `package.json` and will happily install a different
  project's dependencies.
- **`npm install` versus `npm ci`.** `npm install` may update the lockfile if
  something has drifted. `npm ci` installs exactly what the lockfile says and
  discards any existing `node_modules` — use it for reproducible builds and
  CI.

### Production build

```bash
npm run build
npm start
```

The app is a standard Next.js application and deploys to any platform that supports Node or Next.js. There is no database, no server-side state and no environment configuration.

### Optional environment variables

None are required. One is available:

| Variable | Purpose |
| --- | --- |
| `FPL_DIAGNOSTICS` | Set to `1` to enable the `/api/data-status` diagnostics route. Unset by default, so it returns 404 in production rather than exposing your team and the full player pool in machine-readable form. |

```bash
FPL_DIAGNOSTICS=1 npm run dev
```

### Deploying to Vercel

```bash
npm i -g vercel
vercel
```

The default Next.js settings are sufficient — no build arguments, environment variables or rewrites needed.

### Deploying anywhere else

```bash
npm ci        # install exactly what the lockfile specifies
npm run build
npm start
```

The server listens on `PORT` (default `3000`).

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint over `src/` and `scripts/` |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Data validation, transfer logic and transformation tests |
| `npm run validate` | Snapshot integrity checks |
| `npm run test:transfers` | Transfer simulation rules |
| `npm run test:transform` | Data transformation and DGW aggregation |
| `npm run test:live` | Live checks against the real APIs (needs network) |
| `npm run capture` | Re-capture the offline snapshot from live data |
| `npm run shot <path> [name]` | Screenshot a page for layout review |

---

## Architecture

```
src/
  app/                     Routes — server components that load the snapshot
    layout.tsx             App shell, fonts, sidebar and header
    page.tsx               Team Overview
    about/                 About
    expected-points/       Expected Points
    transfer-planner/      Transfer Planner
    api/data-status/       Diagnostics endpoint — source health
  components/
    my-team/               Pitch and the Team Overview view
    expected-points/       Expected Points view
    transfer-planner/      Transfer Planner view
    season-overview/       Rank and points charts
    system/                Source banner and provenance badges
    ui/                    Design system primitives
    navigation/            Sidebar and header
  lib/
    model.ts               Common player model — official stats and predictions
    transform.ts           Pure transformations, including DGW aggregation
    formation.ts           Formation definitions and pitch placement
    transfers.ts           Transfer simulation
    calculations.ts        Points arithmetic
    attributions.ts        Third-party attribution
    utils.ts               Class merging and formatting
    server/                All network access — server-only
  data/
    snapshot.ts            Captured live fallback
    provider.ts            Data provider boundary
```

Three layers are kept strictly apart:

1. **Fetching** — `src/lib/server/*`, all `server-only`. Every outbound request goes through `http.ts`, which owns the cache policy and error handling.
2. **Transformation** — `src/lib/transform.ts` and friends. Pure functions with no I/O, so they can be tested without the network.
3. **Presentation** — `src/components/*` and `src/app/*`. Rendering only.

### The common player model

`DashboardPlayer` keeps official FPL statistics and model predictions in **separate fields** (`fplProjection` and `sidelineQuantProjection`), plus a resolved `expectedPoints` with `expectedPointsSource` recording which one was used. A new prediction provider can be added without changing the shape or the components.

### Caching

| Data | Cache window |
| --- | --- |
| Bootstrap (players, clubs, gameweeks) | 6 hours |
| Fixtures | 6 hours |
| Sideline Quant projections | 1 hour |
| Manager data (squad, history, rank) | 5 minutes |
| Assembled page snapshot | 5 minutes, revalidated |

> The upstream payloads are large — the FPL bootstrap is ~1.8MB, over the data cache limit — so they are **reduced to the fields used** before being cached. Without this, caching silently fails and every request re-downloads them.

### Build resilience

The production build runs the same code as the server, so an unreachable upstream service must not be able to fail it. Two rules keep that true:

1. **A cached function never throws.** An error thrown inside a `"use cache"` boundary cannot be caught by its caller, so every cached accessor catches its own failures and returns a result object instead.
2. **Failures are cached briefly, successes for hours.** `cacheLife()` is set conditionally — a failure is retried after a minute rather than being held for the full window.

If the live sources cannot be reached, the captured snapshot is used and the interface says **"Snapshot"** rather than **"Live"**. You can verify this locally:

```bash
FPL_API_BASE="https://127.0.0.1:9/api" SQ_ENDPOINT="https://127.0.0.1:9/latest.json" npm run build
```

The build succeeds and every page renders from the snapshot.

### Offline fallback

`src/data/snapshot.ts` is a captured copy of the live data, used when the external sources cannot be reached. The interface says so plainly in the header ("Snapshot" rather than "Live") and in the source banner. Both paths run identical code.

Re-capture it with `npm run capture`.

---

## Testing

```bash
npm test              # 90 assertions, no network required
npm run test:live     # 33 checks against the real APIs
```

The live suite verifies that player ids join correctly between the two sources, that prices agree, that the squad and history reconcile with the manager summary, and that no projection is silently substituted for a missing one.

---

## Licence

Personal project. The dashboard's own code is yours to use as you see fit.

Third-party data retains its own terms:

- Fantasy Premier League data is © Premier League
- Sideline Quant projections are licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and require attribution to [Sideline Quant](https://sidelinequant.com)
