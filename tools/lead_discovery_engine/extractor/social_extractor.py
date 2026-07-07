from bs4 import BeautifulSoup

from tools.lead_discovery_engine.scraper.playwright_scraper import PlaywrightScraper
from tools.lead_discovery_engine.schemas.lead_schema import SocialLinks


class SocialExtractor:
    """
    Extracts official social media links
    directly from the company homepage.
    """

    def __init__(self):

        self.scraper = PlaywrightScraper()

    def extract(
        self,
        homepage_url: str,
    ) -> SocialLinks:

        social = SocialLinks()

        html = self.scraper.scrape(homepage_url)

        if not html:
            return social

        soup = BeautifulSoup(html, "html.parser")

        for link in soup.find_all("a", href=True):

            href = link["href"].strip().lower()

            if (
                social.linkedin is None
                and "linkedin.com" in href
            ):
                social.linkedin = href

            elif (
                social.twitter is None
                and (
                    "twitter.com" in href
                    or "x.com" in href
                )
            ):
                social.twitter = href

            elif (
                social.facebook is None
                and "facebook.com" in href
            ):
                social.facebook = href

            elif (
                social.youtube is None
                and "youtube.com" in href
            ):
                social.youtube = href

        self.scraper.close_browser()

        return social