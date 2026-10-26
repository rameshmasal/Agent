%dw 2.0
output application/json
var exp      = payload.export
var costing  = exp.EX_API_COSTING default {}
var plants   = payload.tables.ET_PLANTS default []
var filterWerks = vars.params.plantId default ""
var filteredPlants = plants filter (row) ->
  (isEmpty(filterWerks) or row.WERKS == filterWerks)
---
{
  productId        : exp.EV_MATNR,
  productDesc      : exp.EV_MAKTX,
  crossPlantStatus : exp.EV_MSTAE,
  productType      : exp.EV_MTART,
  division         : exp.EV_SPART,
  baseUnitOfMeasure: exp.EV_BUOM,

  plants: filteredPlants map (row) -> {
    productId                           : row.MATNR,
    plantId                             : row.WERKS,
    plantDesc                           : row.WERKSD,
    plantSpecificMaterialStatusId       : row.MMSTA,
    plantSpecificMaterialStatusDesc     : row.MMSTAD,
    plantSpecificMaterialStatusValidDate: row.MMSTD
  },

  costingData: {
    productId                           : costing.MATNR,
    productDesc                         : costing.MAKTX,
    plantId                             : costing.WERKS,
    plantDesc                           : costing.WERKSD,
    plantSpecificMaterialStatusId       : costing.MMSTA,
    plantSpecificMaterialStatusDesc     : costing.MMSTAD,
    plantSpecificMaterialStatusValidDate: costing.MMSTD,
    costingLotSize                      : costing.LOSGR,
    withQuantityStructure               : costing.EKALR == "X",
    materialOriginIndicator             : costing.HKMAT,
    originGroupId                       : costing.HRKFT,
    originGroupDesc                     : costing.HRKFTD,
    overheadGroupId                     : costing.KOSGR,
    overheadGroupDesc                   : costing.KOSGRD,
    varianceKeyId                       : costing.AWSLS,
    varianceKeyDesc                     : costing.AWSLSD,
    costingProfitCenterId               : costing.PRCTR,
    costingProfitCenterDesc             : costing.PRCTRD,
    doNotCost                           : costing.NCOST == "X",
    coProduct                           : costing.KZKUP == "X",
    bulkMaterial                        : costing.SCHGT == "X",
    specialProcurementCostingId         : costing.SOBSK,
    specialProcurementCostingDesc       : costing.SOBSKD,
    plannedPrice1                       : costing.ZPLP1,
    plannedPrice1ValidFrom              : costing.ZPLD1,
    plannedPrice2                       : costing.ZPLP2,
    plannedPrice2ValidFrom              : costing.ZPLD2,
    plannedPrice3                       : costing.ZPLP3,
    plannedPrice3ValidFrom              : costing.ZPLD3,
    taxBasedPrice                       : costing.BWPRS,
    commercialPrice                     : costing.BWPRH,
    currency                            : costing.WAERS,
    valuationCategoryId                 : costing.BWTTY,
    valuationCategoryDesc               : costing.BWTTYD,
    valuationClassId                    : costing.BKLAS,
    valuationClassDesc                  : costing.BKLASD,
    priceControlId                      : costing.VPRSV,
    priceControlDesc                    : costing.VPRSVD,
    standardPrice                       : costing.STPRS,
    movingAveragePrice                  : costing.VERPR,
    priceUnit                           : costing.PEINH,
    currentValuationPrice               : costing.STPRS default costing.VERPR,
    previousPrice                       : costing.VMSTP default costing.VMVER,
    lastPriceChangeDate                 : costing.LAEPR,
    futurePrice                         : costing.ZKPRS,
    futurePriceValidFrom                : costing.ZKDAT,
    costEstimateNumber                  : costing.KALN1,
    materialLedgerActive                : costing.MLMAA == "X",
    materialPriceDeterminationId        : costing.MLAST,
    materialPriceDeterminationDesc      : costing.MLASTD,
    customField: {
      prelimPriceSCOGS   : costing.ZZPRELIM,
      fiscalYearSCOGS    : costing.ZZFISCYR,
      currentPeriodSCOGS : costing.ZZCURPER
    }
  },

  createdAt: exp.EV_ERSDA,
  updatedAt: exp.EV_LAEDA
}
