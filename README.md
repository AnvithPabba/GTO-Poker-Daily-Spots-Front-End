# Poker Daily Trainer frontend

This is the public browser repository. It may contain React/Vite UI code and
the public contracts package, but never GTO frequencies, reached ranges,
solver inputs, database credentials, raw archives, or admin operations.

## Local checks

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm assets:check
pnpm test
pnpm test:e2e
pnpm build
```

The Vite/React shell is implemented. Run locally with
`corepack pnpm dev` and open `http://127.0.0.1:4173`.

Routes are `/`, `/daily`, `/challenge/:spotId`, `/archive`,
`/archive/:date`, and the loopback-only `/admin`. Challenge state is
introduction → history playback → answering → submitting → results → practice
retry. Controls come only from API legal actions; allocations are integer
basis points and the featured combo is always included.

Playback is reducer-driven and persists per-spot state in browser storage so a
refresh does not unexpectedly restart a hand. Pause/resume, replay, skip, and
muted-by-default sound preference controls are keyboard accessible; CSS honors
`prefers-reduced-motion`. Storage is optional and failures are ignored safely.

## Static container

The integration Compose file builds this directory into an Nginx image that:

- serves the Vite production build and public card assets;
- returns `200` from `/health/live`;
- proxies same-origin `/api/*` requests to the private `api` service;
- contains no solver artifacts or private solution data.

From `webapp/`:

```bash
docker compose up -d --build frontend
curl http://127.0.0.1:4173/health/live
curl http://127.0.0.1:4173/api/health/live
```

The host binding is loopback-only during development. A public deployment
must point the browser at an authenticated HTTPS API; keeping backend source
private does not make a browser `localhost` endpoint reachable by users.

## Frontend architecture

`src/api/client.ts` is the only server communication module. Feature pages use
TanStack Query; poker calculations live in `src/domain`; table, allocator,
range-grid, and result components are presentational. Vitest covers reducers,
blockers, allocation boundaries, and dynamic action counts. Playwright uses
deterministic intercepted v2 fixtures and avoids arbitrary sleeps.

```mermaid
flowchart TD
    Router[React Router] --> Feature[Feature page]
    Feature --> Query[TanStack Query]
    Query --> Client[Typed API client]
    Feature --> Domain[Pure reducers and poker utilities]
    Feature --> Components[Table / allocator / range / results]
    Components --> Assets[CardAssetProvider]
```

## Contracts boundary

The source currently consumes the sibling contracts package while npm release
is approval-gated. The target public dependency is the exact published
`@poker-trainer/contracts@0.2.0`; after release approval, replace the local
link, regenerate this repository's lockfile, run `npm pack --dry-run`, and
rebuild. Never publish from Docker or CI automatically.
The browser receives only public challenge/action schemas; solution
percentages are withheld until the private backend accepts a submission.

The `/admin` page is a local operator view. It reads the loopback-only queue,
Pacific publication calendar, coverage warning, and guarded job controls; it
does not contain solver output or answer data in the frontend bundle.

## Visual assets and public-repository boundary

The target trainer uses the user's poker-table artwork and the public-domain /
CC0 [OpenDecks playing-card deck](https://github.com/AustinGabriel/OpenDecks-Public-Domain-and-CC0-Playing-Cards).
The normalized 52 card faces and two backs are committed in `public/cards/`, so
a clean public checkout can build and run without a private asset-injection
step.

The source repository provides PNG and SVG assets and explicitly permits use,
modification, commercial distribution, and redistribution under CC0. We use
the PNG faces and normalize their descriptive filenames (for example,
`ace of hearts.png`) to the app's stable `Ah.png` convention. The complete
license text is preserved beside the images.

Do not put temporary signed download URLs in source, Dockerfiles, CI variables,
or logs. The frontend uses stable URLs such as `/cards/Ah.png`; because the
images are CC0, they may be committed, included in the static Docker image,
and served by GitHub/Vercel/Netlify-style builds. Do not reference a developer's
`Downloads` directory at runtime.

### Swappable asset provider

UI code does not construct card filenames itself. It consumes the
`CardAssetProvider` interface exported by
[`src/assets/card-assets.ts`](src/assets/card-assets.ts). The current
`OpenDecksCardAssetProvider` maps the normalized paths, and `cardAssets` is the
injected application default. To change artwork later, add another provider
that implements the same interface and change the provider binding; the table,
history playback, and challenge components remain unchanged.

### Asset credits

Playing-card artwork used by the production application:

- [OpenDecks Public Domain / CC0 Playing Cards](https://github.com/AustinGabriel/OpenDecks-Public-Domain-and-CC0-Playing-Cards)
- [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/)

The exact license text is preserved at
[`public/cards/LICENSE-OPENDECKS.txt`](public/cards/LICENSE-OPENDECKS.txt). The
frontend implementation and asset mapping are specified in
[frontend-structure.md](frontend-structure.md).
