"""Combined Knowledge Graph RAG + HyDE pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from knowhow.config import Settings, get_settings
from knowhow.documents import Chunk, chunk_text, load_file
from knowhow.embeddings import VectorStore
from knowhow.graph.extract import extract_entities_and_relations
from knowhow.graph.retrieve import GraphRetriever
from knowhow.graph.retrieve import RetrievalResult
from knowhow.graph.store import KnowledgeGraph
from knowhow.hyde.generator import HyDERetriever
from knowhow.llm import LLMClient


ANSWER_SYSTEM = """You are a helpful assistant. Answer the question using ONLY the
provided context. If the context doesn't contain enough information, say so.
Cite specific details from the context to support your answer."""

ANSWER_PROMPT = """Context:
{context}

Question: {question}

Answer:"""


@dataclass
class Answer:
    text: str
    sources: list[RetrievalResult]
    method: str


class KnowHowPipeline:
    """End-to-end pipeline combining Knowledge Graph RAG with HyDE augmentation.

    Two retrieval augmentation methods:
    1. **Knowledge Graph RAG**: Extracts entities/relationships from documents,
       builds a graph, and traverses it to find relevant context.
    2. **HyDE**: Generates hypothetical answer documents, embeds them, and uses
       the averaged embedding for more accurate semantic search.

    Supports multiple LLM providers (OpenAI, Anthropic, Ollama, any OpenAI-compatible)
    and multiple input formats (text, images, PDF, DOCX, CSV, HTML, JSON).
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.llm = LLMClient(self.settings)
        self.vector_store = VectorStore()
        self.knowledge_graph = KnowledgeGraph()
        self.chunks: list[Chunk] = []

        self.graph_retriever = GraphRetriever(
            graph=self.knowledge_graph,
            llm=self.llm,
            vector_store=self.vector_store,
        )
        self.hyde_retriever = HyDERetriever(
            llm=self.llm,
            vector_store=self.vector_store,
            num_hypotheticals=self.settings.hyde_num_hypotheticals,
        )

    def ingest(self, file_paths: list[str], verbose: bool = False) -> None:
        """Ingest documents of any supported format.

        Supports: .txt, .md, .pdf, .docx, .csv, .html, .json,
                  .png, .jpg, .jpeg, .gif, .webp (via vision LLM)
        """
        all_chunks: list[Chunk] = []

        for file_path in file_paths:
            if verbose:
                print(f"Loading {file_path}...")
            text = load_file(file_path, llm=self.llm)
            chunks = chunk_text(
                text,
                chunk_size=self.settings.chunk_size,
                overlap=self.settings.chunk_overlap,
                source=file_path,
            )
            for chunk in chunks:
                chunk.index = len(all_chunks)
                all_chunks.append(chunk)

        self._ingest_chunks(all_chunks, verbose)

    def ingest_text(self, text: str, source: str = "inline", verbose: bool = False) -> None:
        """Ingest raw text directly (convenience method)."""
        chunks = chunk_text(
            text,
            chunk_size=self.settings.chunk_size,
            overlap=self.settings.chunk_overlap,
            source=source,
        )
        for chunk in chunks:
            chunk.index = len(self.chunks)

        self._ingest_chunks(chunks, verbose)

    def _ingest_chunks(self, chunks: list[Chunk], verbose: bool = False) -> None:
        """Internal: embed chunks and build knowledge graph."""
        if verbose:
            print(f"Processing {len(chunks)} chunks...")

        self.chunks.extend(chunks)

        # Embed all chunks
        if verbose:
            print("Generating embeddings...")
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            texts = [c.text for c in batch]
            embeddings = self.llm.embed(texts)
            metadatas = [{"chunk_index": c.index, **c.metadata} for c in batch]
            self.vector_store.add(texts, embeddings, metadatas)

        # Build knowledge graph
        if verbose:
            print("Extracting entities and relationships...")
        for idx, chunk in enumerate(chunks):
            if verbose:
                print(f"  Processing chunk {idx + 1}/{len(chunks)}...")
            result = extract_entities_and_relations(self.llm, chunk.text)
            self.knowledge_graph.add_extraction(result, chunk)

        if verbose:
            g = self.knowledge_graph.graph
            print(f"Knowledge graph: {g.number_of_nodes()} nodes, {g.number_of_edges()} edges")

    def query(
        self,
        question: str,
        method: Literal["graph", "hyde", "combined"] = "combined",
        top_k: int | None = None,
        verbose: bool = False,
    ) -> Answer:
        """Answer a question using the specified retrieval method.

        Methods:
            graph: Knowledge Graph traversal only
            hyde: HyDE (Hypothetical Document Embeddings) only
            combined: Merge results from both methods (default)
        """
        k = top_k or self.settings.top_k

        if method == "graph":
            results = self.graph_retriever.retrieve(question, top_k=k)
        elif method == "hyde":
            results = self.hyde_retriever.retrieve(question, top_k=k)
        elif method == "combined":
            graph_results = self.graph_retriever.retrieve(question, top_k=k)
            hyde_results = self.hyde_retriever.retrieve(question, top_k=k)

            # Merge and deduplicate
            seen_texts: set[str] = set()
            merged: list[RetrievalResult] = []
            for r in graph_results + hyde_results:
                if r.text not in seen_texts:
                    seen_texts.add(r.text)
                    merged.append(r)

            merged.sort(key=lambda x: x.score, reverse=True)
            results = merged[:k]
        else:
            raise ValueError(f"Unknown method: {method}")

        if verbose:
            print(f"Retrieved {len(results)} chunks using '{method}' method")
            for i, r in enumerate(results):
                print(f"  [{i+1}] score={r.score:.3f} source={r.source} text={r.text[:80]}...")

        # Generate answer
        context = "\n\n---\n\n".join(r.text for r in results)
        answer_text = self.llm.complete(
            prompt=ANSWER_PROMPT.format(context=context, question=question),
            system=ANSWER_SYSTEM,
            temperature=0.0,
        )

        return Answer(text=answer_text, sources=results, method=method)

    def save(self, directory: str) -> None:
        """Persist vector store and knowledge graph to disk."""
        path = Path(directory)
        path.mkdir(parents=True, exist_ok=True)
        self.vector_store.save(str(path / "vector_store"))
        self.knowledge_graph.save(str(path / "knowledge_graph.json"))

    def load(self, directory: str) -> None:
        """Load vector store and knowledge graph from disk."""
        path = Path(directory)
        self.vector_store.load(str(path / "vector_store"))
        self.knowledge_graph.load(str(path / "knowledge_graph.json"))
