# Conventions (dod)

Rules for anyone changing this codebase, human or agent. Short by design; add a rule only
when a real slip motivates one.

## Code

- **Data-by-key is a map, never an if/elif/switch chain.** When code maps a constant key to a
  constant value (verb→label, tone→color, code→message), use a declarative lookup table — a TS
  `Record<K, V>` or a Python `dict` — with an explicit fallback (`WORDS[key] ?? WORDS.default`),
  not a chain of `if`s. Reference: `frontend/src/dashkit/dk-wordcloud.ts` (`TONE`). An if-chain is
  an imperative restatement of a table, and its unit test then mirrors the data key-by-key — a
  tautology that adds no safety, only maintenance. With a map the data is self-evident and the
  only thing left to test is the fallback. Scope: this is *data-by-key* (key → constant value).
  Behavior-dispatch (key → handler / different code, e.g. the route table in `server.py` and the
  command table in `cli.py`) and projections that carry a computed predicate or a dynamic value
  (e.g. `status.ts` `statusWord`, whose crash label interpolates an exit code) stay a
  case-by-case judgment.

- **Runtime is stdlib-only (Python).** No runtime dependencies: an always-on daemon should have
  nothing to resolve at boot, so the core is `TypedDict` + dataclasses, not pydantic. Dev/test
  deps (pytest, ruff, mypy) and frontend dev deps (Lit, Vite, Vitest) are fine. The web UI is
  built dev-time (`cd frontend && npm run build:web`) and the bundle is committed to
  `src/dod/web/`; the daemon serves it statically.
