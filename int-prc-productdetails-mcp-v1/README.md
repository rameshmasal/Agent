# int-prc-productdetails-mcp-v1

A thin MCP (Model Context Protocol) server for the Product Details process API
(`prc-productdetails-api-v1`). It lets MCP clients such as Claude ask for product data in plain
language. The server has no business logic. Each tool validates its input, calls the process API,
removes empty fields from the response and returns the JSON.

| Item | Value |
|---|---|
| Runtime | Mule 4.9.3 or later, Java 17 |
| Connector | MuleSoft MCP Connector 1.7.1 |
| Transport | Streamable HTTP |
| Endpoint path | `/mcp` |
| Server name | `prc-productdetails-mcp` (version `1.0.0`) |
| Deployment | CloudHub (QA), through the API gateway |

```
MCP client (Claude, MCP Inspector, Postman)
        |  Streamable HTTP, POST /mcp
        v
int-prc-productdetails-mcp-v1   (this app)
        |  HTTPS + client_id / client_secret headers
        v
prc-productdetails-api-v1       (existing process API, unchanged)
        v
SAP NWL / Windchill
```

## Tools

All tools are read-only. `productId` is the SAP product (material) number, for example `30001`.

| Tool | Process API call | Inputs |
|---|---|---|
| `get_product_basic` | `GET /basic` | `productId` |
| `get_product_description` | `GET /descriptions` | `productId`, `lang` (optional, 2-letter ISO code, for example `FR`) |
| `get_product_weights_and_measures` | `GET /weightsandmeasures` | `productId` |
| `get_product_plant_info` | `GET /plantInfo` | `productId`, `plantId` (optional) |

Not exposed: `/characteristics`, `/salesOrg` and `/fgcollection`.

Notes:
- Weights and measures come from Windchill when the product status is 10 and from SAP when it is above 10. That routing is done by the process API.
- Fields that are null, empty strings, empty objects or empty arrays are removed from every response.
- Errors are returned to the client as short text, for example `Error: productId is required.`

### Error messages

| Situation | Message |
|---|---|
| `productId` missing or empty | `productId is required.` |
| `lang` is not two letters | `lang must be a two-letter ISO language code, for example FR.` |
| API returns 404 | `No data found for productId <id>` |
| API returns another non-200 status | `Product details API returned HTTP <code>: <first 300 characters of the body>` |

## Project layout

```
src/main/mule/
  cf-global.xml                  properties, secure properties, HTTP listener, MCP server config,
                                 HTTP request config to the process API
  tf-basic.xml                   tool: get_product_basic
  tf-descriptions.xml            tool: get_product_description
  tf-weightsandmeasures.xml      tool: get_product_weights_and_measures
  tf-plantinfo.xml               tool: get_product_plant_info
  sf-productdetails-call.xml     shared sub-flow: validate productId, call the API, handle status codes
src/main/resources/
  transformdata/trim-empty-response.dwl    removes empty fields
  properties/<env>.yaml                    plain properties (host, paths, client-id, ...)
  properties/<env>-secure.yaml             encrypted properties (client-secret)
  log4j2.xml
```

Environments: `local`, `dev`, `qa`, `uat`, `prd`.

## Configuration

The structure is the same as the other Newell APIs.

`properties/<env>.yaml`:
```yaml
int-prc-productdetails-mcp:
  http-listener:
    port: "8081"              # listener port
  mcp-server:
    name: "prc-productdetails-mcp"
    version: "1.0.0"
    endpoint-path: "/mcp"     # path the MCP server answers on

prc-productdetails-api:       # downstream process API
  host: "qa.apis.newellbrands.com"
  port: "443"
  basic-path: "/q/prc/productdetails/v1/api/basic"
  descriptions-path: "/q/prc/productdetails/v1/api/descriptions"
  weightsandmeasures-path: "/q/prc/productdetails/v1/api/weightsandmeasures"
  plantinfo-path: "/q/prc/productdetails/v1/api/plantInfo"
  client-id: "<client id>"
  timeout: "300000"
```

`properties/<env>-secure.yaml` (Blowfish encrypted with the environment master key):
```yaml
prc-productdetails-api:
  client-secret: "![<encrypted secret>]"
```

Rules:
- `client-id` goes in the plain file and `client-secret` goes only in the `-secure` file.
- Never commit a plain-text secret. The `local-secure.yaml` file is the only one that holds a plain value, and it must hold a placeholder in the repository.
- The `*-path` values must match the URL the gateway exposes for the process API in that environment.
- If you change `endpoint-path`, update the URL clients use.

### Runtime properties (set at deploy time)

| Property | Purpose |
|---|---|
| `env` | selects `properties/<env>.yaml` and `properties/<env>-secure.yaml` |
| `masterKey` | key used to decrypt the secure properties |

## Run locally (Anypoint Studio)

1. Fill in `client-id` in `properties/local.yaml` and a client secret in `properties/local-secure.yaml`. Or run with `env=qa` and the QA master key.
2. Run the app with the VM arguments `-Denv=local -DmasterKey=<key>`.
3. The MCP endpoint is `http://localhost:<port>/mcp`, where `<port>` is `http-listener.port` from the properties file for the environment you started.

Opening the URL in a browser returns `405 Method Not Allowed`. That is expected, because the endpoint only accepts POST requests from an MCP client.

## Test

### MCP Inspector
```
npx @modelcontextprotocol/inspector
```
Add a server of type **Streamable HTTP** with the endpoint URL, connect, open **Tools**, list the tools and run one, for example `get_product_basic` with `productId` = `30001`.

### Postman or curl
Send these POST requests with the headers `Content-Type: application/json` and `Accept: application/json, text/event-stream`.

1. Initialize. The response has an `Mcp-Session-Id` header:
   ```json
   {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
   ```
2. Add the header `Mcp-Session-Id: <value>` to the next requests:
   ```json
   {"jsonrpc":"2.0","method":"notifications/initialized"}
   {"jsonrpc":"2.0","id":2,"method":"tools/list"}
   {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_product_basic","arguments":{"productId":"30001"}}}
   ```

An empty body returns `-32700 Failed to read value`. That means the server is reachable and the request body is missing.

### Test questions for Claude
- What are the basic details of product 30001?
- What is the French description of product 30001?
- What are the weights and measures of product 30001?
- Show the plant info for product 30001 at plant 1910.
- What are the details of product 999999999? (expects a readable error)

## Use from Claude

### Claude Desktop
Edit `claude_desktop_config.json` (**Settings, Developer, Edit Config**). Keep a single `mcpServers` block:
```json
{
  "mcpServers": {
    "productdetails-local": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "mcp-remote", "http://localhost:8091/mcp", "--allow-http"]
    },
    "productdetails-qa": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "mcp-remote", "https://qa.apis.newellbrands.com/q/prc/productdetailsmcp/v1/mcp"]
    }
  }
}
```
Then:
1. Fully quit Claude Desktop (also from the tray) and reopen it.
2. Check that both servers show **running** under **Settings, Developer**.
3. Start a new chat and name the server in the question, for example "Using productdetails-qa, ...".

Requirements: Node.js on the machine and the Mule app running first for the local server. If `npx` is not found, add the Node folder to the server's `env` PATH or use the full path to `npx.cmd`.

### Claude Code
```
claude mcp add --transport http productdetails https://qa.apis.newellbrands.com/q/prc/productdetailsmcp/v1/mcp
claude mcp list
```

### Custom connector (web or Desktop)
Add the public URL under **Settings, Connectors, Add custom connector**. The URL must be reachable from the internet, and your organization must allow custom connectors.

## Deploy

The GitHub workflow (`.github/workflows/mulesoft.yml`) uses the shared Newell workflow `mulesoft-build-deploy-aws-java17`. Check that the deployment sets:
- the Mule runtime to 4.9.x with Java 17 (4.9.3 or later is required by the MCP connector),
- the properties `env` and `masterKey`,
- a worker size of at least 0.2 vCore and 1 worker.

Sessions are kept in the app's memory. A restart or redeploy invalidates them, and clients must reconnect (an old session returns `Session not found`). With more than one worker, configure a sessions Object Store on the Streamable HTTP connection.

## Security

- The `/mcp` endpoint has no authentication in this version. Anyone who can reach the URL can call the four tools. This is acceptable only for short tests with non-sensitive data. Before wider use, add OAuth or a gateway policy, restrict by network, or keep the endpoint private.
- The client ID and secret for the process API stay inside the app and are never sent to Claude.
- Do not commit `settings.xml`, `aws_settings.xml`, master keys or real secrets.
- Logs contain the tool path and `productId` only, not response payloads.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `405 Method Not Allowed` in a browser | Expected. Use an MCP client. |
| `-32700 Failed to read value` | The POST body is empty or not JSON. Send a JSON-RPC body. |
| `Session not found` | Stale session after a restart. Disconnect and reconnect, or start a new chat. |
| 502, 503 or 504 on the CloudHub URL | The app is not started or crashed. Check Runtime Manager status and logs (missing `env` or `masterKey`, wrong runtime version, small worker). |
| 404 on the gateway URL | The gateway forwards a path the app does not serve. Fix the base path mapping, or set `endpoint-path` to match. |
| Tool result `HTTP 401` | Wrong `client-id` or `client-secret` for the process API, or the master key does not match the key that encrypted the secret. |
| `ECONNREFUSED` in the Claude Desktop log | The local Mule app is not running or uses a different port. Start it first, then restart Claude. |
| Claude Desktop shows the server as not running | Duplicate `mcpServers` keys in the JSON, `npx` not on the PATH, or the wrong config file. Check the log on the Developer page. |
| Studio shows `Failed to resolve module ... mcp-connector` | Wrong version or missing Maven credentials for the repository. Add the connector from the Exchange palette and refresh Maven. |

## Known limitations

- Read-only. There are no create, update or delete tools.
- The RAML examples of the process API do not match its real responses in every case. This server passes through whatever the API returns, minus empty fields.
- Responses are not size-limited. Use the `plantId` filter for large plant lists.
- No MUnit tests are included.
