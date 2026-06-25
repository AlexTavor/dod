# Mutation grading (M5b)

Line coverage says a line *ran*; it cannot say a test would *fail* if that line were wrong.
Mutation grading answers that: inject a small change (a mutant) into the source and check the
tests turn red. A surviving mutant is either a weak test (add a case) or dead/irrelevant code.

This is a periodic assessment, not a CI gate (a full run is far too slow for per-push CI). Run
it ad-hoc; it needs no committed dependency.

## How to run

[cosmic-ray](https://github.com/sixty-north/cosmic-ray) is used because it handles this project's
src-layout cleanly (it mutates through an import hook driven by an explicit test command). Pull it
in transiently with `uv run --with`, one module at a time, pointing the test command at just the
tests that cover that module so each mutant runs in well under a second.

```toml
# /tmp/cr-ports.toml
[cosmic-ray]
module-path = "src/dod/ports.py"
timeout = 30.0
test-command = "python -m pytest -x -q tests/test_ports.py tests/test_ports_properties.py"
excluded-modules = []

[cosmic-ray.distributor]
name = "local"
```

```bash
uv run --with cosmic-ray cosmic-ray init /tmp/cr-ports.toml /tmp/cr-ports.sqlite
uv run --with cosmic-ray cosmic-ray exec /tmp/cr-ports.toml /tmp/cr-ports.sqlite
uv run --with cosmic-ray cr-report /tmp/cr-ports.sqlite          # totals + per-mutant detail
```

Keep the session `.sqlite` outside the repo (e.g. `/tmp`). Note: cosmic-ray's local distributor
writes the mutated source to disk while a mutant runs and reverts it after; if a run is killed
mid-flight it can leave a stray mutation, so `git checkout -- <module>` after an aborted run.

## Results

Scored 2026-06-25 against the M5a suite. "Survivors" are mutants the tests did **not** catch.

| Module | Mutants | Survivors before | Survivors after | Gap found and fixed |
|---|---|---|---|---|
| `ports.py` | 23 | 4 (17%) | **0 (0%)** | The default pool bounds (`POOL_START`/`POOL_END` = 4300..4399) were unpinned: every test passed explicit `start`/`end`, yet `pdd.py` constructs `PortAllocator(paths.ports)` with the defaults. Added `test_default_pool_is_4300_through_4399`. |
| `manifest.py` | 177 | 106 (60%) | 86 (49%) | `find_manifests` is depth-bounded, but no test built a tree past `max_depth`, so mutating `depth + 1` survived. Added `test_find_manifests_respects_max_depth` and `test_find_manifests_skips_hidden_dirs`. |
| `registry.py` | 135 | 74 (55%) | (assessment only) | No real gap: `resolve_cwd`, `validate`, the merge precedence, `forget`, and the duplicate-port lint are all covered. The survivors are equivalent mutants and lightly-tested glue (see below). |

A property suite surfaced the first half of this story too: M5a's manifest property is what flagged
the `cmd`-consistency bug, before mutation grading ran.

## Reading the survivors

The raw survival percentages overstate weakness, for two reasons that were checked by reading the
survivors rather than trusting the count:

- **Equivalent and near-equivalent mutants.** cosmic-ray emits ~11 binary-operator variants per
  operator. For a bounded counter like `depth + 1`, mutants such as `depth * 1`, `depth ** 1`, or
  `depth | 0` are semantically identical (or differ only on inputs the bound never reaches). For
  `Path / str` joins, the arithmetic replacements (`+`, `*`, ...) raise `TypeError` only where that
  path is exercised; on untested glue they neither change a result nor get caught. These cannot be
  killed without contrived tests, which `keep-properties-honest` warns against.
- **Lightly-tested glue.** The bulk of `manifest.py`'s remaining survivors sit in
  `ManifestProvider.from_paths` (a one-line config-path read), the `discover` TTL cache, and `_scan`
  config handling, not in the `manifest_to_entry` transform (which is property-tested) or the now
  pinned scan bound. These are low-risk integration glue; pinning each would add tests with little
  defect-finding power.

The goal was to find and close genuine gaps, not to chase a target percentage.

## Deferred: `supervisor.py`

`supervisor.py` was not fully graded. Its suite includes `test_state_raw_is_race_safe_under_concurrent_stop`,
a threaded stress test; under some mutants its worker threads do not settle, and cosmic-ray's local
distributor was killed mid-run (and left a stray on-disk mutant, since reverted). The supervisor's
behavior is otherwise covered by 20+ example tests plus the M5a state-projection property
(`test_state_projection_is_total_and_live_iff_running`). A full pass (running the module's tests with
the threaded case excluded, then triaging) is left as a follow-up.
