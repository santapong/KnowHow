"""FAISS-based vector store for document embeddings."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import faiss
import numpy as np


@dataclass
class SearchResult:
    text: str
    score: float
    metadata: dict


class VectorStore:
    """In-memory FAISS vector store with cosine similarity."""

    def __init__(self, dimension: int = 1536) -> None:
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        self.texts: list[str] = []
        self.metadatas: list[dict] = []

    def add(
        self,
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict] | None = None,
    ) -> None:
        if not texts:
            return
        vectors = np.array(embeddings, dtype=np.float32)
        # Normalize for cosine similarity
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1, norms)
        vectors = vectors / norms
        self.index.add(vectors)
        self.texts.extend(texts)
        self.metadatas.extend(metadatas or [{} for _ in texts])

    def search(self, query_embedding: list[float], top_k: int = 5) -> list[SearchResult]:
        if self.index.ntotal == 0:
            return []
        query = np.array([query_embedding], dtype=np.float32)
        norms = np.linalg.norm(query, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1, norms)
        query = query / norms

        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            results.append(SearchResult(
                text=self.texts[idx],
                score=float(score),
                metadata=self.metadatas[idx],
            ))
        return results

    def search_by_vector(self, vector: np.ndarray, top_k: int = 5) -> list[SearchResult]:
        """Search using a pre-computed numpy vector."""
        return self.search(vector.tolist(), top_k)

    def save(self, directory: str) -> None:
        path = Path(directory)
        path.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(path / "index.faiss"))
        with open(path / "metadata.json", "w") as f:
            json.dump({"texts": self.texts, "metadatas": self.metadatas}, f)

    def load(self, directory: str) -> None:
        path = Path(directory)
        self.index = faiss.read_index(str(path / "index.faiss"))
        with open(path / "metadata.json") as f:
            data = json.load(f)
        self.texts = data["texts"]
        self.metadatas = data["metadatas"]
