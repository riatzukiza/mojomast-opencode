## Keybind Schema Research Summary

### Current Schema Structure
The keybind schema is defined in `packages/opencode/src/config/config.ts` in the `Keybinds` zod object (lines 381-491). It includes:

- **leader**: ctrl+x (default)
- **app_exit**: ctrl+c,ctrl+d,<leader>q
- **editor_open**: <leader>e
- **theme_list**: <leader>t
- **sidebar_toggle**: <leader>b
- **status_view**: <leader>s
- **session_export**: <leader>x
- **session_new**: <leader>n
- **session_list**: <leader>l
- **session_timeline**: <leader>g
- **session_share**: none
- **session_unshare**: none
- **session_interrupt**: escape
- **session_compact**: <leader>c
- **messages_page_up**: pageup
- **messages_page_down**: pagedown
- **messages_half_page_up**: ctrl+alt+u
- **messages_half_page_down**: ctrl+alt+d
- **messages_first**: ctrl+g,home
- **messages_last**: ctrl+alt+g,end
- **messages_copy**: <leader>y
- **messages_undo**: <leader>u
- **messages_redo**: <leader>r
- **messages_toggle_conceal**: <leader>h
- **model_list**: <leader>m
- **model_cycle_recent**: f2
- **model_cycle_recent_reverse**: shift+f2
- **command_list**: ctrl+p
- **agent_list**: <leader>a
- **agent_cycle**: tab
- **agent_cycle_reverse**: shift+tab
- **input_clear**: ctrl+c
- **input_forward_delete**: ctrl+d
- **input_paste**: ctrl+v
- **input_submit**: return
- **input_newline**: shift+return,ctrl+j
- **history_previous**: up
- **history_next**: down
- **session_child_cycle**: ctrl+right
- **session_child_cycle_reverse**: ctrl+left

### Keybind Utility Functions
Located in `packages/opencode/src/util/keybind.ts`:
- `Keybind.Info` type with ctrl, meta, shift, leader, name fields
- `Keybind.match()` for comparing keybinds
- `Keybind.toString()` for string representation
- `Keybind.parse()` for parsing string patterns

### Documentation Status
- Web docs at https://opencode.ai/docs/keybinds/ show current schema
- Python SDK docs don't contain keybind configuration details
- Type definitions are generated in JS SDK (`KeybindsConfig` type)

### Migration Requirements
Based on the branch name "2-5-keybind-schema-migration-and-docs-sync", this appears to be about:
1. Migrating the keybind schema structure
2. Synchronizing documentation across all platforms

The current schema appears comprehensive and well-structured. Any migration would need to maintain backward compatibility.