"""atomic_write under the concurrency dod actually runs at.

dod is a threaded daemon: the sampler thread and every ThreadingHTTPServer handler thread
reach ``registry.load`` → ``PortAllocator.allocate`` → ``write_json(ports.json)``. So
"atomic" here has to mean atomic against a *concurrent writer*, not just against a reader.
"""
import threading

from dod.util import atomic_write, load_json, write_json


def test_concurrent_writers_all_succeed(tmp_path):
    """Six threads writing one path must all complete.

    With a single shared ``<name>.tmp``, the first ``os.replace`` consumed the temp out from
    under everyone else and the losers raised ``FileNotFoundError`` — which ``registry.load``
    read as "provider failed" and turned into a tick with no dashboards at all.
    """
    target = tmp_path / "ports.json"
    errors: list[Exception] = []

    def hammer(n: int) -> None:
        for i in range(50):
            try:
                write_json(target, {"assignments": {f"k{n}": 4300 + i}})
            except Exception as e:  # noqa: BLE001 — the point of the test is that none happen
                errors.append(e)

    threads = [threading.Thread(target=hammer, args=(n,)) for n in range(6)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert errors == []
    assert load_json(target)          # …and the file that survived is complete, readable JSON


def test_write_leaves_no_temp_behind(tmp_path):
    write_json(tmp_path / "a.json", {"x": 1})
    assert [p.name for p in tmp_path.iterdir()] == ["a.json"]


def test_reader_never_sees_a_partial_file(tmp_path):
    """The original guarantee, unchanged: a replaced file is whole or absent, never half."""
    target = tmp_path / "a.json"
    write_json(target, {"x": 1})
    atomic_write(target, '{"x": 2}')
    assert load_json(target) == {"x": 2}
