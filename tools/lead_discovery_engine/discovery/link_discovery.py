from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from tools.lead_discovery_engine.schemas.page_schema import DiscoveredPage


class LinkDiscovery:
    """
    Discovers internal links from a company's homepage.
    """

    def discover(self, html: str, base_url: str):

        soup = BeautifulSoup(html, "html.parser")

        discovered = []

        base_domain = urlparse(base_url).netloc

        seen = set()

        for tag in soup.find_all("a", href=True):

            href = tag["href"].strip()

            if not href:
                continue

            absolute = urljoin(base_url, href)

            parsed = urlparse(absolute)

            if parsed.netloc != base_domain:
                continue

            if absolute in seen:
                continue

            seen.add(absolute)

            discovered.append(
                DiscoveredPage(
                    url=absolute,
                    text=tag.get_text(strip=True),
                )
            )

        return discovered