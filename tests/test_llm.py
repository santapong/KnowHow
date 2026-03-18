"""Tests for universal LLM client."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from knowhow.config import Settings
from knowhow.llm import LLMClient, _local_embed, OpenAIProvider, OllamaProvider, _PROVIDERS


def test_local_embed_returns_vectors():
    results = _local_embed(["hello world", "test document"])
    assert len(results) == 2
    assert len(results[0]) == 384
    assert len(results[1]) == 384
    # Vectors should be normalized
    import numpy as np
    for vec in results:
        norm = np.linalg.norm(vec)
        assert abs(norm - 1.0) < 0.01


def test_local_embed_different_texts_differ():
    results = _local_embed(["cats are great", "quantum physics equations"])
    import numpy as np
    similarity = np.dot(results[0], results[1])
    assert similarity < 0.99


def test_local_embed_same_text_identical():
    results = _local_embed(["hello", "hello"])
    assert results[0] == results[1]


def test_provider_registry_has_expected_keys():
    assert "openai" in _PROVIDERS
    assert "anthropic" in _PROVIDERS
    assert "ollama" in _PROVIDERS


def test_default_provider_is_openai():
    settings = Settings(llm_provider="openai", api_key="test-key")
    mock_provider = MagicMock()
    with patch.dict(_PROVIDERS, {"openai": lambda s: mock_provider}):
        client = LLMClient(settings)
        assert client._provider is mock_provider


def test_unknown_provider_falls_back_to_openai():
    settings = Settings(llm_provider="together", api_key="test-key",
                        api_base_url="https://api.together.xyz/v1")
    # Unknown providers fall back to OpenAIProvider
    with patch.object(OpenAIProvider, "__init__", return_value=None):
        client = LLMClient(settings)
        assert isinstance(client._provider, OpenAIProvider)


def test_anthropic_provider_selected():
    settings = Settings(llm_provider="anthropic", api_key="test-key")
    mock_provider = MagicMock()
    with patch.dict(_PROVIDERS, {"anthropic": lambda s: mock_provider}):
        client = LLMClient(settings)
        assert client._provider is mock_provider


def test_ollama_provider_selected():
    settings = Settings(llm_provider="ollama",
                        api_base_url="http://localhost:11434")
    mock_provider = MagicMock()
    with patch.dict(_PROVIDERS, {"ollama": lambda s: mock_provider}):
        client = LLMClient(settings)
        assert client._provider is mock_provider


def test_llm_client_retries_on_failure():
    settings = Settings(llm_provider="openai", api_key="test-key")
    mock_provider = MagicMock()
    mock_provider.complete.side_effect = [Exception("fail"), "success"]
    with patch.dict(_PROVIDERS, {"openai": lambda s: mock_provider}):
        client = LLMClient(settings)
        result = client.complete("test", max_retries=2)
        assert result == "success"
        assert mock_provider.complete.call_count == 2
