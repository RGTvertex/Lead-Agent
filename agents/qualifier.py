from typing import Dict, Any

from agents.schemas import CampaignState
from agents.llm_logic import qualify_leads_with_llm
from email_validator import validate_email, EmailNotValidError
from memory.neo4j_client import Neo4jMemoryClient

neo4j_memory = Neo4jMemoryClient()


def validate_lead_email(email: str) -> bool:
    if not email or email.strip().lower() == "unknown":
        return False
    try:
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError as e:
        print(f"    [!] Invalid email {email}: {str(e)}")
        return False


def qualifier_node(state: CampaignState) -> Dict[str, Any]:
    print("[Qualifier] Starting qualification process...")
    raw_leads = state.get("raw_leads", [])

    print(f"    Raw leads received: {len(raw_leads)}")
    unique_leads = {}
    for lead in raw_leads:
        key = lead.get("email") or f"{lead.get('full_name')}_{lead.get('company_name')}"
        if key not in unique_leads and key != "Unknown_Unknown":
            unique_leads[key] = lead

    deduped_leads = list(unique_leads.values())
    print(f"    After in-memory deduplication: {len(deduped_leads)}")

    print("[Qualifier] Standardizing & scoring leads using LLM in batches...")
    standardized_leads = []
    batch_size = 10
    
    try:
        for i in range(0, len(deduped_leads), batch_size):
            batch = deduped_leads[i:i + batch_size]
            print(f"    [Qualifier] Processing batch {i//batch_size + 1} ({len(batch)} leads)...")
            batch_standardized = qualify_leads_with_llm(
                batch,
                state["target_criteria"],
            )
            standardized_leads.extend(batch_standardized)
    except Exception as e:
        print(f"[Qualifier] LLM qualification failed on batch: {e}. Falling back to raw deduplicated leads for remaining.")
        # If a batch fails, we add whatever we successfully processed, plus the remaining unprocessed raw leads
        unprocessed = deduped_leads[len(standardized_leads):]
        standardized_leads.extend(unprocessed)

    print(f"    [Qualifier] LLM returned {len(standardized_leads)} leads out of {len(deduped_leads)}.")

    print("[Qualifier] Validating emails and applying confidence thresholds...")
    final_leads = []
    for lead in standardized_leads:
        email = lead.get("email")

        confidence = lead.get("confidence_score", 0.0)
        
        # Filter out extremely low confidence (hallucinated/vague)
        if confidence < 0.4:
            print(f"    [-] Dropping {lead.get('full_name')} (Low confidence: {confidence})")
            continue
        
        # Validate structurally
        if not validate_lead_email(email):
            print(f"    [-] Dropping {lead.get('full_name')} (Invalid/Missing email: {email})")
            continue

        lead["status"] = "Verified"
        final_leads.append(lead)

    final_leads, duplicate_leads = neo4j_memory.filter_new_leads(final_leads)
    if duplicate_leads:
        print(f"[Qualifier] Neo4j filtered out {len(duplicate_leads)} duplicate leads.")

    print(f"[Qualifier] Qualification complete. {len(final_leads)} leads approved for review.")
    return {
        "validated_leads": final_leads,
        "duplicate_leads": duplicate_leads,
        "current_status": "awaiting_approval",
    }
