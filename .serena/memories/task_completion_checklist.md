# Task Completion Checklist

## Code Quality
- [ ] Run `bun turbo typecheck` - ensure all TypeScript errors are resolved
- [ ] Run `bun turbo build` - ensure all packages build successfully
- [ ] Run tests with `bun test` in relevant packages
- [ ] Format code with Prettier (if configured)
- [ ] Check for linting errors

## Functionality Verification
- [ ] Test the specific feature/fix implemented
- [ ] Verify no regressions in existing functionality
- [ ] Test edge cases and error conditions
- [ ] Ensure proper error handling follows conventions

## Documentation & Communication
- [ ] Update relevant documentation if needed
- [ ] Add clear commit messages following project style
- [ ] Reference relevant issues in commit messages
- [ ] Ensure code comments are minimal and necessary

## Integration Checks
- [ ] Verify workspace dependencies are correct
- [ ] Check that package.json changes are consistent
- [ ] Ensure build outputs are generated correctly
- [ ] Test any SDK regeneration if server code changed

## Alpine Linux Specific
- [ ] Verify compatibility with Alpine Linux environment
- [ ] Check that all dependencies work with musl libc
- [ ] Ensure binary compatibility if native modules used
- [ ] Test any system-specific integrations

## Final Verification
- [ ] Run full development workflow (`bun dev`)
- [ ] Check that all services start correctly
- [ ] Verify TUI functionality if relevant
- [ ] Test any plugin or extension points affected