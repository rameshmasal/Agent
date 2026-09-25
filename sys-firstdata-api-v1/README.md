# sys-firstdata-api-v1

Newell Brands **System API** for First Data gift card operations.  
Migrated from Apigee `FirstData_Proxy_v2` into MuleSoft 4 (Mule Runtime 4.9 / Java 17).

---

## Overview

This API wraps the First Data Datawire XML platform and exposes five gift card operations as a clean JSON REST API. It handles per-brand merchant configuration, optional 3DES PIN encryption, URL discovery (with caching and fallback), and automatic timeout reversals for lock/unlock transactions.

**API tier:** System API  
**Base path:** `/sys/firstdata/v1/*`  
**Auth:** Client credentials (managed via Anypoint API Manager autodiscovery)

---

## Endpoints

| Method | Path | First Data TX Code | Description |
|--------|------|--------------------|-------------|
| POST | `/sys/firstdata/v1/balance` | 2400 | Gift card balance enquiry |
| POST | `/sys/firstdata/v1/activate` | 2104 | Gift card activation + fund load |
| POST | `/sys/firstdata/v1/lock` | 2408 | Partial lock — reserve funds |
| POST | `/sys/firstdata/v1/unlock` | 2208 | Unlock — release reserved funds |
| POST | `/sys/firstdata/v1/merchantkeyactivation` | 2010 | Merchant working key activation |

All endpoints require the `X-Brand` header.

---

## Request Headers

| Header | Required | Values | Description |
|--------|----------|--------|-------------|
| `Content-Type` | Yes | `application/json` | |
| `X-Brand` | Yes | `marmot`, `yankee candle` | Identifies the calling brand — drives merchant config lookup |

---

## Request / Response Examples

### POST /balance

**Request:**
```json
{
  "cardNumber": "6006200000000000",
  "pin": "1234",
  "currencyCode": "USD",
  "transactionId": "TXN-20260922-001"
}
```

**Response (200):**
```json
{
  "statusCode": "OK",
  "returnCode": "00",
  "cardNumber": "6006200000000000",
  "availableBalance": "5000",
  "lockedAmount": "0",
  "previousBalance": "5000",
  "currencyCode": "USD",
  "success": true
}
```

### POST /activate

**Request:**
```json
{
  "cardNumber": "6006200000000000",
  "pin": "1234",
  "amount": 50.00,
  "currencyCode": "USD"
}
```

**Response (200):**
```json
{
  "statusCode": "OK",
  "returnCode": "00",
  "availableBalance": "5000",
  "promotionCode": "30253",
  "success": true
}
```

### POST /lock

**Request:**
```json
{
  "cardNumber": "6006200000000000",
  "pin": "1234",
  "amount": 25.00,
  "currencyCode": "USD",
  "transactionId": "TXN-20260922-003"
}
```

**Response (200):**
```json
{
  "statusCode": "OK",
  "returnCode": "00",
  "availableBalance": "2500",
  "lockedAmount": "2500",
  "lockId": "987654321",
  "success": true
}
```

> **504 response** — if First Data returns timeout code `205` or `8`, the API automatically sends a reversal (tx code `0704`) and returns HTTP 504.

### POST /unlock

**Request:**
```json
{
  "cardNumber": "6006200000000000",
  "pin": "1234",
  "amount": 25.00,
  "currencyCode": "USD",
  "lockId": "987654321"
}
```

### POST /merchantkeyactivation

**Request:**
```json
{
  "keyId": "1002",
  "workingKey": "ABCDEF1234567890ABCDEF1234567890",
  "source": "30"
}
```

**Response (200):**
```json
{
  "statusCode": "OK",
  "returnCode": "00",
  "success": true
}
```

---

## Brand Configuration

Each brand has its own merchant credentials stored per environment. The `X-Brand` header value determines which config is used.

| Brand | `merchantKeyId` | PIN Encryption | Activate Promo Code |
|-------|----------------|----------------|---------------------|
| `marmot` | `NOKEY` | Plain PIN (no encryption) | `79234` |
| `yankee candle` | `1002` | 3DES encrypted | `30253` |

When `merchantKeyId` is not `NOKEY`, the PIN is 3DES-encrypted using the brand's `merchantKey` before being sent to First Data (field `34`).

---

## Project Structure

```
sys-firstdata-api-v1/
├── pom.xml
├── mule-artifact.json
└── src/
    ├── main/
    │   ├── mule/
    │   │   ├── cf-global.xml                          # HTTP connectors, secure props, API autodiscovery
    │   │   ├── pf-main.xml                            # HTTP listener + APIKit router
    │   │   ├── pf-router.xml                          # APIKit router, error handlers, flow dispatchers
    │   │   ├── sf-shared.xml                          # Shared sub-flows: brand config, URL discovery, PIN encrypt
    │   │   ├── rf-firstdata-balance-post.xml
    │   │   ├── rf-firstdata-activate-post.xml
    │   │   ├── rf-firstdata-lock-post.xml
    │   │   ├── rf-firstdata-unlock-post.xml
    │   │   └── rf-firstdata-merchantkeyactivation-post.xml
    │   └── resources/
    │       ├── api/
    │       │   ├── sys-firstdata-api-v1.raml
    │       │   └── firstdata-types.raml
    │       ├── properties/
    │       │   ├── local.yaml / local-secure.yaml
    │       │   ├── dev.yaml / dev-secure.yaml
    │       │   ├── qa.yaml / qa-secure.yaml
    │       │   ├── uat.yaml / uat-secure.yaml
    │       │   └── prd.yaml / prd-secure.yaml
    │       └── transformdata/
    │           └── *.dwl                              # DataWeave files (inlined in XML; kept for reference)
    └── test/
        └── munit/
```

---

## Key Properties

| Property | Description |
|----------|-------------|
| `sys.whitelisted-brands` | Comma-separated allowed brand values (e.g. `yankee candle,marmot`) |
| `sys.server.hosts` | Comma-separated First Data Datawire hosts for URL discovery |
| `sys.url-cache-ttl` | Seconds to cache the discovered target URL (default `300`) |
| `sys.timeout-responses` | First Data return codes treated as timeouts — triggers auto-reversal (`205,8`) |
| `sys.payload-encoding` | Encoding field sent in XML envelope (`datawire`) |
| `sys.request-version` | Request XML version attribute (`3`) |
| `{brand}.merchant-key-id` | `NOKEY` = plain PIN; any other value = 3DES encrypt PIN |
| `{brand}.activate-promo-code` | Promotion code sent in field `F2` on activate |

Sensitive values (`merchantKey`, `client_secret`) live in `*-secure.yaml` files only, encrypted with Blowfish before deploying to non-local environments.

---

## Local Development

### Prerequisites

- Java 17
- Maven 3.8+
- Anypoint credentials in `~/.m2/settings.xml` for Exchange dependency resolution

### Run locally

```bash
mvn clean package -DskipTests
```

Pass environment and master key as JVM args in Anypoint Studio or via:

```bash
# in Studio run config VM arguments
-Denv=local -DmasterKey=localkey
```

### Environment selection

The active properties file is chosen by the `-Denv=<env>` JVM argument:

| `-Denv` value | Files loaded |
|---|---|
| `local` | `local.yaml` + `local-secure.yaml` |
| `dev` | `dev.yaml` + `dev-secure.yaml` |
| `qa` | `qa.yaml` + `qa-secure.yaml` |
| `uat` | `uat.yaml` + `uat-secure.yaml` |
| `prd` | `prd.yaml` + `prd-secure.yaml` |

### Build & test

```bash
# Package only
mvn clean package -DskipTests

# Package + MUnit tests
mvn clean test
```

---

## Migration from Apigee

This API replaces both Apigee proxies:

| Apigee Proxy | Status | Notes |
|---|---|---|
| `FirstData_Proxy` (v1) | Active — being migrated | Single brand, no brand header required there |
| `FirstData_Proxy_v2` | Deployed but 0 traffic | Multi-brand design — this MuleSoft API is its replacement |
| `FirstData_OptimizedUrlProxy` | Helper — redundant | URL discovery is built into this API (`sf-url-discovery`) |

**Caller changes required when migrating from Apigee v1:**

1. Update URL: `/v1/firstdata/{operation}` → `/sys/firstdata/v1/{operation}`
2. Add header: `X-Brand: <brand>` (e.g. `X-Brand: yankee candle`)
3. Flatten request body: `$.transaction.card_number` → `cardNumber` (top-level JSON fields)

---

## Error Responses

| HTTP Status | Error Code | Cause |
|---|---|---|
| 400 | `BAD_REQUEST` | Missing required field or invalid request format |
| 401 | `UNAUTHORIZED` | Missing or invalid client credentials |
| 403 | `FORBIDDEN` | Client ID not authorised for this API |
| 404 | `NOT_FOUND` | Endpoint does not exist |
| 405 | `METHOD_NOT_ALLOWED` | HTTP method not supported |
| 422 | `INVALID_BRAND` | `X-Brand` header value not in whitelist |
| 422 | `BRAND_CONFIG_NOT_FOUND` | Brand present but config missing in properties |
| 504 | `TIMEOUT` | First Data returned timeout code; auto-reversal sent |
| 503 | `SERVICE_UNAVAILABLE` | First Data unreachable or HTTP error |

---

## Dependencies

| Artifact | Version |
|---|---|
| Mule Runtime | 4.9-java17 |
| mule-maven-plugin | 4.7.0 |
| mule-http-connector | 1.11.1 |
| mule-apikit-module | 1.9.2 |
| mule-secure-configuration-property-module | 1.2.5 |
| mule-sockets-connector | 1.2.7 |

---

## Contacts

| Role | Name |
|---|---|
| API Owner | Newell Brands E-Commerce Engineering |
| Original Apigee Author | bibin.vijayaratnan@newellco.com |
