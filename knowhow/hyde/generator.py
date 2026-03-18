"""HyDE (Hypothetical Document Embeddings) retrieval.

Instead of embedding the raw query, HyDE generates hypothetical answer
documents, embeds them, and uses the averaged embedding to search. This
places the query in the semantic space of answers rather than questions,
improving retrieval quality.

Reference: Gao et al., "Precise Zero-Shot Dense Retrieval without Relevance Labels"
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

import numpy as np

if TYPE_CHECKING:
    from knowhow.embeddings import VectorStore
    from knowhow.llm import LLMClient


HYDE_PROMPT = """Write a short, detailed passage (3-5 sentences) that would directly answer
the following question. The passage should read like an excerpt from a
knowledgeable document. Do not say "the answer is" — just write the passage.

Question: {query}

Passage:"""


@dataclass
class RetrievalResult:
    text: str
    score: float
    source: str
    entities: list[str]


class HyDERetriever:
    """Retrieves documents using Hypothetical Document Embeddings."""

    def __init__(
        self,
        llm: LLMClient,
        vector_store: VectorStore,
        num_hypotheticals: int = 3,
    ) -> None:
        self.llm = llm
        self.vector_store = vector_store
        self.num_hypotheticals = num_hypotheticals

    def _generate_hypotheticals(self, query: str) -> list[str]:
        """Generate N hypothetical answer documents."""
        hypotheticals = []
        for _ in range(self.num_hypotheticals):
            doc = self.llm.complete(
                prompt=HYDE_PROMPT.format(query=query),
                temperature=0.7,
            )
            if doc.strip():
                hypotheticals.append(doc.strip())
        return hypotheticals

    def retrieve(self, query: str, top_k: int = 5) -> list[RetrievalResult]:
        """Retrieve using HyDE: generate hypothetical docs, average their
        embeddings, and search the vector store."""
        # Step 1: Generate hypothetical documents
        hypotheticals = self._generate_hypotheticals(query)
        if not hypotheticals:
            # Fallback to direct query embedding
            query_emb = self.llm.embed([query])[0]
            results = self.vector_store.search(query_emb, top_k)
            return [
                RetrievalResult(
                    text=r.text, score=r.score, source="hyde_fallback", entities=[]
                )
                for r in results
            ]

        # Step 2: Embed all hypothetical documents
        embeddings = self.llm.embed(hypotheticals)
        vectors = np.array(embeddings, dtype=np.float32)

        # Step 3: Compute the centroid (average) embedding
        centroid = np.mean(vectors, axis=0)
        centroid = centroid / (np.linalg.norm(centroid) or 1.0)

        # Step 4: Search the vector store with the centroid
        results = self.vector_store.search(centroid.tolist(), top_k)

        return [
            RetrievalResult(
                text=r.text,
                score=r.score,
                source="hyde",
                entities=[],
            )
            for r in results
        ]
