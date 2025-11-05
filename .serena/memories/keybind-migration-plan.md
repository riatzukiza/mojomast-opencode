Keybind Schema Migration Plan

Current Issues:
- Python SDK has outdated keybinds that don't match TypeScript schema
- Python SDK has non-existent keybinds: app_help, project_init, tool_details, thinking_blocks
- Python SDK has deprecated keybinds that should be removed
- Missing keybinds in Python SDK: sidebar_toggle, status_view, messages_toggle_conceal, input_forward_delete, command_list, history_previous/next

Migration Steps:
1. Update Python SDK to match TypeScript schema exactly
2. Remove all deprecated keybinds from Python SDK
3. Add missing keybinds to Python SDK with correct defaults
4. Update documentation to ensure consistency
5. Regenerate TypeScript types if needed

Canonical schema is in packages/opencode/src/config/config.ts Keybinds object