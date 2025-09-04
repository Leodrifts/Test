from typing import Protocol


class Plugin(Protocol):
    """Plugin interface allowing custom reporters to be registered."""

    def register(self, engine: 'Engine') -> None:  # noqa: F821
        """Register the plugin with the engine."""
        ...
