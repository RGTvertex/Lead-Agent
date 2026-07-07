from pydantic import BaseModel, HttpUrl


class SearchResult(BaseModel):
    """
    Standard search result used across all search providers.
    """

    title: str
    url: HttpUrl
    snippet: str

    source: str
    query: str

    rank: int