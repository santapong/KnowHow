"""Tests for knowledge graph construction and retrieval."""

from __future__ import annotations

from knowhow.documents import Chunk
from knowhow.graph.extract import Entity, ExtractionResult, Relationship
from knowhow.graph.store import KnowledgeGraph


def test_add_extraction_creates_nodes_and_edges():
    kg = KnowledgeGraph()
    result = ExtractionResult(
        entities=[
            Entity(name="python", type="TECHNOLOGY", description="A programming language"),
            Entity(name="guido van rossum", type="PERSON", description="Creator of Python"),
        ],
        relationships=[
            Relationship(
                source="guido van rossum",
                target="python",
                relation="CREATED",
                description="Guido created Python",
            ),
        ],
    )
    chunk = Chunk(text="Python was created by Guido van Rossum.", index=0)
    kg.add_extraction(result, chunk)

    assert kg.graph.number_of_nodes() == 2
    assert kg.graph.number_of_edges() == 1
    assert kg.get_entity("python") is not None
    assert kg.get_entity("python")["type"] == "TECHNOLOGY"


def test_merge_duplicate_entities():
    kg = KnowledgeGraph()
    chunk1 = Chunk(text="Chunk one about Python.", index=0)
    chunk2 = Chunk(text="Chunk two about Python.", index=1)

    result1 = ExtractionResult(
        entities=[Entity(name="python", type="TECHNOLOGY", description="A language")],
        relationships=[],
    )
    result2 = ExtractionResult(
        entities=[Entity(name="python", type="TECHNOLOGY", description="Used for AI")],
        relationships=[],
    )

    kg.add_extraction(result1, chunk1)
    kg.add_extraction(result2, chunk2)

    assert kg.graph.number_of_nodes() == 1
    entity = kg.get_entity("python")
    assert "A language" in entity["description"]
    assert "Used for AI" in entity["description"]
    assert len(entity["chunk_texts"]) == 2


def test_get_neighbors():
    kg = KnowledgeGraph()
    chunk = Chunk(text="Test", index=0)
    result = ExtractionResult(
        entities=[
            Entity(name="a", type="CONCEPT", description=""),
            Entity(name="b", type="CONCEPT", description=""),
            Entity(name="c", type="CONCEPT", description=""),
        ],
        relationships=[
            Relationship(source="a", target="b", relation="LINKS", description=""),
            Relationship(source="b", target="c", relation="LINKS", description=""),
        ],
    )
    kg.add_extraction(result, chunk)

    # Depth 1 from 'a' should get a and b
    sub = kg.get_neighbors("a", depth=1)
    assert set(sub.nodes()) == {"a", "b"}

    # Depth 2 from 'a' should get all
    sub = kg.get_neighbors("a", depth=2)
    assert set(sub.nodes()) == {"a", "b", "c"}


def test_get_related_chunks():
    kg = KnowledgeGraph()
    chunk = Chunk(text="Python is great.", index=0)
    result = ExtractionResult(
        entities=[Entity(name="python", type="TECHNOLOGY", description="")],
        relationships=[],
    )
    kg.add_extraction(result, chunk)

    chunks = kg.get_related_chunks("python")
    assert len(chunks) == 1
    assert chunks[0] == "Python is great."


def test_nonexistent_entity():
    kg = KnowledgeGraph()
    assert kg.get_entity("nonexistent") is None
    assert kg.get_related_chunks("nonexistent") == []
