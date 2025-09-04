from typing import Any

from .base import Reporter
from logging.logger import get_logger


class TextReporter(Reporter):
    """Log engine events as plain text."""

    def __init__(self, logger=None) -> None:
        self.logger = logger or get_logger(__name__)

    def handle(self, event: str, data: Any) -> None:
        self.logger.info(f"{event}: {data}")
