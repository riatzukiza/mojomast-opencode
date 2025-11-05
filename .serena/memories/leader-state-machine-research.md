# Leader State Machine & Chord Parsing Research

## Current Implementation Analysis

### Existing Leader Key Support
- **Location**: `packages/opencode/src/cli/cmd/tui/context/keybind.tsx`
- **Current State**: Simple boolean `leader` flag
- **Timeout**: Fixed 2-second timeout
- **Limitations**: No chord support, no visual feedback, no proper state machine

### Keybind Parsing
- **Utility**: `packages/opencode/src/util/keybind.ts`
- **Features**: Supports `<leader>` notation, modifier parsing, multiple keybinds
- **Type**: `Keybind.Info` with ctrl, meta, shift, leader, name properties

### Configuration
- **Schema**: `packages/opencode/src/config/config.ts`
- **Leader Key**: Configurable via `keybinds.leader` (default: "ctrl+x")
- **Keybind Format**: Supports `<leader>` notation like `"<leader>q"`

## Vim Inspiration

From Vim documentation analysis:
- Leader key acts as a prefix for custom mappings
- Supports `<Leader>` syntax in mappings
- Can define local and global leader keys
- Supports key sequences and chords
- Uses `mapleader` variable for customization

## Implementation Requirements

### State Machine States
1. **idle** - Normal state, waiting for input
2. **leader_active** - Leader key pressed, waiting for chord
3. **chord_building** - Building multi-key chord sequence
4. **timeout** - Leader mode timed out
5. **matched** - Chord matched and executed

### Chord Parsing Features
- Multi-key sequence support (e.g., `<leader>gg` for goto top)
- Timeout management per state
- Visual feedback for current state
- Partial matching for ambiguous chords
- Escape/cancel functionality

### Integration Points
- Extend existing `KeybindProvider` in `keybind.tsx`
- Enhance `Keybind.parse()` to support chord sequences
- Add visual feedback to TUI components
- Update configuration schema for chord definitions