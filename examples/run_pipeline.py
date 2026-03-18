#!/usr/bin/env python3
"""End-to-end demo of the KnowHow Knowledge Graph RAG + HyDE pipeline.

Usage:
    # With files:
    python examples/run_pipeline.py --files doc1.txt doc2.md --query "What is X?"

    # With built-in sample data:
    python examples/run_pipeline.py --query "What is retrieval augmented generation?"

    # Compare methods:
    python examples/run_pipeline.py --query "How does RAG work?" --method combined
"""

from __future__ import annotations

import argparse
import sys

# Load .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from knowhow.config import get_settings
from knowhow.pipeline import KnowHowPipeline

SAMPLE_TEXT = """
Retrieval-Augmented Generation (RAG) is a technique that enhances large language
models by combining them with external knowledge retrieval. Instead of relying
solely on the model's parametric knowledge, RAG systems first retrieve relevant
documents from a knowledge base, then use those documents as context for
generating more accurate and grounded responses.

The RAG architecture consists of two main components: a retriever and a generator.
The retriever is typically a dense passage retrieval system that uses embedding
similarity to find relevant documents. The generator is a large language model
that conditions its output on both the query and the retrieved passages.

Knowledge graphs provide a structured representation of information, capturing
entities and their relationships. When combined with RAG, knowledge graphs enable
more precise retrieval by following relationship paths between concepts. This is
particularly valuable for multi-hop reasoning questions where the answer depends
on connecting information from multiple sources.

HyDE (Hypothetical Document Embeddings) is an innovative augmentation technique
for improving retrieval quality. Instead of embedding the raw query directly,
HyDE first generates hypothetical answer documents using an LLM, then embeds
those hypothetical documents. The key insight is that hypothetical answers exist
in the same semantic space as real answers, making the embedding search more
effective than searching with the original question embedding.

The combination of knowledge graph retrieval and HyDE creates a powerful hybrid
system. Knowledge graph traversal excels at finding structurally related
information through entity relationships, while HyDE improves semantic matching
by transforming the query into the answer space. Together, they provide
complementary retrieval strategies that cover both structural and semantic
aspects of information retrieval.

Vector databases like FAISS (Facebook AI Similarity Search) provide efficient
similarity search for high-dimensional embedding vectors. FAISS supports multiple
index types including flat indexes for exact search, IVF indexes for approximate
search, and product quantization for memory-efficient search. For RAG systems,
FAISS serves as the backbone for storing and querying document embeddings.

Entity extraction is the process of identifying named entities and concepts from
unstructured text. Modern approaches use large language models to extract entities
along with their types (person, organization, concept, etc.) and relationships.
This structured information forms the nodes and edges of the knowledge graph,
enabling graph-based retrieval and reasoning.
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="KnowHow RAG Pipeline Demo")
    parser.add_argument("--files", nargs="+", help="Text/markdown files to ingest")
    parser.add_argument("--query", "-q", default="What is RAG and how does it work?",
                        help="Question to ask")
    parser.add_argument("--method", "-m", default="combined",
                        choices=["graph", "hyde", "combined", "all"],
                        help="Retrieval method")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    settings = get_settings()
    if not settings.openai_api_key:
        print("Error: OPENAI_API_KEY environment variable is required.")
        print("Copy .env.example to .env and fill in your API key.")
        sys.exit(1)

    pipeline = KnowHowPipeline(settings)

    # Ingest
    if args.files:
        pipeline.ingest(args.files, verbose=args.verbose)
    else:
        print("Using built-in sample text about RAG...")
        pipeline.ingest_text(SAMPLE_TEXT, source="sample", verbose=args.verbose)

    # Query
    if args.method == "all":
        methods = ["graph", "hyde", "combined"]
    else:
        methods = [args.method]

    for method in methods:
        print(f"\n{'='*60}")
        print(f"Method: {method.upper()}")
        print(f"{'='*60}")
        answer = pipeline.query(args.query, method=method, verbose=args.verbose)
        print(f"\nAnswer:\n{answer.text}")
        print(f"\nSources ({len(answer.sources)}):")
        for i, src in enumerate(answer.sources):
            print(f"  [{i+1}] score={src.score:.3f} via={src.source}")
            print(f"      {src.text[:100]}...")


if __name__ == "__main__":
    main()
