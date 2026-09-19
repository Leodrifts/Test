# Voice guardrail acceptance corpus

126 executable cases against `ssc_engineer.voice.guardrails.TranscriptGuardrail`.
This is the acceptance bar for any replacement: **A must all BLOCK, B must all ALLOW,
C must stay BLOCKED, D must never raise.**

## Run it

From a checkout of `Leodrifts/SSC-Race-Engineer` at `e125697` (branch
`chore/professional-baseline`), with the project installed in a venv:

```bash
cp -r guardrail_corpus <ssc-repo>/tests/
cd <ssc-repo>
PYTHONPATH=src:tests/guardrail_corpus ./.venv/bin/python tests/guardrail_corpus/corpus.py
```

It prints `REQ / OBS / OK-FAIL` per case and a per-group tally.

## Baseline on `e125697` (verified 2026-09-19, reproduced independently)

| Group | n | Requirement | Observed today | Meets bar |
|---|---|---|---|---|
| A | 60 | BLOCK | 46 ALLOW, 14 BLOCK | **14/60** |
| B | 34 | ALLOW | 31 ALLOW, 3 BLOCK | 31/34 |
| C | 18 | BLOCK | 18 BLOCK | 18/18 |
| D | 14 | never raise | 1 RAISED, 13 returned | 13/14 |

**46 live regressions, 3 live false rejects, 1 live crash** (`D01` →
`KeyError: 'position'` out of `validate()`).

Group C is clean and a replacement may not lose any of it — those 18 are what the
current design does right.

## Groups

- **A — must block, currently allowed.** Field swaps, unit swaps, rate-as-level,
  range-bound-as-point, derived numbers, P-notation, MM:SS times, negations,
  synonym and hedged imperatives, reported speech, German phrasings.
- **B — must allow.** Legitimate grounded answers. This is what stops a fix from
  degenerating into "reject everything"; a replacement that passes A by failing B
  has not worked.
- **C — must block, already blocked.** Regression guard.
- **D — must not raise.** Malformed and edge-case inputs.

Fixtures in `fixtures.py` mirror `tool_status.py::_result()` — real field names, real
`units` dicts, real `provenance`, and real `EngineerCall` / `EngineerFact` /
`EngineeringEvent` objects, with status strings copied verbatim from
`pit_operations.py`, `race_control.py` and `communication/phrases.py`.
