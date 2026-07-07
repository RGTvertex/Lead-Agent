import os
from pathlib import Path

from dotenv import dotenv_values, load_dotenv

PLACEHOLDER_MARKERS = (
    "your_",
    "your-instance-id",
    "your-cluster-id",
    "placeholder",
    "example",
    "changeme",
)


def _is_placeholder(value: str | None) -> bool:
    if value is None:
        return True
    normalized = value.strip().strip('"').strip("'").lower()
    if not normalized:
        return True
    return any(marker in normalized for marker in PLACEHOLDER_MARKERS)


def load_project_env() -> None:
    current_dir = Path(__file__).resolve().parent
    workspace_env = current_dir.parent.parent / ".env"
    package_env = current_dir.parent / ".env"

    if workspace_env.exists():
        load_dotenv(dotenv_path=workspace_env, override=True)

    if package_env.exists():
        load_dotenv(dotenv_path=package_env, override=True)
        local_values = dotenv_values(package_env)
        for key, value in local_values.items():
            if value is None:
                continue
            existing = os.getenv(key)
            if existing is None or _is_placeholder(existing):
                if not _is_placeholder(value):
                    os.environ[key] = value


__all__ = ["load_project_env", "_is_placeholder"]
