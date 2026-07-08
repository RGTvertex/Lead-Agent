from typing import Dict, Any

from agents.schemas import CampaignState
from tools.lead_discovery_engine.pipeline.pipeline import LeadDiscoveryPipeline


def lead_discoverer_node(state: CampaignState) -> Dict[str, Any]:
    target = state.get("target_criteria", "")
    location = state.get("location", None)
    niche = state.get("niche", None)
    platforms = state.get("platforms", None)
    max_leads = state.get("max_leads_per_day", 100)

    print(f"[Lead Discoverer] Searching for: {target} | Location: {location} | Niche: {niche} | Platforms: {platforms}")

    target_urls = []

    if target and target.startswith("http"):
        target_urls.append(target)
    else:
        print("[Lead Discoverer] Expanding search queries using LLM...")
        from config.llm_config import get_llm
        from pydantic import BaseModel, Field
        from typing import List
        from langchain_core.output_parsers import PydanticOutputParser
        from langchain_core.prompts import PromptTemplate

        class QueryExpansion(BaseModel):
            queries: List[str] = Field(description="A list of 3-5 highly optimized search queries to find company websites in the target niche and location. Include terms like 'startups', 'companies', 'incubators', 'accelerators', 'university spinoffs'.")

        llm = get_llm(temperature=0.7)
        parser = PydanticOutputParser(pydantic_object=QueryExpansion)

        prompt_template = PromptTemplate(
            template="Generate 3-5 search engine queries to find B2B '{niche}' in '{location}'. Your goal is to maximize the surface area to find their official company websites.\n\n{format_instructions}",
            input_variables=["niche", "location"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )

        chain = prompt_template | llm | parser

        try:
            expansion = chain.invoke({
                "niche": niche if niche else target,
                "location": location if location else "any location"
            })
            expanded_queries = expansion.queries
        except Exception as e:
            print(f"[Lead Discoverer] LLM Expansion failed: {e}. Falling back to basic query.")
            expanded_queries = [f"{niche if niche else target} in {location}" if location else f"{niche if niche else target}"]

        print(f"[Lead Discoverer] AI generated queries: {expanded_queries}")

        import httpx
        import urllib.parse
        from ddgs import DDGS
        import os
        
        tinyfish_key = os.getenv("TINYFISH_API_KEY", "sk-tinyfish-hfIrIkzvQBqTKprprSHYy46nJasEYDL4")

        for q in expanded_queries:
            if platforms:
                q += f" site:{platforms[0]}.com"
                
            query_success = False
            print(f"[Lead Discoverer] Searching Tinyfish API for: {q}")
            try:
                encoded_q = urllib.parse.quote(q)
                url = f"https://api.search.tinyfish.ai?query={encoded_q}"
                headers = {"X-API-Key": tinyfish_key}
                
                with httpx.Client(timeout=30) as client:
                    resp = client.get(url, headers=headers)
                    resp.raise_for_status()
                    data = resp.json()
                    results = data.get("results", [])
                    if results:
                        for res in results:
                            if "url" in res:
                                target_urls.append(res["url"])
                        query_success = True
                    else:
                        print(f"[Lead Discoverer] Tinyfish returned 0 results for '{q}'")
            except Exception as e:
                print(f"[Lead Discoverer] Tinyfish search failed for query '{q}': {e}")
                
            if not query_success:
                print(f"[Lead Discoverer] Fallback: Searching DDG for: {q}")
                try:
                    ddgs = DDGS()
                    results = ddgs.text(q, max_results=15)
                    for res in results:
                        target_urls.append(res["href"])
                except Exception as e:
                    print(f"[Lead Discoverer] DDG Search failed for query '{q}': {e}")

        target_urls = list(set(target_urls))
        # Removed hard limit of 10 to allow it to scrape until max_leads is reached
        print(f"[Lead Discoverer] Found {len(target_urls)} unique potential company URLs across all queries.")

    extracted_leads = []
    processed_companies = set()
    
    import concurrent.futures

    try:
        # Use a ThreadPoolExecutor with max_workers=1 to ensure Playwright runs in a pure thread 
        # (no asyncio loop) and stays in the same thread for all calls.
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            def init_pipeline():
                return LeadDiscoveryPipeline()
            
            # Initialize pipeline in the dedicated thread
            pipeline = executor.submit(init_pipeline).result()

            for url in target_urls:
                if len(extracted_leads) >= max_leads:
                    print(f"[Lead Discoverer] Reached required limit of {max_leads} leads. Stopping batch process.")
                    break

                print(f"\n[Lead Discoverer] Processing Company URL: {url}")
                try:
                    def run_pipeline(p, u):
                        return p.run(homepage_url=u)
                        
                    lead_obj = executor.submit(run_pipeline, pipeline, url).result()
                    lead_data = lead_obj.model_dump(mode="json")

                    company_name = lead_data.get("company_name", url)
                    if company_name in processed_companies:
                        continue

                    processed_companies.add(company_name)

                    contacts = lead_data.get("contacts", [])
                    if contacts:
                        for c in contacts:
                            if len(extracted_leads) >= max_leads:
                                break
                            
                            email = c.get('email')
                            if not email:
                                continue
                                
                            # Validate email format
                            try:
                                from email_validator import validate_email, EmailNotValidError
                                validate_email(email, check_deliverability=False)
                            except EmailNotValidError:
                                print(f"[Lead Discoverer] Skipped invalid email: {email}")
                                continue
                                
                            # Deduplicate against database
                            try:
                                from memory.neo4j_client import Neo4jMemoryClient
                                neo4j = Neo4jMemoryClient()
                                _, dups = neo4j.filter_new_leads([{"email": email, "company_name": company_name}])
                                if dups:
                                    print(f"[Lead Discoverer] Skipped duplicate lead: {email}")
                                    continue
                            except Exception as e:
                                pass
                                
                            # Sanitize names instead of showing "Unknown" or "None"
                            raw_name = c.get('name')
                            full_name = raw_name if raw_name and str(raw_name).lower() not in ["none", "unknown", "null", ""] else "Team"
                            
                            raw_job = c.get('designation')
                            job_title = raw_job if raw_job and str(raw_job).lower() not in ["none", "unknown", "null", ""] else "Contact"
    
                            extracted_leads.append({
                                "full_name": full_name,
                                "job_title": job_title,
                                "email": email,
                                "phone": c.get('phone'),
                                "company_name": company_name,
                                "industry": lead_data.get('industry', niche),
                                "confidence_score": 0.9 # Defaulted since pipeline passed it
                            })
                    else:
                        print(f"[Lead Discoverer] No contacts extracted for {company_name}, but the website was parsed successfully.")
    
                except Exception as e:
                    print(f"[Lead Discoverer] Skipped {url} due to error: {e}")
                    continue

    except Exception as e:
        print(f"[Lead Discoverer] Pipeline initialization failed: {e}")

    # No need to slice as the loop breaks automatically
    return {"raw_leads": extracted_leads, "current_status": "discovery_completed"}
