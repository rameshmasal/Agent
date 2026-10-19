# prc-acorderstatus-api-v1

Process API that returns the latest status of an order.

`GET /order/{orderId}?brand={brand}` looks the order up in the `ucp_order_latest_status` table through the System API for Postgres DB and returns it as JSON.

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
GET /order/{orderId}?brand={brand}
```

| Parameter | In | Required | Description |
|---|---|---|---|
| `orderId` | URI | Yes | Order id, for example `123435` |
| `brand` | Query | Yes | Brand of the order, for example `graco`. An order of another brand is answered as 404. |

### Responses

| Status | Meaning |
|---|---|
| 200 | Order found. Body is the order as JSON. |
| 400 | `brand` missing, or `orderId` or `brand` contains characters other than letters, digits, `-` and `_`. |
| 401, 405, 406 | Standard APIkit and policy errors. |
| 404 | No order with that id. |
| 500 | Unexpected error, for example a database failure. |

### Example 200 response

```json
{
  "orderId": "123435",
  "brand": "Rubbermaid",
  "siteId": "RubbermaidUS",
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

1. `pf-router` (APIkit) matches `GET /order/{orderId}` and saves `orderId` and the `brand` query parameter to variables.
2. `rf-orderstatus-get` validates both values, then calls the System API select operation with the filter
   `and=(order_id.eq.'<orderId>',brand.eq.'<brand>')` on `mulesoft_dt.ucp_order_latest_status`.
   A `NOT_FOUND` error from the System API is treated as no rows.
3. No row (unknown id, or an order of another brand): returns 404. Row found: `order-status-response.dwl` converts it to JSON.
4. `sf-splunk-info` (success) and `sf-splunk-error` (failure) log to Splunk asynchronously.
   Splunk gets the order id, status, brand and site id. The order snapshot is not logged.

## Project layout

```
src/main/mule/
  cf-global.xml            Listener, APIkit, System API for Postgres DB and secure property configs
  pf-router.xml            Main flow, console flow and the GET dispatcher
  rf-orderstatus-get.xml     Request flow plus Splunk sub-flows
src/main/resources/
  api/prc-acorderstatus-api.raml
  transformation/          order-status-response, order-not-found, error-response (.dwl)
  properties/              {env}.yaml and {env}-secure.yaml for local, dev, qa, uat, prd
src/test/munit/            MUnit suite (200 and 404)
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

Runtime properties: `env` (for example `qa`) and `masterKey`.

## Build and run

```bash
mvn clean package -Denv=local -DmasterKey=<key>
mvn test -Denv=local -DmasterKey=<key>
```

Call it locally:

```bash
curl 'http://localhost:8081/order/123435?brand=graco'
```

## Deployment

Pushes to `develop` or `master` run `.github/workflows/mulesoft.yml`, which builds and deploys to CloudHub.
