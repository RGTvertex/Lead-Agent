from typing import List

from ddgs import DDGS

from tools.lead_discovery_engine.schemas.search_schema import SearchResult


class DuckDuckGoProvider:
    """
    Searches DuckDuckGo and converts the results into
    our internal SearchResult schema.
    """

    def search(self, query: str, max_results: int = 10) -> List[SearchResult]:
        results: List[SearchResult] = []

        try:
            with DDGS() as ddgs:

                # Fetch search results
                search_results = list(
                    ddgs.text(
                        query=query,
                        max_results=max_results,
                    )
                )

                # Debug (temporary)
                print("\nRaw DuckDuckGo Response:\n")
                print(search_results)

                # Convert to our SearchResult schema
                for rank, item in enumerate(search_results, start=1):

                    result = SearchResult(
                        title=item.get("title", ""),
                        url=item.get("href", ""),
                        snippet=item.get("body", ""),
                        source="DuckDuckGo",
                        query=query,
                        rank=rank,
                    )

                    results.append(result)

        except Exception as e:
            print(f"\nDuckDuckGo Search Error: {e}")

        return results