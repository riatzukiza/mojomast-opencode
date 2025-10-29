import { describe, expect, test, beforeEach, afterEach, vi } from "bun:test"
import { WebFetchTool } from "../../src/tool/webfetch"
import { Config } from "../../src/config/config"
import { Permission } from "../../src/permission"

const ctx = {
  sessionID: "test",
  messageID: "",
  callID: "",
  agent: "build",
  abort: new AbortController().signal,
  metadata: () => {},
}

const webFetchTool = await WebFetchTool.init()
const originalFetch = global.fetch

describe("tool.webfetch", () => {
  beforeEach(() => {
    vi.spyOn(Config, "get").mockResolvedValue({
      permission: {
        webfetch: "allow",
      },
    })

    // Mock Permission.ask to resolve immediately
    vi.spyOn(Permission, "ask").mockResolvedValue(undefined)
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  test("should fetch content from valid URL", async () => {
    // Mock fetch to return test content
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body>Test content</body></html>"),
      headers: new Headers({ "content-type": "text/html" }),
    })

    const result = await webFetchTool.execute(
      {
        url: "https://example.com",
        format: "text",
      },
      ctx,
    )

    expect(result.title).toBe("https://example.com")
    expect(result.output).toContain("Test content")
    expect(fetch).toHaveBeenCalledWith("https://example.com")
  })

  test("should validate URL format", async () => {
    await expect(
      webFetchTool.execute(
        {
          url: "invalid-url",
          format: "text",
        },
        ctx,
      ),
    ).rejects.toThrow("URL must start with http:// or https://")
  })

  test("should handle HTTP URLs", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("HTTP content"),
      headers: new Headers({ "content-type": "text/plain" }),
    })

    const result = await webFetchTool.execute(
      {
        url: "http://example.com",
        format: "text",
      },
      ctx,
    )

    expect(result.title).toBe("http://example.com")
    expect(result.output).toContain("HTTP content")
  })

  test("should handle HTTPS URLs", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("HTTPS content"),
      headers: new Headers({ "content-type": "text/plain" }),
    })

    const result = await webFetchTool.execute(
      {
        url: "https://example.com",
        format: "text",
      },
      ctx,
    )

    expect(result.title).toBe("https://example.com")
    expect(result.output).toContain("HTTPS content")
  })

  test("should handle different formats", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<h1>HTML Content</h1>"),
      headers: new Headers({ "content-type": "text/html" }),
    })

    // Test text format
    const textResult = await webFetchTool.execute(
      {
        url: "https://example.com",
        format: "text",
      },
      ctx,
    )
    expect(textResult.output).toContain("<h1>HTML Content</h1>")

    // Test markdown format
    const markdownResult = await webFetchTool.execute(
      {
        url: "https://example.com",
        format: "markdown",
      },
      ctx,
    )
    expect(markdownResult.output).toContain("# HTML Content")

    // Test HTML format
    const htmlResult = await webFetchTool.execute(
      {
        url: "https://example.com",
        format: "html",
      },
      ctx,
    )
    expect(htmlResult.output).toContain("<h1>HTML Content</h1>")
  })

  test("should handle fetch errors", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    await expect(
      webFetchTool.execute(
        {
          url: "https://example.com",
          format: "text",
        },
        ctx,
      ),
    ).rejects.toThrow("Network error")
  })

  test("should handle HTTP error responses", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    })

    await expect(
      webFetchTool.execute(
        {
          url: "https://example.com/notfound",
          format: "text",
        },
        ctx,
      ),
    ).rejects.toThrow()
  })

  test("should handle timeout", async () => {
    global.fetch = vi
      .fn()
      .mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 2000)),
      )

    await expect(
      webFetchTool.execute(
        {
          url: "https://example.com",
          format: "text",
          timeout: 1, // 1 second timeout
        },
        ctx,
      ),
    ).rejects.toThrow()
  })

  test("should validate required parameters", async () => {
    await expect(webFetchTool.execute({} as any, ctx)).rejects.toThrow()

    await expect(
      webFetchTool.execute(
        {
          url: "https://example.com",
          // missing format
        } as any,
        ctx,
      ),
    ).rejects.toThrow()
  })

  test("should handle large responses", async () => {
    const largeContent = "x".repeat(6 * 1024 * 1024) // 6MB content

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(largeContent),
      headers: new Headers({ "content-type": "text/plain" }),
    })

    const result = await webFetchTool.execute(
      {
        url: "https://example.com/large",
        format: "text",
      },
      ctx,
    )

    // Should truncate large responses
    expect(result.output.length).toBeLessThan(5 * 1024 * 1024) // Less than 5MB
  })

  test("should handle permission denied", async () => {
    // Mock Config to return denied permission
    vi.mocked(Config.get).mockResolvedValue({
      permission: {
        webfetch: "deny",
      },
    })

    await expect(
      webFetchTool.execute(
        {
          url: "https://example.com",
          format: "text",
        },
        ctx,
      ),
    ).rejects.toThrow()
  })
})
