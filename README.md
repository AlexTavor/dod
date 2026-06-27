# dod

A local supervisor for your other local dashboards. Register a command once; dod launches it on
demand, tracks whether it is alive, hands it a stable port, and frames it in a single admin UI. When
dod exits it kills everything it started, so dev servers stop piling up on forgotten ports.

Runs entirely locally — the daemon binds to loopback, and every state-changing request carries a
per-boot token.

## Install

```bash
uv sync
```

## Use

```bash
uv run dod                 # serve the admin UI at http://127.0.0.1:8090
uv run dod ls              # list every dashboard and whether it is live
uv run dod start <id>      # launch one (also: stop / restart / forget <id>)
uv run dod daemon install  # run dod as an always-on background agent
```

dod keeps its catalog and runtime state under `~/.dod` (override with `$DOD_HOME`), none of it
committed here. See [registry.example.json](src/dod/_examples/registry.example.json) for the entry
format.

## Make a dashboard discoverable

dod renders dashboards with **dashkit**: a dashboard sends a flat spec of display atoms
(`{ title, panels: [...] }`) and dod draws it, so the dashboard ships no frontend of its own. See
[frontend/README.md](frontend/README.md) for dashkit and the atom set.

To be managed by dod, a dashboard speaks the `dod-kit/1` contract over loopback:

| Endpoint | Returns |
|---|---|
| `GET /api/meta` | `{ contract: "dod-kit/1", render: "spec", name, refresh_ms, accepts_actions }` |
| `GET /api/render` | the spec dod draws |
| `POST /api/action` | runs `{ action, payload }` through your logic (optional) |

The reference kits write all of that for you, in [Python](src/dod/kit.py) and
[Node](kits/node/dod-kit.js) (a whole dashboard is [example-counter.js](kits/node/example-counter.js),
about 20 lines). A kit also serves its spec standalone, so the dashboard works opened directly and
inside dod's pane, one renderer either way.

dod only adopts ports that answer `/api/meta` with the contract, never a blind scan. Surface yours
by announcing on startup (POST your meta to dod's `/api/announce`, which the kit does for you), or
let dod contract-probe its known ports. A discovered dashboard is a candidate until you **pin** it;
after that dod manages its lifecycle like anything else.

## Notes

- One kill gate. A child is terminated when dod exits, and dod is kept alive by the OS service
  manager; on boot it re-adopts any survivors, so kill-on-exit holds even after an unclean crash.
- Native dashboards (a [dashkit](frontend/README.md) spec) render in place; anything else is
  framed, and auto-demoted to "open in a new tab" if it refuses to be framed.
- State-changing requests require a loopback origin and the per-boot token from `$DOD_HOME/token`.
- A provider can synthesize dashboard entries from what is on disk, each with its own stable port;
  see the [provider protocol](src/dod/providers/base.py).

Python · standard-library-only runtime · uv · Lit (web UI, built dev-time).

## License

MIT — see [LICENSE](LICENSE).
