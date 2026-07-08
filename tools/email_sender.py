import os
from typing import Any, Dict
from uuid import uuid4
import smtplib
from email.message import EmailMessage

import socket

# Globally patch getaddrinfo to prefer IPv4 to avoid Render IPv6 Errno 101 / -9
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_getaddrinfo

from config.env_loader import _is_placeholder, load_project_env

load_project_env()


class EmailSender:
    def __init__(self):
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL") or self.smtp_username
        self.smtp_from_name = os.getenv("SMTP_FROM_NAME", "Lead Outbound Engine")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    def is_configured(self) -> bool:
        if self.resend_api_key and not _is_placeholder(self.resend_api_key):
            return True
            
        return bool(
            self.smtp_host
            and self.smtp_username
            and self.smtp_password
            and self.smtp_from_email
            and not _is_placeholder(self.smtp_host)
            and not _is_placeholder(self.smtp_username)
            and not _is_placeholder(self.smtp_password)
        )

    def send_email(self, to_email: str | None, subject: str, body: str) -> Dict[str, Any]:
        if not to_email:
            return {
                "status": "skipped",
                "message": "Missing recipient email.",
                "message_id": None,
            }

        if not self.is_configured():
            return {
                "status": "draft_only",
                "message": "Email not configured, generated draft only.",
                "message_id": f"draft-{uuid4()}",
            }

        # --- RESEND API IMPLEMENTATION ---
        if self.resend_api_key and not _is_placeholder(self.resend_api_key):
            try:
                import resend
                resend.api_key = self.resend_api_key
                
                from_address = self.smtp_from_email if self.smtp_from_email and not _is_placeholder(self.smtp_from_email) else "onboarding@resend.dev"
                
                params = {
                    "from": f"{self.smtp_from_name} <{from_address}>" if "resend.dev" not in from_address else "Acme <onboarding@resend.dev>",
                    "to": [to_email],
                    "subject": subject,
                    "text": body,
                }
                
                email_res = resend.Emails.send(params)
                
                return {
                    "status": "sent",
                    "message": "Email sent successfully via Resend API.",
                    "message_id": f"resend-{email_res.get('id', uuid4())}",
                }
            except Exception as exc:
                return {
                    "status": "failed",
                    "message": f"Resend API failed: {exc}",
                    "message_id": None,
                }

        # --- SMTP IMPLEMENTATION FALLBACK ---
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
        message["To"] = to_email
        
        from email.utils import make_msgid, formatdate
        message["Date"] = formatdate(localtime=True)
        domain = self.smtp_from_email.split('@')[-1] if '@' in self.smtp_from_email else 'localhost'
        message["Message-ID"] = make_msgid(domain=domain)
        message["Reply-To"] = self.smtp_from_email

        message.set_content(body)

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
                if self.smtp_use_tls:
                    server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)

            return {
                "status": "sent",
                "message": "Email sent successfully.",
                "message_id": f"smtp-{uuid4()}",
            }
        except Exception as exc:
            return {
                "status": "failed",
                "message": f"SMTP send failed: {exc}",
                "message_id": None,
            }
