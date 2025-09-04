import importlib.util
import os
from typing import Optional

# Load the standard library logging module explicitly to avoid name clashes
_stdlib_dir = os.path.dirname(os.__file__)
_logging_path = os.path.join(_stdlib_dir, 'logging', '__init__.py')
_spec = importlib.util.spec_from_file_location('stdlib_logging', _logging_path)
_std_logging = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_std_logging)  # type: ignore

LOG_LEVELS = {
    'critical': _std_logging.CRITICAL,
    'error': _std_logging.ERROR,
    'warning': _std_logging.WARNING,
    'info': _std_logging.INFO,
    'debug': _std_logging.DEBUG,
}


def _resolve_level(level: Optional[str]) -> int:
    """Resolve a textual level into a logging level constant."""
    if level is None:
        return _std_logging.INFO
    if isinstance(level, int):
        return level
    return LOG_LEVELS.get(str(level).lower(), _std_logging.INFO)


def configure(level: Optional[str] = None) -> _std_logging.Logger:
    """Configure root logging.

    Level may be provided as a string or resolved from the ``LOG_LEVEL``
    environment variable. Returns the configured root logger.
    """
    if level is None:
        level = os.getenv('LOG_LEVEL', 'info')
    _std_logging.basicConfig(
        level=_resolve_level(level),
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    return _std_logging.getLogger()


def get_logger(name: Optional[str] = None, level: Optional[str] = None) -> _std_logging.Logger:
    """Return a logger with optional level override."""
    logger = _std_logging.getLogger(name)
    if level is not None:
        logger.setLevel(_resolve_level(level))
    return logger
