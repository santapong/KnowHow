"""Entity and relationship extraction from text using LLM."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from knowhow.llm import LLMClient

EXTRACTION_SYSTEM = """You are an expert at extracting structured knowledge from text.
Extract entities and their relationships. Return valid JSON only."""

EXTRACTION_PROMPT = """Extract all entities and relationships from the following text.

Rules:
- Normalize entity names to lowercase canonical form
- Assign entity types: PERSON, ORGANIZATION, CONCEPT, TECHNOLOGY, LOCATION, EVENT, or OTHER
- Capture meaningful relationships between entities
- Include brief descriptions

Return ONLY valid JSON in this exact format:
{{
  "entities": [
    {{"name": "entity name", "type": "TYPE", "description": "brief description"}}
  ],
  "relationships": [
    {{"source": "entity1", "target": "entity2", "relation": "RELATION_TYPE", "description": "brief description"}}
  ]
}}

Text:
{text}"""


@dataclass
class Entity:
    name: str
    type: str
    description: str


@dataclass
class Relationship:
    source: str
    target: str
    relation: str
    description: str


@dataclass
class ExtractionResult:
    entities: list[Entity] = field(default_factory=list)
    relationships: list[Relationship] = field(default_factory=list)


def _parse_json(text: str) -> dict:
    """Parse JSON from LLM response, handling markdown fences."""
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try extracting from markdown code block
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    # Try finding JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {"entities": [], "relationships": []}


def extract_entities_and_relations(
    llm: LLMClient,
    text: str,
) -> ExtractionResult:
    """Extract entities and relationships from a text chunk using LLM."""
    response = llm.complete(
        prompt=EXTRACTION_PROMPT.format(text=text),
        system=EXTRACTION_SYSTEM,
        temperature=0.0,
    )
    data = _parse_json(response)

    entities = [
        Entity(
            name=e.get("name", "").lower().strip(),
            type=e.get("type", "OTHER").upper(),
            description=e.get("description", ""),
        )
        for e in data.get("entities", [])
        if e.get("name")
    ]

    relationships = [
        Relationship(
            source=r.get("source", "").lower().strip(),
            target=r.get("target", "").lower().strip(),
            relation=r.get("relation", "RELATED_TO").upper(),
            description=r.get("description", ""),
        )
        for r in data.get("relationships", [])
        if r.get("source") and r.get("target")
    ]

    return ExtractionResult(entities=entities, relationships=relationships)
