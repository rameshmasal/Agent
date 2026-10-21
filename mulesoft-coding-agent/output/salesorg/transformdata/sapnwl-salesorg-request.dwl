%dw 2.0
output application/xml
---
ZGLO_GET_PRODUCT_SALESORG: {
    "import": {
        "IV_MATNR": (vars.params.productId as Number) as String default "",
        "IV_VKORG": vars.params.salesOrg default "",
        "IV_VTWEG": vars.params.distributionChannel default ""
    }
}
