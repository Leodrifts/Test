"""Realistic tool_result / EngineerCall fixtures mirroring tool_status.py::_result()."""
from __future__ import annotations
from typing import Any

from ssc_engineer.communication.contracts import EngineerCall, EngineerFact
from ssc_engineer.contracts.engineering import EngineeringEvent, EngineeringMeasurement

NOW = "2026-09-19T13:45:12.300+00:00"


def res(tool: str, data: Any, *, confidence: float, units: dict[str, str] | None = None,
        provenance: tuple[str, ...] = ("EngineerContext",), available: bool = True,
        unavailable_reason: str | None = None) -> dict[str, Any]:
    return {
        "tool": tool,
        "timestamp_utc": NOW,
        "data_timestamp_utc": NOW,
        "freshness_s": 0.21,
        "simulator": "lmu",
        "operating_mode": "RACE",
        "unavailable_fields": [],
        "confidence": confidence,
        "units": units or {},
        "provenance": list(provenance),
        "available": available,
        "unavailable_reason": unavailable_reason,
        "data": data if available else None,
    }


# --- get_fuel_status -------------------------------------------------------
FUEL_UNITS = {"current_l": "L", "estimated_per_lap_l": "L/lap",
              "target_margin_l": "L", "saving_required_l_per_lap": "L/lap"}
FUEL_DATA = {
    "current_l": 42.5, "estimated_per_lap_l": 3.41, "stint_average_l": 3.38,
    "session_average_l": 3.44, "last_lap_l": 3.52, "stint_sample_count": 7,
    "session_sample_count": 31, "laps_remaining": 12.4, "laps_to_finish": 14.0,
    "required_to_finish_l": 47.74, "margin_to_finish_l": -5.24, "reserve_laps": 0.5,
    "source": "STINT_ROLLING", "confidence": "MEDIUM", "rolling_average_l": 3.40,
    "rolling_stddev_l": 0.06, "projected_stint_laps": 12.4, "projected_usable_laps": 11.9,
    "pit_window_open_lap": 118.0, "pit_window_close_lap": 124.0, "reserve_l": 1.70,
    "target_laps": 14.0, "target_required_l": 47.74, "target_margin_l": -5.24,
    "saving_required_l_per_lap": 0.37, "status": "FUEL SAVING REQUIRED",
}
FUEL = res("get_fuel_status", FUEL_DATA, confidence=0.7, units=FUEL_UNITS,
           provenance=("SessionTracker fuel model",))

FUEL_UNAVAIL = res("get_fuel_status", None, confidence=0.25, units=FUEL_UNITS,
                   provenance=("SessionTracker fuel model",), available=False,
                   unavailable_reason="No accepted fuel-consumption lap")

# --- get_virtual_energy_status --------------------------------------------
VE = res("get_virtual_energy_status", {
    "current_pct": 63.0, "estimated_per_lap_pct": 7.2, "predicted_stint_margin_pct": 4.5,
    "applicable": True, "confidence": "HIGH", "status": "ON TARGET",
    "stint_sample_count": 9, "laps_remaining": 8.75,
}, confidence=0.9, units={"current_pct": "%", "estimated_per_lap_pct": "%/lap",
                          "predicted_stint_margin_pct": "%"},
   provenance=("SessionTracker virtual-energy model",))

# --- get_position_and_gaps -------------------------------------------------
GAPS_UNITS = {"gap_ahead_s": "s", "gap_behind_s": "s",
              "effective_gap_ahead_s": "s", "effective_gap_behind_s": "s"}
GAPS_DATA = {
    "position": 4, "physical_overall_position": 4, "physical_class_position": 3,
    "effective_class_position": None, "projected_rejoin_class_position": None,
    "effective_gap_ahead_s": None, "effective_gap_behind_s": None,
    "effective_position_status": "UNAVAILABLE", "effective_position_confidence": "UNAVAILABLE",
    "effective_position_assumptions": [], "total_vehicles": 42,
    "gap_ahead_s": 1.8, "gap_behind_s": 5.2, "gaps_available": True,
    "gap_unavailable_reason": None,
}
GAPS = res("get_position_and_gaps", GAPS_DATA, confidence=0.95, units=GAPS_UNITS,
           provenance=("LMU player gap telemetry", "PitCycleModel"))

# gaps present, 'position' key absent -> known _fallback KeyError
GAPS_NO_POSITION = res("get_position_and_gaps",
                       {k: v for k, v in GAPS_DATA.items() if k != "position"},
                       confidence=0.95, units=GAPS_UNITS)

# --- get_pace_status -------------------------------------------------------
PACE = res("get_pace_status", {
    "last_lap_s": 214.352, "last_valid_lap_s": 214.352,
    "normalized_pace_trend_s_per_lap": 0.08, "normalized_confidence": "MEDIUM",
    "lap_validity": "VALID", "status": "STABLE",
    "interpretation": "Normalized pace is stable within the accepted band",
}, confidence=0.8, units={"last_lap_s": "s", "normalized_pace_trend_s_per_lap": "s/lap"},
   provenance=("SessionTracker pace model",))

# --- get_tyre_status -------------------------------------------------------
TYRES = res("get_tyre_status", [
    {"position": "FL", "compound": "SOFT", "surface_avg_c": 86.4,
     "temperature_trend_c_per_min": 1.2, "raw_wear": 0.93, "calibrated_degradation_s": 0.35,
     "pressure_status": "NOMINAL", "pressure_kpa": 165.0, "thermal_data_valid": True},
    {"position": "FR", "compound": "SOFT", "surface_avg_c": 91.7,
     "temperature_trend_c_per_min": 2.1, "raw_wear": 0.91, "calibrated_degradation_s": 0.41,
     "pressure_status": "NOMINAL", "pressure_kpa": 166.0, "thermal_data_valid": True},
    {"position": "RL", "compound": "SOFT", "surface_avg_c": 84.9,
     "temperature_trend_c_per_min": 0.7, "raw_wear": 0.95, "calibrated_degradation_s": 0.22,
     "pressure_status": "NOMINAL", "pressure_kpa": 163.0, "thermal_data_valid": True},
    {"position": "RR", "compound": "SOFT", "surface_avg_c": 88.2,
     "temperature_trend_c_per_min": 1.0, "raw_wear": 0.94, "calibrated_degradation_s": 0.28,
     "pressure_status": "NOMINAL", "pressure_kpa": 164.0, "thermal_data_valid": True},
], confidence=0.9, units={"surface_avg_c": "C", "temperature_trend_c_per_min": "C/min",
                          "raw_wear": "opaque LMU signal", "calibrated_degradation_s": "s"},
   provenance=("SessionTracker tyre state", "Tyre calibration registry"))

# --- get_weather_status ----------------------------------------------------
WEATHER = res("get_weather_status", {
    "ambient_c": 19.0, "track_c": 27.5, "rain_pct": 18.0, "wetness_pct": 6.5,
    "condition": "LIGHT RAIN", "wind_mps": 3.2,
    "rain_trend": "INCREASING", "wetness_trend": "WORSENING", "confidence": "MEDIUM",
    "crossover": {"status": "APPROACHING", "target": "WET TYRE",
                  "estimated_min_minutes": 6.0, "estimated_max_minutes": 11.0,
                  "confidence": "LOW"},
    "recommended_action": "Monitor grip and the bounded crossover estimate.",
}, confidence=0.7, units={"ambient_c": "C", "track_c": "C", "rain_pct": "%",
                          "wetness_pct": "%", "wind_mps": "m/s",
                          "crossover.estimated_min_minutes": "min",
                          "crossover.estimated_max_minutes": "min"},
   provenance=("WeatherModel time-based regression", "LMU scoring environment"))

# --- get_strategy_status ---------------------------------------------------
def _strategy(preferred: str | None, authorized: bool, rationale: str,
              confidence_label: str = "MEDIUM") -> dict[str, Any]:
    return res("get_strategy_status", {
        "fuel_margin_l": -5.24, "fuel_saving_l_per_lap": 0.37, "ve_margin_pct": 4.5,
        "pit_window_open_lap": 118.0, "pit_window_close_lap": 124.0,
        "pit_service": {"current_lane_time_s": 41.2, "current_stationary_time_s": 28.5},
        "pit_cycle": {"expected_green_pit_loss_min_s": 62.0,
                      "expected_green_pit_loss_max_s": 68.0,
                      "recommendation": "NO MODELED PIT-LOSS ADVANTAGE",
                      "effective_position": {"effective_gap_ahead_s": None,
                                             "effective_gap_behind_s": None}},
        "scenarios": {
            "scenarios": {
                "PIT_NOW": {"status": "AVAILABLE", "expected_total_effect_min_s": 60.0,
                            "expected_total_effect_max_s": 72.0, "fuel_margin_l": 9.6,
                            "pit_lane_loss_min_s": 62.0, "pit_lane_loss_max_s": 68.0,
                            "stationary_time_min_s": 26.0, "stationary_time_max_s": 31.0,
                            "virtual_energy_margin_pct": 12.0},
                "STAY_OUT": {"status": "AVAILABLE", "expected_total_effect_min_s": 0.0,
                             "expected_total_effect_max_s": 14.0, "fuel_margin_l": -5.24,
                             "virtual_energy_margin_pct": 4.5},
            },
            "recommendation": {
                "preferred_scenario": preferred,
                "automatic_call_authorized": authorized,
                "confidence": confidence_label,
                "rationale": rationale,
                "main_uncertainty": None if preferred else "Pit-loss calibration is incomplete",
            },
        },
    }, confidence=0.7, units={"fuel_margin_l": "L", "fuel_saving_l_per_lap": "L/lap",
                              "ve_margin_pct": "%",
                              "pit_service.current_lane_time_s": "s",
                              "pit_cycle.expected_green_pit_loss_min_s": "s"},
       provenance=("Deterministic fuel and VE strategy state", "PitServiceModel and PitCycleModel",
                   "StrategyScenarioEngine bounded deterministic comparison"))


STRAT_PIT_AUTH = _strategy("PIT_NOW", True, "Fuel range does not support another lap.")
STRAT_STAYOUT_AUTH = _strategy("STAY_OUT", True, "Resource models reach the finish.")
STRAT_PIT_NOT_AUTH = _strategy("PIT_NOW", False, "Pit-loss calibration is incomplete.")
STRAT_NONE = _strategy(None, False, "Deterministic scenario evidence is incomplete.")

# --- get_caution_strategy (status literally contains 'PIT') ----------------
CAUTION_PIT_CLOSED = res("get_caution_strategy", {
    "calculation_id": "caution-0007", "timestamp_utc": NOW,
    "status": "PIT_CLOSED", "caution_active": True, "pit_lane_status": "CLOSED",
    "pits_confirmed_open": False,
    "green_pit_loss_min_s": 62.0, "green_pit_loss_max_s": 68.0,
    "caution_pit_loss_min_s": None, "caution_pit_loss_max_s": None,
    "modeled_saving_min_s": None, "modeled_saving_max_s": None,
    "free_stop_threshold_s": None, "fuel_extension_status": "UNAVAILABLE",
    "tyre_opportunity": "UNAVAILABLE", "driver_change_opportunity": "UNAVAILABLE",
    "effective_position_effect": "UNAVAILABLE", "queue_restart_risk": "UNQUANTIFIED",
    "recommendation": "DO NOT ENTER: LMU reports the pit lane closed",
    "confidence": "MEDIUM",
}, confidence=0.7, units={"green_pit_loss_min_s": "s", "green_pit_loss_max_s": "s"},
   provenance=("PitCycleModel", "RaceControlModel"))

# --- get_pit_execution_status ---------------------------------------------
PIT_EXEC_IN_PROGRESS = res("get_pit_execution_status", {
    "execution_id": "exec-0002", "timestamp_utc": NOW, "status": "IN_PROGRESS",
    "phase": "PIT_STOPPED", "stop_number": 2, "box_lap_status": "PIT ENTRY OBSERVED",
    "expectation": {"stop_number": 2, "expected_fuel_min_l": 46.0, "expected_fuel_max_l": 50.0},
    "current_lane_time_s": 18.4, "current_stationary_time_s": 11.2,
    "observed_fuel_added_l": 48.0, "observed_virtual_energy_added_pct": 62.0,
    "observed_compounds": ["SOFT", "SOFT", "SOFT", "SOFT"], "observed_driver": "M. Sehe",
    "limiter_active": True, "abnormal_delay": False, "confidence": "HIGH",
    "pit_box_countdown_status": "UNAVAILABLE: no validated pit-box distance/countdown source",
    "automatic_pit_menu_control": False,
    "exact_summary": "Pit stop 2 in progress; lane time 18.4 seconds, stationary 11.2 seconds, fuel added 48.0 litres.",
    "model_version": "pit-execution-v1",
}, confidence=0.9, units={"current_lane_time_s": "s", "current_stationary_time_s": "s",
                          "observed_fuel_added_l": "L", "observed_virtual_energy_added_pct": "%"},
   provenance=("PitServiceModel", "Approved RacePlan", "PitOperationsModel"))

# --- get_race_control_status ----------------------------------------------
RACE_CONTROL_FCY = res("get_race_control_status", {
    "full_course_yellow": True, "local_yellow": False, "blue_flag": False,
    "disqualified": False, "pit_lane_status": "CLOSED",
    "penalties": {"outstanding_count": 0, "items": []},
    "status": "PIT LANE CLOSED",
    "recommended_action": "Do not enter the pit lane unless race control requires it.",
}, confidence=0.95, provenance=("LMU race control state",))

RACE_CONTROL_CLEAN = res("get_race_control_status", {
    "full_course_yellow": False, "local_yellow": False, "blue_flag": False,
    "disqualified": False, "pit_lane_status": "OPEN",
    "penalties": {"outstanding_count": 0, "items": []},
}, confidence=0.95, provenance=("LMU race control state",))

# --- EngineerCall fixtures -------------------------------------------------
def call(code: str, summary: str, action: str, facts: tuple[EngineerFact, ...],
         measurements: tuple[EngineeringMeasurement, ...] = (),
         category: str = "STRATEGY", severity: str = "WARNING") -> EngineerCall:
    event = EngineeringEvent(
        sequence=41, code=code, category=category, severity=severity,
        transition="EVENT", title=code.replace("_", " "), timestamp_utc=NOW,
        explanation=summary, recommended_action=action, measurements=measurements,
        raised_utc=NOW,
    )
    return EngineerCall(
        call_id="call-0041", category=category, priority="HIGH", priority_rank=2,
        severity=severity, timestamp_utc=NOW, expires_utc=NOW, confidence=0.78,
        confidence_label="MEDIUM", triggering_event=event, engineering_facts=facts,
        recommended_action=action, driver_facing_summary=summary,
        dedupe_key=f"{code}|1",
    )


CALL_PIT_THIS_LAP = call(
    "STRATEGY_PIT_THIS_LAP",
    "Pit this lap, subject to race control. Resource range does not support another lap.",
    "Pit this lap.",
    (EngineerFact("Fuel margin", -5.24, "L", "strategy_model"),
     EngineerFact("Laps remaining", 12.4, "lap", "strategy_model")),
    (EngineeringMeasurement("fuel_margin_l", -5.24, "L"),),
)

CALL_PIT_WINDOW_OPEN = call(
    "STRATEGY_PIT_WINDOW_OPEN",
    "Pit window is open.",
    "Pit when strategically suitable.",
    (EngineerFact("Pit window opens", 118.0, "lap", "strategy_model"),
     EngineerFact("Pit window closes", 124.0, "lap", "strategy_model")),
    severity="ADVISORY",
)

CALL_FUEL_SAVING = call(
    "FUEL_SAVING_REQUIRED",
    "Fuel saving required. Save 0.37 L/lap.",
    "Lift and coast into the slow corners.",
    (EngineerFact("Saving required", 0.37, "L/lap", "fuel_model"),
     EngineerFact("Fuel margin", -5.24, "L", "fuel_model")),
    (EngineeringMeasurement("saving_required_l_per_lap", 0.37, "L/lap"),),
    category="FUEL",
)

CALL_STAY_OUT = call(
    "STRATEGY_STAY_OUT_TO_FINISH",
    "Stay out to the finish. Current resource models reach the finish.",
    "Stay out.",
    (EngineerFact("Fuel margin", 2.1, "L", "strategy_model"),),
)
