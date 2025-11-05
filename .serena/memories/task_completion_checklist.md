# Task Completion Checklist

## Before Completing Any Task

### Code Quality
- [ ] Run `bun turbo typecheck` - ensure no TypeScript errors
- [ ] Run `bun test` (from packages/opencode) - ensure all tests pass
- [ ] Check code follows conventions in AGENTS.md
- [ ] Verify no unnecessary `else` statements or `try/catch` blocks
- [ ] Ensure no `any` types used
- [ ] Prefer `const` over `let` where possible

### Testing
- [ ] Write tests for new functionality
- [ ] Update existing tests if needed
- [ ] Run full test suite to ensure no regressions

### Documentation
- [ ] Update relevant documentation if API changes
- [ ] Add comments for complex logic (if necessary)
- [ ] Update README files if user-facing changes

### Build & Deployment
- [ ] Run `bun turbo build` - ensure project builds successfully
- [ ] Check for any build warnings or errors
- [ ] Verify all workspace dependencies are correct

### MCP Specific
- [ ] Test MCP connections and error handling
- [ ] Verify socket error improvements work as expected
- [ ] Check timeout configurations are appropriate
- [ ] Test failure surfacing mechanisms

## Final Verification
- [ ] Review changes one last time
- [ ] Ensure task requirements are fully met
- [ ] Check for any edge cases missed
- [ ] Verify error messages are user-friendly

## Commands to Run
```bash
# From project root
bun turbo typecheck
bun turbo build

# From packages/opencode
bun test
```