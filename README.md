# FPL Analytics

A personal Fantasy Premier League analytics dashboard for **team 6906082**.

It pulls live data from the official Fantasy Premier League API, joins it with published model projections, and keeps actual figures and modelled figures visually distinct throughout.

> Not affiliated with the Premier League or the Fantasy Premier League.
> Built for personal use — no credentials are required, stored or transmitted.

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

- **Node.js 20 or newer**
- No API keys, accounts or environment variables

---

## Getting started

```bash
# install dependencies
npm install

# start the development server
npm run dev
```

Open <http://localhost:3000>.

### Production build

```bash
npm run build
npm start
```

The app is a standard Next.js application and deploys to any platform that supports Node or Next.js. There is no database, no server-side state and no environment configuration.

### Deploying to Vercel

```bash
npm i -g vercel
vercel
```

The default Next.js settings are sufficient — no build arguments, environment variables or rewrites needed.

### Deploying anywhere else

```bash
npm ci
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
