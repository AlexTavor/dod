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

## Notes

- One kill gate. A child is terminated when dod exits, and dod is kept alive by the OS service
  manager; on boot it re-adopts any survivors, so kill-on-exit holds even after an unclean crash.
- Native dashboards (a [dashkit](src/dod/web/dashkit.js) spec) render in place; anything else is
  framed, and auto-demoted to "open in a new tab" if it refuses to be framed.
- State-changing requests require a loopback origin and the per-boot token from `$DOD_HOME/token`.
- A provider can synthesize dashboard entries from what is on disk, each with its own stable port;
  see the [provider protocol](src/dod/providers/base.py).

Python · standard-library-only runtime · uv · Lit (web UI, built dev-time).

## License

MIT — see [LICENSE](LICENSE).
