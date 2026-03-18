"""Tests for multi-format document loaders."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock

from knowhow.loaders import detect_file_type, load_file, _load_text, _load_csv, _load_json, _flatten_json


def test_detect_file_type():
    assert detect_file_type("doc.txt") == "text"
    assert detect_file_type("doc.md") == "text"
    assert detect_file_type("photo.png") == "image"
    assert detect_file_type("photo.jpg") == "image"
    assert detect_file_type("photo.jpeg") == "image"
    assert detect_file_type("doc.pdf") == "pdf"
    assert detect_file_type("doc.docx") == "docx"
    assert detect_file_type("data.csv") == "csv"
    assert detect_file_type("data.tsv") == "csv"
    assert detect_file_type("page.html") == "html"
    assert detect_file_type("data.json") == "json"
    assert detect_file_type("unknown.xyz") == "text"  # fallback


def test_load_text(tmp_path):
    f = tmp_path / "test.txt"
    f.write_text("Hello, world!")
    result = load_file(str(f))
    assert result == "Hello, world!"


def test_load_csv(tmp_path):
    f = tmp_path / "data.csv"
    f.write_text("name,age\nAlice,30\nBob,25\n")
    result = load_file(str(f))
    assert "Alice" in result
    assert "Bob" in result
    assert "name" in result
    assert "age" in result


def test_load_json(tmp_path):
    f = tmp_path / "data.json"
    data = {"name": "Alice", "skills": ["python", "ml"]}
    f.write_text(json.dumps(data))
    result = load_file(str(f))
    assert "Alice" in result
    assert "python" in result


def test_load_jsonl(tmp_path):
    f = tmp_path / "data.jsonl"
    f.write_text('{"name": "Alice"}\n{"name": "Bob"}\n')
    result = load_file(str(f))
    assert "Alice" in result
    assert "Bob" in result


def test_flatten_json():
    result = _flatten_json({"a": 1, "b": {"c": 2}})
    assert "a: 1" in result
    assert "b.c: 2" in result


def test_image_requires_llm(tmp_path):
    f = tmp_path / "test.png"
    f.write_bytes(b"\x89PNG\r\n")
    try:
        load_file(str(f))
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "LLM" in str(e)


def test_image_with_mock_llm(tmp_path):
    f = tmp_path / "test.png"
    f.write_bytes(b"\x89PNG\r\n")
    llm = MagicMock()
    llm.describe_image.return_value = "A diagram showing RAG architecture."
    result = load_file(str(f), llm=llm)
    assert "diagram" in result.lower()
    llm.describe_image.assert_called_once()
