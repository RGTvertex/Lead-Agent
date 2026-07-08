import requests
from bs4 import BeautifulSoup
from typing import Optional

from tools.lead_discovery_engine.utils.logger import get_logger

logger = get_logger(__name__)

class PlaywrightScraper:
    """
    Downloads HTML from company websites using fast HTTP requests.
    (Kept the class name PlaywrightScraper for backward compatibility 
    with existing code that imports it).
    """

    def __init__(self, headless: bool = True):
        # Headless param kept for compatibility but ignored
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/137.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })

    def launch_browser(self):
        # No-op for compatibility
        pass

    def close_browser(self):
        # No-op for compatibility
        self.session.close()

    def scrape(
        self,
        url: str,
        timeout: int = 15000,
        retry_on_restart: bool = False,
    ) -> Optional[str]:
        """
        Fast HTML scraping using requests.
        Timeout is in milliseconds for compatibility with older code, converted to seconds.
        """
        timeout_seconds = max(timeout / 1000.0, 5.0) # minimum 5 seconds, usually 10-15s

        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        import logging
        logging.getLogger("trafilatura").setLevel(logging.CRITICAL)

        # Ensure URL has scheme
        if not url.startswith('http'):
            url = f"https://{url}"

        # 1. Try Tinyfish Fetch API first
        import os
        import httpx
        tinyfish_key = os.getenv("TINYFISH_API_KEY", "sk-tinyfish-hfIrIkzvQBqTKprprSHYy46nJasEYDL4")
        
        try:
            logger.debug(f"Attempting Tinyfish Fetch API for: {url}")
            fetch_url = "https://api.fetch.tinyfish.ai"
            headers = {
                "X-API-Key": tinyfish_key,
                "Content-Type": "application/json"
            }
            payload = {"urls": [url]}
            
            with httpx.Client(timeout=30) as client:
                resp = client.post(fetch_url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                
                results = data.get("results", [])
                if results and "text" in results[0] and results[0]["text"]:
                    markdown_text = results[0]["text"]
                    logger.debug(f"Successfully scraped via Tinyfish ({len(markdown_text):,} characters).")
                    return markdown_text
                else:
                    logger.warning(f"Tinyfish Fetch returned no text for {url}. Falling back to standard scraper.")
                    
        except Exception as e:
            logger.warning(f"Tinyfish Fetch API failed for {url} (Credits exhausted or error): {e}. Falling back...")

        # 2. Fallback to standard requests scraper
        try:
            logger.debug(f"Fallback Fast scraping: {url}")
            response = self.session.get(url, timeout=timeout_seconds, allow_redirects=True, verify=False)
            response.raise_for_status()

            html = response.text
            
            # Clean it up slightly with BeautifulSoup to remove scripts/styles
            soup = BeautifulSoup(html, "html.parser")
            for script in soup(["script", "style", "noscript", "meta", "link", "svg"]):
                script.extract()
                
            clean_html = str(soup)
            
            logger.debug(f"Successfully scraped via Fallback ({len(clean_html):,} characters).")
            return clean_html

        except requests.exceptions.Timeout:
            logger.warning(f"Timeout while fast scraping: {url}")
            return None
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Request error while scraping {url}: {str(e)}")
            return None
            
        except Exception as e:
            logger.warning(f"Unexpected error while scraping {url}: {e}")
            return None
