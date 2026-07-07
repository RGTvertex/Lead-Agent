from typing import List, Optional


class QueryBuilder:
    """
    Generates optimized search queries for discovering
    official company websites.
    """

    SEARCH_TEMPLATES = [
        "{industry} company official website {location}",
        "{industry} official website {location}",
        "{industry} technology company {location}",
        "{industry} startup {location}",
        "{industry} company contact {location}",
        "{industry} company about us {location}",
        "{industry} headquarters {location}",
        "{industry} {designation} {location}",
        "{industry} leadership team {location}",
        "site:.com {industry} {location}",
        "site:.in {industry} {location}",
    ]

    def __init__(self, max_queries: int = 10):
        self.max_queries = max_queries

    def build_queries(
        self,
        industry: str,
        location: str,
        designation: str,
        company_size: Optional[str] = None,
        keywords: Optional[List[str]] = None,
    ) -> List[str]:

        queries = []

        # Generate queries from templates
        for template in self.SEARCH_TEMPLATES:
            queries.append(
                template.format(
                    industry=industry,
                    location=location,
                    designation=designation,
                )
            )

        # Company size query
        if company_size:
            queries.append(
                f"{industry} company {company_size} employees {location}"
            )

        # Additional keyword queries
        if keywords:
            for keyword in keywords:
                queries.append(
                    f"{industry} {keyword} {location}"
                )

        # Remove duplicates
        unique_queries = list(dict.fromkeys(queries))

        return unique_queries[: self.max_queries]