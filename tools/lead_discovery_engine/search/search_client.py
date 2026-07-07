from typing import List, Optional

from tools.lead_discovery_engine.schemas.search_schema import SearchResult
from tools.lead_discovery_engine.search.query_builder import QueryBuilder
from tools.lead_discovery_engine.search.providers.duckduckgo_provider import DuckDuckGoProvider
from tools.lead_discovery_engine.search.result_filter import SearchResultFilter


class SearchClient:
    """
    Orchestrates the complete search pipeline.

    Responsibilities:
    - Generate search queries
    - Execute searches
    - Merge search results
    - Remove duplicate URLs
    - Filter irrelevant websites
    """

    def __init__(self, max_queries: int = 10):
        self.query_builder = QueryBuilder(max_queries=max_queries)
        self.provider = DuckDuckGoProvider()
        self.result_filter = SearchResultFilter()

    def search(
        self,
        industry: str,
        location: str,
        designation: str,
        company_size: Optional[str] = None,
        keywords: Optional[List[str]] = None,
    ) -> List[SearchResult]:

        # Generate search queries
        queries = self.query_builder.build_queries(
            industry=industry,
            location=location,
            designation=designation,
            company_size=company_size,
            keywords=keywords,
        )

        all_results: List[SearchResult] = []
        seen_urls = set()

        # Search each query
        for query in queries:

            results = self.provider.search(query)

            for result in results:

                url = str(result.url)

                # Skip duplicate URLs
                if url in seen_urls:
                    continue

                seen_urls.add(url)
                all_results.append(result)

        # Filter unwanted results
        filtered_results = self.result_filter.filter(all_results)

        return filtered_results