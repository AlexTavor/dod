"""Property tests for the PortAllocator seam.

Properties are sourced from the design in ``ports.py`` (the module docstring): each logical
key gets a stable port from a fixed pool, persisted across restarts, and a new key is given
"the lowest free pool port". Each example runs against a fresh on-disk allocator so examples
do not leak state into each other.
"""
import tempfile
from pathlib import Path

import pytest
from hypothesis import given
from hypothesis import strategies as st

from dod.ports import PortAllocator

START, END = 4300, 4309
POOL = range(START, END + 1)
_key = st.text(alphabet="abcdefghijklmnopqrstuvwxyz0123456789-_", min_size=1, max_size=8)


def _alloc(d, start=START, end=END):
    return PortAllocator(Path(d) / "ports.json", start=start, end=end)


@given(keys=st.lists(_key, max_size=len(POOL), unique=True))
def test_distinct_keys_get_distinct_ports_in_range_stable_and_persisted(keys):
    with tempfile.TemporaryDirectory() as d:
        a = _alloc(d)
        ports = [a.allocate(k) for k in keys]
        assert all(START <= p <= END for p in ports)          # every port is in the pool
        assert len(set(ports)) == len(ports)                  # distinct keys never collide
        for k, p in zip(keys, ports, strict=True):
            assert a.allocate(k) == p                          # stable across calls
            assert _alloc(d).allocate(k) == p                  # stable across a fresh allocator (on disk)


@given(pre=st.lists(_key, max_size=len(POOL) - 1, unique=True))
def test_a_new_key_gets_the_lowest_free_port(pre):
    with tempfile.TemporaryDirectory() as d:
        a = _alloc(d)
        for k in pre:
            a.allocate(k)
        used = set(a.assignments().values())
        expected = min(p for p in POOL if p not in used)
        assert a.allocate("a-brand-new-key") == expected       # 15 chars: never one of `pre`


@given(keys=st.lists(_key, min_size=1, max_size=len(POOL), unique=True),
       pick=st.integers(min_value=0, max_value=1000))
def test_release_returns_the_port_to_the_pool(keys, pick):
    with tempfile.TemporaryDirectory() as d:
        a = _alloc(d)
        ports = {k: a.allocate(k) for k in keys}
        victim = keys[pick % len(keys)]
        a.release(victim)
        assert victim not in a.assignments()                   # the key is gone
        assert ports[victim] not in set(a.assignments().values())  # its port is free again


@given(pool_size=st.integers(min_value=1, max_value=25))
def test_allocation_raises_at_the_pool_exhaustion_boundary(pool_size):
    with tempfile.TemporaryDirectory() as d:
        a = _alloc(d, start=START, end=START + pool_size - 1)
        for i in range(pool_size):
            a.allocate(f"k{i}")                                # fills the pool exactly — all succeed
        with pytest.raises(RuntimeError):
            a.allocate("one-too-many")                         # the (N+1)th has no free port
