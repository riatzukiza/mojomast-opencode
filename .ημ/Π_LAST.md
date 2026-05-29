# Π handoff: eta-mu kanban migration batch agent_shuv

- time: 2026-05-29T04:03:19Z
- repo: /home/err/devel/orgs/shuv/shuvcode
- branch: dev
- manifest: /tmp/eta-mu-kanban-batches/agent_shuv.json
- migrated markdown cards: 4

## Migrated boards
- `packages/opencode/specs` -> `packages/opencode/kanban` (3 markdown cards); validation: `eta-mu-beta kanban count --tasks-dir /home/err/devel/orgs/shuv/shuvcode/packages/opencode/kanban` => total 3
- `specs` -> `kanban` (1 markdown cards); validation: `eta-mu-beta kanban count --tasks-dir /home/err/devel/orgs/shuv/shuvcode/kanban` => total 1

## Verification

- Ran migration script from `/home/err/devel`: `node services/eta-mu/kanban/scripts/migrate-specs-to-kanban.mjs --root /home/err/devel --manifest /tmp/eta-mu-kanban-batches/agent_shuv.json`.
- Spot-checked every board in the manifest with `eta-mu-beta kanban count --tasks-dir <boardDir>`.

## Concurrency guard

- Staging is path-scoped to migrated kanban directories, removed spec/specs directories, and these `.ημ` handoff artifacts.
- No repo-wide cleanup/reset/restore was run.
- `services/eta-mu` and `orgs/open-hax/eta-mu` were not modified or staged by this batch.
