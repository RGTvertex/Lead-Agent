from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List

from sqlalchemy import text
from memory.postgres_client import engine
from config.env_loader import load_project_env

load_project_env()

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

def _dt_to_iso(value: datetime | None = None) -> str:
    return (value or _utcnow()).isoformat()

class CampaignStore:
    def __init__(self, db_path: str | None = None):
        self._initialize()

    def _connect(self):
        return engine.begin()

    def _initialize(self):
        with self._connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS agent_campaigns (
                    thread_id TEXT PRIMARY KEY,
                    campaign_id TEXT NOT NULL,
                    target_criteria TEXT NOT NULL,
                    current_status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    user_id TEXT
                );
            """))
            
        try:
            with self._connect() as conn:
                conn.execute(text("ALTER TABLE agent_campaigns ADD COLUMN user_id TEXT;"))
        except Exception:
            pass
                
        with self._connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS outreach_log (
                    id SERIAL PRIMARY KEY,
                    thread_id TEXT NOT NULL,
                    campaign_id TEXT NOT NULL,
                    email TEXT,
                    full_name TEXT,
                    company_name TEXT,
                    subject TEXT,
                    status TEXT,
                    message_id TEXT,
                    sent_at TEXT NOT NULL,
                    delivery_message TEXT,
                    UNIQUE(thread_id, email, subject, sent_at)
                );
            """))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS reply_log (
                    id SERIAL PRIMARY KEY,
                    thread_id TEXT NOT NULL,
                    email TEXT NOT NULL,
                    classification TEXT NOT NULL,
                    subject TEXT,
                    preview TEXT,
                    message_id TEXT UNIQUE,
                    received_at TEXT NOT NULL,
                    raw_headers TEXT
                );
            """))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS followup_log (
                    id SERIAL PRIMARY KEY,
                    thread_id TEXT NOT NULL,
                    email TEXT NOT NULL,
                    company_name TEXT,
                    stage INTEGER NOT NULL,
                    due_at TEXT NOT NULL,
                    status TEXT NOT NULL,
                    replied INTEGER NOT NULL DEFAULT 0,
                    reply_classification TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    metadata_json TEXT
                );
            """))

            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_outreach_thread_email ON outreach_log(thread_id, email);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_reply_thread_email ON reply_log(thread_id, email);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_followup_thread_status_due ON followup_log(thread_id, status, due_at);"))

    def save_snapshot(self, thread_id: str, state: Dict[str, Any]) -> None:
        payload_json = json.dumps(state, default=str)
        now = _dt_to_iso()
        with self._connect() as conn:
            conn.execute(
                text("""
                INSERT INTO agent_campaigns (thread_id, campaign_id, target_criteria, current_status, created_at, updated_at, payload_json, user_id)
                VALUES (:thread_id, :campaign_id, :target_criteria, :current_status, :created_at, :updated_at, :payload_json, :user_id)
                ON CONFLICT(thread_id) DO UPDATE SET
                    campaign_id = EXCLUDED.campaign_id,
                    target_criteria = EXCLUDED.target_criteria,
                    current_status = EXCLUDED.current_status,
                    updated_at = EXCLUDED.updated_at,
                    payload_json = EXCLUDED.payload_json,
                    user_id = COALESCE(EXCLUDED.user_id, agent_campaigns.user_id)
                """),
                {
                    "thread_id": thread_id,
                    "campaign_id": state.get("campaign_id", thread_id),
                    "target_criteria": state.get("target_criteria", ""),
                    "current_status": state.get("current_status", "started"),
                    "created_at": now,
                    "updated_at": now,
                    "payload_json": payload_json,
                    "user_id": str(state.get("user_id")) if state.get("user_id") is not None else None,
                },
            )
            
    def list_campaigns(self, user_id: str = None) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            if user_id:
                cursor = conn.execute(
                    text("SELECT thread_id, campaign_id, target_criteria, current_status, created_at, updated_at, payload_json FROM agent_campaigns WHERE user_id = :user_id ORDER BY updated_at DESC"),
                    {"user_id": str(user_id)}
                )
            else:
                cursor = conn.execute(text("SELECT thread_id, campaign_id, target_criteria, current_status, created_at, updated_at, payload_json FROM agent_campaigns ORDER BY updated_at DESC"))
                
            results = []
            for row in cursor.fetchall():
                row_dict = row._mapping
                tid = row_dict["thread_id"]
                try:
                    payload = json.loads(row_dict["payload_json"]) if row_dict["payload_json"] else {}
                except Exception:
                    payload = {}

                # Pull real metrics from outreach_log and reply_log tables
                sent = conn.execute(text("SELECT COUNT(*) AS c FROM outreach_log WHERE thread_id = :tid"), {"tid": tid}).fetchone()._mapping["c"]
                replies = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log WHERE thread_id = :tid"), {"tid": tid}).fetchone()._mapping["c"]
                positives = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log WHERE thread_id = :tid AND classification = 'positive'"), {"tid": tid}).fetchone()._mapping["c"]
                bounces = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log WHERE thread_id = :tid AND classification = 'bounce'"), {"tid": tid}).fetchone()._mapping["c"]
                pending_followups = conn.execute(text("SELECT COUNT(*) AS c FROM followup_log WHERE thread_id = :tid AND status = 'pending'"), {"tid": tid}).fetchone()._mapping["c"]

                success_rate = round((positives / sent) * 100, 2) if sent else 0.0
                    
                results.append({
                    "thread_id": tid,
                    "campaign_id": row_dict["campaign_id"],
                    "target_criteria": row_dict["target_criteria"],
                    "current_status": row_dict["current_status"],
                    "created_at": row_dict["created_at"],
                    "updated_at": row_dict["updated_at"],
                    "stats": {
                        "raw_leads": len(payload.get("raw_leads", [])),
                        "validated_leads": len(payload.get("validated_leads", [])),
                        "sent_emails": sent,
                        "replies": replies,
                        "positive_replies": positives,
                        "bounces": bounces,
                        "pending_followups": pending_followups,
                        "success_rate": success_rate,
                    }
                })
            return results

    def load_snapshot(self, thread_id: str) -> Dict[str, Any]:
        with self._connect() as conn:
            row = conn.execute(
                text("SELECT payload_json FROM agent_campaigns WHERE thread_id = :thread_id"),
                {"thread_id": thread_id},
            ).fetchone()
        if not row:
            return {}
        try:
            return json.loads(row._mapping["payload_json"])
        except Exception:
            return {}

    def log_outreach(self, thread_id: str, campaign_id: str, lead: Dict[str, Any], delivery_status: str, subject: str | None = None, message_id: str | None = None, delivery_message: str | None = None) -> Dict[str, Any]:
        now = _dt_to_iso()
        record = {
            "thread_id": thread_id,
            "campaign_id": campaign_id,
            "email": lead.get("email"),
            "full_name": lead.get("full_name"),
            "company_name": lead.get("company_name"),
            "subject": subject,
            "status": delivery_status,
            "message_id": message_id,
            "sent_at": now,
            "delivery_message": delivery_message,
        }
        with self._connect() as conn:
            res = conn.execute(
                text("""
                INSERT INTO outreach_log
                (thread_id, campaign_id, email, full_name, company_name, subject, status, message_id, sent_at, delivery_message)
                VALUES (:thread_id, :campaign_id, :email, :full_name, :company_name, :subject, :status, :message_id, :sent_at, :delivery_message)
                RETURNING id
                """),
                record,
            )
            record["outreach_id"] = res.fetchone()._mapping["id"]
        return record

    def schedule_followups(self, thread_id: str, campaign_id: str, leads: Iterable[Dict[str, Any]], stages: Iterable[int] = (3, 7)) -> None:
        now = _utcnow()
        entries = []
        for lead in leads:
            email = lead.get("email")
            if not email:
                continue
            for stage in stages:
                due = now + timedelta(days=int(stage))
                entries.append(
                    {
                        "thread_id": thread_id,
                        "email": email,
                        "company_name": lead.get("company_name"),
                        "stage": int(stage),
                        "due_at": _dt_to_iso(due),
                        "status": "pending",
                        "replied": 0,
                        "created_at": _dt_to_iso(now),
                        "updated_at": _dt_to_iso(now),
                        "metadata_json": json.dumps({"campaign_id": campaign_id}),
                    }
                )
        if not entries:
            return
        with self._connect() as conn:
            for entry in entries:
                conn.execute(
                    text("""
                    INSERT INTO followup_log
                    (thread_id, email, company_name, stage, due_at, status, replied, created_at, updated_at, metadata_json)
                    VALUES (:thread_id, :email, :company_name, :stage, :due_at, :status, :replied, :created_at, :updated_at, :metadata_json)
                    """),
                    entry,
                )

    def log_reply(self, thread_id: str, email: str, subject: str | None, preview: str, classification: str, message_id: str, raw_headers: str | None = None) -> None:
        now = _dt_to_iso()
        with self._connect() as conn:
            conn.execute(
                text("""
                INSERT INTO reply_log (thread_id, email, classification, subject, preview, message_id, received_at, raw_headers)
                VALUES (:thread_id, :email, :classification, :subject, :preview, :message_id, :received_at, :raw_headers)
                ON CONFLICT (message_id) DO NOTHING
                """),
                {
                    "thread_id": thread_id,
                    "email": email,
                    "classification": classification,
                    "subject": subject,
                    "preview": preview,
                    "message_id": message_id,
                    "received_at": now,
                    "raw_headers": raw_headers,
                },
            )
            
            conn.execute(
                text("""
                UPDATE followup_log
                SET replied = 1, reply_classification = :classification, updated_at = :now, status = 'completed'
                WHERE thread_id = :thread_id AND email = :email AND replied = 0
                """),
                {"classification": classification, "now": now, "thread_id": thread_id, "email": email},
            )

    def is_reply_logged(self, message_id: str) -> bool:
        if not message_id:
            return False
        with self._connect() as conn:
            row = conn.execute(
                text("SELECT 1 FROM reply_log WHERE message_id = :message_id"),
                {"message_id": message_id},
            ).fetchone()
        return bool(row)

    def reply_exists(self, message_id: str) -> bool:
        """Alias for is_reply_logged, called by EmailReplyMonitor."""
        return self.is_reply_logged(message_id)

    def cancel_followups_for_email(self, thread_id: str, email: str) -> None:
        now = _dt_to_iso()
        with self._connect() as conn:
            conn.execute(
                text("""
                UPDATE followup_log
                SET status = 'cancelled', updated_at = :now
                WHERE thread_id = :thread_id AND email = :email AND status = 'pending'
                """),
                {"now": now, "thread_id": thread_id, "email": email},
            )

    def get_campaign_leads(self, thread_id: str | None = None) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            if thread_id:
                rows = conn.execute(
                    text("""
                    SELECT DISTINCT thread_id, campaign_id, email, full_name, company_name
                    FROM outreach_log
                    WHERE thread_id = :thread_id
                    """),
                    {"thread_id": thread_id},
                ).fetchall()
            else:
                rows = conn.execute(
                    text("""
                    SELECT DISTINCT thread_id, campaign_id, email, full_name, company_name
                    FROM outreach_log
                    """),
                ).fetchall()
        return [dict(row._mapping) for row in rows]

    def map_lead_to_campaigns(self, thread_id: str | None = None) -> Dict[str, List[str]]:
        mapping: Dict[str, List[str]] = {}
        for row in self.get_campaign_leads(thread_id=thread_id):
            email = (row.get("email") or "").lower()
            if not email:
                continue
            mapping.setdefault(email, [])
            if row.get("thread_id") not in mapping[email]:
                mapping[email].append(row.get("thread_id"))
        return mapping

    def get_due_followups(self, thread_id: str | None = None) -> List[Dict[str, Any]]:
        now = _utcnow()
        with self._connect() as conn:
            if thread_id:
                rows = conn.execute(
                    text("""
                    SELECT thread_id, email, company_name, stage, due_at, status, replied
                    FROM followup_log
                    WHERE thread_id = :thread_id AND status = 'pending' AND due_at <= :now
                    ORDER BY due_at ASC
                    """),
                    {"thread_id": thread_id, "now": _dt_to_iso(now)},
                ).fetchall()
            else:
                rows = conn.execute(
                    text("""
                    SELECT thread_id, email, company_name, stage, due_at, status, replied
                    FROM followup_log
                    WHERE status = 'pending' AND due_at <= :now
                    ORDER BY due_at ASC
                    """),
                    {"now": _dt_to_iso(now)},
                ).fetchall()
        return [dict(row._mapping) for row in rows]

    def get_metrics(self, thread_id: str | None = None) -> Dict[str, Any]:
        with self._connect() as conn:
            if thread_id:
                sent = conn.execute(text("SELECT COUNT(*) AS c FROM outreach_log WHERE thread_id = :tid"), {"tid": thread_id}).fetchone()._mapping["c"]
                replies = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log WHERE thread_id = :tid"), {"tid": thread_id}).fetchone()._mapping["c"]
                positives = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log WHERE thread_id = :tid AND classification = 'positive'"), {"tid": thread_id}).fetchone()._mapping["c"]
                bounces = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log WHERE thread_id = :tid AND classification = 'bounce'"), {"tid": thread_id}).fetchone()._mapping["c"]
                pending = conn.execute(text("SELECT COUNT(*) AS c FROM followup_log WHERE thread_id = :tid AND status = 'pending'"), {"tid": thread_id}).fetchone()._mapping["c"]
                cancelled = conn.execute(text("SELECT COUNT(*) AS c FROM followup_log WHERE thread_id = :tid AND status = 'cancelled'"), {"tid": thread_id}).fetchone()._mapping["c"]
            else:
                sent = conn.execute(text("SELECT COUNT(*) AS c FROM outreach_log")).fetchone()._mapping["c"]
                replies = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log")).fetchone()._mapping["c"]
                positives = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log WHERE classification = 'positive'")).fetchone()._mapping["c"]
                bounces = conn.execute(text("SELECT COUNT(*) AS c FROM reply_log WHERE classification = 'bounce'")).fetchone()._mapping["c"]
                pending = conn.execute(text("SELECT COUNT(*) AS c FROM followup_log WHERE status = 'pending'")).fetchone()._mapping["c"]
                cancelled = conn.execute(text("SELECT COUNT(*) AS c FROM followup_log WHERE status = 'cancelled'")).fetchone()._mapping["c"]

        success_rate = round((positives / sent) * 100, 2) if sent else 0.0
        return {
            "sent_emails": sent,
            "replies": replies,
            "positive_replies": positives,
            "bounces": bounces,
            "pending_followups": pending,
            "cancelled_followups": cancelled,
            "success_rate": success_rate,
        }

    def list_replies(self, thread_id: str | None = None) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            if thread_id:
                rows = conn.execute(
                    text("""
                    SELECT thread_id, email, classification, subject, preview, message_id, received_at
                    FROM reply_log
                    WHERE thread_id = :thread_id
                    ORDER BY received_at DESC
                    """),
                    {"thread_id": thread_id},
                ).fetchall()
            else:
                rows = conn.execute(
                    text("""
                    SELECT thread_id, email, classification, subject, preview, message_id, received_at
                    FROM reply_log
                    ORDER BY received_at DESC
                    """),
                ).fetchall()
        return [dict(row._mapping) for row in rows]

    def get_last_snapshot(self, thread_id: str) -> Dict[str, Any]:
        return self.load_snapshot(thread_id)
