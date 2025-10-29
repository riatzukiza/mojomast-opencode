import { describe, expect, test, beforeEach, afterEach, mock, spyOn } from "bun:test"
import { WebFetchTool } from "../../src/tool/webfetch"
import { Config } from "../../src/config/config"
import { Permission } from "../../src/permission"

const ctx = {
  sessionID: "test",
  messageID: "",
  toolCallID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  metadata: () => {},
}

describe("tool.webfetch", () => {
  let webFetchTool: any

  beforeEach(async () => {
    // Set up localized mocks using mock.module
    mock.module("../../src/config/config", () => ({
      Config: {
        get: mock(() =>
          Promise.resolve({
            permission: {
              webfetch: "allow",
            },
          }),
        ),
      },
    }))

    mock.module("../../src/permission", () => ({
      Permission: {
        ask: mock(() => Promise.resolve(undefined)),
      },
    }))

    // Initialize tool with mocked dependencies
    const { WebFetchTool: MockedWebFetchTool } = await import("../../src/tool/webfetch")
    webFetchTool = await MockedWebFetchTool.init()
  })

  afterEach(() => {
    // Clean up all mocks to prevent test pollution
    mock.restore()
    mock.clearAllMocks()
  })

  test("should fetch content from valid URL", async () => {
    // Mock fetch to return test content
    global.fetch = mock().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body>Test content</body></html>"),
      arrayBuffer: () =>
        Promise.resolve(new TextEncoder().encode("<html><body>Test content</body></html>").buffer),
      headers: new Headers({ "content-type": "text/html" }),
      preconnect: mock(),
    }) as any

    const result = await webFetchTool.execute(
      {
        url: "https://example.com",
        format: "text",
      },
      ctx,
    )

    expect(result.title).toBe("https://example.com (text/html)")
    expect(result.output).toContain("Test content")
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
    global.fetch = mock().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("HTTP content"),
      arrayBuffer: () => Promise.resolve(new TextEncoder().encode("HTTP content").buffer),
      headers: new Headers({ "content-type": "text/plain" }),
      preconnect: mock(),
    }) as any

    const result = await webFetchTool.execute(
      {
        url: "http://example.com",
        format: "text",
      },
      ctx,
    )

    expect(result.title).toBe("http://example.com (text/plain)")
    expect(result.output).toContain("HTTP content")
  })

  test("should handle HTTPS URLs", async () => {
    global.fetch = mock().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("HTTPS content"),
      arrayBuffer: () => Promise.resolve(new TextEncoder().encode("HTTPS content").buffer),
      headers: new Headers({ "content-type": "text/plain" }),
      preconnect: mock(),
    }) as any

    const result = await webFetchTool.execute(
      {
        url: "https://example.com",
        format: "text",
      },
      ctx,
    )

    expect(result.title).toBe("https://example.com (text/plain)")
    expect(result.output).toContain("HTTPS content")
  })

  test("should handle different formats", async () => {
    global.fetch = mock().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<h1>HTML Content</h1>"),
      arrayBuffer: () => Promise.resolve(new TextEncoder().encode("<h1>HTML Content</h1>").buffer),
      headers: new Headers({ "content-type": "text/html" }),
      preconnect: mock(),
    }) as any

    // Test text format
    const textResult = await webFetchTool.execute(
      {
        url: "https://example.com",
        format: "text",
      },
      ctx,
    )
    expect(textResult.output).toContain("HTML Content")

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
    global.fetch = mock().mockRejectedValue(new Error("Network error")) as any

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
    global.fetch = mock().mockResolvedValue({
      ok: false,
      preconnect: mock(),
      status: 404,
      statusText: "Not Found",
    }) as any

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
    global.fetch = mock()
      .mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 2000)),
      ) as any

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

    global.fetch = mock().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(largeContent),
      arrayBuffer: () => Promise.resolve(new TextEncoder().encode(largeContent).buffer),
      headers: new Headers({ "content-type": "text/plain" }),
      preconnect: mock(),
    }) as any

    // Should throw error for large responses
    await expect(
      webFetchTool.execute(
        {
          url: "https://example.com/large",
          format: "text",
        },
        ctx,
      ),
    ).rejects.toThrow("Response too large")
  })

  test("should handle permission denied", async () => {
    // Override the mock for this specific test
    mock.module("../../src/config/config", () => ({
      Config: {
        get: mock(() =>
          Promise.resolve({
            permission: {
              webfetch: "deny",
            },
          }),
        ),
      },
    }))

    // Re-initialize tool with new mock
    const { WebFetchTool: MockedWebFetchTool } = await import("../../src/tool/webfetch")
    webFetchTool = await MockedWebFetchTool.init()

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
