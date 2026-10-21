%dw 2.0
output application/json
var exp      = payload.export
var salesorg = exp.EX_API_SALESORG default {}
var salesorgs = payload.tables.ET_SALESORG default []
var filterVkorg = vars.params.salesOrg default ""
var filterVtweg = vars.params.distributionChannel default ""
var filteredSalesOrgs = salesorgs filter (row) ->
  (isEmpty(filterVkorg) or row.VKORG == filterVkorg) and
  (isEmpty(filterVtweg) or row.VTWEG == filterVtweg)
// Normalise TAXCLASS: handles Array (new rf-salesorg) or {row:...} object (raw XML conversion)
var taxRaw  = salesorg.TAXCLASS
var taxList =
  if (taxRaw == null)          []
  else if (taxRaw is Array)    taxRaw
  else if (taxRaw.row is Array) taxRaw.row
  else if (taxRaw.row != null) [taxRaw.row]
  else                         []
---
{
  productId        : exp.EV_MATNR,
  productDesc      : exp.EV_MAKTX,
  crossPlantStatus : exp.EV_MSTAE,
  productType      : exp.EV_MTART,
  division         : exp.EV_SPART,

  salesOrg: filteredSalesOrgs map (row) -> {
    productId             : row.MATNR,
    salesOrgId            : row.VKORG,
    salesOrgDesc          : row.VKORGD,
    distributionChannelId : row.VTWEG,
    distributionChannelDesc: row.VTWEGD,
    dChainSpecStatusId    : row.VMSTA,
    dChainSpecStatusDesc  : row.VMSTAD,
    validFromDate         : row.VMSTD
  },

  salesOrgData: {
    productId              : salesorg.MATNR,
    salesOrgId             : salesorg.VKORG,
    salesOrgDesc           : salesorg.VKORGD,
    distributionChannelId  : salesorg.VTWEG,
    distributionChannelDesc: salesorg.VTWEGD,
    salesUnitId            : salesorg.VRKME,
    salesUnitDesc          : salesorg.VRKMED,
    unitOfMeasureGroupId   : salesorg.MEGRU,
    unitOfMeasureGroupDesc : salesorg.MEGRUD,
    dChainSpecStatusId     : salesorg.VMSTA,
    dChainSpecStatusDesc   : salesorg.VMSTAD,
    validFromDate          : salesorg.VMSTD,
    deliveryPlantId        : salesorg.DWERK,
    deliveryPlantDesc      : salesorg.DWERKD,
    cashDiscountIndicator  : salesorg.SKTOF,
    salesUnitNotAllowed    : salesorg.VAVME,
    minOrderQty            : salesorg.AUMNG,
    minDelyQty             : salesorg.LFMNG,
    deliveryValue          : salesorg.SCMNG,
    deliveryUnit           : salesorg.SCHME,
    rndingProfileId        : salesorg.RDPRF,
    rndingProfileDesc      : salesorg.RDPRFD,
    materialStatisticsGroupId  : salesorg.VERSG,
    materialStatisticsGroupDesc: salesorg.VERSGD,
    materialPricingGroupId     : salesorg.KONDM,
    materialPricingGroupDesc   : salesorg.KONDMD,
    volumeRebateGroupId        : salesorg.BONUS,
    volumeRebateGroupDesc      : salesorg.BONUSD,
    accountAssignmentGroupId   : salesorg.KTGRM,
    accountAssignmentGroupDesc : salesorg.KTGRMD,
    itemCategoryGroupsId       : salesorg.MTPOS,
    itemCategoryGroupsDesc     : salesorg.MTPOSD,
    pricingRefMaterialId       : salesorg.PMATN,
    pricingRefMaterialDesc     : salesorg.PMATND,
    commissionGroupId          : salesorg.PROVG,
    commissionGroupDesc        : salesorg.PROVGD,

    materialGroups: {
      materialGroup1Id  : salesorg.MVGR1,
      materialGroup1Desc: salesorg.MVGR1D,
      materialGroup2Id  : salesorg.MVGR2,
      materialGroup2Desc: salesorg.MVGR2D,
      materialGroup3Id  : salesorg.MVGR3,
      materialGroup3Desc: salesorg.MVGR3D,
      materialGroup4Id  : salesorg.MVGR4,
      materialGroup4Desc: salesorg.MVGR4D,
      materialGroup5Id  : salesorg.MVGR5,
      materialGroup5Desc: salesorg.MVGR5D
    },

    productAttributes: {
      productAttribute1 : salesorg.PRAT1,
      productAttribute2 : salesorg.PRAT2,
      productAttribute3 : salesorg.PRAT3,
      productAttribute4 : salesorg.PRAT4,
      productAttribute5 : salesorg.PRAT5,
      productAttribute6 : salesorg.PRAT6,
      productAttribute7 : salesorg.PRAT7,
      productAttribute8 : salesorg.PRAT8,
      productAttribute9 : salesorg.PRAT9,
      productAttribute10: salesorg.PRATA
    },

    taxClassifications: taxList map (row) -> {
      countryId            : row.ALAND,
      countryDesc          : row.ALANDD,
      taxCategoryId        : row.TATYP,
      taxCategoryDesc      : row.TATYPD,
      taxClassificationId  : row.TAXKM,
      taxClassificationDesc: row.VTEXT
    },

    salesPlantData: {
      plantId                : salesorg.SALESPLANT.WERKS,
      plantDesc              : salesorg.SALESPLANT.WERKSD,
      availabilityCheckId    : salesorg.SALESPLANT.MTVFP,
      availabilityCheckDesc  : salesorg.SALESPLANT.MTVFPD,
      transportationGroupId  : salesorg.SALESPLANT.TRAGR,
      transportationGroupDesc: salesorg.SALESPLANT.TRAGRD,
      loadingGroupId         : salesorg.SALESPLANT.LADGR,
      loadingGroupDesc       : salesorg.SALESPLANT.LADGRD
    },

    customField: {
      materialSourcingGroupId  : salesorg.ZZMSRCGRP,
      materialSourcingGroupDesc: salesorg.ZZMSRCGRPD,
      infoProviderGLN1Id       : salesorg.ZZIPGLN1,
      infoProviderGLN1Desc     : salesorg.ZZIPGLN1D,
      infoProviderGLN2Id       : salesorg.ZZIPGLN2,
      infoProviderGLN2Desc     : salesorg.ZZIPGLN2D,
      infoProviderGLN3Id       : salesorg.ZZIPGLN3,
      infoProviderGLN3Desc     : salesorg.ZZIPGLN3D,
      certOfComplianceId       : salesorg.ZZCOC,
      certOfComplianceDesc     : salesorg.ZZCOCD
    }
  },

  createdAt: exp.EV_ERSDA,
  updatedAt: exp.EV_LAEDA
}
