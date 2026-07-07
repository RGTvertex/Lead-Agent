from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List

from memory.campaign_store import CampaignStore


class FollowUpManager:
    def __init__(self):
        self.store = CampaignStore()

    def get_due_followups(self, thread_id: str | None = None) -> List[Dict[str, Any]]:
        return self.store.get_due_followups(thread_id=thread_id)

    def summarize_followups(self, thread_id: str | None = None) -> Dict[str, Any]:
        due = self.get_due_followups(thread_id=thread_id)
        return {
            "due_count": len(due),
            "due_followups": due,
        }
