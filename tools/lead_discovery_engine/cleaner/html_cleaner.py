from bs4 import BeautifulSoup
import trafilatura


class HTMLCleaner:
    """
    Cleans raw HTML before sending it to the extractor.
    """

    def clean(self, html: str) -> str:

        # ---------- Stage 1 ----------
        # Remove unwanted HTML elements

        soup = BeautifulSoup(html, "html.parser")

        for tag in soup(
            [
                "script",
                "style",
                "noscript",
                "svg",
                "iframe",
                "canvas",
            ]
        ):
            tag.decompose()

        cleaned_html = str(soup)

        # ---------- Stage 2 ----------
        # Extract meaningful text

        extracted = trafilatura.extract(
            cleaned_html,
            include_links=True,
            include_images=False,
            include_tables=True,
        )

        if extracted:

            return extracted

        # Fallback

        return soup.get_text(separator="\n", strip=True)