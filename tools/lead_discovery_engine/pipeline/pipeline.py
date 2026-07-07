from urllib.parse import urlparse

from tools.lead_discovery_engine.discovery.multi_page_crawler import MultiPageCrawler
from tools.lead_discovery_engine.extractor.extractor import Extractor
from tools.lead_discovery_engine.extractor.regex_extractor import RegexExtractor
from tools.lead_discovery_engine.schemas.lead_schema import Contact, Lead
from tools.lead_discovery_engine.utils.logger import get_logger
from tools.lead_discovery_engine.validator.lead_validator import LeadValidator

logger = get_logger(__name__)


class LeadDiscoveryPipeline:
    """
    Orchestrates the complete Lead Discovery Engine.

    Pipeline:

    Website
        ->
    Multi Page Crawler
        ->
    Extractor
        ->
    Validator
        ->
    Lead Object
    """

    def __init__(self):

        self.crawler = MultiPageCrawler()
        self.extractor = Extractor()
        self.validator = LeadValidator()
        self.regex = RegexExtractor()

    def _build_fallback_lead(
        self,
        homepage_url: str,
        merged_text: str,
    ) -> Lead:
        domain = urlparse(homepage_url).netloc.replace("www.", "")
        company_name = domain.split(".")[0].replace("-", " ").replace("_", " ").strip().title()

        contacts = [
            Contact(email=email)
            for email in self.regex.extract_emails(merged_text)[:5]
        ]
        contacts.extend(
            Contact(phone=phone)
            for phone in self.regex.extract_phones(merged_text)[:5]
        )

        return Lead(
            company_name=company_name or domain or homepage_url,
            website=homepage_url,
            description=merged_text[:500].strip() or None,
            contacts=contacts,
        )

    def run(
        self,
        homepage_url: str,
    ) -> Lead:

        logger.debug("==========================================")
        logger.debug("Lead Discovery Pipeline Started")
        logger.debug(f"Target URL: {homepage_url}")
        logger.debug("==========================================")

        target_url = homepage_url
        if not target_url:
            raise ValueError("A homepage_url must be provided.")

        merged_text = self.crawler.crawl(
            homepage_url=target_url
        )

        if not merged_text:
            raise RuntimeError(
                "Website crawling failed."
            )

        logger.debug("Website Crawling Completed.")

        try:
            lead = self.extractor.extract(
                text=merged_text,
                website=homepage_url,
            )
        except Exception as e:
            logger.warning(
                "AI extraction failed for %s. Falling back to regex/domain-based extraction. Error: %s",
                homepage_url,
                e,
            )
            lead = self._build_fallback_lead(
                homepage_url=homepage_url,
                merged_text=merged_text,
            )

        try:
            lead = self.validator.validate(
                lead=lead,
                source_text=merged_text,
            )
        except Exception as e:
            logger.warning(
                "Lead validation failed for %s. Returning partially extracted lead. Error: %s",
                homepage_url,
                e,
            )

        logger.debug("Lead Extraction Completed.")

        logger.debug("==========================================")
        logger.debug("Pipeline Finished Successfully")
        logger.debug("==========================================")

        return lead
