import json

from dod.__main__ import _init
from dod.config import EXAMPLE_REGISTRY, PKG_DIR


def test_example_registry_is_packaged():
    # atlas R3: the example `dod init` seeds from must live inside the package so it ships in
    # the wheel (a repo-root path is absent once pip-installed). Verified end-to-end against a
    # clean wheel install; this pins the invariant cheaply in CI.
    assert EXAMPLE_REGISTRY.exists()
    assert EXAMPLE_REGISTRY.is_relative_to(PKG_DIR)
    assert json.loads(EXAMPLE_REGISTRY.read_text(encoding="utf-8")).get("entries")


def test_init_seeds_from_the_example(paths):
    # `dod init` on a fresh home copies the example verbatim, not an empty registry.
    assert _init(paths) == 0
    assert json.loads(paths.registry.read_text()) == json.loads(EXAMPLE_REGISTRY.read_text())


def test_init_leaves_an_existing_registry_alone(paths):
    # no-op path: init must never overwrite a registry that already exists.
    paths.registry.write_text('{"entries": [{"id": "mine"}]}', encoding="utf-8")
    before = paths.registry.read_text()
    assert _init(paths) == 0
    assert paths.registry.read_text() == before
