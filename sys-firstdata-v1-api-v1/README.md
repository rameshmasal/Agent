# sys-firstdata-v1-api-v1

**Newell Brands — First Data Gift Card System API (v1)**

MuleSoft 4 system API that proxies First Data (Fiserv) DataWire gift card transactions for Yankee Candle. Migrated from the legacy Apigee `FirstData_Proxy` v1. Request and response formats match the Apigee v1 contract exactly so no caller changes are required.

---

## Overview

| Item | Value |
|---|---|
| Layer | System |
| Brand | Yankee Candle only (single-merchant) |
| Downstream | First Data DataWire XML over HTTPS |
| Mule Runtime | 4.11.0 (EE) |
| Java | 17 |
| Port (local) | 8081 |
| Base path | `/sys/firstdata/v1/` |

---

## Endpoints

All endpoints use `POST` and `Content-Type: application/json`.

### POST `/sys/firstdata/v1/balance`

Query the available and locked balance on a gift card.

**Request**
```json
{
  "request_id": "REQ-001",
  "transaction": {
    "card_number": "6006200000000000",
    "card_pin": "1234",
    "currency_code": "USD",
    "id": "optional-correlation-id"
  }
}
```

**Response (success)**
```json
{
  "request_id": "REQ-001",
  "transaction_result": {
    "is_succeeded": true,
    "card_number": "6006200000000000",
    "balance": { "value": 45.00, "currency_code": "USD" },
    "expiration_date": "1231",
    "card_class": "GF"
  }
}
```

---

### POST `/sys/firstdata/v1/activate`

Activate a gift card and load funds onto it.

> **Note:** Disabled by default in production (`sys.activate-enabled: "false"`). Returns HTTP 400 if the gate is off.

**Request**
```json
{
  "request_id": "REQ-002",
  "transaction": {
    "card_number": "6006200000000000",
    "card_pin": "1234"
  },
  "activate_transaction": {
    "transaction_amount": 50.00,
    "currency_code": "USD"
  }
}
```

**Response (success)**
```json
{
  "request_id": "REQ-002",
  "transaction_result": {
    "is_succeeded": true,
    "card_number": "6006200000000000",
    "balance": { "value": 50.00, "currency_code": "USD" },
    "promotion_code": "30253"
  }
}
```

---

### POST `/sys/firstdata/v1/lock`

Place a partial hold (lock) on a gift card balance.

**Request**
```json
{
  "request_id": "REQ-003",
  "transaction": {
    "card_number": "6006200000000000",
    "card_pin": "1234"
  },
  "lock_transaction": {
    "transaction_amount": 25.00,
    "currency_code": "USD"
  }
}
```

**Response (success)**
```json
{
  "request_id": "REQ-003",
  "transaction_result": {
    "is_succeeded": true,
    "lock_id": "12345678"
  }
}
```

On timeout (First Data return code 205 or 8), a reversal is automatically sent and the API returns HTTP 504.

---

### POST `/sys/firstdata/v1/unlock`

Release a previously locked hold on a gift card.

**Request**
```json
{
  "request_id": "REQ-004",
  "transaction": {
    "card_number": "6006200000000000",
    "card_pin": "1234"
  },
  "unlock_transaction": {
    "transaction_amount": 25.00,
    "lock_id": "12345678",
    "currency_code": "USD"
  }
}
```

**Response (success)**
```json
{
  "request_id": "REQ-004",
  "transaction_result": {
    "is_succeeded": true,
    "balance": { "value": 45.00, "currency_code": "USD" }
  }
}
```

On timeout a reversal is automatically sent and the API returns HTTP 504.

---

## Architecture

```
Caller
  │  POST /sys/firstdata/v1/{balance|activate|lock|unlock}
  ▼
pf-router.xml          ← APIKit router dispatches to the right rf- flow
  │
  ├── rf-firstdata-balance-post.xml
  ├── rf-firstdata-activate-post.xml
  ├── rf-firstdata-lock-post.xml
  └── rf-firstdata-unlock-post.xml
        │
        ├── sf-load-merchant-config  (sf-shared.xml) — builds merchantConfig var
        ├── sf-url-discovery         (sf-shared.xml) — 3-tier host cache (300 s TTL)
        │     └── parallel ping → sorts by latency → caches fastest host in Object Store
        ├── sf-encrypt-pin           (sf-shared.xml) — 3DES/CBC PIN encryption (Groovy)
        │
        └── HTTP POST → First Data DataWire (XML over HTTPS)
              └── parse XML response → v1 JSON
```

### PIN Encryption

Card PINs are encrypted using 3DES (`DESede/CBC/NoPadding`) with the merchant key from `*-secure.yaml` before being sent to First Data. The Groovy script runs via the MuleSoft Scripting Module (JSR-223).

### URL Discovery

First Data provides multiple DataWire hosts. On each cold start (or after return code `8` clears the cache) the API pings all configured hosts in parallel, sorts by response time, and caches the fastest URL for 300 seconds in an in-memory Object Store.

| Environment | Hosts |
|---|---|
| Local / Dev / QA / UAT | `staging1.datawire.net`, `staging2.datawire.net` |
| Production | `vxn.datawire.net`, `vxn1.datawire.net` |

---

## Properties

Each environment has two property files under `src/main/resources/properties/`:

| File | Contents |
|---|---|
| `{env}.yaml` | Non-sensitive config (hosts, paths, tx codes, autodiscovery-id) |
| `{env}-secure.yaml` | Sensitive values (merchant-id, merchant-key, DID, masterKey) — Blowfish-encrypted in non-local environments |

Environments: `local`, `dev`, `qa`, `uat`, `prd`

### Key properties

| Property | Description |
|---|---|
| `sys.server.hosts` | Comma-separated `host:port` list for URL discovery ping |
| `sys.default-server-host` | Initial host used before discovery runs |
| `sys.activate-enabled` | `"true"` to allow activate; `"false"` to gate it off (prod default) |
| `sys.timeout-responses` | Comma-separated FD return codes treated as timeouts (default `205,8`) |
| `sys.url-cache-ttl` | Seconds to cache the fastest DataWire URL (default `300`) |
| `secure::sys.merchant-id` | First Data merchant ID |
| `secure::sys.merchant-key` | 3DES key (colon-hex format) for PIN encryption |
| `secure::sys.did` | DataWire DID |
| `masterKey` | Blowfish key used by the secure-properties module to decrypt `![...]` values |

---

## Local Development

### Prerequisites

- Anypoint Studio 7.24 (Mule 4.11.0 EE)
- Java 17
- Maven 3.8+
- Access to MuleSoft Exchange (Newell org) for dependency download

### Run locally

1. Clone the repo.
2. Open in Anypoint Studio → **Run As → Mule Application**.
3. The app picks up `local.yaml` and `local-secure.yaml` automatically (environment = `local`).
4. Test with any REST client on `http://localhost:8081/sys/firstdata/v1/balance`.

`local-secure.yaml` values are plain text (no encryption needed locally). Fill in valid staging credentials before testing end-to-end against First Data staging.

### Maven build

```bash
mvn clean package -DskipTests
```

---

## Environment Configuration Checklist

Before deploying to a new environment, verify these values are filled in:

- [ ] `{env}.yaml` → `sys-firstdata-v1-api.http-listener.autodiscovery-id` — set to the API Manager instance ID for that environment
- [ ] `{env}-secure.yaml` → `sys.merchant-id`, `sys.merchant-key`, `sys.did` — real First Data credentials for that environment
- [ ] `{env}-secure.yaml` → `masterKey` — the Blowfish key used to decrypt the secure file
- [ ] All values in `{env}-secure.yaml` Blowfish-encrypted with the Secure Properties Tool (non-local environments)
- [ ] `sys.activate-enabled` set correctly (`"false"` for production, `"true"` for lower environments if needed)

---

## First Data Return Codes (common)

| Code | Meaning |
|---|---|
| `00` | Approved |
| `01` | Insufficient funds |
| `04` | Inactive account |
| `05` | Expired card |
| `08` | Already active |
| `32` | Account locked |
| `33` | No previous transaction |
| `34` | Already reversed |
| `35` | Generic denial |
| `8` | DataWire host error — triggers URL cache invalidation |
| `205` | Timeout — triggers automatic reversal |

---

## Project Structure

```
sys-firstdata-v1-api-v1/
├── pom.xml
├── mule-artifact.json
└── src/
    └── main/
        ├── mule/
        │   ├── cf-global.xml                    # HTTP config, secure props, Object Store
        │   ├── pf-router.xml                    # APIKit router
        │   ├── rf-firstdata-balance-post.xml    # Balance endpoint
        │   ├── rf-firstdata-activate-post.xml   # Activate endpoint
        │   ├── rf-firstdata-lock-post.xml       # Lock endpoint
        │   ├── rf-firstdata-unlock-post.xml     # Unlock endpoint
        │   └── sf-shared.xml                    # Shared sub-flows (merchant config, URL discovery, PIN encryption)
        └── resources/
            ├── api/
            │   ├── sys-firstdata-v1-api-v1.raml
            │   ├── firstdata-types.raml
            │   └── examples/
            └── properties/
                ├── local.yaml / local-secure.yaml
                ├── dev.yaml / dev-secure.yaml
                ├── qa.yaml / qa-secure.yaml
                ├── uat.yaml / uat-secure.yaml
                └── prd.yaml / prd-secure.yaml
```

---

## Notes

- **Yankee Candle only.** The merchant credentials (merchant-id, merchant-key, DID, app-id `NWLECOMMWGIFTXML`) are hardcoded to a single First Data account. Supporting a second brand (e.g. Marmot) requires a new property block and brand-selection logic in `sf-load-merchant-config`.
- **Apigee parity.** Field names in request and response JSON are kept identical to the legacy Apigee v1 proxy so existing callers do not need changes.
- **No `![...]` in plain `.yaml` files.** Blowfish decrypt notation only works in `*-secure.yaml` files loaded by the `secure-properties:config` module.
