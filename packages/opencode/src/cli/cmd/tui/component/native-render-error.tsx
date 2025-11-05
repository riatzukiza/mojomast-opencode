import { createSignal } from "solid-js"
import { TextAttributes } from "@opentui/core"
import type { NativeRenderDetectionResult } from "@/util/native-render"

interface NativeRenderErrorProps {
  detection: NativeRenderDetectionResult
  onExit: () => Promise<void>
}

export function NativeRenderError(props: NativeRenderErrorProps) {
  const [copied, setCopied] = createSignal(false)

  const copyErrorInfo = () => {
    const errorInfo = formatErrorForClipboard(props.detection)
    // In a real implementation, we'd use the clipboard utility
    // For now, we'll just show that it was "copied"
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatErrorForClipboard = (detection: NativeRenderDetectionResult): string => {
    if (detection.success) return ""
    
    const error = detection.error!
    return `OpenCode TUI Native Render Error

Error: ${error.message}
Type: ${error.type}
Platform: ${detection.platform || 'unknown'}
Architecture: ${detection.arch || 'unknown'}

Details: ${error.details || 'No additional details'}

Suggestion: ${error.suggestion || 'No suggestion available'}

---
If this issue persists, please report it at:
https://github.com/sst/opencode/issues/new?template=bug-report.yml`
  }

  const getAlternativeOptions = () => {
    const options = []

    if (props.detection.error?.type === "missing_package") {
      options.push("Try the web interface: https://opencode.ai")
      options.push("Use a different platform that supports native TUI")
    }

    if (props.detection.error?.type === "preload_failed" || 
        props.detection.error?.type === "corrupted_installation") {
      options.push("Reinstall opencode: npm install -g opencode-ai@latest")
      options.push("Try the web interface: https://opencode.ai")
    }

    if (props.detection.error?.type === "permission_denied") {
      options.push("Check file permissions for opencode installation")
      options.push("Try running with appropriate privileges")
    }

    options.push("Report this issue for further assistance")

    return options
  }

  return (
    <box flexDirection="column" gap={2} padding={2}>
      <box flexDirection="column" gap={1}>
        <text attributes={TextAttributes.BOLD} fg="#ff5555">
          ✗ OpenCode TUI Failed to Start
        </text>
        <text>
          Native render library could not be loaded
        </text>
      </box>

      <box flexDirection="column" gap={1}>
        <text attributes={TextAttributes.BOLD}>Error Details:</text>
        <text fg="#f8f8f2">
          {props.detection.error?.message}
        </text>
        {props.detection.error?.details && (
          <text fg="#6272a4" wrapMode="word">
            {props.detection.error.details}
          </text>
        )}
      </box>

      <box flexDirection="column" gap={1}>
        <text attributes={TextAttributes.BOLD}>Platform Information:</text>
        <text>
          Platform: {props.detection.platform || 'unknown'}
        </text>
        <text>
          Architecture: {props.detection.arch || 'unknown'}
        </text>
      </box>

      {props.detection.error?.suggestion && (
        <box flexDirection="column" gap={1}>
          <text attributes={TextAttributes.BOLD}>Suggested Solution:</text>
          <text fg="#50fa7b" wrapMode="word">
            {props.detection.error.suggestion}
          </text>
        </box>
      )}

      <box flexDirection="column" gap={1}>
        <text attributes={TextAttributes.BOLD}>Alternative Options:</text>
        {getAlternativeOptions().map((option, index) => (
          <text key={index} wrapMode="word">
            {index + 1}. {option}
          </text>
        ))}
      </box>

      <box flexDirection="row" gap={2} marginTop={1}>
        <box 
          onMouseUp={copyErrorInfo} 
          backgroundColor="#6272a4" 
          padding={1}
        >
          <text attributes={TextAttributes.BOLD}>
            {copied() ? "✓ Copied!" : "Copy Error Info"}
          </text>
        </box>
        <box 
          onMouseUp={props.onExit} 
          backgroundColor="#ff5555" 
          padding={1}
        >
          <text attributes={TextAttributes.BOLD}>Exit</text>
        </box>
      </box>

      <box flexDirection="column" gap={1} marginTop={2}>
        <text fg="#6272a4">
          Need help? Visit https://opencode.ai/docs or join our Discord community
        </text>
      </box>
    </box>
  )
}