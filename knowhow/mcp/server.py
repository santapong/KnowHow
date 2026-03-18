"""KnowHow MCP Server — expose Knowledge Graph RAG + HyDE as MCP tools.

Run with:
    python -m knowhow.mcp            # stdio transport (for Claude Desktop / Claude Code)
    python -m knowhow.mcp --sse      # SSE transport (for web clients)
    python -m knowhow.mcp --http     # Streamable HTTP transport

Tools exposed:
    - knowhow_ingest_text    — Ingest raw text into the knowledge base
    - knowhow_ingest_files   — Ingest files (txt, md, pdf, docx, csv, html, json, images)
    - knowhow_query          — Query the knowledge base with graph/hyde/combined methods
    - knowhow_graph_info     — Get knowledge graph statistics and entity list
    - knowhow_get_entity     — Look up a specific entity and its relationships
    - knowhow_save           — Save pipeline state to disk
    - knowhow_load           — Load pipeline state from disk

Resources exposed:
    - knowhow://status       — Current pipeline status
    - knowhow://entities     — List of all entities in the knowledge graph

Prompts exposed:
    - knowhow_analyze        — Analyze a document and answer questions about it
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from mcp.server.fastmcp import FastMCP

from knowhow.config import Settings, get_settings
from knowhow.pipeline import KnowHowPipeline

# ---------------------------------------------------------------------------
# Server instance
# ---------------------------------------------------------------------------

mcp = FastMCP(
    "KnowHow",
    instructions=(
        "KnowHow is a Knowledge Graph RAG system with HyDE augmentation. "
        "Use knowhow_ingest_text or knowhow_ingest_files to add documents, "
        "then knowhow_query to ask questions. The system uses two retrieval "
        "methods: knowledge graph traversal and hypothetical document embeddings."
    ),
)

# Global pipeline instance (lazy-initialized)
_pipeline: KnowHowPipeline | None = None


def _get_pipeline() -> KnowHowPipeline:
    """Get or create the global pipeline instance."""
    global _pipeline
    if _pipeline is None:
        _pipeline = KnowHowPipeline()
    return _pipeline


def _reset_pipeline() -> None:
    """Reset the pipeline (for testing or reconfiguration)."""
    global _pipeline
    _pipeline = None


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
def knowhow_ingest_text(
    text: str,
    source: str = "mcp_input",
) -> str:
    """Ingest raw text into the KnowHow knowledge base.

    The text will be chunked, embedded, and entities/relationships will be
    extracted to build the knowledge graph. Use this for pasting content
    directly — articles, notes, documentation, etc.

    Args:
        text: The text content to ingest.
        source: Optional label for the source of this text.

    Returns:
        Summary of what was ingested.
    """
    pipeline = _get_pipeline()
    chunk_count_before = len(pipeline.chunks)
    node_count_before = pipeline.knowledge_graph.graph.number_of_nodes()

    pipeline.ingest_text(text, source=source)

    new_chunks = len(pipeline.chunks) - chunk_count_before
    new_nodes = pipeline.knowledge_graph.graph.number_of_nodes() - node_count_before
    total_edges = pipeline.knowledge_graph.graph.number_of_edges()

    return (
        f"Ingested text from '{source}': "
        f"{new_chunks} new chunks, "
        f"{new_nodes} new entities discovered, "
        f"{pipeline.knowledge_graph.graph.number_of_nodes()} total entities, "
        f"{total_edges} total relationships."
    )


@mcp.tool()
def knowhow_ingest_files(
    file_paths: list[str],
) -> str:
    """Ingest files into the KnowHow knowledge base.

    Supports multiple formats:
    - Text/Markdown (.txt, .md)
    - Images (.png, .jpg, .gif, .webp) — uses vision LLM to extract content
    - PDF (.pdf) — requires pymupdf or pdfplumber
    - DOCX (.docx) — requires python-docx
    - CSV/TSV (.csv, .tsv)
    - HTML (.html, .htm) — requires beautifulsoup4
    - JSON/JSONL (.json, .jsonl)

    Args:
        file_paths: List of file paths to ingest.

    Returns:
        Summary of ingestion results.
    """
    pipeline = _get_pipeline()

    # Validate paths exist
    missing = [p for p in file_paths if not Path(p).exists()]
    if missing:
        return f"Error: Files not found: {', '.join(missing)}"

    chunk_count_before = len(pipeline.chunks)
    node_count_before = pipeline.knowledge_graph.graph.number_of_nodes()

    pipeline.ingest(file_paths)

    new_chunks = len(pipeline.chunks) - chunk_count_before
    new_nodes = pipeline.knowledge_graph.graph.number_of_nodes() - node_count_before

    return (
        f"Ingested {len(file_paths)} file(s): "
        f"{new_chunks} new chunks, "
        f"{new_nodes} new entities discovered, "
        f"{pipeline.knowledge_graph.graph.number_of_nodes()} total entities, "
        f"{pipeline.knowledge_graph.graph.number_of_edges()} total relationships."
    )


@mcp.tool()
def knowhow_query(
    question: str,
    method: str = "combined",
    top_k: int = 5,
) -> str:
    """Query the KnowHow knowledge base.

    Uses Knowledge Graph RAG and/or HyDE to find relevant context,
    then generates an answer using the LLM.

    Args:
        question: The question to answer.
        method: Retrieval method — "graph" (knowledge graph traversal),
                "hyde" (hypothetical document embeddings), or
                "combined" (both, default).
        top_k: Number of source chunks to retrieve (default 5).

    Returns:
        The answer with source information.
    """
    pipeline = _get_pipeline()

    if not pipeline.chunks:
        return "No documents have been ingested yet. Use knowhow_ingest_text or knowhow_ingest_files first."

    if method not in ("graph", "hyde", "combined"):
        return f"Invalid method '{method}'. Use 'graph', 'hyde', or 'combined'."

    answer = pipeline.query(question, method=method, top_k=top_k)

    # Format response
    sources_info = []
    for i, src in enumerate(answer.sources):
        sources_info.append(
            f"  [{i+1}] score={src.score:.3f} via={src.source}\n"
            f"      {src.text[:150]}..."
        )

    return (
        f"**Answer** (method: {answer.method}):\n\n"
        f"{answer.text}\n\n"
        f"**Sources** ({len(answer.sources)}):\n"
        + "\n".join(sources_info)
    )


@mcp.tool()
def knowhow_graph_info() -> str:
    """Get information about the current knowledge graph.

    Returns statistics and a list of all entities with their types.
    """
    pipeline = _get_pipeline()
    graph = pipeline.knowledge_graph.graph

    if graph.number_of_nodes() == 0:
        return "Knowledge graph is empty. Ingest some documents first."

    # Collect entity info
    entities_by_type: dict[str, list[str]] = {}
    for node in graph.nodes():
        data = graph.nodes[node]
        etype = data.get("type", "OTHER")
        entities_by_type.setdefault(etype, []).append(node)

    lines = [
        f"**Knowledge Graph Statistics:**",
        f"- Entities: {graph.number_of_nodes()}",
        f"- Relationships: {graph.number_of_edges()}",
        f"- Chunks indexed: {len(pipeline.chunks)}",
        f"",
        f"**Entities by type:**",
    ]
    for etype, entities in sorted(entities_by_type.items()):
        lines.append(f"  {etype} ({len(entities)}): {', '.join(sorted(entities)[:20])}")
        if len(entities) > 20:
            lines.append(f"    ... and {len(entities) - 20} more")

    return "\n".join(lines)


@mcp.tool()
def knowhow_get_entity(
    entity_name: str,
    depth: int = 1,
) -> str:
    """Look up an entity in the knowledge graph and its relationships.

    Args:
        entity_name: Name of the entity to look up (case-insensitive).
        depth: How many relationship hops to include (default 1).

    Returns:
        Entity details and its relationships.
    """
    pipeline = _get_pipeline()
    entity = pipeline.knowledge_graph.get_entity(entity_name)

    if not entity:
        # Suggest similar entities
        all_names = pipeline.knowledge_graph.get_all_entity_names()
        search = entity_name.lower()
        similar = [n for n in all_names if search in n or n in search][:5]
        msg = f"Entity '{entity_name}' not found."
        if similar:
            msg += f" Did you mean: {', '.join(similar)}?"
        return msg

    subgraph = pipeline.knowledge_graph.get_neighbors(entity_name, depth=depth)

    lines = [
        f"**Entity: {entity_name}**",
        f"- Type: {entity.get('type', 'OTHER')}",
        f"- Description: {entity.get('description', 'N/A')}",
        f"- Source chunks: {len(entity.get('chunk_texts', []))}",
        f"",
    ]

    # Show relationships
    edges = list(subgraph.edges(data=True))
    if edges:
        lines.append(f"**Relationships ({len(edges)}):**")
        for src, tgt, data in edges:
            rel = data.get("relation", "RELATED_TO")
            desc = data.get("description", "")
            lines.append(f"  {src} --[{rel}]--> {tgt}")
            if desc:
                lines.append(f"    {desc}")

    # Show neighbor entities
    neighbors = [n for n in subgraph.nodes() if n != entity_name.lower()]
    if neighbors:
        lines.append(f"")
        lines.append(f"**Connected entities ({len(neighbors)}):** {', '.join(sorted(neighbors))}")

    return "\n".join(lines)


@mcp.tool()
def knowhow_save(directory: str = "./knowhow_data") -> str:
    """Save the current pipeline state (vector store + knowledge graph) to disk.

    Args:
        directory: Directory to save to (default: ./knowhow_data).

    Returns:
        Confirmation message.
    """
    pipeline = _get_pipeline()
    pipeline.save(directory)
    return f"Pipeline state saved to '{directory}'."


@mcp.tool()
def knowhow_load(directory: str = "./knowhow_data") -> str:
    """Load pipeline state from disk.

    Args:
        directory: Directory to load from (default: ./knowhow_data).

    Returns:
        Confirmation with loaded stats.
    """
    pipeline = _get_pipeline()
    path = Path(directory)

    if not path.exists():
        return f"Error: Directory '{directory}' not found."

    pipeline.load(directory)
    graph = pipeline.knowledge_graph.graph

    return (
        f"Pipeline state loaded from '{directory}': "
        f"{graph.number_of_nodes()} entities, "
        f"{graph.number_of_edges()} relationships, "
        f"{pipeline.vector_store.index.ntotal} vectors."
    )


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------

@mcp.resource("knowhow://status")
def get_status() -> str:
    """Current status of the KnowHow pipeline."""
    pipeline = _get_pipeline()
    graph = pipeline.knowledge_graph.graph

    return json.dumps({
        "provider": pipeline.settings.llm_provider,
        "model": pipeline.settings.llm_model,
        "embedding_model": pipeline.settings.embedding_model or "(local fallback)",
        "chunks_indexed": len(pipeline.chunks),
        "entities": graph.number_of_nodes(),
        "relationships": graph.number_of_edges(),
        "vectors": pipeline.vector_store.index.ntotal,
    }, indent=2)


@mcp.resource("knowhow://entities")
def get_entities() -> str:
    """List of all entities in the knowledge graph."""
    pipeline = _get_pipeline()
    graph = pipeline.knowledge_graph.graph

    entities = []
    for node in graph.nodes():
        data = graph.nodes[node]
        entities.append({
            "name": node,
            "type": data.get("type", "OTHER"),
            "description": data.get("description", ""),
            "connections": graph.degree(node),
        })

    entities.sort(key=lambda e: e["connections"], reverse=True)
    return json.dumps(entities, indent=2)


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

@mcp.prompt()
def knowhow_analyze(document_text: str, questions: str = "") -> str:
    """Analyze a document by ingesting it and answering questions.

    Args:
        document_text: The document text to analyze.
        questions: Comma-separated list of questions to answer (optional).
    """
    prompt_parts = [
        "I have a document to analyze using the KnowHow knowledge base.",
        "",
        "First, ingest this text using the knowhow_ingest_text tool:",
        "",
        f"```\n{document_text}\n```",
        "",
    ]

    if questions:
        q_list = [q.strip() for q in questions.split(",") if q.strip()]
        prompt_parts.append("Then answer these questions using knowhow_query:")
        for q in q_list:
            prompt_parts.append(f"- {q}")
    else:
        prompt_parts.extend([
            "Then:",
            "1. Use knowhow_graph_info to show the extracted knowledge graph",
            "2. Use knowhow_query to answer: 'What are the main topics and concepts?'",
        ])

    return "\n".join(prompt_parts)


@mcp.prompt()
def knowhow_research(topic: str) -> str:
    """Research a topic using the knowledge base.

    Args:
        topic: The topic to research.
    """
    return (
        f"Research the topic: {topic}\n\n"
        f"1. Use knowhow_query with method='combined' to find relevant information about: {topic}\n"
        f"2. Use knowhow_graph_info to see what entities are related\n"
        f"3. For each key entity found, use knowhow_get_entity to explore its connections\n"
        f"4. Synthesize a comprehensive answer about {topic} based on all findings"
    )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def create_server(settings: Settings | None = None) -> FastMCP:
    """Create a configured MCP server instance.

    Args:
        settings: Optional settings override. If None, reads from env vars.

    Returns:
        The configured FastMCP server.
    """
    global _pipeline
    if settings:
        _pipeline = KnowHowPipeline(settings)
    return mcp
