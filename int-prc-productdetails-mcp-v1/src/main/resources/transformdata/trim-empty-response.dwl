%dw 2.0
output application/json indent=false
fun isBlank(v: Any): Boolean =
    v == null
    or v == ""
    or (v is Object and isEmpty(v))
    or (v is Array and isEmpty(v))
fun clean(v: Any): Any = v match {
    case o is Object -> o mapObject ((val, key) -> do {
        var c = clean(val)
        ---
        if (isBlank(c)) {} else { (key): c }
    })
    case a is Array -> a map ((item) -> clean(item)) filter ((item) -> not isBlank(item))
    else -> v
}
---
clean(payload)
