# Markdown/Text Rendering Parity Analysis for Windows Git Bash

## Current Issues Identified

### 1. Markdown Function Not Processing Text
- Location: `packages/opencode/src/cli/ui.ts:80`
- Issue: The `markdown(text: string)` function just returns text as-is
- Impact: No markdown processing or Windows Git Bash compatibility applied

### 2. TextPart Component Missing Terminal Processing
- Location: `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx:856-875`
- Issue: Text content rendered with `filetype="markdown"` but not processed through Windows Git Bash utilities
- Impact: Markdown content doesn't get ANSI processing, path normalization, or Git Bash compatibility

### 3. Inconsistent Processing Pattern
- Bash tool output: Goes through `sanitizeTextForTerminal()` → `processAnsiForTerminal()`
- Text content: Goes directly to renderer without processing
- Impact: Inconsistent rendering behavior between tool output and markdown content

## Root Causes

1. **Missing Integration**: The existing Windows Git Bash utilities (terminal.ts, path.ts, ansi.ts) are not integrated into the markdown/text rendering pipeline

2. **Incomplete UI Function**: The `UI.markdown()` function is a stub that doesn't actually process markdown

3. **Direct Rendering**: TextPart component renders content directly without applying terminal compatibility processing

## Solution Design

### Phase 1: Enhance UI.markdown Function
- Integrate Windows Git Bash detection and processing
- Apply ANSI processing for terminal compatibility
- Handle path normalization within markdown content

### Phase 2: Update TextPart Component  
- Process text content through Windows Git Bash utilities before rendering
- Apply the same sanitization and ANSI processing as bash tool output
- Ensure consistent rendering behavior

### Phase 3: Integration Testing
- Verify markdown rendering works correctly in Git Bash
- Test path display and ANSI color rendering
- Ensure no regression in other terminal environments

## Expected Impact

- Consistent markdown rendering across all Windows terminals
- Proper ANSI color processing in Git Bash environment  
- Correct path display formatting for Git Bash users
- Improved overall text rendering parity