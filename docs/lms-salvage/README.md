# Agents

This directory defines the AI agents that will power the learning platform once the AI runtime is enabled (post-UAT).

Per the project decision, **every agent uses `claude-opus-4-7`** — the model identifier for Claude Opus 4.7 — as its only model. No fallback or downgrade to smaller models.

## Status: spec-only

For the first UAT release, AI is intentionally not wired up. These markdown files are the authoritative role definitions and prompt scaffolds. When AI is enabled, each file maps 1:1 to an agent definition in the Claude Agent SDK (`.claude/agents/<name>.md` or equivalent).

## Roster

| Agent | Role | Trigger |
|---|---|---|
| `project-manager.md` | Orchestrator. Plans courses, delegates to other agents, tracks progress. | Top-level entry point |
| `curriculum-designer.md` | Produces module & lesson outlines from a topic. | Called by PM during course creation |
| `tutor.md` | Per-learner explainer, answers questions, adapts to skill level. | Called when a learner asks for help on a lesson |
| `content-reviewer.md` | QA pass on instructor uploads (clarity, accuracy, captions). | Called after instructor saves a lesson |
| `upload-coordinator.md` | Generates video metadata, transcripts, suggested thumbnails. | Called after video upload completes |

## Wiring later

When ready, install `@anthropic-ai/sdk` and instantiate agents from these markdown files. Example call site:

```ts
const client = new Anthropic();
const response = await client.messages.create({
  model: "claude-opus-4-7",
  system: await fs.readFile("agents/curriculum-designer.md", "utf8"),
  messages: [{ role: "user", content: "Outline a course on photosynthesis." }],
});
```

Prompt caching should be applied to the system prompt (1h TTL) since these specs are stable.
