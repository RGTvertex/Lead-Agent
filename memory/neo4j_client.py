import os
from typing import Any, Dict, List, Tuple

from neo4j import GraphDatabase

from config.env_loader import _is_placeholder, load_project_env

load_project_env()


class Neo4jMemoryClient:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.username = os.getenv("NEO4J_USERNAME")
        self.password = os.getenv("NEO4J_PASSWORD")
        self._driver = None

    def is_configured(self) -> bool:
        return False

    def _get_driver(self):
        if not self.is_configured():
            return None
        if self._driver is None:
            from neo4j.exceptions import AuthError
            try:
                driver = GraphDatabase.driver(
                    self.uri,
                    auth=(self.username, self.password),
                )
                driver.verify_connectivity()
                self._driver = driver
            except AuthError as exc:
                print(f"[Neo4j] Authentication failed: {exc}. Please check your credentials in .env. Falling back to in-memory mode.")
                # Unset uri to prevent repeated connection attempts in the same session
                self.uri = None
                return None
            except Exception as exc:
                print(f"[Neo4j] Connection failed: {exc}. Falling back to in-memory mode.")
                self.uri = None
                return None
        return self._driver

    def close(self):
        if self._driver is not None:
            self._driver.close()
            self._driver = None

    def filter_new_leads(self, leads: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        if not self.is_configured() or not leads:
            return leads, []

        fresh_leads: List[Dict[str, Any]] = []
        duplicate_leads: List[Dict[str, Any]] = []

        try:
            driver = self._get_driver()
            with driver.session() as session:
                for lead in leads:
                    email = lead.get("email")
                    company_name = lead.get("company_name")
                    result = session.run(
                        """
                        MATCH (lead:Lead)
                        WHERE ($email IS NOT NULL AND lead.email = $email)
                           OR ($company_name IS NOT NULL AND lead.company_name = $company_name)
                        RETURN lead.email AS email, lead.company_name AS company_name
                        LIMIT 1
                        """,
                        email=email,
                        company_name=company_name,
                    ).single()

                    if result:
                        duplicate_lead = dict(lead)
                        duplicate_lead["duplicate_reason"] = "Already exists in Neo4j"
                        duplicate_leads.append(duplicate_lead)
                    else:
                        fresh_leads.append(lead)
        except Exception as exc:
            print(f"[Neo4j] Deduplication unavailable, falling back to in-memory leads only: {exc}")
            return leads, []

        return fresh_leads, duplicate_leads

    def log_outreach(self, campaign_id: str, lead: Dict[str, Any], delivery_status: str, subject: str | None = None) -> None:
        if not self.is_configured():
            return

        try:
            driver = self._get_driver()
            with driver.session() as session:
                session.run(
                    """
                    MERGE (campaign:Campaign {id: $campaign_id})
                    MERGE (company:Company {name: coalesce($company_name, 'Unknown')})
                    SET company.industry = $industry
                    MERGE (lead:Lead {email: $email})
                    SET lead.full_name = $full_name,
                        lead.job_title = $job_title
                    MERGE (lead)-[:WORKS_AT]->(company)
                    MERGE (campaign)-[r:TARGETED]->(lead)
                    SET r.status = $delivery_status,
                        r.subject = $subject
                    """,
                    campaign_id=campaign_id,
                    email=lead.get("email"),
                    full_name=lead.get("full_name"),
                    job_title=lead.get("job_title"),
                    company_name=lead.get("company_name"),
                    industry=lead.get("industry"),
                    delivery_status=delivery_status,
                    subject=subject,
                )
        except Exception as exc:
            print(f"[Neo4j] Outreach logging skipped: {exc}")

    def create_lead_and_interaction(
        self,
        lead: Dict[str, Any],
        campaign_id: str,
        interaction_type: str = "EMAIL_SENT",
        metadata: Dict[str, Any] | None = None,
    ) -> None:
        """Creates or updates Lead, Company, and Campaign nodes with an interaction edge.
        
        This is the primary method called by the outreach writer after sending emails.
        It records the full graph: Campaign -[TARGETED]-> Lead -[WORKS_AT]-> Company
        with interaction metadata on the TARGETED edge.
        """
        if not self.is_configured():
            return

        metadata = metadata or {}

        try:
            driver = self._get_driver()
            with driver.session() as session:
                session.run(
                    """
                    MERGE (campaign:Campaign {id: $campaign_id})
                    MERGE (company:Company {name: coalesce($company_name, 'Unknown')})
                    SET company.industry = $industry
                    MERGE (lead:Lead {email: $email})
                    SET lead.full_name = $full_name,
                        lead.job_title = $job_title
                    MERGE (lead)-[:WORKS_AT]->(company)
                    MERGE (campaign)-[r:TARGETED]->(lead)
                    SET r.interaction_type = $interaction_type,
                        r.status = $status,
                        r.subject = $subject,
                        r.timestamp = datetime()
                    """,
                    campaign_id=campaign_id,
                    email=lead.get("email"),
                    full_name=lead.get("full_name"),
                    job_title=lead.get("job_title"),
                    company_name=lead.get("company_name"),
                    industry=lead.get("industry"),
                    interaction_type=interaction_type,
                    status=metadata.get("status", "unknown"),
                    subject=metadata.get("subject"),
                )
        except Exception as exc:
            print(f"[Neo4j] create_lead_and_interaction skipped: {exc}")

