"""NetworkX-based knowledge graph store."""

from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING

import networkx as nx

if TYPE_CHECKING:
    from knowhow.documents import Chunk
    from knowhow.graph.extract import ExtractionResult


class KnowledgeGraph:
    """Directed graph storing entities as nodes and relationships as edges."""

    def __init__(self) -> None:
        self.graph = nx.DiGraph()

    def add_extraction(self, result: ExtractionResult, source_chunk: Chunk) -> None:
        """Add extracted entities and relationships to the graph.

        Merges with existing nodes/edges if they already exist.
        """
        chunk_ref = f"chunk_{source_chunk.index}"

        for entity in result.entities:
            if self.graph.has_node(entity.name):
                node = self.graph.nodes[entity.name]
                chunks = node.get("source_chunks", [])
                if chunk_ref not in chunks:
                    chunks.append(chunk_ref)
                node["source_chunks"] = chunks
                # Append description if new info
                if entity.description and entity.description not in node.get("description", ""):
                    node["description"] = f"{node.get('description', '')} {entity.description}".strip()
            else:
                self.graph.add_node(
                    entity.name,
                    type=entity.type,
                    description=entity.description,
                    source_chunks=[chunk_ref],
                    chunk_texts=[source_chunk.text],
                )

            # Store chunk text for retrieval
            node = self.graph.nodes[entity.name]
            chunk_texts = node.get("chunk_texts", [])
            if source_chunk.text not in chunk_texts:
                chunk_texts.append(source_chunk.text)
            node["chunk_texts"] = chunk_texts

        for rel in result.relationships:
            # Ensure both nodes exist
            for name in (rel.source, rel.target):
                if not self.graph.has_node(name):
                    self.graph.add_node(
                        name,
                        type="OTHER",
                        description="",
                        source_chunks=[chunk_ref],
                        chunk_texts=[source_chunk.text],
                    )

            if self.graph.has_edge(rel.source, rel.target):
                edge = self.graph.edges[rel.source, rel.target]
                chunks = edge.get("source_chunks", [])
                if chunk_ref not in chunks:
                    chunks.append(chunk_ref)
                edge["source_chunks"] = chunks
            else:
                self.graph.add_edge(
                    rel.source,
                    rel.target,
                    relation=rel.relation,
                    description=rel.description,
                    source_chunks=[chunk_ref],
                )

    def get_entity(self, name: str) -> dict | None:
        name = name.lower().strip()
        if self.graph.has_node(name):
            return dict(self.graph.nodes[name])
        return None

    def get_neighbors(self, name: str, depth: int = 1) -> nx.DiGraph:
        """Get the local subgraph around an entity up to a given depth."""
        name = name.lower().strip()
        if not self.graph.has_node(name):
            return nx.DiGraph()

        nodes = {name}
        frontier = {name}
        for _ in range(depth):
            next_frontier = set()
            for n in frontier:
                next_frontier.update(self.graph.successors(n))
                next_frontier.update(self.graph.predecessors(n))
            nodes.update(next_frontier)
            frontier = next_frontier

        return self.graph.subgraph(nodes).copy()

    def get_related_chunks(self, entity_name: str) -> list[str]:
        """Get all chunk texts associated with an entity."""
        entity = self.get_entity(entity_name)
        if not entity:
            return []
        return entity.get("chunk_texts", [])

    def get_all_entity_names(self) -> list[str]:
        return list(self.graph.nodes())

    def save(self, path: str) -> None:
        data = nx.node_link_data(self.graph)
        Path(path).write_text(json.dumps(data, indent=2))

    def load(self, path: str) -> None:
        data = json.loads(Path(path).read_text())
        self.graph = nx.node_link_graph(data)
