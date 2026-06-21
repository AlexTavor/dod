"""DERISK R5 (Wave 1): a Node project speaks dod-kit/1 and is discovered, rendered, and
driven by dod identically to the Python kit — proven with a real `node` subprocess and a
real dod server. This retires the language-agnostic risk before jobsearch is rewritten on
the Node kit. See docs/derisk/wave0-kit.md (R5).
"""
import json
import shutil
import socket
import subprocess
import threading
import time
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

import pytest

from dod.app import App
from dod.server import make_handler
from tests.conftest import entry

NODE = shutil.which("node")
KIT = Path(__file__).resolve().parent.parent / "kits" / "node" / "example-counter.js"


def _free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


@pytest.mark.skipif(not NODE, reason="node not installed")
def test_node_kit_discovered_rendered_and_driven_through_dod(paths):
    port = _free_port()
    proc = subprocess.Popen([NODE, str(KIT), str(port)])
    try:
        for _ in range(100):                        # wait for the node kit to bind
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/api/meta", timeout=0.5).read()
                break
            except Exception:  # noqa: BLE001
                time.sleep(0.1)
        app = App(paths, providers=[], token="t")
        app.registry.add_local(entry("nodecounter", type="web-external", cmd=[], port=port, stop="leave"))

        # R5: dod's REAL discriminator (fetch_meta → state) resolves the Node kit to a spec
        st = app.supervisor.state(app.registry.get("nodecounter"))
        assert st["render"] == "spec"

        dod = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(app))
        threading.Thread(target=dod.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{dod.server_address[1]}"
        try:
            req = urllib.request.Request(
                base + "/api/action",
                data=json.dumps({"id": "nodecounter", "action": "add", "payload": {"n": 5}}).encode(),
                method="POST", headers={"Content-Type": "application/json", "X-Dod-Token": "t"})
            assert json.loads(urllib.request.urlopen(req, timeout=4).read())["count"] == 5
            spec = json.loads(urllib.request.urlopen(base + "/api/render?id=nodecounter", timeout=4).read())
            assert spec["panels"][0]["value"] == 5      # render reflects the action — loop closed
        finally:
            dod.shutdown()
    finally:
        proc.terminate()
        proc.wait(timeout=5)
