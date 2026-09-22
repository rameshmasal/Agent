%dw 2.0
/**
 * Parses First Data XML response for Partial Lock into canonical JSON.
 * Adds lockId (field 79) to the response.
 *
 * Additional fields vs. balance:
 *   79 = lock ID (returned by First Data; must be stored to unlock later)
 */
input payload application/xml
output application/json
var statusCode = payload.Response.Status.StatusCode as String default "UNKNOWN"
var returnCode = payload.Response.TransactionResponse.ReturnCode as String default ""
var fdPayloadStr = payload.Response.TransactionResponse.Payload as String default ""

var fieldMap = if (fdPayloadStr != "")
    (fdPayloadStr splitBy "|1C") reduce (field, acc = {}) ->
        if (sizeOf(field) >= 3)
            acc ++ {(field[0 to 1]): field[2 to -1]}
        else if (sizeOf(field) == 2)
            acc ++ {(field[0 to 1]): ""}
        else acc
    else {}

fun getField(code: String) = fieldMap[code] default null

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
    lockId:           getField("79"),
    currencyCode:     currency,
    expirationDate:   getField("A0"),
    cardClass:        getField("B0"),
    referenceNumber:  getField("08"),
    authorizationCode: getField("38"),
    traceNumber:      getField("11"),
    success:          (statusCode == "OK" and returnCode == "00")
}
