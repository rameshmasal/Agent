%dw 2.0
output text/plain
---
if (vars.logType == "ERROR") p('logging.status.error') else p('logging.status.success')
