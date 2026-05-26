---
name: creating-codex-subagents
description: Use when defining, configuring, or spawning Codex subagents or custom agents for parallel work, PR review, codebase exploration, documentation research, or CSV batch fan-out
---

# Creating Codex Subagents

## Overview

Create narrow Codex subagents only when the user explicitly asks for subagents, delegation, or parallel agent work. A useful subagent has one job, a bounded tool surface, clear ownership, and a lifecycle that ends with reviewed results and closed threads.

Codex changes over time. For current schema or config details, verify official OpenAI Codex docs before editing agent files.

## When to Use

Use for:
- Custom Codex agents in `~/.codex/agents/` or `.codex/agents/`.
- Parallel review, exploration, documentation research, implementation slices, or CSV batch jobs.
- Choosing between built-in `default`, `worker`, `explorer`, and custom agents.

Do not use for:
- Tiny tasks faster to do locally.
- Tightly coupled work where the next local step depends on the answer.
- Unclear requirements, shared write scopes, or tasks likely to edit the same files.
- Recursive delegation unless explicitly needed; keep `agents.max_depth = 1`.

## Quick Reference

| Need | Pattern |
| --- | --- |
| Read-only code question | Spawn `explorer`; pass exact question and expected evidence. |
| Bounded implementation | Spawn `worker`; assign file ownership and verification. |
| Reusable role | Add one TOML file under `.codex/agents/` or `~/.codex/agents/`. |
| Same full context required | Use `fork_context = true`; otherwise pass curated context. |
| Result needed now | `wait_agent` once with a useful timeout. |
| Done with thread | `close_agent`; do not leave finished agents open. |

## Custom Agent Schema

Every standalone custom agent TOML file must define `name`, `description`, and `developer_instructions`. The `name` field is the source of truth; the filename is only convention.

```toml
name = "reviewer"
description = "PR reviewer focused on correctness, security, and missing tests."
sandbox_mode = "read-only"
model_reasoning_effort = "high"
developer_instructions = """
Review code like an owner.
Prioritize correctness, security, regressions, and missing tests.
Lead with concrete findings and cite files or symbols.
Do not make code changes.
"""
nickname_candidates = ["Atlas", "Delta", "Echo"]
```

Optional fields such as `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, `skills.config`, and `nickname_candidates` inherit from the parent when omitted. Use model overrides only when the user asks or the role clearly needs different capability.

Sandbox and approvals inherit from the parent session unless the custom agent overrides them. Use `sandbox_mode = "read-only"` for review, research, and docs roles; use `workspace-write` only for bounded implementation roles with explicit ownership.

Global limits live under `[agents]` in config:

```toml
[agents]
max_threads = 6
max_depth = 1
```

## Spawn Prompt Template

```text
You are one of several Codex subagents. You are not alone in the codebase.

Goal:
<specific outcome>

Ownership:
- Own only: <files/directories/responsibility>
- Do not edit outside this scope unless you report why first.
- Treat unrelated uncommitted changes as user-owned. Do not revert them.

Context:
<relevant files, commands, constraints, acceptance criteria>

Verification:
<checks to run, or say why they cannot run>

Report:
1. Files changed or evidence inspected.
2. Result and reasoning.
3. Checks run with outcomes.
4. Blockers, conflicts, assumptions, or follow-up.
```

## Lifecycle

1. Decide what stays local on the critical path.
2. Split only independent sidecar tasks.
3. Spawn with the narrowest capable role and curated context.
4. Continue non-overlapping local work while agents run.
5. Wait only when blocked on the result.
6. Review returned evidence or patches before trusting them.
7. Integrate, run relevant verification, then close completed agents.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Using `instructions` in custom TOML | Use required `developer_instructions`. |
| Spawning because work is merely complex | Spawn only after explicit user authorization. |
| Giving two agents the same write scope | Split ownership or keep the work local. |
| Letting reviewers write code | Set `sandbox_mode = "read-only"` and say "Do not edit." |
| Waiting repeatedly by reflex | Wait only when the next step needs that result. |
| Trusting subagent output directly | Parent verifies diffs, tests, and final behavior. |
