from urllib.parse import urlparse

from tools.lead_discovery_engine.schemas.search_schema import SearchResult


class SearchResultFilter:
    """
    Filters irrelevant search results before scraping.
    """

    BLOCKED_DOMAINS = {

        # Social Media
        "linkedin.com",
        "facebook.com",
        "instagram.com",
        "twitter.com",
        "x.com",
        "youtube.com",
        "reddit.com",
        "quora.com",

        # Job / Review Platforms
        "glassdoor.com",
        "ambitionbox.com",
        "indeed.com",
        "naukri.com",
        "monster.com",
        "foundit.in",

        # Business Directories
        "justdial.com",
        "indiamart.com",
        "yellowpages.com",
        "dnb.com",
        "aeroleads.com",
        "easyleadz.com",

        # Startup / Company Directories
        "wellfound.com",
        "f6s.com",
        "tracxn.com",
        "beststartup.in",

        # Blog / Listing Sites
        "builtin.com",
        "tiimagazine.com",
    }

    BLOCKED_KEYWORDS = {
        "top 10",
        "top 20",
        "top 50",
        "top 100",
        "best companies",
        "companies to know",
        "list of",
        "directory",
        "reviews",
        "review",
        "salary",
        "jobs",
        "job",
        "career",
        "careers",
        "blog",
        "ranking",
        "rankings",
    }

    def filter(self, results: list[SearchResult]) -> list[SearchResult]:

        filtered: list[SearchResult] = []
        seen_domains = set()

        for result in results:

            url = str(result.url)

            # Skip invalid URLs
            if not url.startswith(("http://", "https://")):
                continue

            domain = urlparse(url).netloc.lower().replace("www.", "")

            title = result.title.lower().strip()
            snippet = result.snippet.lower().strip()

            # Skip empty titles
            if not title:
                continue

            # Block unwanted domains
            if any(blocked in domain for blocked in self.BLOCKED_DOMAINS):
                continue

            # Block unwanted keywords
            combined_text = f"{title} {snippet}"

            if any(keyword in combined_text for keyword in self.BLOCKED_KEYWORDS):
                continue

            # Keep only one result per domain
            if domain in seen_domains:
                continue

            seen_domains.add(domain)
            filtered.append(result)

        return filtered