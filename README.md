# Test

Basic event engine with configurable logging and pluggable reporters.

```python
from logging import configure
from engine import Engine
from reports import JSONReporter, TextReporter

configure('debug')
engine = Engine()
engine.register_reporter(TextReporter())
engine.register_reporter(JSONReporter('events.json'))
engine.emit('started', {'foo': 'bar'})
engine.finalize()
```

## Command-line interface

A simple interactive interface is provided via ``ui.py``:

```bash
python ui.py --json events.json --log-level debug
```

Type event names optionally followed by JSON data and finish with ``quit``.
