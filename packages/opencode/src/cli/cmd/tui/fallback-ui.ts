import { createInterface } from "node:readline"
import { exit } from "node:process"

interface FallbackUIOptions {
  error: string
  suggestions: string[]
  onRetry?: () => void
  onExit?: () => void
}

export function showFallbackUI(options: FallbackUIOptions): void {
  // Clear screen and move cursor to top
  process.stdout.write('\x1b[2J\x1b[H')
  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  // Enable raw mode for better input handling
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true)
  }

  let selectedOption = 0
  const menuOptions = [
    { label: "Retry", action: () => options.onRetry?.() },
    { label: "Exit", action: () => options.onExit?.() }
  ]

  function render() {
    process.stdout.write('\x1b[2J\x1b[H')
    
    console.log('\x1b[31m╔══════════════════════════════════════════════════════════════╗\x1b[0m')
    console.log('\x1b[31m║                    Native Library Error                 ║\x1b[0m')
    console.log('\x1b[31m╚══════════════════════════════════════════════════════════════╝\x1b[0m')
    console.log('')
    console.log('\x1b[33mOpenCode TUI failed to start because the native render library could not be loaded.\x1b[0m')
    console.log('')
    console.log('\x1b[1mError Details:\x1b[0m')
    console.log(`  ${options.error}`)
    console.log('')
    console.log('\x1b[1mSuggested Solutions:\x1b[0m')
    options.suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`)
    })
    console.log('')
    console.log('\x1b[1mOptions:\x1b[0m')
    
    menuOptions.forEach((option, index) => {
      const prefix = index === selectedOption ? '\x1b[32m▶\x1b[0m' : ' '
      const highlight = index === selectedOption ? '\x1b[32m' : ''
      const reset = index === selectedOption ? '\x1b[0m' : ''
      console.log(`  ${prefix} ${highlight}${option.label}${reset}`)
    })
    
    console.log('')
    console.log('\x1b[90mUse ↑/↓ arrows to navigate, Enter to select, Ctrl+C to exit\x1b[0m')
  }

  function handleInput(key: string) {
    switch (key) {
      case '\x1b[A': // Up arrow
        selectedOption = Math.max(0, selectedOption - 1)
        render()
        break
      case '\x1b[B': // Down arrow
        selectedOption = Math.min(menuOptions.length - 1, selectedOption + 1)
        render()
        break
      case '\r': // Enter
      case '\n': // Enter
        cleanup()
        menuOptions[selectedOption].action()
        break
      case '\x03': // Ctrl+C
        cleanup()
        exit(0)
        break
    }
  }

  function cleanup() {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false)
    }
    rl.close()
  }

  process.stdin.on('data', (data) => {
    const str = data.toString()
    if (str.startsWith('\x1b[')) {
      handleInput(str)
    } else if (str === '\r' || str === '\n') {
      handleInput(str)
    }
  })

  render()
}

export function showSimpleError(error: string): void {
  process.stdout.write('\x1b[2J\x1b[H')
  console.log('\x1b[31m╔══════════════════════════════════════════════════════════════╗\x1b[0m')
  console.log('\x1b[31m║                    Native Library Error                 ║\x1b[0m')
  console.log('\x1b[31m╚══════════════════════════════════════════════════════════════╝\x1b[0m')
  console.log('')
  console.log('\x1b[33mOpenCode TUI failed to start because the native render library could not be loaded.\x1b[0m')
  console.log('')
  console.log('\x1b[1mError:\x1b[0m')
  console.log(`  ${error}`)
  console.log('')
  console.log('\x1b[1mTo fix this issue:\x1b[0m')
  console.log('  1. Run: bun run build')
  console.log('  2. Try again')
  console.log('  3. If the issue persists, report it at: https://github.com/sst/opencode/issues')
  console.log('')
  console.log('\x1b[90mPress any key to exit...\x1b[0m')
  
  // Simple exit on any key
  process.stdin.setRawMode(true)
  process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    exit(1)
  })
}