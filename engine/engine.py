from typing import Any, List

from reports.base import Reporter


class Engine:
    """Simple event-driven engine."""

    def __init__(self) -> None:
        self.reporters: List[Reporter] = []

    # Reporter registration
    def register_reporter(self, reporter: Reporter) -> None:
        self.reporters.append(reporter)

    # Plugin registration
    def register_plugin(self, plugin: 'Plugin') -> None:  # noqa: F821
        plugin.register(self)

    # Event emission
    def emit(self, event: str, data: Any = None) -> None:
        for reporter in self.reporters:
            reporter.handle(event, data)

    def finalize(self) -> None:
        for reporter in self.reporters:
            reporter.finalize()
