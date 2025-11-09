# Explicit Prototypal Agent Extends

This feature lets you define agents in Markdown that inherit from other agents using an `extends` frontmatter field. It enables reusing prompts, model settings, tools, and permissions while overriding only what you need.

## Syntax

In an agent Markdown file:

```md
---
name: child
extends: [[base/auth]]
model: anthropic/claude-3-7
temperature: 0.4
# tools and permissions shown just for example
tools:
  webfetch: true
permission:
  edit: allow
  bash: allow
---

System prompt goes here...
```

- `extends` accepts a wiki‑link of the form `[[path]]`.
- The path is resolved by the shortest unique suffix among all `agent/**/*.md` files discovered in your config directories (both `.opencode/agent` and `agent`).
  - If you have `agent/group1/auth.md` and `agent/group2/auth.md`, then `[[group1/auth]]` and `[[group2/auth]]` are unambiguous; `[[auth]]` will be considered ambiguous and fail with a helpful error.
- You may also use a direct string (no wiki‑link) such as `extends: group1/auth` if you prefer.

## Inheritance Rules

- Child inherits all properties from the parent unless explicitly overridden in the child.
- `prompt` and scalar fields (`model`, `temperature`, `top_p`, `description`, `mode`) are replaced by the child when present.
- `tools` are shallow‑merged: child values override the same keys from the parent, new keys are added.
- `permission` uses the child value if present; otherwise the parent’s value is used. Global/default permissions are merged later at runtime when agents are assembled.
- Unknown/custom option keys in frontmatter (fields not defined in the schema) are inherited from the parent and can be overridden by the child.
- Circular inheritance is detected and raises a configuration error.
- Agents with `disable: true` are removed from the final runtime agent map even if other agents attempt to extend them.

## Error Handling

- Unknown target:
  - Error: `Parent agent "xyz" not found`
- Ambiguous wiki‑link:
  - Error: `Ambiguous reference "auth". Matches: group1/auth, group2/auth`
- Circular reference:
  - Error: `Circular reference detected: a -> b -> a`

## Examples

Base agent (`agent/base.md`):

```md
---
description: Base agent
tools:
  dash: false
permission:
  edit: allow
  bash: allow
---

Base prompt
```

Child agent (`agent/child.md`):

```md
---
extends: [[base]]
description: Child agent
tools:
  dash: false
  todowrite: false
---

Child prompt
```

Result (effective):

- `prompt`: "Child prompt"
- `tools`: `{ dash: false, todowrite: false }` (merged)
- `permission`: inherited from base

## Testing

Automated tests live in `packages/opencode/test/config` and cover:

- Wiki‑link resolution and ambiguity detection
- Multi‑level inheritance
- Tools merging and unknown option key inheritance
- Circular reference errors

## Notes

- This capability is applied during config load; after loading, runtime agent assembly merges global defaults (tools, permissions) as usual.
- You can validate your setup by running `bun test` in the repository, or consume agents via the TUI to confirm merged results are visible.
