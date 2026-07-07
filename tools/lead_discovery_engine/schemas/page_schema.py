from pydantic import BaseModel, HttpUrl


class DiscoveredPage(BaseModel):
    """
    Represents an internal page discovered from a company website.
    """

    url: HttpUrl
    text: str
    score: int = 0