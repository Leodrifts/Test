from abc import ABC, abstractmethod
from typing import Any


class Reporter(ABC):
    """Base class for all reporters."""

    @abstractmethod
    def handle(self, event: str, data: Any) -> None:
        """Handle an event emitted by the engine."""

    def finalize(self) -> None:
        """Hook for cleanup after the engine finishes."""
        return None
