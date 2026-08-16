# KarKade — restructure v2 + race history

Two deliverables, both verified:

1. **`restructure.sh`** — replaces the earlier version. Covers all **55** files, applies your decision to keep the original stack, and tested against a live clone of the repo: 48 files placed, 7 deleted, zero left unmapped.
2. **`backend/src/routes/races.ts`** — the `/api/races/history` endpoint the player Dashboard calls. Typechecks clean; placement-parsing and earnings math verified 10/10.

`backend/src/server.ts` is included because it needed one import and one `app.use` line to mount the new route.

## Do this first

Your `env` file is committed to a public repo with what looks like a real `DATABASE_URL` — 52 characters, not a placeholder. **Rotate that database password now.** The script untracks the file and renames it to `.env`, but that only stops future commits; the value stays in history until you purge it:

```bash
git filter-repo --path env --invert-paths
git push --force
```

`JWT_SECRET` in that file is still a placeholder, so no issued tokens are at risk.

## What the script does with the 25 new files

**Kept:**

| File | Destination |
|---|---|
| `typescript20` | `frontend/src/services/api.ts` |
| `index.html` | `frontend/public/landing.html` |
| `bash7` | `docs/deploy-fly.sh.txt` |
| `bash8` | `docs/local-test.sh.txt` |
| `env` | `.env` (untracked) |

The landing page goes to `public/` rather than the frontend root because Vite already owns `index.html` there. It'll serve at `/landing.html`.

**Moved to `_superseded/`** — the parallel `pg` stack, kept rather than deleted so you can port pieces later: `typescript11`–`typescript19`, plus `json5`, `json6`, `sql1`, `text1`.

Worth knowing: `typescript16` (players routes) has `/profile`, `/location`, and `/earnings` endpoints that don't exist in the original stack. Those are genuinely new functionality, just written against `query()` instead of `sql`. Say the word and I'll port them.

**Deleted:**

- `json3`, `json7`, `json8` — three competing `vercel.json` files. `json8` builds `frontend/index.html` with `@vercel/static`, which is precisely the 404 you started with.
- `json4` — root `package.json` whose build script is `cp -r frontend/* dist/`; `dist/` never exists, so it fails.
- `bash5`, `bash6`, `bash9` — the snippets that created `frontend/`, then moved the HTML out and `rmdir`'d it again. That round trip is why `index.html` ended up at the root.

## races.ts

Serves `GET /api/races/history`, returning exactly the fields `Dashboard.tsx` reads: `id`, `trackId`, `finishedAt`, `placement`, `earnings`. Also adds `/api/races/stats` and `/api/races/:raceId`, the latter readable only by someone who was actually in that race.

Two things constrained the implementation:

**Earnings are derived, not stored.** `gameSocket.ts` credits `users.balance` on race completion but never records a per-race, per-player amount. So history recomputes it the same way the socket does — 7% of `ad_revenue`, split evenly across players. If you ever change the split in `gameSocket`, change `PLAYER_REVENUE_SHARE` here to match, or history will disagree with what players were actually paid. Writing `ad_impressions` rows with `player_earnings` at race end would remove the duplication; the column already exists in your schema.

**`results` is client-supplied.** `gameSocket` writes `data.results` straight from the socket payload with no validation, so the shape isn't guaranteed. `placementFor` checks `userId`, `playerId`, and `id` for the player key, then `placement`, `position`, and `rank` for the value, falls back to array order, and returns `null` rather than inventing a number. Worth validating that payload server-side at some point — right now a client can report any finishing position it likes.

## Order of operations

```bash
git clone https://github.com/DSangHub/KarKade && cd KarKade
cp /path/to/restructure.sh . && chmod +x restructure.sh && ./restructure.sh

cp -r /path/to/karkade-fix/scaffolding/. .        # frontend build config
cp -r /path/to/karkade-backend/backend/. backend/  # auth layer
cp -r /path/to/karkade-v2/backend/. backend/       # races route + server

cd frontend && npm install && npm run build
cd ../backend && npm install && npx tsc --noEmit
cd .. && git add -A && git commit -m "Restructure; consolidate on original stack" && git push
```

Once that's pushed, I can link the repo to Vercel as a git-backed project — root directory `frontend` — so every future push deploys automatically. That's better than the file upload I attempted earlier, which produces a one-off deployment with no git connection.
