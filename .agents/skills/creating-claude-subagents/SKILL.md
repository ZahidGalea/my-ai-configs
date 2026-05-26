---
name: creating-claude-subagents
description: Use when creating, configuring, or designing custom subagent definition files for Claude Code — including choosing scope, restricting tools, setting models, and writing system prompts for specialized workflows
---

# Creating Claude Code Subagents

## Overview

Subagents are Markdown files with YAML frontmatter that define specialized AI assistants. Claude delegates tasks to them automatically (via description matching) or when explicitly invoked. Each runs in isolated context with its own system prompt, tool access, and model.

**Core principle:** One focused job per subagent. Narrow tool access + precise description = reliable delegation.

## When to Use

Use subagents (vs. main conversation) when:
- Task produces verbose output you don't need in your main context
- You want to enforce specific tool restrictions
- Work is self-contained and can return a summary

Don't use subagents when:
- Task needs frequent back-and-forth or iterative refinement
- Multiple phases share significant context
- You want a reusable prompt in the main conversation → use a **Skill** instead

## File Structure

```markdown
---
name: my-subagent          # lowercase, hyphens only — no special chars
description: Use when...   # CRITICAL: triggering conditions only, no workflow summary
tools: Read, Grep, Glob    # omit to inherit all tools
model: sonnet              # sonnet | opus | haiku | full-id | inherit (default)
---

You are a specialized assistant. When invoked:
1. Do X
2. Do Y
3. Return Z
```

## Scope — Where to Save

| Location | When |
|---|---|
| `.claude/agents/` | Project-specific, share via version control |
| `~/.claude/agents/` | Personal, available in all projects |

**After creating a file manually**, restart the session to load it. Files created via `/agents` take effect immediately.

## Frontmatter Quick Reference

| Field | Values | Notes |
|---|---|---|
| `name` | `lowercase-hyphens` | Required. Identity — filename doesn't matter |
| `description` | `"Use when..."` | Required. Drives automatic delegation |
| `tools` | `Read, Grep, Glob, Bash, Edit, Write...` | Allowlist. Omit = inherit all |
| `disallowedTools` | same | Denylist from inherited set |
| `model` | `sonnet`, `opus`, `haiku`, full ID, `inherit` | Default: `inherit` |
| `permissionMode` | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan` | |
| `memory` | `user`, `project`, `local` | Persistent cross-session memory dir |
| `isolation` | `worktree` | Isolated git worktree — auto-cleaned if no changes |
| `background` | `true` / `false` | Always run in background (concurrent) |
| `maxTurns` | integer | Cap agentic turns |
| `skills` | list of skill names | Preload full skill content at startup |
| `color` | `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan` | |

## Tool Control

```yaml
# Allowlist — only these tools available
tools: Read, Grep, Glob, Bash

# Denylist — inherit everything except these
disallowedTools: Write, Edit

# Both set: disallowedTools applied first, then tools resolves against remainder
```

**Tools NOT available to subagents** (even if listed): `Agent`, `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode` (unless `permissionMode: plan`), `ScheduleWakeup`.

**Subagents cannot spawn other subagents.**

## Description — The Most Important Field

Claude reads descriptions to decide when to delegate. Write triggering conditions only — never summarize the workflow.

```yaml
# ❌ BAD: summarizes workflow — Claude may follow this instead of reading the full prompt
description: Reviews code for security issues by reading changed files and reporting findings

# ✅ GOOD: triggering conditions only
description: Use when code has been written or modified and needs security review
```

Add "Use proactively" to encourage automatic delegation without being asked.

## Model Selection

- `haiku` — fast, cheap; file search, read-only research
- `sonnet` — balanced; code review, analysis, most implementation
- `opus` — most capable; architecture, design decisions
- `inherit` (default) — same as main conversation

## Memory Scopes

```yaml
memory: project    # .claude/agent-memory/<name>/ — shareable via git (recommended)
memory: user       # ~/.claude/agent-memory/<name>/ — across all projects
memory: local      # .claude/agent-memory-local/<name>/ — not committed
```

When enabled: `MEMORY.md` (first 200 lines) is injected at startup. Read/Write/Edit auto-enabled for memory management.

## Common Patterns

### Read-only reviewer
```yaml
---
name: code-reviewer
description: Use when code has been written or modified and needs quality, security, and best-practices review
tools: Read, Grep, Glob, Bash
model: sonnet
---
```

### Implementation agent with isolation
```yaml
---
name: feature-implementer
description: Use when implementing a well-scoped feature that should not affect the main branch
isolation: worktree
permissionMode: acceptEdits
---
```

### Scoped MCP server
```yaml
---
name: browser-tester
description: Use when testing UI features requires a real browser
mcpServers:
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
---
```

## Invoking Subagents

- **Natural language**: "Use the code-reviewer subagent to..." — Claude decides
- **@-mention**: `@"code-reviewer (agent)"` — guarantees delegation for that task
- **Session-wide**: `claude --agent code-reviewer` — entire session uses the subagent's system prompt

## Common Mistakes

| Mistake | Fix |
|---|---|
| Forgetting `name` uses only lowercase + hyphens | No parentheses, spaces, or special chars |
| Description summarizes workflow | Describe only WHEN to use, not what it does |
| Listing `Agent` in tools | Unavailable — subagents can't spawn subagents |
| Expecting cross-session learning without `memory` | Enable `memory: project` explicitly |
| Editing file on disk expecting instant load | Restart session, or use `/agents` UI instead |
| Setting `permissionMode: bypassPermissions` broadly | Skips all prompts incl. writes to `.git` — use cautiously |
