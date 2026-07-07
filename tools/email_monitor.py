from __future__ import annotations

import imaplib
import os
import re
from dataclasses import dataclass
from email import message_from_bytes
from email.message import Message
from email.utils import parseaddr
from typing import Any, Dict, List, Optional

from config.env_loader import _is_placeholder, load_project_env
from memory.campaign_store import CampaignStore

load_project_env()


@dataclass
class ReplyResult:
    thread_id: str
    email: str
    classification: str
    subject: str
    preview: str
    message_id: str | None


class EmailReplyMonitor:
    def __init__(self, store: CampaignStore | None = None):
        self.store = store or CampaignStore()
        self.imap_host = os.getenv("IMAP_HOST")
        self.imap_port = int(os.getenv("IMAP_PORT", "993"))
        self.imap_username = os.getenv("IMAP_USERNAME")
        self.imap_password = os.getenv("IMAP_PASSWORD")
        self.imap_use_ssl = os.getenv("IMAP_USE_SSL", "true").lower() == "true"
        self.imap_folder = os.getenv("IMAP_FOLDER", "INBOX")
        self.lookback_hours = int(os.getenv("IMAP_LOOKBACK_HOURS", "48"))

    def is_configured(self) -> bool:
        return bool(
            self.imap_host
            and self.imap_username
            and self.imap_password
            and not _is_placeholder(self.imap_host)
            and not _is_placeholder(self.imap_username)
            and not _is_placeholder(self.imap_password)
        )

    def _connect(self):
        if self.imap_use_ssl:
            client = imaplib.IMAP4_SSL(self.imap_host, self.imap_port)
        else:
            client = imaplib.IMAP4(self.imap_host, self.imap_port)
        client.login(self.imap_username, self.imap_password)
        client.select(self.imap_folder)
        return client

    def _decode_message(self, raw_bytes: bytes) -> Message:
        return message_from_bytes(raw_bytes)

    def _extract_text(self, msg: Message) -> str:
        parts: List[str] = []
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                disposition = str(part.get("Content-Disposition", "")).lower()
                if "attachment" in disposition:
                    continue
                if content_type in ("text/plain", "text/html"):
                    payload = part.get_payload(decode=True)
                    if payload:
                        try:
                            parts.append(payload.decode(part.get_content_charset() or "utf-8", errors="ignore"))
                        except Exception:
                            parts.append(payload.decode("utf-8", errors="ignore"))
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                try:
                    parts.append(payload.decode(msg.get_content_charset() or "utf-8", errors="ignore"))
                except Exception:
                    parts.append(payload.decode("utf-8", errors="ignore"))
        return "\n".join(parts).strip()

    def classify_reply(self, subject: str, body: str) -> str:
        text = f"{subject}\n{body}".lower()
        if any(token in text for token in ("unsubscribe", "opt out", "remove me", "stop emailing", "do not contact")):
            return "unsubscribe"
        if any(token in text for token in ("out of office", "ooo", "away from the office", "auto reply", "automatic reply", "vacation")):
            return "out_of_office"
        if any(token in text for token in ("bounce", "undeliverable", "delivery status notification", "mailbox unavailable", "failed to deliver")):
            return "bounce"
        if any(token in text for token in ("interested", "let's talk", "lets talk", "book a call", "schedule", "call next week", "sounds good", "yes")):
            return "positive"
        if any(token in text for token in ("not interested", "no thanks", "not now", "pass")):
            return "not_interested"
        return "neutral"

    def _reply_exists(self, message_id: str | None) -> bool:
        if not message_id:
            return False
        return self.store.reply_exists(message_id)

    def poll_inbox(self, thread_id: str | None = None, limit: int = 50) -> Dict[str, Any]:
        if not self.is_configured():
            return {"status": "disabled", "processed": 0, "replies": []}

        client = self._connect()
        replies: List[Dict[str, Any]] = []
        processed = 0

        try:
            status, data = client.search(None, "ALL")
            if status != "OK":
                return {"status": "error", "processed": 0, "replies": []}

            message_ids = data[0].split()[-limit:]
            lead_email_to_campaigns = self.store.map_lead_to_campaigns(thread_id=thread_id)

            for message_id in message_ids:
                status, raw_data = client.fetch(message_id, "(RFC822)")
                if status != "OK" or not raw_data or not raw_data[0]:
                    continue

                raw_message = raw_data[0][1]
                msg = self._decode_message(raw_message)
                message_key = msg.get("Message-ID")
                if self._reply_exists(message_key):
                    continue

                sender_email = parseaddr(msg.get("From", ""))[1].lower()
                if not sender_email:
                    continue

                if sender_email not in lead_email_to_campaigns:
                    continue

                subject = msg.get("Subject", "")
                body = self._extract_text(msg)
                classification = self.classify_reply(subject, body)
                campaign_ids = lead_email_to_campaigns.get(sender_email, [])
                preview = re.sub(r"\s+", " ", body).strip()[:240]

                for campaign_id in campaign_ids:
                    if thread_id and campaign_id != thread_id:
                        continue

                    reply_record = self.store.log_reply(
                        thread_id=campaign_id,
                        email=sender_email,
                        classification=classification,
                        subject=subject,
                        preview=preview,
                        message_id=message_key,
                    )
                    self.store.cancel_followups_for_email(campaign_id, sender_email)
                    replies.append(reply_record)

                processed += 1

            return {
                "status": "ok",
                "processed": processed,
                "replies": replies,
            }
        finally:
            try:
                client.close()
                client.logout()
            except Exception:
                pass
