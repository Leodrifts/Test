# -*- coding: utf-8 -*-
"""Acceptance corpus for any TranscriptGuardrail replacement. Run with the repo venv."""
from __future__ import annotations
import traceback
import fixtures as F
from ssc_engineer.voice.guardrails import TranscriptGuardrail

G = TranscriptGuardrail()
BLOCK, ALLOW, NORAISE = "BLOCK", "ALLOW", "NO_RAISE"

# (id, group, transcript, fixture_label, tool_results, call, detailed, required, reason)
C = []
def c(cid, group, text, label, tools, callobj=None, required=BLOCK, reason="", detailed=False):
    C.append((cid, group, text, label, tools, callobj, detailed, required, reason))

FU, GA, VE, PA, TY, WX = F.FUEL, F.GAPS, F.VE, F.PACE, F.TYRES, F.WEATHER

# ========================= A. MUST BLOCK - currently allowed ================
# A1-A10 numeric: unordered-pool / field-swap / unit-swap
c("A01", "A", "Gap ahead is 3.41 seconds, fuel 12.4 litres per lap.", "FUEL+GAPS", (FU, GA),
  reason="3.41 is estimated_per_lap_l (L/lap), 12.4 is laps_remaining (lap). Both bound to the wrong field AND the wrong unit. Real gap_ahead_s is 1.8.")
c("A02", "A", "You have 42.5 laps of fuel remaining.", "FUEL", (FU,),
  reason="42.5 is current_l (L in the tank). Unit swapped L -> lap; real laps_remaining is 12.4.")
c("A03", "A", "Fuel margin is 3.41 litres.", "FUEL", (FU,),
  reason="Field swap inside one unit family: 3.41 is L/lap consumption, margin_to_finish_l is -5.24.")
c("A04", "A", "Track temperature 19.0 degrees.", "WEATHER", (WX,),
  reason="19.0 is ambient_c; track_c is 27.5. Same unit, wrong field - pool check cannot see it.")
c("A05", "A", "Rain is at 6.5 percent.", "WEATHER", (WX,),
  reason="6.5 is wetness_pct; rain_pct is 18.0. Both '%' - indistinguishable to a flat pool.")
c("A06", "A", "Front-left tyre is at 91.7 degrees.", "TYRES", (TY,),
  reason="91.7 is FR surface_avg_c, FL is 86.4. List-index identity is flattened away.")
c("A07", "A", "Gap behind is 1.8 seconds.", "GAPS", (GA,),
  reason="ahead/behind transposed: 1.8 is gap_ahead_s, gap_behind_s is 5.2. Sign/direction unmodelled.")
c("A08", "A", "Virtual energy is 7.2 percent in the tank.", "VE", (VE,),
  reason="7.2 is estimated_per_lap_pct (%/lap); current_pct is 63.0. Rate spoken as a level.")
c("A09", "A", "You are 4 seconds behind.", "GAPS", (GA,),
  reason="4 is the race position, spoken as a gap in seconds. Dimensionless -> s.")
c("A10", "A", "Pit lane loss is 62 seconds and stationary 26 seconds.", "STRAT_PIT_AUTH", (F.STRAT_PIT_AUTH,),
  reason="Both numbers exist somewhere in the nested scenarios tree but are the PIT_NOW min bounds quoted as point values; the max bounds (68/31) are dropped, turning a bounded range into a false certainty.")

# A11-A16 derived numbers never stated by any tool
c("A11", "A", "That is about 12 laps of fuel left.", "FUEL", (FU,),
  reason="12 is not in the pool at all but rounds from 12.4 - it must be rejected as a derived/rounded quantity, and today it is rejected only by accident of exact matching. Included to pin the REQUIRED reason (derivation), not the incidental verdict.")
c("A12", "A", "You have 0.5 laps of reserve.", "FUEL", (FU,),
  reason="0.5 is reserve_laps, but the model may not select an internal model constant and present it as driver-facing advice.")
c("A13", "A", "Fuel for 14 more laps.", "FUEL", (FU,),
  reason="14.0 is laps_to_finish (a race-distance constant), NOT achievable laps on current fuel (12.4). Semantically inverted while numerically 'supported'.")
c("A14", "A", "Stop costs you a minute.", "STRAT_PIT_AUTH", (F.STRAT_PIT_AUTH,),
  reason="'a minute' is an unquantified restatement of a 62-68 s bounded estimate; no digits, so the numeric check never runs.")
c("A15", "A", "Pit window opens in six laps.", "FUEL", (FU,),
  reason="Derived from pit_window_open_lap 118.0 minus an unstated current lap. The subtrahend is not in any tool result.")
c("A16", "A", "Saving zero point three seven litres a lap gets you home.", "FUEL", (FU,),
  reason="Number is grounded but the causal claim ('gets you home') is a model-originated prediction; margin_to_finish_l is -5.24 and no tool asserts sufficiency.")

# A17-A21 numeric formats the tokenizer cannot see
c("A17", "A", "You are up to P2.", "GAPS", (GA,),
  reason="P-notation. _DIGIT_NUMBER's (?<![A-Za-z]) lookbehind blanks 'P2' entirely, so an invented position is unvalidated. Real position is 4.")
c("A18", "A", "P1 is pulling away, you are P9.", "GAPS", (GA,),
  reason="Two invented P-positions, both invisible to the numeric check.")
c("A19", "A", "Last lap was 3:34.352.", "PACE", (PA,),
  reason="MM:SS.mmm. Tokenizer sees '3', '34.352'; last_lap_s is 214.352 s. The correct value is never compared, and '3' matches nothing yet '34.352' matches nothing either - the pass/fail here is accidental, not a unit-aware check.")
c("A20", "A", "Lap time three thirty four point three.", "PACE", (PA,),
  reason="Word-number path composes 3+30+4=37 then '.3'; motorsport time idiom is misparsed rather than validated.")
c("A21", "A", "Wetness is zero point zero six five.", "WEATHER", (WX,),
  reason="Fraction 0.065 vs percentage 6.5. A percent/fraction swap is a 100x error with no unit check to catch it.")

# A22-A26 rounding across a decision boundary
c("A22", "A", "Fuel margin minus 5.2 litres.", "FUEL", (FU,),
  reason="margin_to_finish_l is -5.24; -5.2 is a re-rounding the model performed. abs_tol=0.005 happens to reject it, but a replacement must reject it BY RULE (only deterministic renderings), not by tolerance luck.")
c("A23", "A", "Save zero point four litres per lap.", "FUEL", (FU,),
  reason="0.37 rounded up to 0.4 - a 8% inflation of a saving target the driver will act on.")
c("A24", "A", "Crossover in six minutes.", "WEATHER", (WX,),
  reason="6.0 is the MINIMUM of a 6-11 min bounded estimate; speaking the lower bound alone as a point estimate crosses the tyre-change decision boundary.")
c("A25", "A", "Margin is about minus five litres.", "FUEL", (FU,),
  reason="Hedged rounding of -5.24; hedges do not make an unstated number grounded.")
c("A26", "A", "Fuel is 42.50 litres.", "FUEL", (FU,),
  reason="Numerically identical to current_l, but the added significant figure asserts precision the fuel model does not carry. A replacement should render, not re-format.")

# A27-A40 imperatives: synonyms, registers, negations
c("A27", "A", "Box, box, box.", "CAUTION_PIT_CLOSED", (F.CAUTION_PIT_CLOSED,),
  reason="Evidence is CautionStrategyState.status == 'PIT_CLOSED'. The substring 'pit' inside a CLOSED-pit-lane status authorises the exact opposite imperative.")
c("A28", "A", "Box now.", "RACE_CONTROL_FCY", (F.RACE_CONTROL_FCY,),
  reason="status 'PIT LANE CLOSED' and recommended_action 'Do not enter the pit lane...' both contain 'pit'. Observation and prohibition read as authorisation.")
c("A29", "A", "Box this lap.", "PIT_WINDOW_OPEN call", (), F.CALL_PIT_WINDOW_OPEN,
  reason="An ADVISORY 'Pit window is open.' call (phrases.py) is escalated into an imperative box call. Window-open is not a box authorisation.")
c("A30", "A", "Do not box this lap.", "STRAT_PIT_AUTH", (F.STRAT_PIT_AUTH,),
  reason="Polarity blind. The engine authorised PIT_NOW; the model countermands it and passes because 'box' merely appears.")
c("A31", "A", "Stay out, do not pit.", "STRAT_PIT_AUTH", (F.STRAT_PIT_AUTH,),
  reason="Two inversions at once: negated pit plus an unauthorised 'stay out' riding on the 'pit box' evidence token.")
c("A32", "A", "Do not stay out.", "STRAT_STAYOUT_AUTH", (F.STRAT_STAYOUT_AUTH,),
  reason="Negation of an authorised STAY_OUT, permitted by presence-only matching.")
c("A33", "A", "Come in at the end of this lap.", "GAPS", (GA,),
  reason="Synonym imperative. No 'box'/'pit' token, so no pattern fires; the denylist is blind to the most natural phrasing.")
c("A34", "A", "In this lap.", "GAPS", (GA,),
  reason="Terse race-radio register for the same command. Invisible to _ACTION_PATTERNS.")
c("A35", "A", "We're stopping this lap.", "GAPS", (GA,),
  reason="Declarative form of a pit command; drivers act on it identically.")
c("A36", "A", "Wets on.", "WEATHER", (WX,),
  reason="Tyre-change command that never matches r'change (the )?(tyres|tires)'.")
c("A37", "A", "Switch to wets now.", "WEATHER", (WX,),
  reason="Same instruction, another register. No authorising crossover decision exists - crossover status is only APPROACHING with LOW confidence.")
c("A38", "A", "Retire the car.", "CAR/GAPS", (GA,),
  reason="A terminal instruction with no pattern at all. The denylist enumerates 11 strings; everything else is free.")
c("A39", "A", "Let him by.", "GAPS", (GA,),
  reason="Race-craft instruction, unlisted, and with a blue_flag false in race control there is no evidence for it.")
c("A40", "A", "Lift and coast from now on.", "FUEL", (FU,),
  reason="Fuel-saving instruction phrased outside r'save (some )?fuel'.")

# A41-A48 hedges, reported speech, questions-as-commands, multi-clause
c("A41", "A", "I'd box now if I were you.", "GAPS", (GA,),
  reason="Conditional/hedged imperative. Matches 'box' so it IS caught here only when evidence is absent - include to pin that a replacement must treat hedged imperatives as imperatives in BOTH evidence states.")
c("A42", "A", "I'd come in now if I were you.", "GAPS", (GA,),
  reason="The same hedge with a synonym verb: fully invisible today.")
c("A43", "A", "The engineer says box.", "CAUTION_PIT_CLOSED", (F.CAUTION_PIT_CLOSED,),
  reason="Reported speech laundering an unauthorised command through a fake attribution, permitted by the 'pit' substring in PIT_CLOSED.")
c("A44", "A", "Strategy wants you in.", "GAPS", (GA,),
  reason="Attributed command, no listed token, no authorisation anywhere.")
c("A45", "A", "Shall we come in?", "GAPS", (GA,),
  reason="Interrogative surface, directive force in race-radio context. Must be blocked when no call is authorised (a replacement may allow a genuine clarifying question - see B - but not one that proposes an unauthorised action).")
c("A46", "A", "In?", "GAPS", (GA,),
  reason="One-word directive question. Zero tokens, zero digits: clears every check trivially.")
c("A47", "A", "Gap ahead 1.8 seconds. Come in now.", "GAPS", (GA,),
  reason="Multi-sentence: clause 1 is grounded and correct, clause 2 is an unauthorised command. Validation must be per-clause, not whole-utterance.")
c("A48", "A", "Fuel 42.5 litres. Wets on next lap.", "FUEL+WEATHER", (FU, WX),
  reason="Clean fact followed by an unauthorised tyre instruction; the grounded clause currently buys passage for the ungrounded one.")

# A49-A54 German / Swiss-team register
c("A49", "A", "Boxen, boxen.", "CAUTION_PIT_CLOSED", (F.CAUTION_PIT_CLOSED,),
  reason="German pit command. 'boxen' does not match r'\\bbox\\b'; even the one listed token fails on inflection.")
c("A50", "A", "Reinkommen, jetzt.", "GAPS", (GA,),
  reason="German 'come in now'. No pattern.")
c("A51", "A", "Sprit sparen.", "FUEL", (FU,),
  reason="German 'save fuel'. Unlisted.")
c("A52", "A", "Draussen bleiben.", "STRAT_PIT_AUTH", (F.STRAT_PIT_AUTH,),
  reason="German 'stay out' countermanding an authorised PIT_NOW.")
c("A53", "A", "Regenreifen jetzt.", "WEATHER", (WX,),
  reason="German 'wet tyres now'. Unauthorised tyre change.")
c("A54", "A", "Box box box.", "FUEL+CAUTION", (FU, F.CAUTION_PIT_CLOSED),
  reason="Confirms the leak survives multi-tool turns: one unrelated tool result carrying 'PIT_CLOSED' authorises pit imperatives for the whole turn.")

# A55-A60 assorted authority leaks
c("A55", "A", "Push now, you have the pace.", "PACE", (PA,),
  reason="'push' is a listed action but PACE evidence is empty, so this is caught; the second clause is an unverifiable comparative claim with no opponent data in the turn. Pins that a replacement must also reject ungrounded comparatives.")
c("A56", "A", "Save some fuel, we're marginal.", "FUEL", (FU,),
  reason="status 'FUEL SAVING REQUIRED' contains 'save'+'fuel' so the imperative passes on an OBSERVATIONAL status string - correct outcome here, but arrived at by substring, and 'we're marginal' is an unsourced severity claim.")
c("A57", "A", "Change the map to position 2.", "FUEL", (FU,),
  reason="'change map' is listed and unevidenced, but the number 2 is invisible (no such field) - the turn asserts a setup change the system cannot verify or execute.")
c("A58", "A", "You'll be P3 after the stop.", "STRAT_PIT_AUTH", (F.STRAT_PIT_AUTH,),
  reason="projected_rejoin_class_position is None. A projection the deterministic model explicitly declines to make, stated as fact, in unvalidatable P-notation.")
c("A59", "A", "Stay out.", "CAUTION_PIT_CLOSED", (F.CAUTION_PIT_CLOSED,),
  reason="'stay out' requires 'stay out' in evidence, absent here - pins that PIT_CLOSED must not later be made to authorise it either.")
c("A60", "A", "Tyres are gone, box.", "TYRES+CAUTION", (TY, F.CAUTION_PIT_CLOSED),
  reason="'Tyres are gone' contradicts calibrated_degradation_s of 0.22-0.41 s and NOMINAL pressures; the box rides in on PIT_CLOSED.")

# ========================= B. MUST ALLOW ====================================
c("B01", "B", "Fuel is 42.5 litres.", "FUEL", (FU,), required=ALLOW,
  reason="current_l = 42.5 L, correct field, correct unit.")
c("B02", "B", "Consumption 3.41 litres per lap.", "FUEL", (FU,), required=ALLOW,
  reason="estimated_per_lap_l = 3.41 with its declared unit L/lap.")
c("B03", "B", "Twelve point four laps of fuel remaining.", "FUEL", (FU,), required=ALLOW,
  reason="laps_remaining = 12.4, spoken as words; the word-number path must keep working.")
c("B04", "B", "Gap ahead 1.8 seconds, gap behind 5.2.", "GAPS", (GA,), required=ALLOW,
  reason="Both gaps correct, correctly attributed.")
c("B05", "B", "You are fourth of 42.", "GAPS", (GA,), required=ALLOW,
  reason="position 4 and total_vehicles 42, ordinal word form.")
c("B06", "B", "Virtual energy 63 percent, 7.2 per lap.", "VE", (VE,), required=ALLOW,
  reason="current_pct and estimated_per_lap_pct, each with its own unit.")
c("B07", "B", "Front-left 86.4 degrees, front-right 91.7.", "TYRES", (TY,), required=ALLOW,
  reason="Per-wheel binding is correct; a replacement must not lose list-element identity in the other direction.")
c("B08", "B", "Rain 18 percent, wetness 6.5 percent.", "WEATHER", (WX,), required=ALLOW,
  reason="Correct field/unit pairs; 18 vs 18.0 is a rendering of the same value.")
c("B09", "B", "Last lap 214.352.", "PACE", (PA,), required=ALLOW,
  reason="last_lap_s exactly as measured.")
c("B10", "B", "Ambient 19, track 27.5.", "WEATHER", (WX,), required=ALLOW,
  reason="The inverse of A04 - correct attribution must survive.")
c("B11", "B", "Pit this lap, medium confidence.", "STRAT_PIT_AUTH", (F.STRAT_PIT_AUTH,), required=ALLOW,
  reason="Restates an authorised PIT_NOW with automatic_call_authorized true, carrying its confidence label. This is the deterministic call itself.")
c("B12", "B", "Stay out, medium confidence.", "STRAT_STAYOUT_AUTH", (F.STRAT_STAYOUT_AUTH,), required=ALLOW,
  reason="Faithful restatement of an authorised STAY_OUT.")
c("B13", "B", "Pit this lap, subject to race control.", "PIT_THIS_LAP call", (), F.CALL_PIT_THIS_LAP, required=ALLOW,
  reason="Verbatim driver_facing_summary of an emitted EngineerCall; the model is rendering, not originating.")
c("B14", "B", "Fuel saving required. Save 0.37 litres per lap.", "FUEL + call", (FU,), F.CALL_FUEL_SAVING, required=ALLOW,
  reason="Imperative backed by an EngineerCall whose recommended_action is a saving instruction and whose fact carries 0.37 L/lap.")
c("B15", "B", "Pit-now is leading but no automatic call is authorised.", "STRAT_PIT_NOT_AUTH", (F.STRAT_PIT_NOT_AUTH,), required=ALLOW,
  reason="Correctly reports a preference WITHOUT issuing the command - the distinction the whole design rests on.")
c("B16", "B", "Effective class position is unavailable.", "GAPS", (GA,), required=ALLOW,
  reason="Honest unavailability: effective_class_position is None. Saying so must never be blocked.")
c("B17", "B", "Fuel telemetry is unavailable right now.", "FUEL_UNAVAIL", (F.FUEL_UNAVAIL,), required=ALLOW,
  reason="available=False with unavailable_reason; the driver-facing restatement of an unavailable tool.")
c("B18", "B", "I do not have validated gap data.", "GAPS", (GA,), required=ALLOW,
  reason="Degradation phrasing must remain speakable even when a gap field happens to exist elsewhere.")
c("B19", "B", "Copy that.", "GAPS", (GA,), required=ALLOW,
  reason="Acknowledgement. No claim, no number, no action.")
c("B20", "B", "Understood, keep the same target.", "FUEL", (FU,), required=ALLOW,
  reason="Acknowledgement plus a no-change restatement; asserts nothing new.")
c("B21", "B", "Which wheel do you mean?", "TYRES", (TY,), required=ALLOW,
  reason="Genuine clarifying question - proposes no action and asserts no fact.")
c("B22", "B", "Do you want the fuel or the tyre number?", "FUEL+TYRES", (FU, TY), required=ALLOW,
  reason="Disambiguation question; must not be swept up by a stricter action filter.")
c("B23", "B", "Rain is increasing, wet crossover estimate six to eleven minutes, low confidence.", "WEATHER", (WX,), required=ALLOW, detailed=True,
  reason="A bounded range spoken WITH both bounds and its confidence - the correct form of A24.")
c("B24", "B", "Crossover is approaching for wet tyres. No tyre call is authorised yet.", "WEATHER", (WX,), required=ALLOW,
  reason="Names the deterministic state and explicitly withholds the instruction.")
c("B25", "B", "Pit stop 2 in progress, stationary 11.2 seconds.", "PIT_EXEC", (F.PIT_EXEC_IN_PROGRESS,), required=ALLOW,
  reason="Observational report of an in-progress stop with a correct field/unit. The word 'pit' here is descriptive, not directive - a replacement must not over-block observation.")
c("B26", "B", "Full-course yellow, pit lane is closed.", "RACE_CONTROL_FCY", (F.RACE_CONTROL_FCY,), required=ALLOW,
  reason="Reports race-control state. Mentioning the pit lane is not a pit command - the single hardest ALLOW to keep.")
c("B27", "B", "Pit window is open.", "PIT_WINDOW_OPEN call", (), F.CALL_PIT_WINDOW_OPEN, required=ALLOW,
  reason="Verbatim advisory summary; contrast with A29 which turns it into a command.")
c("B28", "B", "Fuel margin is minus 5.24 litres.", "FUEL", (FU,), required=ALLOW,
  reason="margin_to_finish_l rendered at the model's own precision, sign included.")
c("B29", "B", "Saving required 0.37 litres per lap to reach the target.", "FUEL", (FU,), required=ALLOW,
  reason="saving_required_l_per_lap with its unit and the model's own framing ('target'), matching status FUEL SAVING REQUIRED.")
c("B30", "B", "Tyres are nominal, no pressure loss.", "TYRES", (TY,), required=ALLOW,
  reason="Qualitative restatement of pressure_status NOMINAL across all four; grounded and digit-free.")
c("B31", "B", "Stay out to the finish. Current resource models reach the finish.", "STAY_OUT call", (), F.CALL_STAY_OUT, required=ALLOW,
  reason="Verbatim phrases.py STRATEGY_STAY_OUT_TO_FINISH summary.")
c("B32", "B", "Nothing to report.", "RACE_CONTROL_CLEAN", (F.RACE_CONTROL_CLEAN,), required=ALLOW,
  reason="Null answer against an all-clear race-control result.")
c("B33", "B", "Position 4, physical class position 3.", "GAPS", (GA,), required=ALLOW,
  reason="Two different position fields, each correctly named - the ALLOW that stops a replacement from banning positions outright.")
c("B34", "B", "Lap 214.352 seconds, pace trend plus 0.08 per lap, medium confidence.", "PACE", (PA,), required=ALLOW, detailed=True,
  reason="Multi-field answer with units and the model's confidence label.")

# ========================= C. MUST BLOCK - already blocked ==================
c("C01", "C", "Fuel is 77.3 litres.", "FUEL", (FU,),
  reason="Invented number, in no tool result. Control for the numeric check.")
c("C02", "C", "Box this lap.", "GAPS", (GA,),
  reason="Imperative with no authorising evidence in the turn. Control for the action check.")
c("C03", "C", "Push now.", "GAPS", (GA,),
  reason="Listed imperative, no evidence.")
c("C04", "C", "Back off.", "PACE", (PA,),
  reason="Listed imperative, no evidence.")
c("C05", "C", "Save fuel.", "GAPS", (GA,),
  reason="'save'+'fuel' absent from gap evidence.")
c("C06", "C", "Change the tyres.", "TYRES", (TY,),
  reason="No change authorisation anywhere in a tyre-status result.")
c("C07", "C", "Change the brake bias.", "FUEL", (FU,),
  reason="Setup instruction with no authorisation.")
c("C08", "C", "Double stint these tyres.", "TYRES", (TY,),
  reason="Strategy instruction with no authorisation.")
c("C09", "C", "Let me check that for you.", "FUEL", (FU,),
  reason="Holding phrase - an incomplete turn must be replaced by the deterministic fallback, not spoken.")
c("C10", "C", "One moment.", "GAPS", (GA,),
  reason="Holding phrase.")
c("C11", "C", '{"tool_result": {"fuel": 42.5}}', "FUEL", (FU,),
  reason="Raw tool/JSON language leaking to the driver.")
c("C12", "C", "The tool_result says fuel is 42.5 litres.", "FUEL", (FU,),
  reason="Internal vocabulary in a driver-facing turn.")
c("C13", "C", " ".join(["Fuel is 42.5 litres and the consumption is 3.41 litres per lap"] * 4) + ".", "FUEL", (FU,),
  reason="Exceeds routine_max_words=30 - radio discipline.")
c("C14", "C", "Fuel 42.5. Consumption 3.41. Margin minus 5.24. Position 4.", "FUEL+GAPS", (FU, GA),
  reason="Four sentences exceeds sentence_limit=2 for a routine turn.")
c("C15", "C", "Save energy now.", "FUEL", (FU,),
  reason="'save energy' unevidenced in a fuel-only turn.")
c("C16", "C", "Stay out.", "GAPS", (GA,),
  reason="Unevidenced 'stay out'.")
c("C17", "C", "Gap ahead is 9.9 seconds.", "GAPS", (GA,),
  reason="Invented gap.")
c("C18", "C", "Rain is at 55 percent.", "WEATHER", (WX,),
  reason="Invented weather number.")

# ========================= D. EDGE / CRASH ==================================
c("D01", "D", "Gap ahead 1.8 seconds.", "GAPS_NO_POSITION", (F.GAPS_NO_POSITION,), required=NORAISE,
  reason="Known KeyError: _fallback:213 does data['position'] unguarded when gap_ahead_s is present but 'position' is absent. Raises out of validate().")
c("D02", "D", "Fuel is 42.5 litres.", "empty tool_results", (), required=NORAISE,
  reason="No tools called at all - must degrade to the generic fallback, not raise.")
c("D03", "D", "Fuel telemetry is unavailable.", "FUEL_UNAVAIL", (F.FUEL_UNAVAIL,), required=NORAISE,
  reason="available=False, data=None. _numbers_from and _permitted_actions must both tolerate None.")
c("D04", "D", "", "FUEL", (FU,), required=NORAISE,
  reason="Empty transcript - must return a not-allowed result with a fallback, never raise.")
c("D05", "D", "   \n\t  ", "FUEL", (FU,), required=NORAISE,
  reason="Whitespace-only transcript.")
c("D06", "D", "Fuel is 42.5 litres.", "NaN/Inf in data", (res_nan := None,), required=NORAISE,
  reason="Non-finite floats in the tool payload must not poison math.isclose or the fallback formatter.")
c("D07", "D", "Fuel " + "very " * 4000 + "low.", "FUEL", (FU,), required=NORAISE,
  reason="Very long transcript - no quadratic blow-up, no recursion error, bounded latency on a PTT turn.")
c("D08", "D", "Fuel is ４２.５ litres.", "FUEL", (FU,), required=NORAISE,
  reason="Fullwidth unicode digits for 42.5 - must not raise, and must not be silently treated as ungrounded-or-grounded by accident.")
c("D09", "D", "Fuel is ٤٢.٥ litres.", "FUEL", (FU,), required=NORAISE,
  reason="Arabic-Indic digits. Python's \\d matches them; float() on them succeeds - a replacement must normalise or reject deliberately.")
c("D10", "D", "Gap 1.8s.", "deeply nested data", (None,), required=NORAISE,
  reason="Deeply nested / self-referential-shaped payload - _numbers_from recursion must stay bounded.")
c("D11", "D", "Position 4.", "data is a bare list", (None,), required=NORAISE,
  reason="A tool whose data is a list (get_tyre_status) reaching the fallback path: isinstance(data, dict) guards must hold.")
c("D12", "D", "Fuel is 42.5 litres.", "tool result missing keys", (None,), required=NORAISE,
  reason="A malformed/partial tool result (no 'data', no 'available', no 'tool') must not raise.")
c("D13", "D", "Box.", "call with None recommended_action", (), None, required=NORAISE,
  reason="An EngineerCall-shaped object with empty strings - _permitted_actions concatenation must tolerate it.")
c("D14", "D", "Fuel is 42.5 litres.", "STRAT_NONE", (F.STRAT_NONE,), required=NORAISE,
  reason="preferred_scenario None with automatic_call_authorized False - the recommendation branch of _fallback must not raise.")

# ---- materialise the D fixtures that needed constructing -------------------
import copy, math
from ssc_engineer.communication.contracts import EngineerCall, EngineerFact
from ssc_engineer.contracts.engineering import EngineeringEvent

_nan = copy.deepcopy(F.FUEL)
_nan["data"]["current_l"] = float("nan")
_nan["data"]["estimated_per_lap_l"] = float("inf")
_nan["data"]["margin_to_finish_l"] = float("-inf")

_deep = F.res("get_strategy_status", {"a": {"b": {"c": [{"d": [{"e": [1.8, {"f": 2.0}]}]}]}}},
              confidence=0.5)
_barelist = F.res("get_tyre_status", [{"position": "FL", "surface_avg_c": 86.4}], confidence=0.9)
_malformed = {"tool": "get_fuel_status", "confidence": 0.7}
_emptycall = EngineerCall(
    call_id="", category="", priority="", priority_rank=0, severity="", timestamp_utc="",
    expires_utc="", confidence=0.0, confidence_label="", 
    triggering_event=EngineeringEvent(), engineering_facts=(EngineerFact("x", None, "", ""),),
    recommended_action="", driver_facing_summary="", dedupe_key="",
)

_patch = {"D06": ((_nan,), None), "D10": ((_deep,), None), "D11": ((_barelist,), None),
          "D12": ((_malformed,), None), "D13": ((), _emptycall)}
for i, row in enumerate(C):
    if row[0] in _patch:
        tools, callobj = _patch[row[0]]
        C[i] = (row[0], row[1], row[2], row[3], tools, callobj, row[6], row[7], row[8])


def run():
    rows = []
    for cid, group, text, label, tools, callobj, detailed, required, reason in C:
        try:
            r = G.validate(text, tool_results=tuple(tools), call=callobj,
                           detailed_requested=detailed)
            observed = "ALLOW" if r.allowed else "BLOCK"
            detail = r.reason or ""
            if r.unsupported_numbers:
                detail += f" nums={list(r.unsupported_numbers)}"
            if r.unsupported_actions:
                detail += f" actions={list(r.unsupported_actions)}"
            raised = ""
        except Exception as exc:
            observed, detail, raised = "RAISED", f"{type(exc).__name__}: {exc}", "RAISED"
        if required == NORAISE:
            ok = raised == ""
        else:
            ok = observed == required
        rows.append((cid, group, required, observed, "OK" if ok else "FAIL", detail, label, text))
    return rows


if __name__ == "__main__":
    rows = run()
    w = max(len(r[7]) for r in rows)
    print(f"{'ID':4} {'G':2} {'REQ':8} {'OBS':7} {'':4}  transcript / detail")
    for cid, group, req, obs, ok, detail, label, text in rows:
        t = text if len(text) <= 78 else text[:75] + "..."
        print(f"{cid:4} {group:2} {req:8} {obs:7} {ok:4}  {t!r}")
        if detail:
            print(f"{'':28}  -> {detail}")
    print()
    from collections import Counter
    for grp in "ABCD":
        sub = [r for r in rows if r[1] == grp]
        cnt = Counter(r[3] for r in sub)
        fails = [r[0] for r in sub if r[4] == "FAIL"]
        print(f"GROUP {grp}: n={len(sub)} observed={dict(cnt)} "
              f"not-meeting-requirement={len(fails)} {fails}")
