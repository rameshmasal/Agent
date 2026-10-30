# prc-acorderstatus-api-v1

Process API behind the UCP Get Order endpoint. It returns the latest order snapshot for a given brand.

`GET /order/{orderId}` with a `brand` header looks the order up in the `ucp_order_latest_status` table through the System API for Postgres DB and returns the stored UCP order entity (the payload last sent to Google by the order-lifecycle webhooks).

## Overview

| | |
|---|---|
| Layer | Process (prc) |
| Runtime | Mule 4.9 (Java 17) |
| Data source | System API for Postgres DB (`mule-plugin-sys-postgresdb-api`), table `mulesoft_dt.ucp_order_latest_status` |
| Logging | Splunk, through `sf-splunk-sub-flow` in `newell-common-core-v1` |
| Security | Client credentials (Anypoint managed policy). JWT validation, TLS and the `brand` header are handled by each brand's gateway proxy, not by this app. |

## Endpoint

```
GET /order/{orderId}
brand: {brand}
```

Google calls `GET /orders/{id}` on the brand gateway. The gateway validates the token, rewrites the path to this API's `/order/{orderId}` and sets the `brand` header, so Google never supplies it.

| Parameter | In | Required | Description |
|---|---|---|---|
| `orderId` | URI | Yes | Order id, for example `123435` |
| `brand` | Header | Yes | Brand of the order, as stored in the table: `gracobaby` or `yankeecandle`. Set by the gateway. An order of another brand is answered as not found. |

### Responses

| Status | Meaning |
|---|---|
| 200 | Order found: body is the UCP order entity. **Also** a UCP business error: a missing order, an order of another brand, or an order with an empty snapshot returns 200 with `ucp.status: "error"` and code `not_found`. |
| 400 | `brand` header missing, or `orderId` or the brand contains characters other than letters, digits, `-` and `_`. |
| 401, 405, 406 | Standard APIkit and policy errors. |
| 500 | Unexpected error. The body is generic. |
| 503 | The Postgres System API is unavailable or too slow (10 second timeout). The body is generic. |

### Example 200 response, order found

The body is the stored snapshot as is; fields depend on the order's lifecycle events.

```json
{
  "ucp": { "version": "2026-04-08", "status": "success" },
  "id": "US09576379916",
  "checkout_id": "chk_123",
  "permalink_url": "https://www.yankeecandle.com/order/US09576379916",
  "line_items": [],
  "fulfillment": {},
  "currency": "USD",
  "totals": []
}
```

### Example 200 response, order not found

```json
{
  "ucp": { "version": "2026-04-08", "status": "error" },
  "messages": [
    { "type": "error", "code": "not_found", "content": "Order not found", "severity": "unrecoverable" }
  ]
}
```

### Example 503 response

```json
{
  "status": "Failure",
  "status-code": "503",
  "message": "Service temporarily unavailable"
}
```

## How it works

1. `pf-router` (APIkit) matches `GET /order/{orderId}` and saves `orderId` and the `brand` header to variables.
2. `rf-orderstatus-get` validates both values, then calls the System API select operation with the filter
   `order_id.eq.'<orderId>',,brand.eq.'<brand>'` on `mulesoft_dt.ucp_order_latest_status`.
   A `NOT_FOUND` error from the System API is treated as no rows.
3. No row (unknown id, or an order of another brand) or an empty `order_snapshot`: `order-not-found.dwl` returns the UCP `not_found` envelope with HTTP 200. Row found: `order-status-response.dwl` returns the stored snapshot.
   A System API, HTTP connectivity or timeout failure returns 503 (`service-unavailable-response.dwl`); any other error returns 500. The real error is logged, never returned.
4. `sf-splunk-info` (success) and `sf-splunk-error` (failure) log to Splunk asynchronously.
   Splunk gets the order id, status, brand and site id. The order snapshot, which holds the shopper's name and address, is not logged.

## Database access

The API does not connect to Postgres directly. It uses the `System API for Postgres DB` connector
(`mule-plugin-sys-postgresdb-api` 1.0.18), configured the same way as `prc-accheckout-api`:

- `cf-global.xml` defines `System_API_for_Postgres_DB_Config` from the `sys-postgresdb-api.*` properties.
- `rf-orderstatus-get.xml` calls `select-rows-from-a-specified-schema-and-table` with the schema and table
  from `prc-orderstatus-api.database.*`, and the client id and secret from `postgres-api.*`.
- The filter is built as text, so `orderId` and `brand` are checked first. Only letters, digits, `-` and `_`
  (1 to 64 characters) are accepted, otherwise the API returns 400.
- `brand` is compared as sent, with no case change. It must match the value stored in the `brand` column (`gracobaby`, `yankeecandle`).
- The System API call times out after 10 seconds (`sys-postgresdb-api.responsetimeoutmillis`).

## Project layout

```
src/main/mule/
  cf-global.xml            Listener, APIkit, System API for Postgres DB and secure property configs
  pf-router.xml            Main flow, console flow and the GET dispatcher
  rf-orderstatus-get.xml   Request flow plus Splunk sub-flows
src/main/resources/
  api/prc-acorderstatus-api.raml
  transformation/          order-status-response, order-not-found, bad-request-response, service-unavailable-response, error-response (.dwl)
  properties/              {env}.yaml and {env}-secure.yaml for local, dev, qa, uat, prd
src/test/munit/
  rf-orderstatus-get-test-suite.xml   Success, optional fields, invalid input, not found, empty snapshot, backend failure
```

## Configuration

The `uat` and `prd` `postgres-api` credentials are `ENCRYPTED_PLACEHOLDER` (as in prc-accheckout-api) and must be replaced before deploying there. `dev` points at the QA System API.

| Property | File | Description |
|---|---|---|
| `sys-postgresdb-api.host`, `port`, `protocol`, `basepath`, `responsetimeoutmillis` | `{env}.yaml` | System API for Postgres DB endpoint (same values as prc-accheckout-api) |
| `postgres-api.client-id`, `client-secret` | `{env}-secure.yaml` | System API client credentials, Blowfish-encrypted (copied from prc-accheckout-api) |
| `prc-orderstatus-api.database.schema-name`, `table-name` | `{env}.yaml` | Schema and table read through the System API |
| `prc-orderstatus-api.http-listener.port` | `{env}.yaml` | Listener port (8081) |
| `prc-orderstatus-api.http-listener.autodiscovery-id` | `{env}.yaml` | API Manager id (`0` until registered) |

Runtime properties: `env` (for example `qa`) and `masterKey`. The `masterKey` must be the key the `postgres-api` values were encrypted with (the same one `prc-accheckout-api` uses).

## Build, test and run

```bash
mvn clean package -Denv=local -DmasterKey=<key>
```

Run the MUnit suite with `mvn clean test -Denv=local -DmasterKey=<key>`.

Call it locally:

```bash
curl -H 'brand: yankeecandle' 'http://localhost:8081/order/US09576379916'
```

## Deployment

Pushes to `develop` or `master` run `.github/workflows/mulesoft.yml`, which builds and deploys to CloudHub.
