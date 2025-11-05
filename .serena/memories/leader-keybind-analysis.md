## Leader Key and Keybind System Analysis

### Current Implementation
- Leader key is configured in `Config/Keybinds/leader` (default: "ctrl+x")
- Keybind parsing exists in `packages/opencode/src/util/keybind.ts`
- Leader state management in `packages/opencode/src/cli/cmd/tui/context/keybind.tsx`

### Key Components
1. **Keybind.parse()**: Parses key combinations including `<leader>` syntax
2. **Keybind.Info**: Contains leader boolean flag
3. **KeybindProvider**: Manages leader state with 2-second timeout
4. **useKeyboard**: Handles leader key activation and chord completion

### Current Flow
1. Leader key pressed → leader mode activated (2s timeout)
2. Subsequent key pressed → chord matched, leader mode deactivated
3. Focus management during leader mode

### Missing Features
- No multi-key chord parsing (beyond leader + single key)
- No state machine for complex chord sequences
- Limited to leader + single key combinations

### Architecture Requirements
- Extend current system to support multi-key chords
- Implement proper state machine for chord parsing
- Maintain backward compatibility with existing leader key behavior