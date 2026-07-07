def build_lead_extraction_prompt(text: str) -> str:
    """
    Builds the prompt used for AI-based lead extraction.
    """

    return f"""
You are an expert AI system for B2B Lead Generation.

Your task is to extract structured company information ONLY from the provided website content.
The website content may be split into labeled page blocks such as [PAGE: homepage] and [HIGH SIGNAL CONTACT DATA].
Always prioritize data that appears inside [HIGH SIGNAL CONTACT DATA] before using generic body text.

========================
STRICT RULES
========================

1. Return ONLY valid JSON.
2. Do NOT use markdown.
3. Do NOT wrap the response inside ```json.
4. Do NOT explain your reasoning.
5. Never invent or infer information.
6. Never use outside knowledge.
7. If information is not explicitly available in the website content, return null.
8. Do NOT create empty contact objects.
9. Extract only facts that are directly supported by the website content.

========================
EXTRACTION RULES
========================

Company Name:
- Extract the official company name.

Industry:
- Extract the industry only if explicitly mentioned.

Description:
- Provide a concise summary based only on the website content.

Address:
- Extract only official company addresses.
- If multiple addresses exist, prefer the headquarters or corporate office.

Contacts:
- Extract only valid contacts found in the website.
- Include name, designation, email and phone whenever available.
- If only a generic company email or phone is available, include it as a contact.
- Do NOT create empty contact entries.

Social Links:
- Extract only official company social media links.
- Supported platforms:
  - LinkedIn
  - Twitter / X
  - Facebook
  - YouTube
- If unavailable, return null.

========================
OUTPUT JSON
========================

{{
    "company_name": "",
    "industry": "",
    "description": "",
    "address": {{
        "country": null,
        "state": null,
        "city": null,
        "full_address": null
    }},
    "contacts": [],
    "social": {{
        "linkedin": null,
        "twitter": null,
        "facebook": null,
        "youtube": null
    }}
}}

========================
WEBSITE CONTENT
========================

{text}
"""
