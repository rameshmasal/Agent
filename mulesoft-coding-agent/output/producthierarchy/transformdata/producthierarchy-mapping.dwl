%dw 2.0
output application/json
var allRows = payload.tables.ET_PRODUCT_HIERARCHY
---
allRows map (row) -> {
  productHierarchyId  : row.PRODH,
  productHierarchyDesc: row.VTEXT,
  hierarchyLevelId    : row.STUFE,
  hierarchyLevelDesc  : row.STUFT
}
