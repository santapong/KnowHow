# KnowHow

**Knowledge Graph RAG + HyDE Augmentation Pipeline**

A hybrid retrieval-augmented generation system that combines two complementary augmentation methods:

1. **Knowledge Graph RAG** — Extracts entities and relationships from documents, builds a NetworkX graph, and traverses it to find structurally relevant context.
2. **HyDE (Hypothetical Document Embeddings)** — Generates hypothetical answer documents, embeds them, and uses the averaged embedding for more accurate semantic retrieval.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  KnowHowPipeline                     │
│         ingest() → query() → Answer                  │
├────────────────────┬─────────────────────────────────┤
│   GraphRetriever   │        HyDERetriever            │
│  (Augmentation #1) │       (Augmentation #2)         │
├────────────────────┴──┬──────────────────────────────┤
│  Entity Extraction    │  FAISS Vector Store           │
│  Knowledge Graph      │  (shared by both methods)     │
├───────────────────────┴──────────────────────────────┤
│            LLM Client  (OpenAI-compatible)            │
└──────────────────────────────────────────────────────┘
```

## Installation

```bash
pip install -e ".[dev]"
```

## Configuration

Copy `.env.example` to `.env` and set your API key:

```bash
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
```

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Required. Your OpenAI API key |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | API endpoint (supports Ollama, vLLM, etc.) |
| `LLM_MODEL` | `gpt-4o-mini` | Model for generation and extraction |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Model for embeddings |
| `CHUNK_SIZE` | `512` | Characters per chunk |
| `CHUNK_OVERLAP` | `50` | Overlap between chunks |
| `HYDE_NUM_HYPOTHETICALS` | `3` | Number of hypothetical documents to generate |
| `TOP_K` | `5` | Number of results to retrieve |

## Usage

### CLI Demo

```bash
# With sample data
python examples/run_pipeline.py --query "What is RAG?"

# With your own files
python examples/run_pipeline.py --files doc1.txt doc2.md --query "How does X work?"

# Compare all methods
python examples/run_pipeline.py --query "What is RAG?" --method all --verbose
```

### Python API

```python
from knowhow import KnowHowPipeline

pipeline = KnowHowPipeline()

# Ingest documents
pipeline.ingest(["docs/paper.txt", "docs/notes.md"])

# Or ingest text directly
pipeline.ingest_text("RAG combines retrieval with generation...")

# Query with different methods
answer = pipeline.query("What is RAG?", method="combined")
print(answer.text)

# Available methods: "graph", "hyde", "combined"
graph_answer = pipeline.query("What is RAG?", method="graph")
hyde_answer = pipeline.query("What is RAG?", method="hyde")

# Save/load state
pipeline.save("./knowhow_data")
pipeline.load("./knowhow_data")
```

## How It Works

### Knowledge Graph RAG (Method 1)
1. **Ingest**: For each text chunk, an LLM extracts entities (PERSON, ORG, CONCEPT, etc.) and relationships
2. **Build**: Entities become graph nodes, relationships become edges in a NetworkX directed graph
3. **Retrieve**: Given a query, the LLM identifies mentioned entities, the graph is traversed (depth=2) to find related chunks, and results are ranked by embedding similarity

### HyDE (Method 2)
1. **Generate**: Given a query, the LLM generates N hypothetical answer passages (default 3)
2. **Embed**: Each hypothetical is embedded, and the vectors are averaged into a centroid
3. **Search**: The centroid embedding searches the FAISS vector store — this works because hypothetical answers live in the same semantic space as real answers

### Combined Mode (Default)
Runs both methods, merges and deduplicates results by text content, re-ranks by score, and feeds the top-K chunks as context to the LLM for final answer generation.

## Testing

```bash
pytest tests/ -v
```
