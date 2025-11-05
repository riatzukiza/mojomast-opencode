# Suggested Development Commands

## Core Development
```bash
# Run opencode in development mode (from root)
bun dev

# Run opencode in development mode (from packages/opencode)
cd packages/opencode && bun dev

# Type checking across all packages
bun turbo typecheck

# Build all packages
bun turbo build

# Run tests (from packages/opencode)
cd packages/opencode && bun test
```

## Package Management
```bash
# Install dependencies
bun install

# Add dependency to specific package
bun add <package> --cwd packages/opencode

# Add dev dependency
bun add <package> --dev --cwd packages/opencode
```

## Git Operations
```bash
# Check git status
git status

# View recent commits
git log --oneline -10

# Stage and commit changes
git add .
git commit -m "commit message"
```

## File Operations
```bash
# List files in directory
ls -la

# Search for files
find . -name "*.ts" -type f

# Search within files
grep -r "pattern" --include="*.ts" .

# Check file contents
cat path/to/file.ts
```

## MCP Specific Development
```bash
# Test MCP functionality
cd packages/opencode && bun run src/cli/cmd/mcp.ts

# Check MCP configuration
cat ~/.config/opencode/mcp.json
```

## Debugging
```bash
# Check running processes
ps aux | grep opencode

# Check logs
tail -f ~/.config/opencode/logs/*.log

# Debug with Node inspector
node --inspect packages/opencode/src/index.ts
```