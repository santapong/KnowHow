"""Universal LLM client supporting multiple providers.

Supported providers:
- openai: OpenAI API (GPT-4o, etc.) and any OpenAI-compatible API (vLLM, LiteLLM, Together, etc.)
- anthropic: Anthropic Claude API
- ollama: Local Ollama server
"""

from __future__ import annotations

import base64
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from knowhow.config import Settings


class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    def complete(self, prompt: str, system: str = "", temperature: float = 0.0) -> str: ...

    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]: ...

    def describe_image(self, image_path: str, prompt: str = "Describe this image in detail.") -> str:
        """Extract text/description from an image using vision capabilities.
        Override in providers that support vision.
        """
        raise NotImplementedError(f"{self.__class__.__name__} does not support vision")


class OpenAIProvider(LLMProvider):
    """OpenAI and any OpenAI-compatible API (vLLM, LiteLLM, Together, Groq, etc.)."""

    def __init__(self, settings: Settings) -> None:
        from openai import OpenAI
        self.settings = settings
        self._client = OpenAI(api_key=settings.api_key, base_url=settings.api_base_url)

    def complete(self, prompt: str, system: str = "", temperature: float = 0.0) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = self._client.chat.completions.create(
            model=self.settings.llm_model,
            messages=messages,
            temperature=temperature,
        )
        return resp.choices[0].message.content or ""

    def embed(self, texts: list[str]) -> list[list[float]]:
        resp = self._client.embeddings.create(
            model=self.settings.embedding_model,
            input=texts,
        )
        return [item.embedding for item in resp.data]

    def describe_image(self, image_path: str, prompt: str = "Describe this image in detail. Extract all text visible in the image.") -> str:
        b64 = base64.b64encode(Path(image_path).read_bytes()).decode()
        suffix = Path(image_path).suffix.lower().lstrip(".")
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                "gif": "image/gif", "webp": "image/webp"}.get(suffix, "image/png")
        resp = self._client.chat.completions.create(
            model=self.settings.llm_model,
            messages=[{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
            ]}],
            temperature=0.0,
        )
        return resp.choices[0].message.content or ""


class AnthropicProvider(LLMProvider):
    """Anthropic Claude API."""

    def __init__(self, settings: Settings) -> None:
        import anthropic
        self.settings = settings
        self._client = anthropic.Anthropic(api_key=settings.api_key)

    def complete(self, prompt: str, system: str = "", temperature: float = 0.0) -> str:
        kwargs = {"model": self.settings.llm_model, "max_tokens": 4096,
                  "messages": [{"role": "user", "content": prompt}]}
        if system:
            kwargs["system"] = system
        if temperature > 0:
            kwargs["temperature"] = temperature
        resp = self._client.messages.create(**kwargs)
        return resp.content[0].text if resp.content else ""

    def embed(self, texts: list[str]) -> list[list[float]]:
        # Anthropic has no embedding API — use a lightweight local fallback
        return _local_embed(texts)

    def describe_image(self, image_path: str, prompt: str = "Describe this image in detail. Extract all text visible in the image.") -> str:
        import anthropic
        b64 = base64.b64encode(Path(image_path).read_bytes()).decode()
        suffix = Path(image_path).suffix.lower().lstrip(".")
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                "gif": "image/gif", "webp": "image/webp"}.get(suffix, "image/png")
        resp = self._client.messages.create(
            model=self.settings.llm_model,
            max_tokens=4096,
            messages=[{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image", "source": {"type": "base64", "media_type": mime, "data": b64}},
            ]}],
        )
        return resp.content[0].text if resp.content else ""


class OllamaProvider(LLMProvider):
    """Local Ollama server."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = settings.api_base_url.rstrip("/")

    def complete(self, prompt: str, system: str = "", temperature: float = 0.0) -> str:
        import urllib.request
        import json
        payload = {
            "model": self.settings.llm_model,
            "prompt": f"{system}\n\n{prompt}" if system else prompt,
            "stream": False,
            "options": {"temperature": temperature},
        }
        req = urllib.request.Request(
            f"{self.base_url}/api/generate",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read()).get("response", "")

    def embed(self, texts: list[str]) -> list[list[float]]:
        import urllib.request
        import json
        if not self.settings.embedding_model:
            return _local_embed(texts)
        results = []
        for text in texts:
            payload = {"model": self.settings.embedding_model, "prompt": text}
            req = urllib.request.Request(
                f"{self.base_url}/api/embeddings",
                data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())
                results.append(data.get("embedding", []))
        return results

    def describe_image(self, image_path: str, prompt: str = "Describe this image in detail. Extract all text visible in the image.") -> str:
        import urllib.request
        import json
        b64 = base64.b64encode(Path(image_path).read_bytes()).decode()
        payload = {
            "model": self.settings.llm_model,
            "prompt": prompt,
            "images": [b64],
            "stream": False,
        }
        req = urllib.request.Request(
            f"{self.base_url}/api/generate",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read()).get("response", "")


def _local_embed(texts: list[str]) -> list[list[float]]:
    """Simple TF-IDF-style local embeddings as fallback when no embedding API is available."""
    import hashlib
    import numpy as np

    dim = 384
    results = []
    for text in texts:
        words = text.lower().split()
        vec = np.zeros(dim, dtype=np.float32)
        for word in words:
            h = int(hashlib.sha256(word.encode()).hexdigest(), 16)
            indices = [(h >> (i * 8)) % dim for i in range(3)]
            for idx in indices:
                vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        results.append(vec.tolist())
    return results


_PROVIDERS = {
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "ollama": OllamaProvider,
}


class LLMClient:
    """Unified LLM client that delegates to the configured provider.

    Supports: OpenAI, Anthropic (Claude), Ollama, and any OpenAI-compatible API.
    Set LLM_PROVIDER env var to choose (default: "openai").
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        provider_name = settings.llm_provider.lower()

        # Any unknown provider name is treated as OpenAI-compatible
        provider_cls = _PROVIDERS.get(provider_name, OpenAIProvider)
        self._provider = provider_cls(settings)

    def complete(
        self,
        prompt: str,
        system: str = "",
        temperature: float = 0.0,
        max_retries: int = 3,
    ) -> str:
        for attempt in range(max_retries):
            try:
                return self._provider.complete(prompt, system, temperature)
            except Exception:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)
        return ""

    def embed(self, texts: list[str], max_retries: int = 3) -> list[list[float]]:
        for attempt in range(max_retries):
            try:
                return self._provider.embed(texts)
            except Exception:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)
        return []

    def describe_image(
        self,
        image_path: str,
        prompt: str = "Describe this image in detail. Extract all text visible in the image.",
        max_retries: int = 3,
    ) -> str:
        for attempt in range(max_retries):
            try:
                return self._provider.describe_image(image_path, prompt)
            except Exception:
                if attempt == max_retries - 1:
                    raise
                time.sleep(2 ** attempt)
        return ""
