(pi-handoff
  (kind "eta-mu-kanban-migration")
  (batch "agent_shuv")
  (time "2026-05-29T04:03:19Z")
  (repo "/home/err/devel/orgs/shuv/shuvcode")
  (branch "dev")
  (manifest "/tmp/eta-mu-kanban-batches/agent_shuv.json")
  (migrated-markdown 4)
  (verification "migration script plus eta-mu-beta kanban count for every board")
  (entries
    (entry (spec-dir "packages/opencode/specs") (board-dir "packages/opencode/kanban") (markdown-files 3) (validation-total 3))
    (entry (spec-dir "specs") (board-dir "kanban") (markdown-files 1) (validation-total 1)))
  (concurrency "path-scoped staging only; no destructive repo-wide cleanup; eta-mu paths untouched"))
