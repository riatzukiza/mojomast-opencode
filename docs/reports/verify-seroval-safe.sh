#!/usr/bin/env bash
set -euo pipefail

# Safe canary probe for SolidStart server-function deserialization path.
# This script is for authorized maintainer testing only.

usage() {
  cat <<'EOF'
Usage:
  verify-seroval-safe.sh --base-url <url> [options]

Required:
  --base-url <url>          App base URL, for example: https://opncd.ai

Optional:
  --server-id <id>          SolidStart server-function id (preferred)
  --page-path <path>        Page to scrape for _server?id=... when --server-id is omitted (default: /)
  --endpoint-path <path>    Server-function endpoint path (default: /_server)
  --cookie <cookie>         Cookie header value if auth/session is required
  --timeout <seconds>       curl timeout per request (default: 20)
  --insecure                Pass -k to curl for self-signed TLS
  --help                    Show this help

Examples:
  # Single-curl mode (recommended): provide known server id
  ./verify-seroval-safe.sh \
    --base-url https://opncd.ai \
    --server-id '<captured-id>'

  # Discovery mode: scrape one id from page HTML first, then probe
  ./verify-seroval-safe.sh \
    --base-url https://opncd.ai \
    --page-path /share/<known-share-id>
EOF
}

BASE_URL=""
SERVER_ID=""
PAGE_PATH="/"
ENDPOINT_PATH="/_server"
COOKIE=""
TIMEOUT="20"
INSECURE=0

while (($# > 0)); do
  case "$1" in
    --base-url)
      BASE_URL="${2:-}"
      shift 2
      ;;
    --server-id)
      SERVER_ID="${2:-}"
      shift 2
      ;;
    --page-path)
      PAGE_PATH="${2:-}"
      shift 2
      ;;
    --endpoint-path)
      ENDPOINT_PATH="${2:-}"
      shift 2
      ;;
    --cookie)
      COOKIE="${2:-}"
      shift 2
      ;;
    --timeout)
      TIMEOUT="${2:-}"
      shift 2
      ;;
    --insecure)
      INSECURE=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$BASE_URL" ]]; then
  echo "Error: --base-url is required" >&2
  usage
  exit 1
fi

BASE_URL="${BASE_URL%/}"

if [[ "${PAGE_PATH:0:1}" != "/" ]]; then
  PAGE_PATH="/$PAGE_PATH"
fi

if [[ "${ENDPOINT_PATH:0:1}" != "/" ]]; then
  ENDPOINT_PATH="/$ENDPOINT_PATH"
fi

curl_args=(--silent --show-error --max-time "$TIMEOUT")
if [[ "$INSECURE" -eq 1 ]]; then
  curl_args+=(--insecure)
fi

if [[ -n "$COOKIE" ]]; then
  cookie_args=(--header "Cookie: $COOKIE")
else
  cookie_args=()
fi

cleanup() {
  [[ -n "${TMP_HTML:-}" ]] && rm -f "$TMP_HTML"
  [[ -n "${TMP_HEADERS:-}" ]] && rm -f "$TMP_HEADERS"
  [[ -n "${TMP_BODY:-}" ]] && rm -f "$TMP_BODY"
}
trap cleanup EXIT

if [[ -z "$SERVER_ID" ]]; then
  TMP_HTML="$(mktemp)"
  discovery_status="$((
    10#$(
      curl "${curl_args[@]}" "${cookie_args[@]}" \
        --output "$TMP_HTML" \
        --write-out "%{http_code}" \
        "$BASE_URL$PAGE_PATH"
    )
  ))"

  if (( discovery_status >= 400 )); then
    echo "Discovery request failed: GET $BASE_URL$PAGE_PATH -> HTTP $discovery_status" >&2
    exit 1
  fi

  SERVER_ID="$(grep -Eo '_server\?id=[A-Za-z0-9_=-]+' "$TMP_HTML" | sed 's/.*id=//' | sed -n '1p' || true)"
  if [[ -z "$SERVER_ID" ]]; then
    echo "Could not auto-discover a server id from $BASE_URL$PAGE_PATH" >&2
    echo "Provide --server-id captured from authorized browser/network traffic." >&2
    exit 1
  fi
fi

# Safe malformed payload: intentionally invalid node type to trigger controlled parse failure.
PAYLOAD='{"t":{"t":999,"i":0,"l":1,"a":[],"o":0},"f":31,"m":[]}'

TMP_HEADERS="$(mktemp)"
TMP_BODY="$(mktemp)"

http_status="$((
  10#$(
    curl "${curl_args[@]}" "${cookie_args[@]}" \
      --request POST "$BASE_URL$ENDPOINT_PATH" \
      --header "X-Server-Id: $SERVER_ID" \
      --header "X-Server-Instance: safe-canary" \
      --header "Content-Type: application/json" \
      --data "$PAYLOAD" \
      --dump-header "$TMP_HEADERS" \
      --output "$TMP_BODY" \
      --write-out "%{http_code}"
  )
))"

content_type="$(grep -i '^content-type:' "$TMP_HEADERS" | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r' | sed -n '1p' || true)"
x_error="$(grep -i '^x-error:' "$TMP_HEADERS" | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r' | sed -n '1p' || true)"
cf_ray="$(grep -i '^cf-ray:' "$TMP_HEADERS" | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r' | sed -n '1p' || true)"
body_preview="$(tr -d '\r' < "$TMP_BODY" | tr '\n' ' ' | cut -c1-220)"

if (( http_status == 500 )) && grep -q '"message":"HTTPError"' "$TMP_BODY"; then
  conclusion="Reached application handler and triggered controlled server error on malformed deserialization input."
elif (( http_status == 403 || http_status == 429 )); then
  conclusion="Likely blocked at edge (WAF/Bot/RateLimit). Request may not have reached app runtime."
elif (( http_status == 404 )); then
  conclusion="Endpoint not exposed at this path or function id not valid for this deployment."
else
  conclusion="Received non-blocking response. Review app logs for deserialization traces to confirm reachability."
fi

cat <<EOF
=== Safe Seroval Canary Report ===
Target:        $BASE_URL
Endpoint:      $ENDPOINT_PATH
Server ID:     ${SERVER_ID:0:40}...
HTTP Status:   $http_status
Content-Type:  ${content_type:-<none>}
X-Error:       ${x_error:-<none>}
CF-Ray:        ${cf_ray:-<none>}
Body Preview:  ${body_preview:-<empty>}

Conclusion:
  $conclusion

Next Log Checks (maintainer side):
  - Search runtime logs for "SerovalDeserializationError"
  - Search for "Unsupported node type \"999\""
  - Confirm handler path includes "server-functions-handler"
EOF
