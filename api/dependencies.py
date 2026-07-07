from typing import Any, Dict, List, Optional

from memory.campaign_store import CampaignStore

store = CampaignStore()


def normalize_platforms(platforms: Optional[List[str]] = None, platform_csv: Optional[str] = None) -> Optional[List[str]]:
    if platforms:
        return [platform.strip() for platform in platforms if platform.strip()]
    if platform_csv:
        return [item.strip() for item in platform_csv.split(",") if item.strip()]
    return None


def campaign_response(state: Dict[str, Any], thread_id: str) -> Dict[str, Any]:
    metrics = store.get_metrics(thread_id=thread_id)
    replies = store.list_replies(thread_id=thread_id)
    due_followups = store.get_due_followups(thread_id=thread_id)
    response = {
        "thread_id": thread_id,
        "campaign_id": state.get("campaign_id"),
        "current_status": state.get("current_status"),
        "validated_leads": state.get("validated_leads", []),
        "duplicate_leads": state.get("duplicate_leads", []),
        "approved_leads": state.get("approved_leads", []),
        "sent_emails": state.get("sent_emails", []),
        "outreach_results": state.get("outreach_results", []),
        "reply_events": state.get("reply_events", []),
        "reply_summary": state.get("reply_summary", {}),
        "metrics": metrics,
        "replies": replies,
        "due_followups": due_followups,
        "followup_schedule": state.get("followup_schedule", []),
        "monitor_status": state.get("monitor_status"),
        "last_monitor_run": state.get("last_monitor_run"),
        "last_reply_check": state.get("last_reply_check"),
    }
    return response
