# dod — a dashboard of dashboards

One local supervisor that registers, launches, supervises, and frames every other local
dashboard in a single admin UI. It is a process **supervisor with an IDE face**, not a
launcher menu — owning each dashboard's lifecycle is what ends the orphan/port chaos.

```
dod                       # → http://127.0.0.1:8090  (the admin UI)
dod ls                    # list every dashboard + its live state
dod start <id>            # launch one     dod stop <id> / restart <id> / forget <id>
dod daemon install        # run dod as an always-on launchd agent
```

## The model

- **List-first.** The left list IS the catalog and the spawn surface: click to open
  (starting it if stopped), with inline stop / restart / forget. No header tab-strip,
  no `+ add`.
- **One pane of glass.** Native [dashkit](src/dod/web/dashkit.js) dashboards are rendered
  in-place from their spec; everything else is iframed (and auto-demoted to "open in new
  tab" if it blocks framing).
- **Die with dod.** A child is killed when dod exits, and dod is kept alive by launchd.
  On boot dod re-adopts any survivors into the kill set, so the single-gate property holds
  even across an unclean crash. This is the cure for the "graveyard of broken sessions".
- **Cross-project.** dod lives in `~/.dod` (override with `$DOD_HOME`) and supervises
  dashboards in many repos. Your real catalog is *user data* at `$DOD_HOME/registry.json`
  — not committed here; see [`registry.example.json`](src/dod/_examples/registry.example.json).

## Why it isn't deck anymore

`deck` was one 1075-line script that worked on the happy path but accreted residue:
an append-only registry with no *forget*, in-memory ownership that evaporated on restart,
liveness that under-reported death, and stop/restart that silently no-op'd. dod keeps the
parts deck got right (pgid tree-kill, contract-gated discovery, same-origin spec proxy)
and fixes the rest, as a tested package.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/state` | `{entries:[…live…], discovered:[…]}` — list + live in one |
| POST | `/api/start` `/api/stop` `/api/restart` | lifecycle (token-guarded) |
| POST | `/api/forget` | drop a local entry (durable/provider → archive instead) |
| POST | `/api/add` `/api/pin` `/api/ignore` `/api/probe` | adoption + discovery |
| POST | `/api/announce` | token-exempt passive beacon (contract-gated) |
| GET | `/api/render?id=` `/api/cmeta?id=` `/api/log?id=` | proxy a child's spec / meta / log |

State-changing POSTs require a loopback origin **and** the per-boot token in
`X-Dod-Token` (the CLI reads it from `$DOD_HOME/token`).

## Providers

A **provider** turns something in the world into dashboard entries dynamically. The
bundled [PDD provider](src/dod/providers/pdd.py) scans for `.pdd/` repos and emits a
findings + plan dashboard per repo, with **dod assigning a stable unique port to each** —
which is exactly why PDD lives as a provider in the *one* dod instead of a dod-per-project.
Configure it at `$DOD_HOME/providers/pdd.json`:

```json
{"enabled": true,
 "cli": "/Users/you/Documents/Alex/proof-driven-development/cli/bin/pdd.ts",
 "roots": ["/Users/you/Documents/Alex"]}
```

## Develop

```
uv run -m dod                       # run the server from source
uv run pytest                       # the test suite
uv run ruff check src tests         # lint
```

## Layout

```
src/dod/
  config.py registry.py ports.py probe.py supervisor.py discovery.py
  sampler.py app.py server.py cli.py daemon.py __main__.py
  providers/  base.py pdd.py
  web/        index.html app.js app.css dashkit.js
tests/
```
