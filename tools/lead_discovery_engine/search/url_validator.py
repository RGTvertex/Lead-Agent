import requests


class URLValidator:
    """
    Validates company URLs before scraping.
    """

    def validate(self, url: str, timeout: int = 5):

        try:

            response = requests.get(
                url,
                timeout=timeout,
                allow_redirects=True,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 "
                        "(Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 "
                        "(KHTML, like Gecko) "
                        "Chrome/137.0 Safari/537.36"
                    )
                },
            )

            if response.status_code == 200:

                return True, response.url

            return False, None

        except Exception:

            return False, None