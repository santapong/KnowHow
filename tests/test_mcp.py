"""Tests for the KnowHow MCP server."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from knowhow.config import Settings
from knowhow.mcp.server import (
    _get_pipeline,
    _reset_pipeline,
    knowhow_ingest_text,
    knowhow_ingest_files,
    knowhow_query,
    knowhow_graph_info,
    knowhow_get_entity,
    knowhow_save,
    knowhow_load,
    get_status,
    get_entities,
    create_server,
    mcp,
)


@pytest.fixture(autouse=True)
def reset_pipeline():
    """Reset the global pipeline before each test."""
    _reset_pipeline()
    yield
    _reset_pipeline()


@pytest.fixture
def mock_pipeline():
    """Create a mock pipeline for testing without API calls."""
    from knowhow.documents import Chunk
    from knowhow.graph.extract import Entity, ExtractionResult, Relationship
    from knowhow.graph.store import KnowledgeGraph
    from knowhow.embeddings import VectorStore

    pipeline = MagicMock()
    pipeline.chunks = []
    pipeline.knowledge_graph = KnowledgeGraph()
    pipeline.vector_store = VectorStore(dimension=3)
    pipeline.settings = Settings(llm_provider="openai", llm_model="test")

    # Patch _get_pipeline to return our mock
    import knowhow.mcp.server as server_mod
    server_mod._pipeline = pipeline
    return pipeline


class TestTools:
    """Test MCP tool functions."""

    def test_ingest_text(self, mock_pipeline):
        mock_pipeline.chunks = []

        def fake_ingest(text, source="inline"):
            mock_pipeline.chunks.extend([MagicMock()])
            mock_pipeline.knowledge_graph.graph.add_node(
                "test_entity", type="CONCEPT", description="test"
            )

        mock_pipeline.ingest_text = fake_ingest
        result = knowhow_ingest_text("Hello world", source="test")
        assert "1 new chunks" in result
        assert "test_entity" in str(mock_pipeline.knowledge_graph.graph.nodes())

    def test_ingest_files_missing(self, mock_pipeline):
        result = knowhow_ingest_files(["/nonexistent/file.txt"])
        assert "Error" in result
        assert "not found" in result

    def test_query_empty_kb(self, mock_pipeline):
        mock_pipeline.chunks = []
        result = knowhow_query("What is X?")
        assert "No documents" in result

    def test_query_invalid_method(self, mock_pipeline):
        mock_pipeline.chunks = [MagicMock()]
        result = knowhow_query("What is X?", method="invalid")
        assert "Invalid method" in result

    def test_query_success(self, mock_pipeline):
        mock_pipeline.chunks = [MagicMock()]

        from knowhow.graph.retrieve import RetrievalResult
        from knowhow.pipeline import Answer

        mock_pipeline.query.return_value = Answer(
            text="This is the answer.",
            sources=[
                RetrievalResult(text="Source chunk text", score=0.95, source="graph", entities=["test"])
            ],
            method="combined",
        )
        result = knowhow_query("What is X?")
        assert "This is the answer" in result
        assert "0.95" in result

    def test_graph_info_empty(self, mock_pipeline):
        result = knowhow_graph_info()
        assert "empty" in result.lower()

    def test_graph_info_with_data(self, mock_pipeline):
        mock_pipeline.knowledge_graph.graph.add_node(
            "python", type="TECHNOLOGY", description="A language"
        )
        mock_pipeline.knowledge_graph.graph.add_node(
            "guido", type="PERSON", description="Creator"
        )
        mock_pipeline.knowledge_graph.graph.add_edge("guido", "python", relation="CREATED")

        result = knowhow_graph_info()
        assert "2" in result  # 2 entities
        assert "TECHNOLOGY" in result
        assert "PERSON" in result

    def test_get_entity_not_found(self, mock_pipeline):
        result = knowhow_get_entity("nonexistent")
        assert "not found" in result

    def test_get_entity_with_suggestions(self, mock_pipeline):
        mock_pipeline.knowledge_graph.graph.add_node(
            "python", type="TECHNOLOGY", description="A language"
        )
        result = knowhow_get_entity("pyth")
        assert "Did you mean" in result
        assert "python" in result

    def test_get_entity_found(self, mock_pipeline):
        mock_pipeline.knowledge_graph.graph.add_node(
            "python", type="TECHNOLOGY", description="A programming language",
            source_chunks=["chunk_0"], chunk_texts=["Python is great."]
        )
        mock_pipeline.knowledge_graph.graph.add_node(
            "guido", type="PERSON", description="Creator"
        )
        mock_pipeline.knowledge_graph.graph.add_edge(
            "guido", "python", relation="CREATED", description="Guido created Python"
        )

        result = knowhow_get_entity("python")
        assert "TECHNOLOGY" in result
        assert "programming language" in result

    def test_save(self, mock_pipeline, tmp_path):
        mock_pipeline.save = MagicMock()
        result = knowhow_save(str(tmp_path / "data"))
        assert "saved" in result.lower()
        mock_pipeline.save.assert_called_once()

    def test_load_missing_dir(self, mock_pipeline):
        result = knowhow_load("/nonexistent/path")
        assert "Error" in result


class TestResources:
    """Test MCP resource functions."""

    def test_get_status(self, mock_pipeline):
        result = get_status()
        data = json.loads(result)
        assert "provider" in data
        assert "chunks_indexed" in data
        assert "entities" in data

    def test_get_entities(self, mock_pipeline):
        mock_pipeline.knowledge_graph.graph.add_node(
            "python", type="TECHNOLOGY", description="A language"
        )
        result = get_entities()
        data = json.loads(result)
        assert len(data) == 1
        assert data[0]["name"] == "python"


class TestServer:
    """Test server creation."""

    def test_create_server_returns_fastmcp(self):
        server = create_server()
        assert server is mcp

    def test_mcp_has_tools(self):
        # The server should have registered tools
        assert mcp is not None
        assert mcp.name == "KnowHow"
