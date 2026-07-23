"""planspec: a PDD plan dict -> a dashkit spec. Pure, so every case is a value comparison."""
from __future__ import annotations

import json
from typing import Any

import pytest

from dod.plankit import render_for
from dod.planspec import (
    critical_units,
    cycle_nodes,
    dag_nodes,
    dangling_deps,
    items_of,
    max_concurrency,
    ready_ids,
    spec_from_plan,
    status_word,
)


def item(iid: str, **kw: Any) -> dict[str, Any]:
    return {"id": iid, "title": f"unit {iid}", "status": "pending", "depends_on": [], **kw}


def panels_of(spec: dict[str, Any], kind: str) -> list[dict[str, Any]]:
    return [p for p in spec["panels"] if p["type"] == kind]


class TestStatusWord:
    @pytest.mark.parametrize(("given", "want"), [
        ("pending", "queued"), ("PENDING", "queued"), (" done ", "done"),
        ("landed", "done"), ("in_progress", "in-progress"), ("blocked", "blocked"),
    ])
    def test_maps_known_words(self, given: str, want: str) -> None:
        assert status_word(given) == want

    @pytest.mark.parametrize("given", ["claimed", "waiting_contention", "", None])
    def test_passes_unknown_through_rather_than_guessing(self, given: Any) -> None:
        # The atom treats an unrecognised word as neither finished nor startable. Inventing a
        # mapping here would launder an unknown state into a confident one.
        assert status_word(given) not in ("queued", "done", "green")


class TestItemsOf:
    def test_reads_a_normal_plan(self) -> None:
        assert items_of({"items": [item("a"), item("b")]}) == [item("a"), item("b")]

    @pytest.mark.parametrize("plan", [
        {}, {"items": None}, {"items": "nope"}, {"items": {}},
    ])
    def test_tolerates_a_missing_or_malformed_items_field(self, plan: dict[str, Any]) -> None:
        assert items_of(plan) == []

    def test_drops_entries_with_no_id(self) -> None:
        assert items_of({"items": [item("a"), {"title": "no id"}, "junk", None]}) == [item("a")]


class TestGraphHealth:
    def test_reports_a_dependency_on_a_unit_that_does_not_exist(self) -> None:
        items = [item("a"), item("b", depends_on=["a", "ghost"])]
        assert dangling_deps(items) == [("b", "ghost")]

    def test_no_dangling_deps_in_a_sound_plan(self) -> None:
        assert dangling_deps([item("a"), item("b", depends_on=["a"])]) == []

    def test_finds_the_units_trapped_in_a_cycle(self) -> None:
        items = [item("a"), item("b", depends_on=["c"]), item("c", depends_on=["b"])]
        assert cycle_nodes(items) == ["b", "c"]

    def test_an_acyclic_plan_reports_no_cycle(self) -> None:
        items = [item("a"), item("b", depends_on=["a"]), item("c", depends_on=["a", "b"])]
        assert cycle_nodes(items) == []


class TestMaxConcurrency:
    def test_a_chain_has_a_ceiling_of_one(self) -> None:
        items = [item("a"), item("b", depends_on=["a"]), item("c", depends_on=["b"])]
        assert max_concurrency(items) == 1

    def test_independent_units_are_all_concurrent(self) -> None:
        assert max_concurrency([item("a"), item("b"), item("c")]) == 3

    def test_a_diamond_allows_the_two_middle_units_at_once(self) -> None:
        # a → {b, c} → d: the widest independent set is {b, c}.
        items = [item("a"), item("b", depends_on=["a"]), item("c", depends_on=["a"]),
                 item("d", depends_on=["b", "c"])]
        assert max_concurrency(items) == 2

    def test_a_single_unit_has_a_ceiling_of_one(self) -> None:
        assert max_concurrency([item("a")]) == 1


class TestCriticalUnits:
    def test_the_only_chain_is_entirely_critical(self) -> None:
        items = [item("a"), item("b", depends_on=["a"])]
        assert critical_units(items) == {"a", "b"}

    def test_a_lighter_parallel_branch_has_float_and_is_not_critical(self) -> None:
        # a(2)→b(2)→d against a→c(1)→d: the b branch is heavier, so c floats.
        items = [item("a", size="M"), item("b", size="M", depends_on=["a"]),
                 item("c", size="S", depends_on=["a"]), item("d", size="S", depends_on=["b", "c"])]
        assert critical_units(items) == {"a", "b", "d"}

    def test_is_derived_from_weight_not_the_plans_own_flag(self) -> None:
        # The plan marks b critical, but by weight the heavier c is the spine.
        items = [item("a", size="S"), item("b", size="S", critical=True, depends_on=["a"]),
                 item("c", size="L", depends_on=["a"])]
        assert critical_units(items) == {"a", "c"}


class TestReadyIds:
    def test_a_not_started_unit_with_every_prerequisite_done_is_ready(self) -> None:
        items = [item("a", status="done"), item("b", depends_on=["a"])]
        assert ready_ids(items) == ["b"]

    def test_a_unit_with_an_unfinished_prerequisite_is_not_ready(self) -> None:
        items = [item("a"), item("b", depends_on=["a"])]
        assert ready_ids(items) == ["a"]

    def test_a_unit_already_begun_is_never_ready(self) -> None:
        assert ready_ids([item("a", status="in_progress")]) == []

    def test_an_unrecognised_status_is_never_offered_as_ready(self) -> None:
        # Fail closed: 'claimed' means someone else holds it, not that it is free.
        items = [item("a", status="done"), item("b", status="claimed", depends_on=["a"])]
        assert ready_ids(items) == []

    def test_an_unrecognised_prerequisite_status_does_not_count_as_done(self) -> None:
        items = [item("a", status="claimed"), item("b", depends_on=["a"])]
        assert ready_ids(items) == []


class TestDagNodes:
    def test_builds_the_whole_node_in_one_shape(self) -> None:
        got = dag_nodes([item("u1", title="Swept circle", status="pending", track="SIM",
                              size="M", risk="high", critical=True, agentic=True,
                              depends_on=["u0"], note="Pure geometry.")])
        # Criticality is not in `sub`: the graph draws the critical path in the redline colour,
        # derived by CPM, so the plan's own `critical` flag does not leak into the label.
        assert got == [{
            "id": "u1",
            "label": "Swept circle",
            "status": "queued",
            "sub": "SIM · M",
            "weight": 2,
            "dependsOn": ["u0"],
            "detail": {
                "facts": [
                    {"k": "track", "v": "SIM"},
                    {"k": "size", "v": "M"},
                    {"k": "risk", "v": "high"},
                    {"k": "by", "v": "agent"},
                ],
                "note": "Pure geometry.",
            },
        }]

    def test_falls_back_to_the_id_when_a_unit_has_no_title(self) -> None:
        assert dag_nodes([{"id": "x"}])[0]["label"] == "x"

    def test_tolerates_a_malformed_depends_on(self) -> None:
        assert dag_nodes([{"id": "x", "depends_on": "a"}])[0]["dependsOn"] == []
        assert dag_nodes([{"id": "y", "depends_on": ["a", 3, None]}])[0]["dependsOn"] == ["a"]


PHASES = [{"id": "M1", "name": "sim core", "goal": "byte-stable traces.",
           "exit_criteria": "golden reproduces."}]


class TestDetail:
    def test_resolves_the_phase_to_its_goal_and_exit_criteria_as_refs(self) -> None:
        d = dag_nodes([item("u", phase="M1")], PHASES)[0]["detail"]
        assert {"k": "phase", "v": "M1: sim core"} in d["facts"]
        assert d["refs"] == [
            {"label": "Phase M1 goal", "text": "byte-stable traces."},
            {"label": "Exit criteria", "text": "golden reproduces."},
        ]

    def test_a_phase_with_no_registry_entry_still_names_the_phase(self) -> None:
        d = dag_nodes([item("u", phase="M9")], PHASES)[0]["detail"]
        assert {"k": "phase", "v": "M9"} in d["facts"]
        assert "refs" not in d  # nothing to zoom into

    def test_a_human_unit_is_labelled_human_call(self) -> None:
        d = dag_nodes([item("u", agentic=False)])[0]["detail"]
        assert {"k": "by", "v": "human call"} in d["facts"]

    def test_a_delivered_pr_becomes_a_source_ref_with_its_url(self) -> None:
        # A producer that records PR refs (e.g. .work) surfaces them as links; PDD plans do not.
        d = dag_nodes([item("u", delivers=[{"pr": 42, "url": "https://x/pull/42"}])])[0]["detail"]
        assert {"label": "PR #42", "href": "https://x/pull/42"} in d["refs"]

    def test_a_pr_without_a_url_is_a_label_only_ref(self) -> None:
        d = dag_nodes([item("u", delivers=[{"pr": 7}])])[0]["detail"]
        assert {"label": "PR #7"} in d["refs"]


DEMO_PLAN: dict[str, Any] = {
    "title": "demo plan",
    "phases": [{"id": "M0"}, {"id": "M1"}],
    "items": [
        item("a", status="done", size="M"),
        item("b", size="L", depends_on=["a"], track="SIM", risk="high"),
        item("c", size="S", depends_on=["b"]),
    ],
}


class TestSpecFromPlan:
    plan = DEMO_PLAN

    def test_emits_exactly_one_dag_panel_carrying_every_unit(self) -> None:
        dags = panels_of(spec_from_plan(self.plan), "dag")
        assert len(dags) == 1
        assert [n["id"] for n in dags[0]["nodes"]] == ["a", "b", "c"]

    def test_headline_counts_and_size_weighted_progress(self) -> None:
        spec = spec_from_plan(self.plan)
        stats = {p["label"]: p for p in panels_of(spec, "stat")}
        assert stats["units"]["value"] == 3
        assert stats["units"]["sub"] == "1 done"
        assert stats["ready now"]["value"] == 1        # only b
        assert stats["phases"]["value"] == 2
        # a → b → c is a chain: nothing is concurrent, and the whole chain is the spine.
        assert stats["max parallel"]["value"] == 1
        assert stats["critical path"]["value"] == 3
        assert stats["critical path"]["sub"] == "6 u"  # M+L+S weighted
        prog = panels_of(spec, "progress")[0]
        assert (prog["value"], prog["max"]) == (2, 6)  # M done of M+L+S

    def test_lists_the_startable_units_with_their_context(self) -> None:
        table = panels_of(spec_from_plan(self.plan), "table")[0]
        assert table["columns"] == ["id", "title", "track", "size", "risk"]
        assert table["rows"] == [["b", "unit b", "SIM", "L", "high"]]

    def test_no_startable_table_when_nothing_can_start(self) -> None:
        blocked = {"items": [item("a", status="in_progress"),
                             item("b", depends_on=["a"])]}
        assert panels_of(spec_from_plan(blocked), "table") == []

    def test_a_sound_plan_reports_no_health_problems(self) -> None:
        assert panels_of(spec_from_plan(self.plan), "log") == []

    def test_surfaces_a_dangling_dependency_rather_than_dropping_the_edge(self) -> None:
        spec = spec_from_plan({"items": [item("a", depends_on=["ghost"])]})
        assert "ghost" in panels_of(spec, "log")[0]["lines"][0]

    def test_an_empty_plan_renders_a_message_and_no_graph(self) -> None:
        spec = spec_from_plan({"items": []}, repo="somerepo")
        assert panels_of(spec, "dag") == []
        assert "somerepo" in panels_of(spec, "log")[0]["text"]

    def test_uses_the_repo_name_when_the_plan_has_no_title(self) -> None:
        assert spec_from_plan({"items": [item("a")]}, repo="hoops")["title"] == "hoops"


class TestRenderFor:
    def test_reads_a_real_plan_off_disk(self, tmp_path: Any) -> None:
        (tmp_path / ".pdd").mkdir()
        (tmp_path / ".pdd" / "plan.json").write_text(
            json.dumps({"title": "t", "items": [item("a")]}), encoding="utf-8")
        spec = render_for(tmp_path)
        assert spec["title"] == "t"
        assert panels_of(spec, "dag")[0]["nodes"][0]["id"] == "a"

    def test_a_missing_plan_renders_a_panel_instead_of_raising(self, tmp_path: Any) -> None:
        spec = render_for(tmp_path)
        assert "does not exist" in panels_of(spec, "log")[0]["text"]

    def test_a_half_written_plan_renders_a_panel_instead_of_raising(self, tmp_path: Any) -> None:
        # The daemon polls every few seconds; catching an editor mid-save must not blank it.
        (tmp_path / ".pdd").mkdir()
        (tmp_path / ".pdd" / "plan.json").write_text('{"items": [', encoding="utf-8")
        assert panels_of(render_for(tmp_path), "log")[0]["title"] == "unreadable plan"

    def test_a_json_document_that_is_not_an_object_is_rejected(self, tmp_path: Any) -> None:
        (tmp_path / ".pdd").mkdir()
        (tmp_path / ".pdd" / "plan.json").write_text("[1,2,3]", encoding="utf-8")
        assert panels_of(render_for(tmp_path), "log")[0]["title"] == "unreadable plan"
