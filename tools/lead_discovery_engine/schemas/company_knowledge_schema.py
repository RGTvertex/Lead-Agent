from typing import List, Optional

from pydantic import BaseModel, HttpUrl, Field

from tools.lead_discovery_engine.schemas.page_schema import DiscoveredPage


class CompanyKnowledge(BaseModel):
    """
    Stores all knowledge collected from a company website
    during the crawling process.
    """

    # Homepage information
    homepage_url: HttpUrl
    homepage_text: Optional[str] = None

    # Combined cleaned content from all crawled pages
    merged_text: Optional[str] = None

    # Pages that were successfully crawled
    crawled_pages: List[DiscoveredPage] = Field(default_factory=list)

    # Crawl statistics
    crawl_status: str = "completed"
    total_pages_discovered: int = 0
    total_pages_crawled: int = 0

    # Crawl timestamps
    crawl_started_at: Optional[str] = None
    crawl_completed_at: Optional[str] = None