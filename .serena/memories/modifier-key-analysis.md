# Modifier Key Analysis

## Current Implementation Issues Found

### 1. Asymmetric Meta/Alt Handling in keybind.ts
- **Location**: `packages/opencode/src/util/keybind.ts:20`
- **Bug**: `toString()` converts `meta` to `"alt"` string
- **Impact**: Creates inconsistent representation where parsing works but string output is wrong
- **Code**: `if (info.meta) parts.push("alt")` should be `if (info.meta) parts.push("meta")`

### 2. Modifier State Handling in modifiers.ts
- **Location**: `packages/desktop/src/utils/modifiers.ts`
- **Status**: Well-structured with platform-specific handling
- **Features**: 
  - Platform detection (Mac vs Windows/Linux)
  - `mod` abstraction for platform-appropriate modifier
  - Proper equivalence handling (cmd/meta, mod/ctrl-meta)

### 3. Inconsistency Between Systems
- **Desktop modifiers.ts**: Uses "meta" consistently 
- **Opencode keybind.ts**: Has the meta->alt conversion bug
- **Impact**: Cross-platform modifier handling may be inconsistent

## Normalization Requirements
1. Fix the meta->alt conversion bug in keybind.ts
2. Ensure consistent modifier naming across both systems
3. Maintain platform-specific abstractions where appropriate
4. Test Alt/Meta/Ctrl combos across different platforms