## Keybind Schema Migration and Documentation Sync - COMPLETED

### Summary
Successfully completed the keybind schema migration and documentation sync for OpenCode 2.5.

### Phase 1: Python SDK Migration ✅
- **File Modified**: `packages/sdk/python/src/opencode_ai/models/keybinds_config.py`
- **Changes**: Complete rewrite to match TypeScript schema exactly
- **Removed**: Non-existent keybinds (`app_help`, `project_init`, `tool_details`, `thinking_blocks`) and deprecated keybinds (`switch_mode*`, `switch_agent*`, `file_*`, etc.)
- **Added**: Missing keybinds (`sidebar_toggle`, `status_view`, `messages_toggle_conceal`, `input_forward_delete`, `command_list`, `history_previous/next`, `session_child_cycle*`)

### Phase 2: Documentation Sync ✅
- **File Modified**: `packages/web/src/content/docs/keybinds.mdx`
- **Changes**: 
  - Fixed `input_submit` default value from `"enter"` to `"return"`
  - Added missing `session_child_cycle: "ctrl+right"` and `session_child_cycle_reverse: "ctrl+left"` keybinds

### Verification ✅
- Python SDK syntax check passed
- Documentation format validated
- All keybinds now consistent across TypeScript schema, Python SDK, and documentation

### Files Changed
1. `packages/sdk/python/src/opencode_ai/models/keybinds_config.py` - Complete schema migration
2. `packages/web/src/content/docs/keybinds.mdx` - Documentation updates

The migration ensures all SDKs and documentation have identical keybind configurations, removing inconsistencies and aligning with the canonical TypeScript schema.