# int-prc-productdetails-mcp-v1

Thin MCP server (Mule 4.9, Java 17, CloudHub 2.0) in front of `prc-productdetails-api-v1`.
It has no business logic: each tool validates its input, calls the process API, drops empty
fields from the response and returns the JSON to the MCP client.

## Tools

| Tool | Calls | Inputs |
|---|---|---|
| `get_product_basic` | `GET /basic` | `productId` |
| `get_product_description` | `GET /descriptions` | `productId`, `lang` (optional, 2 letters) |
| `get_product_weights_and_measures` | `GET /weightsandmeasures` | `productId` |
| `get_product_plant_info` | `GET /plantInfo` | `productId`, `plantId` (optional) |

Not exposed: `/characteristics`, `/salesOrg`, `/fgcollection`.

## Layout

| File | Purpose |
|---|---|
| `cf-global.xml` | properties, secure properties, HTTP listener, MCP server config (Streamable HTTP), HTTP request config to the process API |
| `tf-*.xml` | one MCP tool flow per endpoint (description, input schema, query params) |
| `sf-productdetails-call.xml` | shared call: productId check, client credentials headers, status handling |
| `transformdata/trim-empty-response.dwl` | removes null, empty string, empty object and empty array fields |
| `properties/<env>.yaml`, `<env>-secure.yaml` | same structure as the existing API; `client-id` is plain, `client-secret` is in the secure file |

## Before the first deploy (TODO)

1. Confirm the MCP connector patch version in Exchange (`pom.xml`, currently `1.7.0`) and check the
   `mcp:*` element names against the connector reference. They were written from documentation and not compiled.
2. Replace the `REPLACE_WITH_*` client ids in `properties/<env>.yaml`.
3. Encrypt each client secret with the environment master key and put it in `properties/<env>-secure.yaml`.
4. Confirm `host` and the `*-path` values for each environment (`d`, `q`, `u`, `p`) in `properties/<env>.yaml`.
5. Register the app in API Manager (or apply policies at the CH2 ingress) and enforce client credentials on `/mcp`.
6. Start with 1 replica. For more than one replica, configure a sessions Object Store on the Streamable HTTP connection.

## Run locally

Set `-Denv=local -DmasterKey=<key>`. The MCP endpoint is `http://localhost:8081/mcp`. Test with MCP Inspector.

No MUnit tests are included by request.
