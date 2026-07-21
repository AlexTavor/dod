import pytest

from dod.ports import PortAllocator, claimed_ports
from tests.conftest import entry, write_local, write_registry


def test_assignment_is_stable_and_unique(paths):
    a = PortAllocator(paths.ports, start=4300, end=4399)
    p1 = a.allocate("x")
    p2 = a.allocate("y")
    assert p1 != p2
    assert a.allocate("x") == p1            # stable across calls
    # stable across a fresh allocator (persisted to disk)
    assert PortAllocator(paths.ports).allocate("x") == p1


def test_lowest_free_port_reused_after_release(paths):
    a = PortAllocator(paths.ports, start=4300, end=4301)
    p1 = a.allocate("x")           # 4300
    a.allocate("y")               # 4301
    a.release("x")
    assert a.allocate("z") == p1   # the freed slot is reused


def test_pool_exhaustion_boundary(paths):
    # boundary: a pool of exactly N slots allocates N keys, the (N+1)th raises.
    a = PortAllocator(paths.ports, start=4300, end=4301)   # N = 2
    a.allocate("k1")
    a.allocate("k2")
    with pytest.raises(RuntimeError):
        a.allocate("k3")


def test_default_pool_is_4300_through_4399(paths):
    # mutation-grading gap: every other test passes explicit start/end, so the DEFAULT pool
    # (what providers use via PortAllocator(paths.ports), e.g. pdd.py) went unpinned. This
    # nails both bounds: 100 keys fill 4300..4399 exactly, and the 101st exhausts it.
    a = PortAllocator(paths.ports)                         # no explicit bounds → defaults
    allocated = {a.allocate(f"k{i}") for i in range(100)}
    assert allocated == set(range(4300, 4400))
    with pytest.raises(RuntimeError):
        a.allocate("overflow")


# ── reserved ports: the collision the allocator could not see ──────────────────
# Regression: the allocator only avoided ports in its OWN ports.json, so a durable entry
# hard-coding a port inside the 4300-4399 pool was invisible to it and a provider entry
# could be handed a port that entry already binds. Registry._lint_ports observed the
# collision; nothing prevented it.

def test_reserved_port_is_never_allocated(paths):
    a = PortAllocator(paths.ports, start=4300, end=4302)
    assert a.allocate("k1", frozenset({4300})) == 4301


def test_reserved_at_each_pool_boundary(paths):
    # boundary: exactly the first and exactly the last port of the pool.
    lo = PortAllocator(paths.ports, start=4300, end=4302)
    assert lo.allocate("k", frozenset({4300})) == 4301

    hi = PortAllocator(paths.ports.with_name("hi.json"), start=4300, end=4302)
    hi.allocate("a")                                        # 4300
    hi.allocate("b")                                        # 4301
    with pytest.raises(RuntimeError):                       # 4302 is the only slot left, and reserved
        hi.allocate("c", frozenset({4302}))


def test_reserved_outside_the_pool_changes_nothing(paths):
    # no-op path: reserving ports the pool never hands out must not perturb allocation.
    a = PortAllocator(paths.ports, start=4300, end=4399)
    assert a.allocate("k", frozenset({80, 443, 8090, 4299, 4400})) == 4300


def test_empty_reserved_matches_the_unreserved_default(paths):
    # no-op path: the added parameter must not change behaviour when nothing is reserved.
    a = PortAllocator(paths.ports, start=4300, end=4399)
    b = PortAllocator(paths.ports.with_name("b.json"), start=4300, end=4399)
    assert a.allocate("k") == b.allocate("k", frozenset())


def test_stored_assignment_that_became_reserved_is_reassigned(paths):
    # The case that actually bit: the provider entry was allocated FIRST, then a durable
    # entry claimed the same port. Returning the stored value would leave the collision
    # standing, so a stored-but-now-reserved assignment is moved.
    a = PortAllocator(paths.ports, start=4300, end=4302)
    first = a.allocate("pdd-x-plan")
    assert first == 4300
    moved = a.allocate("pdd-x-plan", frozenset({4300}))
    assert moved != 4300
    assert a.allocate("pdd-x-plan", frozenset({4300})) == moved      # stable at its new port
    assert PortAllocator(paths.ports).assignments()["pdd-x-plan"] == moved   # and persisted


def test_reassignment_never_steals_another_key_s_port(paths):
    a = PortAllocator(paths.ports, start=4300, end=4303)
    a.allocate("keep-a")                                    # 4300
    a.allocate("keep-b")                                    # 4301
    victim = a.allocate("victim")                           # 4302
    moved = a.allocate("victim", frozenset({victim}))
    assert moved == 4303                                    # the one free slot, not a neighbour's
    assert a.assignments() == {"keep-a": 4300, "keep-b": 4301, "victim": 4303}


def test_reassignment_with_no_free_slot_raises(paths):
    # boundary: a full pool where the key's own port is the one reserved. There is nowhere
    # to move it, so this must fail loudly rather than hand back the colliding port.
    a = PortAllocator(paths.ports, start=4300, end=4302)
    a.allocate("keep-a")                                    # 4300
    a.allocate("keep-b")                                    # 4301
    victim = a.allocate("victim")                           # 4302
    with pytest.raises(RuntimeError):
        a.allocate("victim", frozenset({victim}))


# ── claimed_ports: what the allocator must treat as already taken ──────────────

def test_claimed_ports_reads_both_tiers_and_skips_terminals(paths):
    # assert-by-shape: the whole returned set against one expectation, not membership
    # probes. 4317 is durable, 4390 is local, the terminal entry binds nothing, and the
    # string port is coerced because this reads RAW json, before registry.validate runs.
    write_registry(paths, [
        entry("jobsearch", port=4317),
        entry("shell-thing", type="terminal", port=4318),
        entry("no-port"),
    ])
    write_local(paths, [
        entry("adopted", port="4390"),
        entry("flagged", port=True),
    ])
    assert claimed_ports(paths) == frozenset({4317, 4390})


def test_claimed_ports_is_empty_when_nothing_is_registered(paths):
    # no-op path: no files, nothing claimed, and no throw.
    assert claimed_ports(paths) == frozenset()


def test_claimed_ports_feeds_the_allocator(paths):
    # The end-to-end shape of the regression: a durable entry on a pool port, and the
    # allocator must route around it.
    write_registry(paths, [entry("jobsearch", port=4300)])
    a = PortAllocator(paths.ports, start=4300, end=4399)
    assert a.allocate("pdd-hoops-plan", claimed_ports(paths)) == 4301
