# Task Completion Checklist

## Before Marking Task Complete
1. **Code Quality**
   - Follow all style conventions from AGENTS.md
   - No unnecessary destructuring or `else` statements
   - Avoid `try`/`catch` where possible
   - Use precise types, avoid `any`
   - Prefer single-word variable names

2. **Build & Type Checking**
   ```bash
   bun turbo typecheck  # Must pass with no errors
   bun turbo build     # Must succeed
   ```

3. **Testing**
   ```bash
   bun test  # All tests must pass
   ```

4. **Code Review**
   - Logic contained in single functions where appropriate
   - Proper error handling with structured logging
   - No unused imports or variables
   - Consistent naming conventions

5. **Documentation**
   - Update relevant memory files if architectural changes
   - Add comments only when explicitly requested
   - Ensure README/CONTRIBUTING.md changes if needed

## After Major Changes
- Run `./packages/sdk/js/script/build.ts` if server.ts was modified
- Test the TUI with `bun dev` if UI changes were made
- Verify all workspace dependencies are correctly resolved

## Git Readiness
- All typecheck/build commands pass
- No console errors or warnings
- Changes are focused and atomic
- Related issues are referenced in commit messages