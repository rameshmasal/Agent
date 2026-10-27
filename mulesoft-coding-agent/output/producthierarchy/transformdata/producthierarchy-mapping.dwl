%dw 2.0
output application/json
var exp = payload.export
---
{
  productHierarchyId  : exp.PRODH,
  productHierarchyDesc: exp.VTEXT,
  hierarchyLevelId    : exp.STUFE,
  hierarchyLevelDesc  : exp.STUFT
}
