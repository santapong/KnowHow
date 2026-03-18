"""Configuration via environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    # LLM provider: "openai", "anthropic", "ollama", or any OpenAI-compatible
    llm_provider: str = "openai"

    # API keys (use whichever matches your provider)
    api_key: str = ""
    api_base_url: str = ""

    # Model names
    llm_model: str = ""
    embedding_model: str = ""

    # Document processing
    chunk_size: int = 512
    chunk_overlap: int = 50

    # RAG settings
    hyde_num_hypotheticals: int = 3
    top_k: int = 5


# Default models per provider
_PROVIDER_DEFAULTS = {
    "openai": {
        "api_base_url": "https://api.openai.com/v1",
        "llm_model": "gpt-4o-mini",
        "embedding_model": "text-embedding-3-small",
    },
    "anthropic": {
        "api_base_url": "https://api.anthropic.com",
        "llm_model": "claude-sonnet-4-20250514",
        "embedding_model": "",  # Anthropic has no embedding API; uses local fallback
    },
    "ollama": {
        "api_base_url": "http://localhost:11434",
        "llm_model": "llama3.2",
        "embedding_model": "nomic-embed-text",
    },
}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    provider = os.environ.get("LLM_PROVIDER", "openai").lower()
    defaults = _PROVIDER_DEFAULTS.get(provider, _PROVIDER_DEFAULTS["openai"])

    # Support legacy OPENAI_API_KEY for backward compat
    api_key = os.environ.get("API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")
    if provider == "anthropic" and not api_key:
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")

    return Settings(
        llm_provider=provider,
        api_key=api_key,
        api_base_url=os.environ.get("API_BASE_URL", "")
            or os.environ.get("OPENAI_BASE_URL", "")
            or defaults["api_base_url"],
        llm_model=os.environ.get("LLM_MODEL", "") or defaults["llm_model"],
        embedding_model=os.environ.get("EMBEDDING_MODEL", "") or defaults["embedding_model"],
        chunk_size=int(os.environ.get("CHUNK_SIZE", "512")),
        chunk_overlap=int(os.environ.get("CHUNK_OVERLAP", "50")),
        hyde_num_hypotheticals=int(os.environ.get("HYDE_NUM_HYPOTHETICALS", "3")),
        top_k=int(os.environ.get("TOP_K", "5")),
    )
