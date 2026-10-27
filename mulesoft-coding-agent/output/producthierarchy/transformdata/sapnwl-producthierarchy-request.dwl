%dw 2.0
output application/xml
---
ZGLO_GET_PRODUCT_HIERARCHY: {
    "import": {
        "IV_PRODH": vars.params.productHierarchyId default ""
    }
}
