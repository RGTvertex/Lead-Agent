from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from agents.lead_discoverer import lead_discoverer_node
from agents.outreach_logic import outreach_writer_node, drafter_node
from agents.qualifier import qualifier_node
from agents.schemas import CampaignState
from memory.campaign_store import CampaignStore

memory = MemorySaver()
store = CampaignStore()


def should_continue(state: CampaignState) -> Literal["outreach_writer_node", END]:
    if len(state.get("approved_leads", [])) > 0:
        return "outreach_writer_node"
    return END


def create_orchestrator_graph():
    builder = StateGraph(CampaignState)
    builder.add_node("lead_discoverer_node", lead_discoverer_node)
    builder.add_node("qualifier_node", qualifier_node)
    builder.add_node("drafter_node", drafter_node)
    builder.add_node("outreach_writer_node", outreach_writer_node)
    
    builder.add_edge(START, "lead_discoverer_node")
    builder.add_edge("lead_discoverer_node", "qualifier_node")
    builder.add_edge("qualifier_node", "drafter_node")
    builder.add_conditional_edges("drafter_node", should_continue)
    builder.add_edge("outreach_writer_node", END)
    
    return builder.compile(checkpointer=memory, interrupt_after=["drafter_node"])


orchestrator_graph = create_orchestrator_graph()


def get_thread_config(thread_id: str) -> Dict[str, Dict[str, str]]:
    return {"configurable": {"thread_id": thread_id}}


def build_initial_state(
    target_criteria: str,
    location: Optional[str] = None,
    niche: Optional[str] = None,
    platforms: Optional[List[str]] = None,
    max_leads_per_day: int = 100,
    campaign_id: Optional[str] = None,
) -> CampaignState:
    resolved_campaign_id = campaign_id or str(uuid4())
    return {
        "campaign_id": resolved_campaign_id,
        "target_criteria": target_criteria.strip(),
        "location": location.strip() if isinstance(location, str) and location.strip() else location,
        "niche": niche.strip() if isinstance(niche, str) and niche.strip() else niche,
        "platforms": platforms or None,
        "max_leads_per_day": max_leads_per_day,
        "raw_leads": [],
        "validated_leads": [],
        "duplicate_leads": [],
        "approved_leads": [],
        "sent_emails": [],
        "outreach_results": [],
        "reply_events": [],
        "reply_summary": {},
        "metrics": {},
        "followup_schedule": [],
        "due_followups": [],
        "last_monitor_run": None,
        "last_reply_check": None,
        "monitor_status": None,
        "current_status": "started",
    }


def _persist_state(thread_id: str, state: Dict[str, Any]) -> None:
    store.save_snapshot(thread_id, state)


def start_campaign(initial_state: CampaignState, thread_id: Optional[str] = None) -> Dict[str, Any]:
    resolved_thread_id = thread_id or initial_state["campaign_id"]
    initial_state = dict(initial_state)
    initial_state["campaign_id"] = resolved_thread_id
    config = get_thread_config(resolved_thread_id)
    events = list(orchestrator_graph.stream(initial_state, config=config))
    snapshot = get_campaign_state(resolved_thread_id)
    if snapshot:
        _persist_state(resolved_thread_id, snapshot)
    return {
        "thread_id": resolved_thread_id,
        "events": events,
        "state": snapshot,
        "awaiting_approval": snapshot.get("current_status") == "awaiting_approval",
    }


def get_campaign_state(thread_id: str) -> Dict[str, Any]:
    config = get_thread_config(thread_id)
    try:
        state_snapshot = orchestrator_graph.get_state(config)
        if state_snapshot and state_snapshot.values:
            return dict(state_snapshot.values)
    except Exception:
        pass
    return store.get_last_snapshot(thread_id)


def approve_campaign(
    thread_id: str,
    approved_leads_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    config = get_thread_config(thread_id)
    current_state = get_campaign_state(thread_id)
    validated_leads = current_state.get("validated_leads", [])

    approved_leads = []
    remaining_leads = []
    approved_indices = {ld.get("index") for ld in (approved_leads_data or [])}

    for i, lead in enumerate(validated_leads):
        if i in approved_indices:
            draft = next((ld.get("final_draft") for ld in approved_leads_data if ld.get("index") == i), None)
            approved_lead = lead.copy()
            approved_lead["final_draft"] = draft
            approved_leads.append(approved_lead)
        else:
            remaining_leads.append(lead)

    updated_state = dict(current_state)
    updated_state["approved_leads"] = approved_leads
    updated_state["validated_leads"] = remaining_leads
    
    # If they didn't approve anything, keep them waiting or reject. 
    # If they approved some, it's "approved". If none but some remain, "awaiting_approval".
    if approved_leads:
        updated_state["current_status"] = "approved"
    elif remaining_leads:
        updated_state["current_status"] = "awaiting_approval"
    else:
        updated_state["current_status"] = "approval_rejected"

    orchestrator_graph.update_state(config, updated_state)

    resume_events = []
    if approved_leads:
        resume_events = list(orchestrator_graph.stream(None, config=config))

    snapshot = get_campaign_state(thread_id)
    if snapshot:
        _persist_state(thread_id, snapshot)
    return {
        "thread_id": thread_id,
        "events": resume_events,
        "state": snapshot,
    }


def save_campaign_output(thread_id: str, output_path: str) -> Dict[str, Any]:
    import json

    snapshot = get_campaign_state(thread_id)
    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(snapshot, file, indent=4)
    return snapshot


def get_campaign_metrics(thread_id: str) -> Dict[str, Any]:
    return store.get_metrics(thread_id=thread_id)


def get_due_followups(thread_id: str) -> List[Dict[str, Any]]:
    return store.get_due_followups(thread_id=thread_id)


def sync_campaign_snapshot(thread_id: str) -> Dict[str, Any]:
    snapshot = get_campaign_state(thread_id)
    if snapshot:
        _persist_state(thread_id, snapshot)
    return snapshot


if __name__ == "__main__":
    print(orchestrator_graph.get_graph().draw_ascii())
