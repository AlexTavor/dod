# System-truth atlas: dod (Phase 0 / MAP)

**Last verified: 2026-06-24** against `quality/m2-map-diagnostic` (stacked on M1).
Method: every claim below was checked by reading the implementation, not inferred
from a name or a grep hit. Anchors are `file:line` at the time of writing; treat
them as leads if the line has drifted.

This is the recovered-truth document that precedes any behaviour-locking or change
(M3+). It has four parts:

1. [Verified code map](#1-verified-code-map)
2. [Footgun register](#2-footgun-register)
3. [Recovered-system risk register](#3-recovered-system-risk-register)
4. [Silent-failure census](#4-silent-failure-census)

A note up front, so this reads in proportion: **dod is well-built.** The supervisor
is carefully reasoned, the seams are injectable (so the suite is hermetic), and the
resilience choices are deliberate and mostly documented. The items below are the
sharp edges that remain, recorded so the migration that follows can't be cut by them.

---

## 1. Verified code map

### Object graph

`__main__.main(argv)` dispatches four ways:

- `dod daemon …` → `daemon.run` (launchd plist install/uninstall/status)
- `dod init` → `_init` (seed `$DOD_HOME/registry.json`)
- `dod <subcommand>` (one of `cli.CLI_COMMANDS`) → `cli.run` (HTTP client to a running dod)
- otherwise → `App(paths).serve(port)` (the server)

`App` (app.py) is the root of the live object graph:

```
App
├─ Paths            on-disk locations, derived from one home dir ($DOD_HOME)
├─ token            per-boot secret (persisted; the agent-control trust boundary)
├─ Registry         providers ∪ durable ∪ local, validated + merged
│   └─ providers[]  ManifestProvider, PddProvider  (each TTL-caches its fs scan)
├─ Supervisor       spawn/stop/restart/reap/shutdown + the liveness state machine
├─ Discovery        contract-gated adoption (announce + probe), pin/ignore/prune
└─ states           {id: state-dict}, recomputed by the sampler thread
```

`serve(port)` boot sequence (app.py:76): mark serving → register `atexit`/SIGTERM
shutdown → `supervisor.reap_on_boot()` (re-adopt survivors, record deaths) →
`discovery.load()` → `write_runtime_files()` → start the sampler thread →
`ThreadingHTTPServer.serve_forever()`.

### Module responsibilities (verified)

| Module | Responsibility | Notes |
|---|---|---|
| `config.py` | Constants + `Paths` (frozen dataclass) → every on-disk location | `RESERVED_FILES` distinguishes lockfiles from state files |
| `registry.py` | Merge + `validate()` entries across 3 tiers; archive overlay; port lint | Durable `registry.json` is **read-only** (trust boundary) |
| `supervisor.py` | Process lifecycle + 3-signal liveness; lockfiles + crash/stop markers | The hard part; own session per child (`start_new_session`) for pgid tree-kill |
| `discovery.py` | Adopt only ports that answer `/api/meta` as a known contract | `found` (unpinned) vs registry (active); never a blind scan |
| `providers/base.py` | `Provider` Protocol: `discover(paths) -> list[dict]` | |
| `providers/manifest.py` | A project self-registers via `dod.project.json` | Generalises the PDD provider |
| `providers/pdd.py` | One entry per `.pdd/` repo × dashboard; dod assigns the port | Cleanly disabled if `cli` not configured/found |
| `ports.py` | `PortAllocator`: stable key→port from a pool, persisted | Raises if the pool (4300–4399) is exhausted |
| `sampler.py` | Recompute every entry's state every 2s, concurrently | Parallel by design (one wedged port can't freeze the board) |
| `probe.py` | Network liveness: `port_open`, `probe`, `fetch_meta`, `proxy_get/post`, `log_tail` | The third liveness signal; never `ps`-by-name |
| `server.py` | HTTP: read endpoints + token-guarded control endpoints | `_guard` = loopback origin **and** `X-Dod-Token` |
| `cli.py` | `dod <subcommand>`: an HTTP client that drives a *running* dod | 15s timeout (survives cold-start storms) |
| `daemon.py` | launchd agent (`KeepAlive`) install/uninstall/status | macOS-specific |
| `kit.py` | Reference `dod-kit/1` contract server for projects | Pure logic in, spec out; security lives at dod's edge |
| `util.py` | `load_json` (never raises), `atomic_write` (temp + replace), `write_json` | |

### Two control/data flows worth holding in your head

**A user action (start/stop/restart/…):** UI → `POST /api/<action>` → `_guard`
(origin + token) → `registry.get(eid)` → `supervisor.<action>(e)` → spawn + write
lockfile (or signal pgid + verify port release). See [F1](#2-footgun-register) on
the cost of `registry.get`.

**Liveness:** sampler tick → `registry.load()` → `supervisor.state(e)` for every
entry, concurrently in a thread pool → `app.states` snapshot under `app.lock` →
`GET /api/state` serves the snapshot. See [F2](#2-footgun-register)/[R1](#3-recovered-system-risk-register):
`state()` both writes to disk and reads `self.procs` without the supervisor lock.

### Runtime file layout (`$DOD_HOME`, default `~/.dod`)

```
registry.json     durable, user-owned: dod READS only (trust boundary)
local.json        adopted / ad-hoc entries: dod writes
state.json        archive-state overlay {id: {state}}
discovered.json   contract-speakers seen, not yet pinned
ports.json        provider port assignments (stable across restarts)
order.json        user's drag ordering
token             per-boot secret, mode 600
server.json       non-secret connection info for the CLI
run/
  <id>.json         per-child lockfile (the durable ownership handle)
  <id>.log          captured child stdout/stderr (capped at LOG_CAP)
  <id>.crash.json   durable crash marker (death survives a dod restart)
  <id>.stop.json    durable clean-stop marker
```

---

## 2. Footgun register

Names/types/signatures that read differently from how they behave at runtime.

| # | Symbol: looks like | Verified reality | Anchor | Severity |
|---|---|---|---|---|
| F1 | `Registry.get(eid)`: an O(1) dict lookup | Calls `load()`: re-reads `registry.json` + `local.json` + `state.json`, re-validates every entry, lints ports, re-merges providers (the provider fs scan is TTL-cached 60s, but the file reads + validation happen on **every** call). Invoked per control action and per render. | registry.py:100 → :61 | Med (perf) |
| F2 | `Supervisor.state()` / `_state_raw()`: a pure status getter | Has disk **write** side effects: `_write_crash` when it observes an owned-but-exited child, `_clear_crash` when healthy. The sampler calls it every 2s per entry, so state transitions write markers. | supervisor.py:289, 312, 337–340 | Med |
| F3 | `validate(e, source)`: a pure validator | Mutates `e` in place (`e["port"] = int(...)`, `setdefault(...)`, `e["source"] = ...`). Called on a shallow `dict(raw)`, so top-level writes are contained, but nested `ready`/`env` remain shared with the source dict. | registry.py:23 | Low |
| F4 | `Supervisor.self.lock`: implies `self.procs` access is synchronised | `_state_raw` reads `self.procs` **without** the lock, while `start`/`stop` mutate it under the lock. See [R1](#3-recovered-system-risk-register). | supervisor.py:323, 337 | Med (race) |
| F5 | a lockfile's `pgid`: always the child's process group | If `os.getpgid` fails right after spawn, `pgid` is silently stored as `None`; later tree-kill can't target the group. See [R2](#3-recovered-system-risk-register). | supervisor.py:167–169 | Med (rare) |
| F6 | `EXAMPLE_REGISTRY`: bundled with the package | Resolved as `<pkg>/../../examples/registry.example.json`. The wheel packages only `src/dod` (pyproject.toml:22), so the file is **absent** once pip-installed; `dod init` then silently writes an empty registry instead of seeding the example. See [R3](#3-recovered-system-risk-register). | config.py:32; __main__.py:25 | Low |

---

## 3. Recovered-system risk register

Where the existing code is, or may be, wrong (distinct from plan-assumption risk).
Each carries a kill-condition / detector so M3–M5 can close it deliberately.

### R1: TOCTOU on `self.procs` between the sampler and a control thread
`_state_raw` does `owned = eid in self.procs` (supervisor.py:323) and later
`self.procs[eid].poll()` (337–338) **without** holding `self.lock`. The sampler runs
`state()` for all entries concurrently; a user `stop()` pops `self.procs[eid]` under
the lock. If the pop interleaves between the membership check and the access, the
read raises `KeyError`.
- **Blast radius:** one sampler tick for one entry throws; the sampler swallows it
  (sampler.py:31, logged) and recovers next tick. No corruption, but the board can
  flicker and the error is real.
- **Likelihood:** low (2s cadence vs a human click), but non-zero and timing-dependent.
- **Detector:** a stress test driving concurrent `state()` + `stop()` on the same id.
- **Remediation (M3/M4):** snapshot `self.procs[eid]` once under the lock in
  `_state_raw`, or read via a single `.get()` and branch on the result.

### R2: `pgid = None` silently weakens "die with dod"
If `os.getpgid(p.pid)` raises right after spawn (supervisor.py:167–169), the child's
lockfile records `pgid = None`. `_killpg` no-ops on a falsy pgid, so `stop`/`shutdown`
cannot tree-kill that child by group: it can orphan.
- **Kill-condition:** a started child whose lockfile has `pgid: null`.
- **Likelihood:** rare (getpgid almost never fails for a just-spawned child).
- **Remediation:** on `None` pgid, fall back to killing `p.pid` directly (and/or
  retry getpgid once); record the degraded state rather than dropping it.

### R3: `dod init` is a source-only feature
Because `examples/` is not in the wheel ([F6](#2-footgun-register)), the headline
behaviour of `dod init` (seed from the example) only works from a source checkout;
an installed dod writes an empty registry.
- **Detector:** `pip install` into a clean venv, run `dod init`, assert the registry
  matches the example.
- **Remediation:** force-include `examples/registry.example.json` as package data, or
  embed the example registry as a module constant.

### R4: `registry.get()` reload cost under load
[F1](#2-footgun-register) means every control action and render re-reads three files
and re-validates all entries. Fine at today's scale (a handful of small JSON files);
a latent scaling cliff as catalogs grow or actions burst.
- **Remediation:** a short-TTL cache on `load()`, or thread the already-loaded
  entries through the request path. Defer until measured.

> Not yet load-bearing, recorded for honesty: the M3 data-model migration should
> not *introduce* a fix for R4 implicitly: measure first, then decide.

---

## 4. Silent-failure census

Every place an exception is swallowed or a failure could pass without a trace, with a
real-vs-benign classification. Legend: **benign** = the swallow *is* the signal (a
probe that fails means "not alive"); **reported** = converted to a caller-visible
result (4xx / `{ok:false}` / 502); **logged** = printed; **REAL-RISK** = can mask a
defect.

| Site | What it swallows | Outcome | Class |
|---|---|---|---|
| probe.py:24 | socket connect | `port_open → False` | benign |
| probe.py:43 | HTTP GET probe | `(False, True, None)` | benign |
| probe.py:56 | `/api/meta` fetch | `None` | benign |
| probe.py:69 | proxy GET upstream | `502` | reported |
| probe.py:83 | proxy POST upstream | `502` | reported |
| util.py:16 | malformed JSON | `{}` + `WARNING` print | logged |
| registry.py:71 | a broken provider | skip provider + print | logged |
| sampler.py:31 | one sampler tick | continue next tick + print | logged |
| server.py:41 | client disconnect mid-write | drop | benign |
| server.py:69 | malformed request body | `{}` | benign |
| server.py:169 | bad `add` port | `400 bad port` | reported |
| server.py:193 | bad `announce` port | `400` | reported |
| kit.py:62 | client disconnect | drop | benign |
| kit.py:80 | a render error | error panel in the spec | reported (UI) |
| kit.py:96 | malformed action body | `{}` | benign |
| kit.py:100 | a failing `on_action` | `500` + `repr(e)` | reported |
| cli.py:52 | unparsable HTTPError body | fall back to `e.reason` | reported |
| cli.py:54 | dod unreachable | `(0, {error})` to the user | reported |
| supervisor.py:140 | terminal spawn failure | `{ok:false, error}` | reported |
| supervisor.py:161 | web spawn failure | `{ok:false, error}` | reported |
| supervisor.py:177 | `killpg` on a gone/denied group | no-op | benign |
| supervisor.py:207 | `getpgid` in `stop` | fall back to lockfile pgid | benign |
| supervisor.py:272 | `killpg` during shutdown | best-effort, continue | benign |
| supervisor.py:94 | `load_json` in `_read_lock` | `None` (double-safety; load_json already guards) | benign (fully silent) |
| **supervisor.py:168** | **`getpgid` right after spawn** | **`pgid = None`, tree-kill weakened** | **REAL-RISK → [R2](#3-recovered-system-risk-register)** |

**Reading of the census:** 25 sites. The overwhelming majority are deliberate
resilience (network probes whose failure *is* the answer, client disconnects,
malformed input → 4xx) or are reported/logged. Exactly one is a real-risk silent
path (supervisor.py:168 → R2). No bare `except:` and no `except BaseException`
anywhere; every broad `except Exception` carries a `# noqa: BLE001` with a reason
(enforced by the ruff `BLE` rule added in M1).
