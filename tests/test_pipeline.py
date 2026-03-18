"""Tests for the combined pipeline."""

from __future__ import annotations

from knowhow.documents import chunk_text
from knowhow.embeddings import VectorStore, SearchResult


def test_chunk_text_basic():
    text = "First sentence. Second sentence. Third sentence. Fourth sentence."
    chunks = chunk_text(text, chunk_size=40, overlap=10)
    assert len(chunks) >= 1
    assert all(c.text for c in chunks)


def test_chunk_text_preserves_content():
    text = "Hello world. This is a test."
    chunks = chunk_text(text, chunk_size=1000, overlap=0)
    assert len(chunks) == 1
    assert "Hello world" in chunks[0].text
    assert "This is a test" in chunks[0].text


def test_vector_store_add_and_search():
    vs = VectorStore(dimension=3)
    vs.add(
        texts=["cat", "dog", "car"],
        embeddings=[[1.0, 0.0, 0.0], [0.9, 0.1, 0.0], [0.0, 0.0, 1.0]],
    )

    # Search for something similar to "cat"
    results = vs.search([1.0, 0.0, 0.0], top_k=2)
    assert len(results) == 2
    assert results[0].text == "cat"
    assert results[1].text == "dog"


def test_vector_store_empty():
    vs = VectorStore(dimension=3)
    results = vs.search([1.0, 0.0, 0.0], top_k=5)
    assert results == []


def test_vector_store_save_load(tmp_path):
    vs = VectorStore(dimension=3)
    vs.add(
        texts=["hello", "world"],
        embeddings=[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]],
        metadatas=[{"id": 1}, {"id": 2}],
    )

    save_dir = str(tmp_path / "store")
    vs.save(save_dir)

    vs2 = VectorStore(dimension=3)
    vs2.load(save_dir)

    assert vs2.texts == ["hello", "world"]
    assert vs2.metadatas == [{"id": 1}, {"id": 2}]
    results = vs2.search([1.0, 0.0, 0.0], top_k=1)
    assert results[0].text == "hello"
