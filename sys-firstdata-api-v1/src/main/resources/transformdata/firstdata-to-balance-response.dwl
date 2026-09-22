%dw 2.0
/**
 * Parses First Data XML response for Balance enquiry into canonical JSON.
 *
 * First Data response XML structure:
 *   Response/Status/StatusCode       → "OK" | "AuthenticationError" | "TIMEOUT"
 *   Response/TransactionResponse/ReturnCode  → "00" (success) | "205" (timeout) | ...
 *   Response/TransactionResponse/Payload     → field-delimited string
 *
 * Field code map (2-char hex codes after splitting on |1C):
 *   39 = transaction response code (00 = success)
 *   70 = card number
 *   76 = available balance (cents)
 *   78 = locked amount (cents)
 *   75 = previous balance (cents)
 *   C0 = currency code (840=USD, 124=CAD)
 *   A0 = expiration date
 *   B0 = card class
 *   08 = reference number
 *   38 = authorization code
 *   11 = trace number
 */
input payload application/xml
output application/json
var statusCode = payload.Response.Status.StatusCode as String default "UNKNOWN"
var returnCode = payload.Response.TransactionResponse.ReturnCode as String default ""
var fdPayloadStr = payload.Response.TransactionResponse.Payload as String default ""

// Build a map of fieldCode → fieldValue by splitting on |1C
var fieldMap = if (fdPayloadStr != "")
    (fdPayloadStr splitBy "|1C") reduce (field, acc = {}) ->
        if (sizeOf(field) >= 3)
            acc ++ {(field[0 to 1]): field[2 to -1]}
        else if (sizeOf(field) == 2)
            acc ++ {(field[0 to 1]): ""}
        else acc
    else {}

fun getField(code: String) = fieldMap[code] default null

// Currency: 840→USD, 124→CAD
var currencyRaw = getField("C0") default "840"
var currency = if (currencyRaw == "124") "CAD"
    else if (currencyRaw == "840") "USD"
    else currencyRaw
---
{
    statusCode:       statusCode,
    returnCode:       returnCode,
    responseCode:     getField("39"),
    cardNumber:       getField("70"),
    availableBalance: getField("76"),
    lockedAmount:     getField("78"),
    previousBalance:  getField("75"),
    currencyCode:     currency,
    expirationDate:   getField("A0"),
    cardClass:        getField("B0"),
    referenceNumber:  getField("08"),
    authorizationCode: getField("38"),
    traceNumber:      getField("11"),
    success:          (statusCode == "OK" and returnCode == "00")
}
