# prc-acorderstatus-api-v1

Process API that returns the latest status of an order for a given brand.

`GET /order/{orderId}` with an `X-Brand` header looks the order up in the `ucp_order_latest_status` table through the System API for Postgres DB and returns it as JSON.

## Overview

| | |
|---|---|
| Layer | Process (prc) |
| Runtime | Mule 4.9 (Java 17) |
| Data source | System API for Postgres DB (`mule-plugin-sys-postgresdb-api`), table `mulesoft_dt.ucp_order_latest_status` |
| Logging | Splunk, through `sf-splunk-sub-flow` in `newell-common-core-v1` |
| Security | Client credentials (Anypoint managed policy) |

## Endpoint

```
GET /order/{orderId}
X-Brand: {brand}
```

| Parameter | In | Required | Description |
|---|---|---|---|
| `orderId` | URI | Yes | Order id, for example `123435` |
| `X-Brand` | Header | Yes | Brand of the order, for example `graco`. An order of another brand is answered as 404. |

### Responses

| Status | Meaning |
|---|---|
| 200 | Order found. Body is the order as JSON. |
| 400 | `X-Brand` header missing, or `orderId` or the brand contains characters other than letters, digits, `-` and `_`. |
| 401, 405, 406 | Standard APIkit and policy errors. |
| 404 | No order with that id for the given brand. An order that exists under another brand also returns 404. |
| 500 | Unexpected error, for example a database failure. |

### Example 200 response

```json
{
  "orderId": "123435",
  "brand": "graco",
  "siteId": "gracobaby",
  "latestEventNumber": 12,
  "latestEventOccuredAt": "2026-10-08T10:45:00Z",
  "orderStatus": "SHIPPED",
  "orderSnapshot": {},
  "createdAt": "2026-10-07T09:00:00Z",
  "updatedAt": "2026-10-08T10:45:00Z",
  "transactionNumber": "T-0001"
}
```

`orderSnapshot` is the JSON stored in the table, returned as a nested object.
`latestEventOccuredAt` keeps the spelling of the `latest_event_occured_at` column.

### Example 404 response

```json
{
  "status": "Failure",
  "status-code": "404",
  "message": "Order not found: 999 for brand graco"
}
```

## How it works

1. `pf-router` (APIkit) matches `GET /order/{orderId}` and saves `orderId` and the `X-Brand` header to variables.
2. `rf-orderstatus-get` validates both values, then calls the System API select operation with the filter
   `and=(order_id.eq.'<orderId>',brand.eq.'<brand>')` on `mulesoft_dt.ucp_order_latest_status`.
   A `NOT_FOUND` error from the System API is treated as no rows.
3. No row (unknown id, or an order of another brand): returns 404. Row found: `order-status-response.dwl` converts it to JSON.
4. `sf-splunk-info` (success) and `sf-splunk-error` (failure) log to Splunk asynchronously.
   Splunk gets the order id, status, brand and site id. The order snapshot is not logged.

## Database access

The API does not connect to Postgres directly. It uses the `System API for Postgres DB` connector
(`mule-plugin-sys-postgresdb-api` 1.0.18), configured the same way as `prc-accheckout-api`:

- `cf-global.xml` defines `System_API_for_Postgres_DB_Config` from the `sys-postgresdb-api.*` properties.
- `rf-orderstatus-get.xml` calls `select-rows-from-a-specified-schema-and-table` with the schema and table
  from `prc-orderstatus-api.database.*`, and the client id and secret from `postgres-api.*`.
- The filter is built as text, so `orderId` and `brand` are checked first. Only letters, digits, `-` and `_`
  (1 to 64 characters) are accepted, otherwise the API returns 400.
- `brand` is compared as sent, with no case change. It must match the value stored in the `brand` column.

## Project layout

```
src/main/mule/
  cf-global.xml            Listener, APIkit, System API for Postgres DB and secure property configs
  pf-router.xml            Main flow, console flow and the GET dispatcher
  rf-orderstatus-get.xml   Request flow plus Splunk sub-flows
src/main/resources/
  api/prc-acorderstatus-api.raml
  transformation/          order-status-response, order-not-found, bad-request-response, error-response (.dwl)
  properties/              {env}.yaml and {env}-secure.yaml for local, dev, qa, uat, prd
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

## Build and run

```bash
mvn clean package -Denv=local -DmasterKey=<key>
```

Call it locally:

```bash
curl -H 'X-Brand: graco' 'http://localhost:8081/order/123435'
```

## Deployment

Pushes to `develop` or `master` run `.github/workflows/mulesoft.yml`, which builds and deploys to CloudHub.
