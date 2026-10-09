# prc-acorderstatus-api-v1

Process API that returns the latest status of an order.

`GET /acorderstatus/{orderId}` looks the order up in the `ucp_order_latest_status` table and returns it as JSON.

## Overview

| | |
|---|---|
| Layer | Process (prc) |
| Runtime | Mule 4.9 (Java 17) |
| Data source | PostgreSQL, table `ucp_order_latest_status` |
| Logging | Splunk, through `sf-splunk-sub-flow` in `newell-common-core-v1` |
| Security | Client credentials (Anypoint managed policy) |

## Endpoint

```
GET /acorderstatus/{orderId}
```

| Parameter | In | Required | Description |
|---|---|---|---|
| `orderId` | URI | Yes | Order id, for example `123435` |

### Responses

| Status | Meaning |
|---|---|
| 200 | Order found. Body is the order as JSON. |
| 400, 401, 405, 406 | Standard APIkit and policy errors. |
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
  "message": "Order not found: 999"
}
```

## How it works

1. `pf-router` (APIkit) matches `GET /acorderstatus/{orderId}` and saves `orderId` to `vars.orderId`.
2. `rf-acorderstatus-get` runs a parameterized select:
   ```sql
   SELECT order_id, brand, site_id, latest_event_number, latest_event_occured_at,
          order_status, CAST(order_snapshot AS TEXT) AS order_snapshot,
          created_at, updated_at, transaction_number
   FROM ucp_order_latest_status
   WHERE order_id = :orderId
   ```
3. No row: returns 404. Row found: `order-status-response.dwl` converts it to JSON.
4. `sf-splunk-info` (success) and `sf-splunk-error` (failure) log to Splunk asynchronously.
   Splunk gets the order id, status, brand and site id. The order snapshot is not logged.

## Project layout

```
src/main/mule/
  cf-global.xml            Listener, APIkit, DB and secure property configs
  pf-router.xml            Main flow, console flow and the GET dispatcher
  rf-acorderstatus-get.xml   Request flow plus Splunk sub-flows
src/main/resources/
  api/prc-acorderstatus-api.raml
  transformation/          order-status-response, order-not-found, error-response (.dwl)
  properties/              {env}.yaml and {env}-secure.yaml for local, dev, qa, uat, prd
src/test/munit/            MUnit suite (200 and 404)
```

## Configuration

Before the first run, replace the `REPLACE_*` values in `src/main/resources/properties/`.

| Property | File | Description |
|---|---|---|
| `prc-acorderstatus-api.database.url` | `{env}.yaml` | JDBC URL |
| `prc-acorderstatus-api.database.username` | `{env}.yaml` | DB user |
| `prc-acorderstatus-api.database.password` | `{env}-secure.yaml` | DB password, Blowfish-encrypted |
| `prc-acorderstatus-api.http-listener.port` | `{env}.yaml` | Listener port (8093) |
| `prc-acorderstatus-api.http-listener.autodiscovery-id` | `{env}.yaml` | API Manager id (`0` until registered) |

Runtime properties: `env` (for example `qa`) and `masterKey`.

## Build and run

```bash
mvn clean package -Denv=local -DmasterKey=<key>
mvn test -Denv=local -DmasterKey=<key>
```

Call it locally:

```bash
curl http://localhost:8093/acorderstatus/123435
```

## Deployment

Pushes to `develop` or `master` run `.github/workflows/mulesoft.yml`, which builds and deploys to CloudHub.
