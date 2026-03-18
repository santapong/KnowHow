"""Document loading and chunking utilities."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from knowhow.llm import LLMClient


@dataclass
class Chunk:
    text: str
    index: int
    metadata: dict = field(default_factory=dict)


def load_text(path: str) -> str:
    """Read a plain-text or markdown file."""
    return Path(path).read_text(encoding="utf-8")


def load_file(path: str, llm: LLMClient | None = None) -> str:
    """Load any supported file format and return text.

    Supports: text, markdown, images (via vision LLM), PDF, DOCX, CSV, HTML, JSON.
    """
    from knowhow.loaders import load_file as _load
    return _load(path, llm=llm)


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences using a simple regex."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s for s in sentences if s.strip()]


def chunk_text(
    text: str,
    chunk_size: int = 512,
    overlap: int = 50,
    source: str = "",
) -> list[Chunk]:
    """Split text into overlapping chunks by character count.

    Uses sentence boundaries to avoid splitting mid-sentence where possible.
    """
    sentences = _split_sentences(text)
    chunks: list[Chunk] = []
    current: list[str] = []
    current_len = 0
    idx = 0

    for sentence in sentences:
        sent_len = len(sentence)
        if current and current_len + sent_len > chunk_size:
            chunk_text_str = " ".join(current)
            chunks.append(Chunk(
                text=chunk_text_str,
                index=idx,
                metadata={"source": source},
            ))
            idx += 1
            # Keep sentences for overlap
            overlap_text = ""
            overlap_sents: list[str] = []
            for s in reversed(current):
                if len(overlap_text) + len(s) > overlap:
                    break
                overlap_sents.insert(0, s)
                overlap_text = " ".join(overlap_sents)
            current = overlap_sents
            current_len = len(overlap_text)

        current.append(sentence)
        current_len += sent_len

    if current:
        chunks.append(Chunk(
            text=" ".join(current),
            index=idx,
            metadata={"source": source},
        ))

    return chunks
