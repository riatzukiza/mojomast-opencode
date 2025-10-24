import { useSync } from "@tui/context/sync"
import { createMemo, For, Show, Switch, Match } from "solid-js"
import { Theme } from "../../context/theme"
import { Locale } from "@/util/locale"
import path from "path"
import type { AssistantMessage } from "@opencode-ai/sdk"

export function Sidebar(props: { sessionID: string }) {
  const sync = useSync()
  const session = createMemo(() => sync.session.get(props.sessionID)!)
  const todo = createMemo(() => sync.data.todo[props.sessionID] ?? [])
  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])

  const cost = createMemo(() => {
    const total = messages().reduce((sum, x) => sum + (x.role === "assistant" ? x.cost : 0), 0)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total)
  })

  const requestTokens = createMemo(() => {
    const totals = messages().reduce(
      (acc, x) => {
        if (x.role === "assistant") {
          acc.input += x.tokens.input
          acc.output += x.tokens.output
          acc.reasoning += x.tokens.reasoning
        }
        return acc
      },
      { input: 0, output: 0, reasoning: 0 },
    )

    return {
      input: totals.input.toLocaleString(),
      output: totals.output.toLocaleString(),
      reasoning: totals.reasoning.toLocaleString(),
      total: (totals.input + totals.output + totals.reasoning).toLocaleString(),
    }
  })

  const context = createMemo(() => {
    const last = messages().findLast((x) => x.role === "assistant" && x.tokens.output > 0) as AssistantMessage
    if (!last)
      return {
        tokens: "0",
        percentage: null,
        compactionEvents: 0,
        conversationLength: "0",
        instructionTokens: "0",
        totalUserTokens: "0",
        totalAssistantTokens: "0",
      }

    const total =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = sync.data.provider.find((x) => x.id === last.providerID)?.models[last.modelID]

    // Count compaction events (summary messages)
    const compactionEvents = messages().filter((x) => x.role === "assistant" && x.summary).length

    // Get the actual system prompt content that was used
    // We need to reconstruct the system prompt from the last message
    const systemPromptContent = last.system?.join("") || ""

    // Count characters in system prompt (rough estimate: ~4 chars per token)
    const systemPromptChars = systemPromptContent.length
    const estimatedSystemTokens = Math.round(systemPromptChars / 4)

    // Calculate conversation length (total minus instruction tokens)
    const conversationLength = Math.max(0, total - estimatedSystemTokens)

    // Calculate user and assistant tokens based on character proportions of conversation only
    let totalUserChars = 0
    let totalAssistantChars = 0

    messages().forEach((msg) => {
      const parts = sync.data.part[msg.id] || []
      if (msg.role === "user") {
        parts.forEach((part) => {
          if (part.type === "text") {
            totalUserChars += part.text?.length || 0
          }
        })
      } else if (msg.role === "assistant") {
        parts.forEach((part) => {
          if (part.type === "text") {
            totalAssistantChars += part.text?.length || 0
          }
        })
      }
    })

    const totalConversationChars = totalUserChars + totalAssistantChars

    // Apply proportional distribution to conversation length only (excluding system prompt)
    const userTokenRatio = totalConversationChars > 0 ? totalUserChars / totalConversationChars : 0
    const assistantTokenRatio = totalConversationChars > 0 ? totalAssistantChars / totalConversationChars : 0

    const userTokens = Math.round(conversationLength * userTokenRatio)
    const assistantTokens = Math.round(conversationLength * assistantTokenRatio)

    return {
      tokens: total.toLocaleString(),
      percentage: model?.limit.context ? Math.round((total / model.limit.context) * 100) : null,
      compactionEvents,
      conversationLength: conversationLength.toLocaleString(),
      instructionTokens: estimatedSystemTokens.toLocaleString(),
      totalUserTokens: userTokens.toLocaleString(),
      totalAssistantTokens: assistantTokens.toLocaleString(),
    }
  })

  return (
    <Show when={session()}>
      <box flexShrink={0} gap={1} width={40}>
        <box>
          <text>
            <b>{session().title}</b>
          </text>
          <Show when={session().share?.url}>
            <text fg={Theme.textMuted}>{session().share!.url}</text>
          </Show>
        </box>
        <box>
          <text>
            <b>Context</b>
          </text>
          <text fg={Theme.textMuted}>{context()?.tokens ?? 0} tokens</text>
          <text fg={Theme.textMuted}>{context()?.percentage ?? 0}% used</text>
          <text fg={Theme.textMuted}>Compaction events: {context()?.compactionEvents ?? 0}</text>

          <text fg={Theme.textMuted}>Instruction tokens: {context()?.instructionTokens ?? 0}</text>
          <text fg={Theme.textMuted}>User Tokens: {context()?.totalUserTokens ?? 0}</text>
          <text fg={Theme.textMuted}>Assistant Tokens: {context()?.totalAssistantTokens ?? 0}</text>
        </box>
        <box>
          <text>
            <b>Request Tokens</b>
          </text>
          <text fg={Theme.textMuted}>Input: {requestTokens().input}</text>
          <text fg={Theme.textMuted}>Output: {requestTokens().output}</text>
          <text fg={Theme.textMuted}>Reasoning: {requestTokens().reasoning}</text>
          <text fg={Theme.textMuted}>Total: {requestTokens().total}</text>
          <text fg={Theme.textMuted}>{cost()} spent</text>
        </box>
        <Show when={Object.keys(sync.data.mcp).length > 0}>
          <box>
            <text>
              <b>MCP</b>
            </text>
            <For each={Object.entries(sync.data.mcp)}>
              {([key, item]) => (
                <box flexDirection="row" gap={1}>
                  <text
                    flexShrink={0}
                    style={{
                      fg: {
                        connected: Theme.success,
                        failed: Theme.error,
                        disabled: Theme.textMuted,
                      }[item.status],
                    }}
                  >
                    •
                  </text>
                  <text wrapMode="word">
                    {key}{" "}
                    <span style={{ fg: Theme.textMuted }}>
                      <Switch>
                        <Match when={item.status === "connected"}>Connected</Match>
                        <Match when={item.status === "failed" && item}>{(val) => <i>{val().error}</i>}</Match>
                        <Match when={item.status === "disabled"}>Disabled in configuration</Match>
                      </Switch>
                    </span>
                  </text>
                </box>
              )}
            </For>
          </box>
        </Show>
        <Show when={sync.data.lsp.length > 0}>
          <box>
            <text>
              <b>LSP</b>
            </text>
            <For each={sync.data.lsp}>
              {(item) => (
                <box flexDirection="row" gap={1}>
                  <text
                    flexShrink={0}
                    style={{
                      fg: {
                        connected: Theme.success,
                        error: Theme.error,
                      }[item.status],
                    }}
                  >
                    •
                  </text>
                  <text fg={Theme.textMuted}>
                    {item.id} {item.root}
                  </text>
                </box>
              )}
            </For>
          </box>
        </Show>
        <Show when={session().summary?.diffs}>
          <box>
            <text>
              <b>Modified Files</b>
            </text>
            <For each={session().summary?.diffs || []}>
              {(item) => {
                const file = createMemo(() => {
                  const splits = item.file.split(path.sep).filter(Boolean)
                  const last = splits.at(-1)!
                  const rest = splits.slice(0, -1).join(path.sep)
                  return Locale.truncateMiddle(rest, 30 - last.length) + "/" + last
                })
                return (
                  <box flexDirection="row" gap={1} justifyContent="space-between">
                    <text fg={Theme.textMuted} wrapMode="char">
                      {file()}
                    </text>
                    <box flexDirection="row" gap={1} flexShrink={0}>
                      <Show when={item.additions}>
                        <text fg={Theme.diffAdded}>+{item.additions}</text>
                      </Show>
                      <Show when={item.deletions}>
                        <text fg={Theme.diffRemoved}>-{item.deletions}</text>
                      </Show>
                    </box>
                  </box>
                )
              }}
            </For>
          </box>
        </Show>
        <Show when={todo().length > 0}>
          <box>
            <text>
              <b>Todo</b>
            </text>
            <For each={todo()}>
              {(todo) => (
                <text style={{ fg: todo.status === "in_progress" ? Theme.success : Theme.textMuted }}>
                  [{todo.status === "completed" ? "✓" : " "}] {todo.content}
                </text>
              )}
            </For>
          </box>
        </Show>
      </box>
    </Show>
  )
}
