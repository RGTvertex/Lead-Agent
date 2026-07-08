from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

import nest_asyncio
nest_asyncio.apply()

import warnings
from bs4 import XMLParsedAsHTMLWarning
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

from contextlib import asynccontextmanager
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agents.orchestrator import (
    approve_campaign,
    build_initial_state,
    get_campaign_metrics,
    get_campaign_state,
    get_due_followups,
    start_campaign,
)
from api.auth import auth_is_enabled, require_api_key, auth_router, get_current_user
from api.dependencies import campaign_response, normalize_platforms, store
from config.llm_config import get_llm
from memory.postgres_client import init_db, User, Note, Task, get_db
from sqlalchemy.orm import Session
from tools.email_monitor import EmailReplyMonitor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield

app = FastAPI(title="Lead Outbound Engine API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

monitor = EmailReplyMonitor()
campaigns_router = APIRouter(prefix="/campaigns", dependencies=[Depends(require_api_key)])


class StartCampaignRequest(BaseModel):
    target_criteria: str
    location: Optional[str] = None
    niche: Optional[str] = None
    platforms: Optional[List[str]] = None
    platform_csv: Optional[str] = None
    max_leads_per_day: int = Field(default=25, ge=1, le=100)
    max_leads_per_day: int = Field(default=25, ge=1, le=100)
    thread_id: Optional[str] = None


class NoteCreate(BaseModel):
    content: str

class TaskCreate(BaseModel):
    title: str
    due_date: Optional[str] = None


class ParsePromptRequest(BaseModel):
    prompt: str


class ParsedPromptResponse(BaseModel):
    target_criteria: str = Field(description="The role or description of the people to target (e.g. 'Software Engineers', 'Founders')")
    location: str = Field(default="", description="The location mentioned, if any (e.g. 'San Francisco', 'Remote')")
    niche: str = Field(default="", description="The industry or niche mentioned, if any (e.g. 'Healthcare', 'AI')")
    max_leads_per_day: int = Field(default=25, description="The number of leads requested. Default is 25 if not mentioned.")


class ApprovedLeadData(BaseModel):
    index: int
    final_draft: str

class ApprovalRequest(BaseModel):
    approved_leads: List[ApprovedLeadData] = Field(default_factory=list)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"status": "ok", "auth_enabled": auth_is_enabled()}


@app.get("/auth/status")
def auth_status() -> Dict[str, Any]:
    return {"enabled": auth_is_enabled()}


@campaigns_router.get("")
def list_campaigns(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    campaigns = store.list_campaigns(user_id=current_user.id)
    return {"campaigns": campaigns}


@campaigns_router.post("/parse-prompt")
def parse_prompt_endpoint(request: ParsePromptRequest) -> Dict[str, Any]:
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import PydanticOutputParser
    
    parser = PydanticOutputParser(pydantic_object=ParsedPromptResponse)
    
    prompt_template = PromptTemplate(
        template="Extract the campaign details from the user's prompt.\n\n{format_instructions}\n\nPrompt: {prompt}\n\nMake sure to return valid JSON matching the schema.",
        input_variables=["prompt"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    
    llm = get_llm(temperature=0.1)
    chain = prompt_template | llm | parser
    
    try:
        parsed_data = chain.invoke({"prompt": request.prompt})
        return parsed_data.dict()
    except Exception as e:
        # Fallback if parsing fails
        print(f"Parsing failed: {e}")
        return {
            "target_criteria": request.prompt,
            "location": "",
            "niche": "",
            "max_leads_per_day": 25
        }


@campaigns_router.post("/start")
def start_campaign_endpoint(request: StartCampaignRequest, current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    if not request.target_criteria.strip():
        raise HTTPException(status_code=400, detail="target_criteria is required")

    thread_id = request.thread_id or str(uuid4())
    initial_state = build_initial_state(
        target_criteria=request.target_criteria,
        location=request.location,
        niche=request.niche,
        platforms=normalize_platforms(request.platforms, request.platform_csv),
        max_leads_per_day=request.max_leads_per_day,
        campaign_id=thread_id,
    )
    initial_state["user_id"] = current_user.id

    result = start_campaign(initial_state, thread_id=thread_id)
    return campaign_response(result["state"], result["thread_id"])


@campaigns_router.get("/{thread_id}")
def get_campaign(thread_id: str) -> Dict[str, Any]:
    state = get_campaign_state(thread_id)
    if not state:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign_response(state, thread_id)


@campaigns_router.post("/{thread_id}/approve")
def approve_campaign_endpoint(thread_id: str, request: ApprovalRequest) -> Dict[str, Any]:
    state = get_campaign_state(thread_id)
    if not state:
        raise HTTPException(status_code=404, detail="Campaign not found")

    result = approve_campaign(
        thread_id=thread_id,
        approved_leads_data=[{"index": lead.index, "final_draft": lead.final_draft} for lead in request.approved_leads],
    )
    return campaign_response(result["state"], thread_id)


@campaigns_router.get("/{thread_id}/metrics")
def campaign_metrics(thread_id: str) -> Dict[str, Any]:
    state = get_campaign_state(thread_id)
    if not state:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return get_campaign_metrics(thread_id)


@campaigns_router.post("/{thread_id}/monitor/replies")
def monitor_replies(thread_id: str) -> Dict[str, Any]:
    state = get_campaign_state(thread_id)
    if not state:
        raise HTTPException(status_code=404, detail="Campaign not found")

    result = monitor.poll_inbox(thread_id=thread_id)
    snapshot = get_campaign_state(thread_id)
    snapshot["reply_events"] = result.get("replies", [])
    snapshot["reply_summary"] = {
        "processed": result.get("processed", 0),
        "status": result.get("status", "unknown"),
        "replies": len(result.get("replies", [])),
    }
    snapshot["last_monitor_run"] = datetime.now(timezone.utc).isoformat()
    snapshot["monitor_status"] = result.get("status", "unknown")
    store.save_snapshot(thread_id, snapshot)
    return campaign_response(snapshot, thread_id)


@campaigns_router.get("/{thread_id}/followups/due")
def due_followups(thread_id: str) -> Dict[str, Any]:
    state = get_campaign_state(thread_id)
    if not state:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"thread_id": thread_id, "due_followups": get_due_followups(thread_id)}


@campaigns_router.get("/{thread_id}/stream")
def stream_campaign(thread_id: str):
    state = get_campaign_state(thread_id)
    if not state:
        raise HTTPException(status_code=404, detail="Campaign not found")

    def event_stream():
        last_payload = None
        for _ in range(60):
            current = campaign_response(get_campaign_state(thread_id), thread_id)
            payload = json.dumps(current, default=str)
            if payload != last_payload:
                yield f"data: {payload}\n\n"
                last_payload = payload
            time.sleep(2)
        yield f"data: {json.dumps({'thread_id': thread_id, 'event': 'stream_complete'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/dashboard/")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metrics = store.get_metrics()
    
    # Calculate pending tasks
    pending_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == 'pending'
    ).count()

    return {
        "stats": {
            "sent_emails": metrics["sent_emails"],
            "replies": metrics["replies"],
            "positive_replies": metrics["positive_replies"],
            "bounces": metrics["bounces"],
            "pending_followups": metrics["pending_followups"],
            "success_rate": f"{metrics['success_rate']}%",
            "total_tasks": pending_tasks
        },
        "lead_growth": [
            {"month": "Jan", "count": 20},
            {"month": "Feb", "count": 35},
            {"month": "Mar", "count": 55},
            {"month": "Apr", "count": 80},
            {"month": "May", "count": 95},
            {"month": "Jun", "count": 125},
            {"month": "Jul", "count": 150}
        ],
        "industry_distribution": [
            {"industry": "Technology", "count": 45},
            {"industry": "Healthcare", "count": 25},
            {"industry": "Finance", "count": 20},
            {"industry": "Retail", "count": 15},
            {"industry": "Manufacturing", "count": 10},
            {"industry": "Other", "count": 10}
        ],
        "lead_status": [
            {"status": "new", "count": 34},
            {"status": "contacted", "count": 45},
            {"status": "qualified", "count": 20},
            {"status": "proposal_sent", "count": 12},
            {"status": "won", "count": 10},
            {"status": "lost", "count": 4}
        ]
    }

app.include_router(auth_router)
app.include_router(campaigns_router)

# --- NOTES API ---
@app.get("/notes")
def get_notes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.created_at.desc()).all()
    return {"notes": [{"id": n.id, "content": n.content, "created_at": n.created_at} for n in notes]}

@app.post("/notes")
def create_note(note: NoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_note = Note(user_id=current_user.id, content=note.content)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return {"id": new_note.id, "content": new_note.content, "created_at": new_note.created_at}

@app.delete("/notes/{note_id}")
def delete_note(note_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if note:
        db.delete(note)
        db.commit()
    return {"status": "success"}

# --- TASKS API ---
@app.get("/tasks")
def get_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.user_id == current_user.id).order_by(Task.created_at.desc()).all()
    return {"tasks": [{"id": t.id, "title": t.title, "status": t.status, "due_date": t.due_date, "created_at": t.created_at} for t in tasks]}

@app.post("/tasks")
def create_task(task: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_task = Task(user_id=current_user.id, title=task.title)
    if task.due_date:
        from dateutil import parser as date_parser
        try:
            new_task.due_date = date_parser.parse(task.due_date)
        except:
            pass
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return {"id": new_task.id, "title": new_task.title, "status": new_task.status, "created_at": new_task.created_at}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if task:
        db.delete(task)
        db.commit()
    return {"status": "success"}

