%dw 2.0
output application/xml
---
ZGLO_GET_PRODUCT_COSTING: {
    "import": {
        "IV_MATNR": (vars.params.productId as Number) as String default "",
        "IV_WERKS":  vars.params.plantId default ""
    }
}
