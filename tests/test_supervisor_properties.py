"""Property tests for the supervisor's state projection.

``Supervisor.state`` projects a detailed liveness state onto the user-facing model: a top-level
``status`` (live | stopped) and a ``last_stop_reason``. The projection must be TOTAL (every state
string maps to exactly one status, never crashing) and must report "live" exactly for the states
that mean "running". The live set is restated here from the design, independently of
``supervisor.LIVE_STATES``, so a drift between the two is caught.
"""
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from tests.conftest import entry

DESIGN_LIVE = frozenset({"ready", "external", "starting", "unhealthy", "launched", "running"})
DESIGN_DEAD = frozenset({"stopped", "crashed", "port-busy-foreign", "archived"})
_state = st.one_of(st.sampled_from(sorted(DESIGN_LIVE | DESIGN_DEAD)), st.text(max_size=12))


@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(state=_state, exit_code=st.one_of(st.none(), st.integers(min_value=-9, max_value=255)))
def test_state_projection_is_total_and_live_iff_running(sup, monkeypatch, state, exit_code):
    monkeypatch.setattr(sup, "_state_raw", lambda e: {"id": e["id"], "state": state, "exit": exit_code})
    out = sup.state(entry("d1"))
    assert out["status"] in ("live", "stopped")                  # totality: always one of the two
    assert (out["status"] == "live") == (state in DESIGN_LIVE)   # live iff a running state
    if out["status"] == "live":
        assert out["last_stop_reason"] is None                   # a live dashboard carries no stop reason
