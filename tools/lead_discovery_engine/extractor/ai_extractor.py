from abc import ABC, abstractmethod

from tools.lead_discovery_engine.schemas.lead_schema import Lead


class AIExtractor(ABC):
    """
    Abstract interface for AI-based information extraction.
    """

    @abstractmethod
    def extract(
        self,
        text: str,
    ) -> Lead:
        pass