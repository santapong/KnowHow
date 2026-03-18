"""Tests for HyDE retrieval."""

from __future__ import annotations

from unittest.mock import MagicMock

import numpy as np

from knowhow.embeddings import VectorStore
from knowhow.hyde.generator import HyDERetriever


def _make_mock_llm():
    llm = MagicMock()
    llm.complete.return_value = "This is a hypothetical answer about the topic."
    # Return 3-dimensional embeddings for testing
    llm.embed.return_value = [[0.5, 0.5, 0.0]]
    return llm


def test_hyde_generates_hypotheticals():
    llm = _make_mock_llm()
    vs = VectorStore(dimension=3)

    # Add some documents
    vs.add(
        texts=["Document about AI", "Document about cooking"],
        embeddings=[[0.6, 0.5, 0.1], [0.1, 0.1, 0.9]],
    )

    retriever = HyDERetriever(llm=llm, vector_store=vs, num_hypotheticals=2)
    results = retriever.retrieve("What is AI?", top_k=2)

    # Should have called complete twice for hypotheticals
    assert llm.complete.call_count == 2
    assert len(results) <= 2
    assert all(r.source == "hyde" for r in results)


def test_hyde_fallback_on_empty_hypotheticals():
    llm = MagicMock()
    llm.complete.return_value = ""  # Empty response
    llm.embed.return_value = [[0.5, 0.5, 0.0]]

    vs = VectorStore(dimension=3)
    vs.add(texts=["Doc"], embeddings=[[0.5, 0.5, 0.0]])

    retriever = HyDERetriever(llm=llm, vector_store=vs, num_hypotheticals=1)
    results = retriever.retrieve("test", top_k=1)

    assert len(results) == 1
    assert results[0].source == "hyde_fallback"
