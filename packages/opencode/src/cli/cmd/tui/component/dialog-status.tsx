import { TextAttributes } from "@opentui/core"
import { useTheme } from "../context/theme"
import { useSync } from "@tui/context/sync"
import { For, Match, Switch, Show, createMemo } from "solid-js"
import type { McpStatus } from "@opencode-ai/sdk"

// Local type augmentation to include new MCP status fields
type EnhancedMcpStatusFailed = McpStatus & {
  status: "failed"
  error: string
  category?: "socket" | "timeout" | "authentication" | "configuration" | "server"
  details?: Record<string, any>
  suggestions?: string[]
}

export type DialogStatusProps = {}

export function DialogStatus() {
  const sync = useSync()
  const { theme } = useTheme()

  const enabledFormatters = createMemo(() => sync.data.formatter.filter((f) => f.enabled))

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          Status
        </text>
        <text fg={theme.textMuted}>esc</text>
      </box>
      <Show when={Object.keys(sync.data.mcp).length > 0} fallback={<text>No MCP Servers</text>}>
        <box>
          <text fg={theme.text}>{Object.keys(sync.data.mcp).length} MCP Servers</text>
          <For each={Object.entries(sync.data.mcp)}>
            {([key, item]) => (
              <box flexDirection="row" gap={1}>
                <text
                  flexShrink={0}
                  style={{
                    fg: {
                      connected: theme.success,
                      failed: theme.error,
                      disabled: theme.textMuted,
                    }[item.status],
                  }}
                >
                  •
                </text>
                <text fg={theme.text} wrapMode="word">
                  <b>{key}</b>{" "}
                  <span style={{ fg: theme.textMuted }}>
                    <Switch>
                      <Match when={item.status === "connected"}>Connected</Match>
                      <Match when={item.status === "failed"}>
                        <box>
                          <text>{(item as EnhancedMcpStatusFailed).error}</text>
                          <Show
                            when={
                              (item as EnhancedMcpStatusFailed).suggestions &&
                              (item as EnhancedMcpStatusFailed).suggestions!.length > 0
                            }
                          >
                            <text fg={theme.textMuted}>
                              <br />
                              Suggestions:
                              <For each={(item as EnhancedMcpStatusFailed).suggestions!}>
                                {(suggestion) => (
                                  <text>
                                    <br />• {suggestion}
                                  </text>
                                )}
                              </For>
                            </text>
                          </Show>
                        </box>
                      </Match>
                      <Match when={item.status === "disabled"}>Disabled in configuration</Match>
                    </Switch>
                  </span>
                </text>
              </box>
            )}
          </For>
        </box>
      </Show>
      {sync.data.lsp.length > 0 && (
        <box>
          <text fg={theme.text}>{sync.data.lsp.length} LSP Servers</text>
          <For each={sync.data.lsp}>
            {(item) => (
              <box flexDirection="row" gap={1}>
                <text
                  flexShrink={0}
                  style={{
                    fg: {
                      connected: theme.success,
                      error: theme.error,
                    }[item.status],
                  }}
                >
                  •
                </text>
                <text fg={theme.text} wrapMode="word">
                  <b>{item.id}</b> <span style={{ fg: theme.textMuted }}>{item.root}</span>
                </text>
              </box>
            )}
          </For>
        </box>
      )}
      <Show
        when={enabledFormatters().length > 0}
        fallback={<text fg={theme.text}>No Formatters</text>}
      >
        <box>
          <text fg={theme.text}>{enabledFormatters().length} Formatters</text>
          <For each={enabledFormatters()}>
            {(item) => (
              <box flexDirection="row" gap={1}>
                <text
                  flexShrink={0}
                  style={{
                    fg: theme.success,
                  }}
                >
                  •
                </text>
                <text wrapMode="word" fg={theme.text}>
                  <b>{item.name}</b>
                </text>
              </box>
            )}
          </For>
        </box>
      </Show>
    </box>
  )
}
