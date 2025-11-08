# Epic: LSP Symbolic Editing, Refactoring, and Search

Goal

- Provide LSP-powered symbolic navigation, refactoring, and search tools that the model and TUI/SDK can call reliably across languages.

Motivation

- Unlock model-native workflows like jump-to-definition, find-references, rename symbol, code actions, and symbol search.
- Address open requests like workspace symbol search API (#247) and pave the way for definition/references/rename tooling.

Non‑Goals (initial)

- Execute command-based code actions (workspace/executeCommand) beyond simple edit actions.
- A full graphical UI. CLI/TUI wiring will target simple commands that call tools/server endpoints.

References (repo)

- Client LSP symbols exist: src/lsp/index.ts (workspaceSymbol, documentSymbol)
- Symbol range fallback: src/session/prompt.ts (uses documentSymbol to expand ranges)
- Server symbol API is stubbed: src/server/server.ts (/find/symbol returns [])
- Existing tools: src/tool/lsp-hover.ts, src/tool/lsp-diagnostics.ts

Definition of Done (MVP)

- Tools exposed: definition, references, symbols (document/workspace), rename (with prepare), code actions (edit-only).
- /find/symbol returns live results where supported (gracefully returns [] otherwise).
- WorkspaceEdit from rename/code actions is converted and applied atomically via patch/multiedit with a dry‑run preview option.
- Story-pointed tasks below are implemented and tests cover core flows (definition, references, rename multi-file, code action producing edits).

Sizing Notes

- Story points are 1, 2, 3, or 5. Any task >5 is split until <=5.

Task Index

Phase 1: Foundations and Capabilities

- [SP:2] Inventory current LSP capabilities and gaps — specs/task-lsp-foundation-inventory.md
- [SP:2] Define MVP operations and capability detection — specs/task-lsp-foundation-mvp-capabilities.md
- [SP:3] Add navigation helpers: definition/typeDefinition/declaration — specs/task-lsp-helper-definition-type-declaration.md
- [SP:2] Add references helper — specs/task-lsp-helper-references.md
- [SP:2] Normalize documentSymbol — specs/task-lsp-helper-documentSymbol-normalize.md
- [SP:3] PrepareRename + Rename helpers — specs/task-lsp-helper-rename-prepare-rename.md
- [SP:2] CodeAction helper — specs/task-lsp-helper-codeAction.md
- [SP:2] Shared error/timeout handling and normalization — specs/task-lsp-helper-errors-timeouts-normalization.md

Phase 2: Tool Abstractions (Server-Side)

- [SP:2] Specify tool IDs and schemas — specs/task-lsp-tools-spec-ids-schemas.md
- [SP:3] LspDefinitionTool — specs/task-lsp-tool-definition.md
- [SP:3] LspReferencesTool — specs/task-lsp-tool-references.md
- [SP:2] LspSymbolsTool — specs/task-lsp-tool-symbols.md
- [SP:3] LspRenameTool — specs/task-lsp-tool-rename.md
- [SP:3] LspCodeActionTool — specs/task-lsp-tool-code-action.md
- [SP:1] Register tools — specs/task-lsp-tools-register.md

Phase 3: Edit/Refactor Application Pipeline

- [SP:3] Convert WorkspaceEdit/TextEdit to patches — specs/task-lsp-edit-convert-workspaceedit.md
- [SP:2] Apply order per file — specs/task-lsp-edit-application-order.md
- [SP:1] Writability/sandbox validation — specs/task-lsp-edit-writability-validation.md
- [SP:3] Rename flow: preview + apply (atomic) — specs/task-lsp-edit-rename-flow.md
- [SP:3] Code action flow: preview + apply — specs/task-lsp-edit-code-action-flow.md
- [SP:2] Conflict detection — specs/task-lsp-edit-conflict-detection.md
- [SP:2] Dry‑run preview format — specs/task-lsp-edit-dry-run-preview.md
- [SP:2] Transactional apply wrapper — specs/task-lsp-edit-transactional-apply.md

Phase 4: Search and Navigation UX

- [SP:2] Re-enable /find/symbol API — specs/task-lsp-api-enable-find-symbol.md
- [SP:2] Document symbol listing tool — specs/task-lsp-tool-document-symbol-listing.md
- [SP:2] Jump-to-definition prioritization — specs/task-lsp-nav-jump-to-definition.md
- [SP:3] References listing (pagination-ready) — specs/task-lsp-nav-references-listing.md
- [SP:2] CLI/TUI command mapping proposal — specs/task-lsp-cli-tui-mapping-proposal.md

Phase 5: Multi-Language and Robustness

- [SP:3] Multi-server routing policy — specs/task-lsp-routing-multi-server-policy.md
- [SP:2] Graceful fallback when unsupported — specs/task-lsp-fallback-unsupported.md
- [SP:3] Performance (timeouts, batching, large edits) — specs/task-lsp-performance-timeouts-batching.md
- [SP:2] Logging/observability — specs/task-lsp-logging-observability.md

Phase 6: Validation and Tests

- [SP:3] Unit tests: navigation/references/symbols — specs/task-lsp-tests-mock-navigation-references-symbols.md
- [SP:3] Unit tests: WorkspaceEdit conversion — specs/task-lsp-tests-workspaceedit-conversion.md
- [SP:2] Unit tests: tool schemas — specs/task-lsp-tests-tool-schemas.md
- [SP:3] Integration: go-to-definition — specs/task-lsp-inttest-go-to-definition.md
- [SP:3] Integration: find-references — specs/task-lsp-inttest-find-references.md
- [SP:3] Integration: rename multi-file — specs/task-lsp-inttest-rename-multifile.md
- [SP:3] Integration: code action edits — specs/task-lsp-inttest-code-action-edits.md
- [SP:2] Documentation: tools and examples — specs/task-lsp-docs-tools-and-examples.md

Phases and Stories (with Story Points)

Phase 1: Foundations and Capabilities

- [SP:2] Inventory current LSP capabilities and gaps (hover/diagnostics present; symbols client OK; server symbol API disabled)
- [SP:2] Define MVP operations and capability detection (definition, references, symbols, rename, code actions)
- LSP client helpers
  - [SP:3] Add navigation helpers: textDocument/definition, typeDefinition, declaration (normalized locations)
  - [SP:2] Add textDocument/references helper (includeDeclaration flag, dedupe/sort)
  - [SP:2] Ensure textDocument/documentSymbol normalization handles both SymbolInformation and DocumentSymbol
  - [SP:3] Add textDocument/prepareRename + textDocument/rename helpers (return WorkspaceEdit)
  - [SP:2] Add textDocument/codeAction helper (limit to edit-producing actions; collect edits)
  - [SP:2] Shared error/timeout handling and result normalization utilities

Phase 2: Tool Abstractions (Server-Side)

- [SP:2] Specify tool IDs, inputs/outputs (Zod) for:
  - lsp-definition, lsp-references, lsp-symbols (document/workspace), lsp-rename, lsp-code-action
- [SP:3] Implement LspDefinitionTool (single primary target; multiple targets supported as list)
- [SP:3] Implement LspReferencesTool (dedupe/sort; include file, range, snippet if possible)
- [SP:2] Implement LspSymbolsTool (document symbols for a file; workspace symbols by query)
- [SP:3] Implement LspRenameTool (uses prepareRename when available; returns WorkspaceEdit)
- [SP:3] Implement LspCodeActionTool (returns actions that include edits only; no executeCommand)
- [SP:1] Register tools in tool registry and ensure provider/model enablement rules align with conventions

Phase 3: Edit/Refactor Application Pipeline

- WorkspaceEdit translation and application
  - [SP:3] Convert LSP WorkspaceEdit/TextEdit to internal patch format grouped per file
  - [SP:2] Ensure correct application order (reverse range apply per file)
  - [SP:1] Validate files are known and writable (respect sandbox/permission model)
- Apply pipeline integration
  - [SP:3] Rename flow: preview (dry‑run) + apply; atomic behavior across files
  - [SP:3] Code action flow: preview + apply for edit-only actions
- Safety and user experience
  - [SP:2] Conflict detection with unsaved or concurrently edited files; fail with guidance
  - [SP:2] Dry‑run preview output format (summarize file edits; hunk counts; line ranges)
  - [SP:2] Transactional apply wrapper to avoid partial writes on failure

Phase 4: Search and Navigation UX

- [SP:2] Re-enable /find/symbol server API (capability gated; fallback to [])
- [SP:2] Document symbol listing tool: returns name, kind, container (if available), location
- [SP:2] Navigation helpers: jump-to-definition tool output prioritization (primary target first; then others)
- [SP:3] References listing output: pagination-ready structure and stable ordering
- [SP:2] CLI/TUI command mapping proposal (/def, /refs, /symbols, /rename, /codeaction) with argument shapes; defer UI wiring to follow-on PR

Phase 5: Multi-Language and Robustness

- [SP:3] Multi-server routing policy (choose server by extension/root matching and capability)
- [SP:2] Graceful fallback when method/capability not supported; clear messages
- [SP:3] Performance: add request timeouts; debounce/batch workspace symbol queries; ensure large WorkspaceEdit remains efficient
- [SP:2] Logging/observability around LSP requests and edit application (Log.create)

Phase 6: Validation and Tests

- Unit tests
  - [SP:3] Mock LSP client methods for navigation/references/symbols
  - [SP:3] Test WorkspaceEdit -> patch conversion (multi-hunk, multi-file)
  - [SP:2] Tool input/output validation tests (Zod schemas)
- Integration tests
  - [SP:3] Go-to-definition happy path with a sample server
  - [SP:3] Find-references across files (dedupe/sort)
  - [SP:3] Rename that produces multi-file edits (dry‑run + apply)
  - [SP:3] Code action producing edits (dry‑run + apply)
- Documentation
  - [SP:2] Tool docs with JSON schema examples and example flows

Cross-Issue Alignment

- #247 need server api for fuzzy searching workspace symbols (lsp): addressed by enabling /find/symbol and symbol tools.
- Future: add issues to track definition/references/rename/codeAction tools and edit application pipeline if not already present.

Risks and Mitigations

- Varying server capability support -> Capability detection + graceful fallbacks.
- Large edit sets -> Dry‑run, per-file ordering, transactional apply.
- Multi-server overlaps -> Clear routing heuristics and server priority rules.

Notes on Implementation Order

- Prefer to land Phase 1 + Phase 4 (/find/symbol) first to unblock #247, then Phase 2/3 for editing/refactor.
