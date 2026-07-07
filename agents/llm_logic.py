# agents/llm_logic.py (or you can put this directly inside your node files)
from langchain_core.prompts import ChatPromptTemplate
from agents.schemas import LeadExtractionResult
from config.llm_config import get_llm

# 1. INITIALIZE THE BRAIN
# We use gemini-2.5-flash for speed and large context windows

llm = get_llm(temperature=0.1)

# Bind the LLM to our strict JSON schema
structured_llm = llm.with_structured_output(LeadExtractionResult)

# 2. DISCOVERY PROMPT (Extracting from Text)

extraction_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an elite B2B Lead Generation Agent. 
    Your job is to analyze raw text scraped from websites or search engines and extract precise lead information.
    
    CRITICAL RULES:
    1. Extract ONLY information present in the text. Do NOT hallucinate or guess emails.
    2. If a field is missing, leave it as 'Unknown' or null.
    3. Calculate a confidence_score based on how clear the data is (0.9 for clear contact pages, 0.4 for vague mentions).
    4. Provide a 1-2 sentence `company_description` summarizing what the company does based on the text."""),
    ("human", "Here is the target criteria: {target_criteria}\n\nHere is the raw scraped text to analyze:\n{raw_html_text}")
])

extraction_chain = extraction_prompt | structured_llm

def extract_leads_from_text(raw_text: str, criteria: str) -> dict:
    """
    Called by the Discovery Agent after Dev 2's scraper finishes.
    """
    print("[LLM] Analyzing raw text and extracting structured JSON...")
    result = extraction_chain.invoke({
        "target_criteria": criteria,
        "raw_html_text": raw_text
    })
    # Convert Pydantic objects back to standard dicts for LangGraph state
    return [lead.model_dump() for lead in result.leads]
# 3. QUALIFICATION PROMPT (Cleaning & Standardizing)
qualifier_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a Data Quality Agent.
    Your job is to review a list of extracted leads and perform data validation as per our system requirements:
    
    1. Standardize formatting (e.g., proper capitalization of names and companies).
    2. Ensure structural data is consistent.
    3. Remove leads that are completely incomplete (e.g., missing both email and phone).
    4. DO NOT drop generic emails (info@, sales@, etc.) as they are still valid contact points.
    5. DO NOT drop leads just because they seem irrelevant to the niche; only drop them if the data itself is malformed or hallucinated.
    
    Return the cleaned list of valid leads."""),
    ("human", "Target Criteria: {target_criteria}\n\nLeads to Review:\n{leads_json}")
])

# For qualification, we can reuse the same schema since the output structure is the same
qualifier_chain = qualifier_prompt | structured_llm

def qualify_leads_with_llm(leads: list, criteria: str) -> list:
    """
    Called by the Qualifier Agent before checking the Graph DB.
    """
    print("[LLM] Standardizing and qualifying extracted leads...")
    if not leads:
        return []
        
    result = qualifier_chain.invoke({
        "target_criteria": criteria,
        "leads_json": str(leads)
    })
    return [lead.model_dump() for lead in result.leads]