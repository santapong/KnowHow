"""Graph-based retrieval for RAG."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from knowhow.embeddings import VectorStore
    from knowhow.graph.store import KnowledgeGraph
    from knowhow.llm import LLMClient


ENTITY_EXTRACTION_PROMPT = """Given the following question, identify the key entities mentioned.
Return a JSON list of entity names (lowercase). Return ONLY the JSON array.

Known entities in the knowledge base:
{known_entities}

Question: {query}

Example output: ["entity1", "entity2"]"""


@dataclass
class RetrievalResult:
    text: str
    score: float
    source: str  # "graph" or "vector" or "hyde"
    entities: list[str]


class GraphRetriever:
    """Retrieves context by traversing the knowledge graph."""

    def __init__(
        self,
        graph: KnowledgeGraph,
        llm: LLMClient,
        vector_store: VectorStore,
    ) -> None:
        self.graph = graph
        self.llm = llm
        self.vector_store = vector_store

    def _extract_query_entities(self, query: str) -> list[str]:
        """Use LLM to identify entities in the query."""
        known = self.graph.get_all_entity_names()
        # Show a sample of known entities to guide the LLM
        sample = known[:100] if len(known) > 100 else known
        response = self.llm.complete(
            prompt=ENTITY_EXTRACTION_PROMPT.format(
                known_entities=json.dumps(sample),
                query=query,
            ),
            temperature=0.0,
        )
        try:
            # Try parsing the JSON array
            text = response.strip()
            if text.startswith("```"):
                text = text.split("```")[1].strip()
                if text.startswith("json"):
                    text = text[4:].strip()
            entities = json.loads(text)
            if isinstance(entities, list):
                return [e.lower().strip() for e in entities if isinstance(e, str)]
        except (json.JSONDecodeError, IndexError):
            pass
        return []

    def retrieve(self, query: str, top_k: int = 5) -> list[RetrievalResult]:
        """Retrieve relevant chunks using knowledge graph traversal."""
        # Step 1: Extract entities from query
        query_entities = self._extract_query_entities(query)

        # Step 2: Expand subgraphs around each entity
        chunk_texts: dict[str, list[str]] = {}  # text -> entities
        for entity_name in query_entities:
            subgraph = self.graph.get_neighbors(entity_name, depth=2)
            for node in subgraph.nodes():
                node_data = self.graph.get_entity(node)
                if node_data:
                    for chunk_text in node_data.get("chunk_texts", []):
                        if chunk_text not in chunk_texts:
                            chunk_texts[chunk_text] = []
                        if entity_name not in chunk_texts[chunk_text]:
                            chunk_texts[chunk_text].append(entity_name)

        if not chunk_texts:
            return []

        # Step 3: Rank by embedding similarity
        query_emb = self.llm.embed([query])[0]
        texts = list(chunk_texts.keys())
        text_embs = self.llm.embed(texts)

        import numpy as np
        query_vec = np.array(query_emb, dtype=np.float32)
        query_vec = query_vec / (np.linalg.norm(query_vec) or 1.0)

        scored = []
        for text, emb in zip(texts, text_embs):
            vec = np.array(emb, dtype=np.float32)
            vec = vec / (np.linalg.norm(vec) or 1.0)
            score = float(np.dot(query_vec, vec))
            scored.append((text, score, chunk_texts[text]))

        scored.sort(key=lambda x: x[1], reverse=True)

        return [
            RetrievalResult(
                text=text,
                score=score,
                source="graph",
                entities=entities,
            )
            for text, score, entities in scored[:top_k]
        ]
