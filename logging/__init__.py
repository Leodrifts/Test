from .logger import configure, get_logger, _std_logging as _stdlib

# Re-export names from the standard library logging module to minimise
# surprises when this package shadows the builtin ``logging`` module.
for _name in dir(_stdlib):
    if _name not in globals():
        globals()[_name] = getattr(_stdlib, _name)

__all__ = list(dir(_stdlib)) + ["configure", "get_logger"]
