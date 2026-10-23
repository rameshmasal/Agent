# sys-mq-api-v1

System API that places an event on an Anypoint MQ queue.
Repository: `int-mulesoft-sys-mq-api-v1` | Mule 4.9 (Java 17) | CloudHub 2.0 | `newell-common-core-v1` 1.0.7

## Endpoint
`POST /queue/write/{queueName}`

- The request body is sent to MQ as received, wrapped as `{"body": "<string>"}`. The API adds the wrapper; callers send only the event.
- `queueName` comes from the path. A new UUID is used as the MQ message ID.
- Optional console: `/console/`.

### Success
`201` `{ "messageId": "<uuid>", "queueName": "<queue>", "status": "QUEUED", "correlationId": "<id>" }`

### Errors
All errors use `{ "error": { "code", "status", "message", "correlationId" } }`.

| Cause | HTTP status |
|---|---|
| APIKit: bad request, not found, method not allowed, not acceptable, unsupported media type, not implemented | 400, 404, 405, 406, 415, 501 |
| MQ answers 404 (queue does not exist) | `404` (`"Queue not found in Anypoint MQ: <queue>"`) |
| MQ answers another 4xx (for example 400, 413, 429) | the same status, with `status: "MQ_REJECTED"` and `downstreamCode` |
| MQ answers 401/403 (our token was refused; the cached token is dropped) | `502` |
| Token service fails (non-200 or no `access_token`) | `502` |
| MQ 5xx, timeout or connectivity error after all retries | `502` |
| Token service unreachable / timeout | `503` / `504` |
| Anything else | `500` |

MQ 4xx answers are not retried. MQ 5xx, timeout and connectivity errors are retried with the same message ID (the PUT is idempotent).
Errors are mapped in `rf-router.xml`.

## Flow
1. `rf-mq-write-details` sets `correlationId`, `queueName` and `messageId`, and builds the envelope.
2. `sf-get-token` returns the cached Anypoint token, or `sf-fetch-token` gets one (client credentials) and caches it (Object Store `mq-token-store`, TTL `anypoint-auth.token-ttl-seconds`).
   A failed token request raises `APP:TOKEN_FAILURE`; nothing is cached.
3. `sf-mq-put` PUTs the message to Anypoint MQ with retries (`anypoint-mq.retry.*`), using the same message ID, then checks the MQ status and raises `APP:QUEUE_NOT_FOUND`, `APP:MQ_AUTH_FAILURE` or `APP:MQ_REJECTED` when it is not 2xx.
4. The flow returns `201`. Errors propagate to the error handler in `rf-router.xml`.

## Properties
`properties/{env}.yaml` (`local`, `dev`, `qa`, `uat`, `prd`): `sys-mq-api.*` (listener), `anypoint-mq.*` (host, org and environment IDs, timeouts, retry), `anypoint-auth.*` (token service, `client-id`, TTL), `application-msgs.*`.
Secrets: `anypoint-auth.client-secret` in `{env}-secure.yaml` (Blowfish `![...]`). Run with `-Denv=local -DmasterKey=<key>`.

## Before deploying to prd
Replace the `REPLACE_WITH_*` values in `prd.yaml` and `prd-secure.yaml`, and `auto-discovery-id`.
