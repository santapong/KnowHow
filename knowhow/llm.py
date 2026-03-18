"""LLM client abstraction wrapping the OpenAI SDK."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

from openai import OpenAI

if TYPE_CHECKING:
    from knowhow.config import Settings


class LLMClient:
    """Thin wrapper around OpenAI-compatible chat and embedding APIs."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    def complete(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.0,
        max_retries: int = 3,
    ) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        for attempt in range(max_retries):
            try:
                resp = self._client.chat.completions.create(
                    model=self.settings.llm_model,
                    messages=messages,
                    temperature=temperature,
                )
                return resp.choices[0].message.content or ""
            except Exception:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)
        return ""

    def embed(self, texts: list[str], max_retries: int = 3) -> list[list[float]]:
        for attempt in range(max_retries):
            try:
                resp = self._client.embeddings.create(
                    model=self.settings.embedding_model,
                    input=texts,
                )
                return [item.embedding for item in resp.data]
            except Exception:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)
        return []
