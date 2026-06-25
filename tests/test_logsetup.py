import logging

from dod.logsetup import LOGFILE, configure_logging


def test_configure_logging_is_idempotent(paths):
    first = configure_logging(paths)
    n = len(first.handlers)
    second = configure_logging(paths)
    assert second is first
    assert len(second.handlers) == n            # a second call attaches no new handlers


def test_module_logger_reaches_the_logfile(paths):
    configure_logging(paths, level="DEBUG")
    logging.getLogger("dod.registry").warning("hello from %s", "test")
    text = (paths.run / LOGFILE).read_text(encoding="utf-8")
    assert "hello from test" in text            # child logger -> shared dod handlers -> file
    assert "WARNING" in text and "dod.registry" in text


def test_level_honors_explicit_argument(paths):
    assert configure_logging(paths, level="ERROR").level == logging.ERROR


def test_level_honors_env_var(paths, monkeypatch):
    monkeypatch.setenv("DOD_LOG_LEVEL", "debug")   # resolved case-insensitively
    assert configure_logging(paths).level == logging.DEBUG
