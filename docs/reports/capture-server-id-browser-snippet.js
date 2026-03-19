// Paste this in browser DevTools Console on an authorized environment.
// It logs any client request that targets /_server or carries X-Server-Id.
// No payload mutation, no request replay, no exploitation.

;(() => {
  if (window.__ocServerFnProbeInstalled) {
    console.log("[server-fn-probe] already installed")
    return
  }
  window.__ocServerFnProbeInstalled = true

  const seen = new Set()

  const logHit = (source, method, url, headers) => {
    const sid = headers.get("x-server-id") || headers.get("X-Server-Id")
    const isServerPath = String(url).includes("/_server")
    if (!sid && !isServerPath) return

    const key = `${source}|${method}|${url}|${sid ?? ""}`
    if (seen.has(key)) return
    seen.add(key)

    console.log("[server-fn-probe]", {
      source,
      method,
      url,
      serverId: sid ?? null,
    })
  }

  const origFetch = window.fetch.bind(window)
  window.fetch = async function (input, init) {
    const req = input instanceof Request ? input : null
    const method = String(init?.method || req?.method || "GET").toUpperCase()
    const url = req ? req.url : String(input)
    const headers = new Headers(init?.headers || req?.headers || {})
    logHit("fetch", method, url, headers)
    return origFetch(input, init)
  }

  const xhrState = new WeakMap()
  const origOpen = XMLHttpRequest.prototype.open
  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader
  const origSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    xhrState.set(this, {
      method: String(method).toUpperCase(),
      url: String(url),
      headers: new Headers(),
    })
    return origOpen.call(this, method, url, ...rest)
  }

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    const state = xhrState.get(this)
    if (state) state.headers.set(name, value)
    return origSetHeader.call(this, name, value)
  }

  XMLHttpRequest.prototype.send = function (body) {
    const state = xhrState.get(this)
    if (state) logHit("xhr", state.method, state.url, state.headers)
    return origSend.call(this, body)
  }

  console.log("[server-fn-probe] installed. Interact with the app and watch console output.")
})()
