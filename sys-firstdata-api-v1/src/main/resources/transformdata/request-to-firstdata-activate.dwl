%dw 2.0
/**
 * Builds the First Data field-delimited payload for Gift Card Activation.
 * Transaction code: 2104 (ActivateRequest)
 *
 * Field layout:
 *   SV.{merchantId} |1C 40{2104} |1C EA{sourceCode} |1C 42{merchantId}{terminalId}
 *   |1C F3{merchantKeyId} |1C 04{amountInCents} |1C C0{currencyCode} |1C 70{cardNumber}
 *   |1C 53{MMddyyyy} |1C 34{encryptedPin} |1C 13{MMddyyyy} |1C 12{HHmmss}
 *   |1C F2{activatePromoCode} |1C 7F1212 [|1C 15{transactionId}]
 *
 * Request: { cardNumber, pin, amount, currencyCode, transactionId? }
 * amount is expected as decimal dollars (e.g. "50.00") and converted to cents.
 */
output text/plain
var sep = "|1C"
var bc  = vars.brandConfig
var req = vars.requestPayload
var currencyCode = if ((req.currencyCode default "USD") == "CAD") "124" else "840"
var dateStr = now() as String {format: "MMddyyyy"}
var timeStr = now() as String {format: "HHmmss"}
var pinValue = vars.encryptedPin as String
// Convert dollar amount to whole cents string (e.g. "50.00" → "5000")
var amountCents = ((req.amount as Number) * 100) as Number {class: "integer"} as String
var hasTransId = (req.transactionId?) and (req.transactionId != null) and ((req.transactionId as String) != "")
---
"SV." ++ bc.merchantId ++ sep ++
"40" ++ "2104"             ++ sep ++
"EA" ++ bc.sourceCode      ++ sep ++
"42" ++ bc.merchantId ++ bc.terminalId ++ sep ++
"F3" ++ bc.merchantKeyId   ++ sep ++
"04" ++ amountCents        ++ sep ++
"C0" ++ currencyCode       ++ sep ++
"70" ++ (req.cardNumber as String) ++ sep ++
"53" ++ dateStr            ++ sep ++
"34" ++ pinValue           ++ sep ++
"13" ++ dateStr            ++ sep ++
"12" ++ timeStr            ++ sep ++
"F2" ++ bc.activatePromoCode ++ sep ++
"7F" ++ "1212"             ++
(if (hasTransId) sep ++ "15" ++ (req.transactionId as String) else "")
