from typing import List

from bs4 import BeautifulSoup

from tools.lead_discovery_engine.cleaner.html_cleaner import HTMLCleaner
from tools.lead_discovery_engine.discovery.link_discovery import LinkDiscovery
from tools.lead_discovery_engine.discovery.page_prioritizer import PagePrioritizer
from tools.lead_discovery_engine.extractor.regex_extractor import RegexExtractor
from tools.lead_discovery_engine.schemas.page_schema import DiscoveredPage
from tools.lead_discovery_engine.scraper.playwright_scraper import PlaywrightScraper


class MultiPageCrawler:
    """
    Crawls the most important pages of a company website
    and merges only the highest-signal content into one document.
    """

    PAGE_TEXT_LIMIT = 3500
    TOTAL_TEXT_LIMIT = 15000
    SIGNAL_LINE_LIMIT = 20
    KEY_PAGE_HINTS = {
        "contact": ("contact", "get-in-touch", "reach-us", "support"),
        "about": ("about", "company", "who-we-are"),
        "team": ("team", "leadership", "management", "founder", "people"),
    }
    SIGNAL_KEYWORDS = (
        "contact",
        "email",
        "phone",
        "call",
        "address",
        "office",
        "headquarters",
        "support",
        "sales",
    )

    def __init__(self):

        self.scraper = PlaywrightScraper()
        self.cleaner = HTMLCleaner()
        self.discovery = LinkDiscovery()
        self.prioritizer = PagePrioritizer()
        self.regex = RegexExtractor()

    def _trim_text(self, text: str, limit: int) -> str:
        text = (text or "").strip()
        if len(text) <= limit:
            return text
        return text[:limit].rsplit(" ", 1)[0].strip()

    def _extract_signals(self, html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        signal_lines: List[str] = []
        seen = set()

        def add_signal(line: str):
            normalized = " ".join(line.split())
            if not normalized:
                return
            key = normalized.lower()
            if key in seen:
                return
            seen.add(key)
            signal_lines.append(normalized)

        for link in soup.find_all("a", href=True):
            href = link["href"].strip()
            label = link.get_text(" ", strip=True)
            lower_href = href.lower()

            if lower_href.startswith("mailto:"):
                add_signal(f"Email link: {href.replace('mailto:', '', 1)}")
            elif lower_href.startswith("tel:"):
                add_signal(f"Phone link: {href.replace('tel:', '', 1)}")
            elif any(domain in lower_href for domain in ("linkedin.com", "twitter.com", "x.com", "facebook.com")):
                add_signal(f"Social link: {href}")
            elif label and any(keyword in label.lower() for keyword in self.SIGNAL_KEYWORDS):
                add_signal(f"Navigation hint: {label} -> {href}")

        visible_text = soup.get_text(separator="\n", strip=True)

        for email in self.regex.extract_emails(visible_text)[:5]:
            add_signal(f"Email found: {email}")

        for phone in self.regex.extract_phones(visible_text)[:5]:
            add_signal(f"Phone found: {phone}")

        for line in visible_text.splitlines():
            cleaned_line = " ".join(line.split())
            if not cleaned_line:
                continue
            lower_line = cleaned_line.lower()
            if "@" in cleaned_line or any(keyword in lower_line for keyword in self.SIGNAL_KEYWORDS):
                add_signal(cleaned_line)
            if len(signal_lines) >= self.SIGNAL_LINE_LIMIT:
                break

        return "\n".join(signal_lines[: self.SIGNAL_LINE_LIMIT])

    def _build_page_packet(self, page_label: str, page_url: str, html: str) -> str:
        cleaned_text = self._trim_text(
            self.cleaner.clean(html),
            self.PAGE_TEXT_LIMIT,
        )
        signal_text = self._extract_signals(html)

        sections = [f"[PAGE: {page_label}] {page_url}"]
        if signal_text:
            sections.append("[HIGH SIGNAL CONTACT DATA]")
            sections.append(signal_text)
        if cleaned_text:
            sections.append("[CLEAN PAGE CONTENT]")
            sections.append(cleaned_text)

        return "\n".join(sections).strip()

    def _select_priority_pages(
        self,
        prioritized: List[DiscoveredPage],
        max_pages: int,
    ) -> List[DiscoveredPage]:
        selected: List[DiscoveredPage] = []
        seen_urls = set()

        for hints in self.KEY_PAGE_HINTS.values():
            for page in prioritized:
                page_url = str(page.url).lower()
                page_url_key = str(page.url)
                if page_url_key in seen_urls:
                    continue
                if any(hint in page_url or hint in page.text.lower() for hint in hints):
                    selected.append(page)
                    seen_urls.add(page_url_key)
                    break

        for page in prioritized:
            if len(selected) >= max_pages:
                break
            page_url_key = str(page.url)
            if page_url_key in seen_urls:
                continue
            if page.score <= 0:
                continue
            selected.append(page)
            seen_urls.add(page_url_key)

        return selected[:max_pages]

    def crawl(
        self,
        homepage_url: str,
        max_pages: int = 4,
    ) -> str:

        homepage_html = self.scraper.scrape(homepage_url)

        if not homepage_html:
            self.scraper.close_browser()
            return ""

        discovered = self.discovery.discover(
            homepage_html,
            homepage_url,
        )

        prioritized = self.prioritizer.prioritize(discovered)
        selected_pages = self._select_priority_pages(
            prioritized=prioritized,
            max_pages=max_pages,
        )
        merged_content: List[str] = []

        homepage_packet = self._build_page_packet(
            page_label="homepage",
            page_url=homepage_url,
            html=homepage_html,
        )
        if homepage_packet:
            merged_content.append(homepage_packet)

        visited = set()

        for page in selected_pages:
            page_url = str(page.url)

            if page_url == homepage_url:
                continue
            if page_url in visited:
                continue

            html = self.scraper.scrape(page_url)
            if not html:
                continue

            page_packet = self._build_page_packet(
                page_label=page.text or "internal-page",
                page_url=page_url,
                html=html,
            )
            if page_packet:
                merged_content.append(page_packet)
            visited.add(page_url)

        self.scraper.close_browser()
        final_document = "\n\n".join(
            block for block in merged_content if block
        )
        final_document = self._trim_text(
            final_document,
            self.TOTAL_TEXT_LIMIT,
        )
        return final_document
