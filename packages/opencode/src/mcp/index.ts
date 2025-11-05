import { experimental_createMCPClient, type Tool } from "ai"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { Config } from "../config/config"
import { Log } from "../util/log"
import { NamedError } from "../util/error"
import z from "zod/v4"
import { Instance } from "../project/instance"
import { withTimeout } from "@/util/timeout"

export namespace MCP {
  const log = Log.create({ service: "mcp" })

  export const Failed = NamedError.create(
    "MCPFailed",
    z.object({
      name: z.string(),
    }),
  )

  type Client = Awaited<ReturnType<typeof experimental_createMCPClient>>

  export const Status = z
    .discriminatedUnion("status", [
      z
        .object({
          status: z.literal("connected"),
        })
        .meta({
          ref: "MCPStatusConnected",
        }),
      z
        .object({
          status: z.literal("disabled"),
        })
        .meta({
          ref: "MCPStatusDisabled",
        }),
      z
        .object({
          status: z.literal("failed"),
          error: z.string(),
          category: z.enum(["socket", "timeout", "authentication", "configuration", "server"]).optional(),
          details: z.record(z.any()).optional(),
          suggestions: z.array(z.string()).optional(),
        })
        .meta({
          ref: "MCPStatusFailed",
        }),
    ])
    .meta({
      ref: "MCPStatus",
    })
  export type Status = z.infer<typeof Status>
  type MCPClient = Awaited<ReturnType<typeof experimental_createMCPClient>>

  const state = Instance.state(
    async () => {
      const cfg = await Config.get()
      const config = cfg.mcp ?? {}
      const clients: Record<string, Client> = {}
      const status: Record<string, Status> = {}

      await Promise.all(
        Object.entries(config).map(async ([key, mcp]) => {
          const result = await create(key, mcp).catch(() => undefined)
          if (!result) return

          status[key] = result.status

          if (result.mcpClient) {
            clients[key] = result.mcpClient
          }
        }),
      )
      return {
        status,
        clients,
      }
    },
    async (state) => {
      await Promise.all(Object.values(state.clients).map((client) => client.close()))
    },
  )

  export async function add(name: string, mcp: Config.Mcp) {
    const s = await state()
    const result = await create(name, mcp)
    if (!result) return
    if (!result.mcpClient) {
      s.status[name] = result.status
      return
    }
    s.clients[name] = result.mcpClient
    s.status[name] = result.status
  }

  async function create(key: string, mcp: Config.Mcp) {
    if (mcp.enabled === false) {
      log.info("mcp server disabled", { key })
      return
    }
    log.info("found", { key, type: mcp.type })
    let mcpClient: MCPClient | undefined
    let status: Status | undefined

    const categorizeError = (error: Error | string): { category: string, message: string, suggestions: string[] } => {
      const errorMessage = error instanceof Error ? error.message : error
      const lowerMessage = errorMessage.toLowerCase()
      
      if (lowerMessage.includes("econnrefused") || lowerMessage.includes("connection refused")) {
        return {
          category: "socket",
          message: "Connection refused - MCP server not running or unreachable",
          suggestions: ["Start the MCP server", "Check server address and port", "Verify firewall settings"]
        }
      }
      
      if (lowerMessage.includes("etimedout") || lowerMessage.includes("timeout")) {
        return {
          category: "timeout", 
          message: "Connection timeout - server not responding",
          suggestions: ["Check network connectivity", "Verify server is running", "Increase timeout configuration"]
        }
      }
      
      if (lowerMessage.includes("enotfound") || lowerMessage.includes("getaddrinfo")) {
        return {
          category: "socket",
          message: "Host not found - invalid server address",
          suggestions: ["Check server URL", "Verify DNS configuration", "Use IP address instead"]
        }
      }
      
      if (lowerMessage.includes("failed to get tools")) {
        return {
          category: "server",
          message: "Tool fetch failed - server error",
          suggestions: ["Check MCP server logs", "Verify server configuration", "Restart MCP server"]
        }
      }
      
      if (lowerMessage.includes("401") || lowerMessage.includes("403") || lowerMessage.includes("unauthorized")) {
        return {
          category: "authentication",
          message: "Authentication failed - invalid credentials",
          suggestions: ["Check API keys", "Verify authentication headers", "Update server permissions"]
        }
      }
      
      return {
        category: "server",
        message: errorMessage,
        suggestions: ["Check MCP server logs", "Verify server configuration"]
      }
    }

    if (mcp.type === "remote") {
      const transports = [
        {
          name: "StreamableHTTP",
          transport: new StreamableHTTPClientTransport(new URL(mcp.url), {
            requestInit: {
              headers: mcp.headers,
            },
          }),
        },
        {
          name: "SSE",
          transport: new SSEClientTransport(new URL(mcp.url), {
            requestInit: {
              headers: mcp.headers,
            },
          }),
        },
      ]
      const transportErrors: Array<{ name: string, error: Error }> = []
      
      for (const { name, transport } of transports) {
        const result = await experimental_createMCPClient({
          name: "opencode",
          transport,
        })
          .then((client) => {
            log.info("connected", { key, transport: name })
            mcpClient = client
            status = { status: "connected" }
            return true
          })
          .catch((error) => {
            const errorObj = error instanceof Error ? error : new Error(String(error))
            transportErrors.push({ name, error: errorObj })
            log.debug("transport connection failed", {
              key,
              transport: name,
              url: mcp.url,
              error: errorObj.message,
            })
            return false
          })
        if (result) break
      }
      
      if (!mcpClient && transportErrors.length > 0) {
        const lastError = transportErrors[transportErrors.length - 1].error
        const categorized = categorizeError(lastError)
        status = {
          status: "failed",
          error: categorized.message,
          category: categorized.category as any,
          details: {
            transportErrors: transportErrors.map(t => ({
              transport: t.name,
              error: t.error.message
            })),
            url: mcp.url
          },
          suggestions: categorized.suggestions
        }
      }
    }

    if (mcp.type === "local") {
      const [cmd, ...args] = mcp.command
      await experimental_createMCPClient({
        name: "opencode",
        transport: new StdioClientTransport({
          stderr: "ignore",
          command: cmd,
          args,
          env: {
            ...process.env,
            ...(cmd === "opencode" ? { BUN_BE_BUN: "1" } : {}),
            ...mcp.environment,
          },
        }),
      })
        .then((client) => {
          mcpClient = client
          status = {
            status: "connected",
          }
        })
        .catch((error) => {
          const errorObj = error instanceof Error ? error : new Error(String(error))
          const categorized = categorizeError(errorObj)
          log.error("local mcp startup failed", {
            key,
            command: mcp.command,
            error: errorObj.message,
          })
          status = {
            status: "failed",
            error: categorized.message,
            category: categorized.category as any,
            details: {
              command: mcp.command,
              originalError: errorObj.message
            },
            suggestions: categorized.suggestions
          }
        })
    }

    if (!status) {
      const categorized = categorizeError("Unknown error")
      status = {
        status: "failed",
        error: categorized.message,
        category: categorized.category as any,
        suggestions: categorized.suggestions
      }
    }

    if (!mcpClient) {
      return {
        mcpClient: undefined,
        status,
      }
    }

    const result = await withTimeout(mcpClient.tools(), mcp.timeout ?? 5000).catch((error) => {
      const categorized = categorizeError(error instanceof Error ? error : new Error(String(error)))
      return categorized
    })
    
    if (!result) {
      await mcpClient.close()
      const categorized = categorizeError("Failed to get tools")
      status = {
        status: "failed",
        error: categorized.message,
        category: categorized.category as any,
        details: {
          timeout: mcp.timeout ?? 5000
        },
        suggestions: [...(categorized.suggestions || []), "Increase timeout configuration"]
      }
      return {
        mcpClient: undefined,
        status,
      }
    }

    return {
      mcpClient,
      status,
    }
  }

  export async function status() {
    return state().then((state) => state.status)
  }

  export async function clients() {
    return state().then((state) => state.clients)
  }

  export async function tools() {
    const result: Record<string, Tool> = {}
    for (const [clientName, client] of Object.entries(await clients())) {
      for (const [toolName, tool] of Object.entries(await client.tools())) {
        const sanitizedClientName = clientName.replace(/\s+/g, "_")
        const sanitizedToolName = toolName.replace(/[-\s]+/g, "_")
        result[sanitizedClientName + "_" + sanitizedToolName] = tool
      }
    }
    return result
  }
}
