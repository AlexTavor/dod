import pytest

from dod.ports import PortAllocator


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
