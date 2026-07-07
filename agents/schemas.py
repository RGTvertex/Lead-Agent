from pydantic import BaseModel, Field
from typing import List, Optional, TypedDict, Dict, Any


class CampaignState(TypedDict):
    """
    State object representing the exact lifecycle of a lead campaign.
    """

    campaign_id: str
    target_criteria: str
    location: Optional[str]
    niche: Optional[str]
    platforms: Optional[List[str]]
    max_leads_per_day: int
    raw_leads: List[Dict[str, Any]]
    validated_leads: List[Dict[str, Any]]
    duplicate_leads: List[Dict[str, Any]]
    approved_leads: List[Dict[str, Any]]
    sent_emails: List[str]
    outreach_results: List[Dict[str, Any]]
    reply_events: List[Dict[str, Any]]
    reply_summary: Dict[str, Any]
    metrics: Dict[str, Any]
    followup_schedule: List[Dict[str, Any]]
    due_followups: List[Dict[str, Any]]
    last_monitor_run: Optional[str]
    last_reply_check: Optional[str]
    monitor_status: Optional[str]
    current_status: str
    user_id: Optional[int]


class ExtractedLead(BaseModel):
    full_name: str = Field(description="The full name of the prospect. Return 'Unknown' if not found.")
    job_title: str = Field(description="The current job title or role.")
    company_name: str = Field(description="The name of the company they work for.")
    company_description: Optional[str] = Field(default=None, description="A 1-2 sentence description of what the company does, based on the scraped context.")
    email: Optional[str] = Field(description="The email address if found, else null.")
    phone: Optional[str] = Field(default=None, description="The phone number if found, else null.")
    industry: Optional[str] = Field(description="The industry of the company.")
    confidence_score: float = Field(description="A score from 0.0 to 1.0 indicating how confident you are in this extraction.")
    draft_options: Optional[List[str]] = Field(default_factory=list, description="List of pre-generated email drafts.")
    final_draft: Optional[str] = Field(default=None, description="The final approved draft chosen by the user.")


class LeadExtractionResult(BaseModel):
    leads: List[ExtractedLead]
