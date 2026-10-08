# prc-orderstatus-api-v1
Returns the latest status of an order: `GET /orderstatus/{orderId}`.

Flow: APIkit router -> `rf-orderstatus-get` -> select from `ucp_order_latest_status` -> JSON (200), or 404 when the order is not found. Splunk info/error logging goes through `sf-splunk-sub-flow` from `newell-common-core-v1`.

Before first run replace the `REPLACE_*` values in `src/main/resources/properties/*.yaml` and `*-secure.yaml`.
