%dw 2.0
/**
 * Builds the First Data field-delimited payload for Merchant Key Activation.
 * Transaction code: 2010
 *
 * Different structure — no card number, no PIN, no currency:
 *   SV.{merchantId} |1C 40{2010} |1C 42{merchantId}{terminalId}
 *   |1C 13{MMddyyyy} |1C 12{HHmmss} |1C F3{keyId}
 *   |1C EA{source} |1C 63{workingKey} |1C 7F1212
 *
 * Request: { keyId, workingKey, source }
 */
output text/plain
var sep = "|1C"
var bc  = vars.brandConfig
var req = vars.requestPayload
var dateStr = now() as String {format: "MMddyyyy"}
var timeStr = now() as String {format: "HHmmss"}
---
"SV." ++ bc.merchantId ++ sep ++
"40" ++ "2010"           ++ sep ++
"42" ++ bc.merchantId ++ bc.terminalId ++ sep ++
"13" ++ dateStr          ++ sep ++
"12" ++ timeStr          ++ sep ++
"F3" ++ (req.keyId as String)        ++ sep ++
"EA" ++ (req.source as String)       ++ sep ++
"63" ++ (req.workingKey as String)   ++ sep ++
"7F" ++ "1212"
