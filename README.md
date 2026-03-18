# KnowHow

**Knowledge Graph RAG + HyDE Augmentation Pipeline**

A hybrid retrieval-augmented generation system that combines two complementary augmentation methods with **universal LLM support**, **multi-format document ingestion**, and **MCP (Model Context Protocol) server**.

## Features

### Two Augmentation Methods
1. **Knowledge Graph RAG** — Extracts entities and relationships from documents, builds a NetworkX graph, and traverses it to find structurally relevant context.
2. **HyDE (Hypothetical Document Embeddings)** — Generates hypothetical answer documents, embeds them, and uses the averaged embedding for more accurate semantic retrieval.

### Universal LLM Support
- **OpenAI** — GPT-4o, GPT-4o-mini, etc.
- **Anthropic** — Claude Sonnet, Claude Opus, etc.
- **Ollama** — Llama, Mistral, Phi, and any local model
- **Any OpenAI-compatible API** — Together AI, Groq, vLLM, LiteLLM, etc.

### Multi-Format Input
- **Text/Markdown** (.txt, .md)
- **Images** (.png, .jpg, .gif, .webp) — via vision LLM
- **PDF** (.pdf) — via pymupdf or pdfplumber
- **DOCX** (.docx) — via python-docx
- **CSV/TSV** (.csv, .tsv)
- **HTML** (.html, .htm) — via beautifulsoup4
- **JSON/JSONL** (.json, .jsonl)

## Architecture

```
┌──────────────────────────────────────────────────────┐
│              MCP Server (stdio / SSE / HTTP)          │
│  Tools, Resources, Prompts for any MCP-compatible AI  │
├──────────────────────────────────────────────────────┤
│                  KnowHowPipeline                     │
│     ingest(any format) → query() → Answer            │
├────────────────────┬─────────────────────────────────┤
│   GraphRetriever   │        HyDERetriever            │
│  (Augmentation #1) │       (Augmentation #2)         │
├────────────────────┴──┬──────────────────────────────┤
│  Entity Extraction    │  FAISS Vector Store           │
│  Knowledge Graph      │  (shared by both methods)     │
├───────────────────────┴──────────────────────────────┤
│  Multi-Format Loaders  (text, image, pdf, docx, ...) │
├──────────────────────────────────────────────────────┤
│  Universal LLM Client (OpenAI / Anthropic / Ollama)  │
└──────────────────────────────────────────────────────┘
```

## Installation

```bash
# Core (OpenAI + FAISS)
pip install -e .

# With Anthropic support
pip install -e ".[anthropic]"

# With all document formats
pip install -e ".[all]"

# With dev tools
pip install -e ".[dev]"
```

## Configuration

Copy `.env.example` to `.env` and configure your provider:

```bash
cp .env.example .env
```

### OpenAI (default)
```env
LLM_PROVIDER=openai
API_KEY=sk-...
```

### Anthropic (Claude)
```env
LLM_PROVIDER=anthropic
API_KEY=sk-ant-...
```

### Ollama (local)
```env
LLM_PROVIDER=ollama
# No API key needed
```

### Any OpenAI-compatible API (Together, Groq, vLLM, etc.)
```env
LLM_PROVIDER=together
API_KEY=...
API_BASE_URL=https://api.together.xyz/v1
LLM_MODEL=meta-llama/Llama-3-70b-chat-hf
EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-retrieval
```

### All Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | Provider: openai, anthropic, ollama, or any name |
| `API_KEY` | — | API key (also reads OPENAI_API_KEY, ANTHROPIC_API_KEY) |
| `API_BASE_URL` | auto | API endpoint (auto-detected per provider) |
| `LLM_MODEL` | auto | Chat model (auto-detected per provider) |
| `EMBEDDING_MODEL` | auto | Embedding model (local fallback if empty) |
| `CHUNK_SIZE` | `512` | Characters per chunk |
| `CHUNK_OVERLAP` | `50` | Overlap between chunks |
| `HYDE_NUM_HYPOTHETICALS` | `3` | Number of hypothetical documents |
| `TOP_K` | `5` | Number of results to retrieve |

## Usage

### CLI Demo

```bash
# Text files
python examples/run_pipeline.py --files doc.txt notes.md --query "What is X?"

# Images (extracted via vision LLM)
python examples/run_pipeline.py --files diagram.png chart.jpg --query "What does it show?"

# PDFs
python examples/run_pipeline.py --files paper.pdf --query "What are the findings?"

# Mixed formats
python examples/run_pipeline.py --files notes.md data.csv image.png --query "Summarize"

# Compare all methods
python examples/run_pipeline.py --query "What is RAG?" --method all --verbose
```

### Python API

```python
from knowhow import KnowHowPipeline
from knowhow.config import Settings

# Auto-configure from environment
pipeline = KnowHowPipeline()

# Or explicit configuration
pipeline = KnowHowPipeline(Settings(
    llm_provider="anthropic",
    api_key="sk-ant-...",
    llm_model="claude-sonnet-4-20250514",
))

# Ingest any format
pipeline.ingest([
    "docs/paper.pdf",
    "docs/notes.md",
    "docs/diagram.png",    # Vision LLM extracts content
    "data/records.csv",
])

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

### Image Ingestion
When you ingest an image file, the pipeline uses the LLM's vision capabilities to extract text and describe visual content. The extracted text is then processed through the same chunking, embedding, and knowledge graph pipeline as any other document.

## MCP Server

KnowHow exposes its full pipeline as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server, making it available as a tool for Claude Desktop, Claude Code, or any MCP-compatible client.

### Running the MCP Server

```bash
# stdio transport (for Claude Desktop / Claude Code)
python -m knowhow.mcp

# SSE transport (for web clients)
python -m knowhow.mcp --sse

# Streamable HTTP transport
python -m knowhow.mcp --http

# Or via the installed entry point
knowhow-mcp
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "knowhow": {
      "command": "python",
      "args": ["-m", "knowhow.mcp"],
      "env": {
        "LLM_PROVIDER": "openai",
        "API_KEY": "sk-..."
      }
    }
  }
}
```

### Claude Code Configuration

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "knowhow": {
      "command": "python",
      "args": ["-m", "knowhow.mcp"],
      "env": {
        "LLM_PROVIDER": "openai",
        "API_KEY": "sk-..."
      }
    }
  }
}
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `knowhow_ingest_text` | Ingest raw text into the knowledge base |
| `knowhow_ingest_files` | Ingest files (txt, md, pdf, docx, csv, html, json, images) |
| `knowhow_query` | Query with graph/hyde/combined methods |
| `knowhow_graph_info` | Get knowledge graph statistics and entity list |
| `knowhow_get_entity` | Look up an entity and its relationships |
| `knowhow_save` | Save pipeline state to disk |
| `knowhow_load` | Load pipeline state from disk |

### MCP Resources

| Resource | Description |
|----------|-------------|
| `knowhow://status` | Current pipeline status (JSON) |
| `knowhow://entities` | All entities in the knowledge graph (JSON) |

### MCP Prompts

| Prompt | Description |
|--------|-------------|
| `knowhow_analyze` | Analyze a document and answer questions about it |
| `knowhow_research` | Research a topic using the knowledge base |

### Programmatic Usage

```python
from knowhow.mcp import create_server
from knowhow.config import Settings

# Create with custom settings
server = create_server(Settings(
    llm_provider="ollama",
    llm_model="llama3.2",
))

# Run
server.run(transport="stdio")
```

## Testing

```bash
pytest tests/ -v
```
