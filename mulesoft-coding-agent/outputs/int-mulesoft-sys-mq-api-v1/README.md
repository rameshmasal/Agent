# sys-mq-api-v1

System API that places an event on an Anypoint MQ queue.

`POST /api/mq/write/{queueName}` - any body; converted to JSON, wrapped as `{"body": "<json string>"}` and PUT to
`/api/v1/organizations/{org}/environments/{env}/destinations/{queueName}/messages/{uuid}`.

- 201 `{messageId, queueName, status: QUEUED, correlationId}`
- 400 empty body or not valid JSON; 404 queue not found; 502/503/504 MQ or token service failures
- Anypoint token is fetched with client credentials and cached (`anypoint-auth.token-ttl-seconds`); a 401 from MQ clears the cache and retries once
- 5xx and connectivity errors from MQ are retried (`anypoint-mq.retry.*`) with the same message ID
- Single-line log sentences (received, placing on MQ, MQ response, response returned, error) are written with plain loggers to the `file` appender in log4j2.xml (copied from the prc-productdetails sample). All sentences are in `logging.messages.*`. `sf-log-event` is the one place to call the common-core logging flow.

## Run
`env` (local|dev|qa|uat|prd) and `masterKey` are required: `-Denv=local -DmasterKey=localkey`.
Local secret goes in `local-secure.yaml` (do not commit). Other environments use Blowfish-encrypted `![...]` values in `{env}-secure.yaml`.

## Before first deploy
- Replace `REPLACE_WITH_*` values in dev/qa/prd properties and `auto-discovery-id`
- Confirm `newell-common-core-v1` provides `pf-global-error-handler.xml` and `rf-build-error-flow.xml`
