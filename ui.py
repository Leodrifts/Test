import argparse
import json
from typing import Any

from logging import configure
from engine import Engine
from reports import JSONReporter, TextReporter


def _parse_line(line: str) -> tuple[str, Any]:
    """Split an input line into an event name and optional data.

    Data is parsed as JSON if possible; otherwise it is returned as a raw
    string. If no data is provided, ``None`` is returned.
    """
    if not line:
        return "", None
    if " " not in line:
        return line, None
    event, data_str = line.split(" ", 1)
    try:
        return event, json.loads(data_str)
    except json.JSONDecodeError:
        return event, data_str


def main() -> None:
    parser = argparse.ArgumentParser(description="Interact with the engine")
    parser.add_argument(
        "--json",
        dest="json_path",
        help="Write events to the given JSON file",
    )
    parser.add_argument(
        "--log-level",
        default="info",
        help="Logging level for the built-in logger",
    )
    args = parser.parse_args()

    configure(args.log_level)
    engine = Engine()
    engine.register_reporter(TextReporter())
    if args.json_path:
        engine.register_reporter(JSONReporter(args.json_path))

    print("Enter events as 'event [JSON_data]' (type 'quit' to exit)")
    while True:
        try:
            line = input("> ").strip()
        except EOFError:
            break
        if line.lower() in {"quit", "exit"}:
            break
        event, data = _parse_line(line)
        if event:
            engine.emit(event, data)
    engine.finalize()


if __name__ == "__main__":
    main()
