import json
from typing import Any, List, Dict

from .base import Reporter


class JSONReporter(Reporter):
    """Collect events and write them to a JSON file."""

    def __init__(self, filename: str = 'report.json') -> None:
        self.filename = filename
        self._events: List[Dict[str, Any]] = []

    def handle(self, event: str, data: Any) -> None:
        self._events.append({'event': event, 'data': data})

    def finalize(self) -> None:
        with open(self.filename, 'w', encoding='utf-8') as fh:
            json.dump(self._events, fh)
