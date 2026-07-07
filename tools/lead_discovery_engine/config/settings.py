import os

from config.env_loader import _is_placeholder, load_project_env

load_project_env()


class Settings:

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    def is_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY and not _is_placeholder(self.GEMINI_API_KEY))


settings = Settings()
