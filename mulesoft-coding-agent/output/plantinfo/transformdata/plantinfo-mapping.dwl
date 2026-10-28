%dw 2.0
output application/json
var exp   = payload.export
var plant = exp.EX_API_PLANT default {}
var plants = payload.tables.ET_PLANTS default []
---
{
  productid        : exp.EV_MATNR,
  prodcutDesc      : exp.EV_MAKTX,
  crossPlantStatus : exp.EV_MSTAE,
  productType      : exp.EV_MTART,
  division            : exp.EV_SPART,
  baseUnitOfMeasure   : exp.EV_BUOM,

  plants: plants map (row) -> {
    productid : row.MATNR,
    plantId   : row.WERKS,
    plantDesc : row.WERKSD
  },

  generalData: {
    productId                          : plant.MATNR,
    plantId                            : plant.WERKS,
    plantDesc                          : plant.WERKSD,
    ccPhysInvIndId                     : plant.ABCIN,
    ccPhysInvIndDesc                   : plant.ABCIND,
    varianceKeyId                      : plant.AWSLS,
    varianceKeyDesc                    : plant.AWSLSD,
    mrpGroupId                         : plant.DISGR,
    mrpGroupDesc                       : plant.DISGRD,
    purchasingGroupId                  : plant.EKGRP,
    purchasingGroupDesc                : plant.EKGRPD,
    openingPeriod                      : plant.ERHOR,
    productionVersionId                : plant.FVIDK,
    productionVersionDesc              : plant.FVIDKD,
    countryOfOriginId                  : plant.HERKL,
    countryOfOriginDesc                : plant.HERKLD,
    regionOfOriginId                   : plant.HERKR,
    regionOfOriginDesc                 : plant.HERKRD,
    automaticPurchaseOrderAllowed      : plant.KAUTB,
    sourceListRequirement              : plant.KORDB,
    loadingGroupId                     : plant.LADGR,
    loadingGroupDesc                   : plant.LADGRD,
    issueStorageLocationId             : plant.LGPRO,
    issueStorageLocationDesc           : plant.LGPROD,
    abcIndicatorId                     : plant.MAABC,
    abcIndicatorDesc                   : plant.MAABCD,
    materialFreightGroupId             : plant.MFRGR,
    materialFreightGroupDesc           : plant.MFRGRD,
    donotCost                          : plant.NCOST,
    profitCenterId                     : plant.PRCTR,
    profitCenterDesc                   : plant.PRCTRD,
    prdSchedulingProfileId             : plant.SFCPF,
    prdSchedulingProfileDesc           : plant.SFCPFD,
    commodityCodeId                    : plant.STAWN,
    commodityCodeDesc                  : plant.STAWND,
    unitOfIssueId                      : plant.AUSME,
    unitOfIssueDesc                    : plant.AUSMED,
    productionUnitId                   : plant.FRTME,
    productionUnitDesc                 : plant.FRTMED,
    productionSupervisorId             : plant.FEVOR,
    productionSupervisorDesc           : plant.FEVORD,
    serialNoProfileId                  : plant.SERNP,
    serialNoProfileDesc                : plant.SERNPD,
    inspectionStockInicator            : plant.INSMK,
    criticalPartIndicator              : plant.KZKRI,
    batchManagementRequirementIndicator: plant.XCHPF
  },

  status: {
    plantSpecificMaterialStatusId        : plant.MMSTA,
    plantSpecificMaterialStatusDesc      : plant.MMSTAD,
    plantSpecificMaterialStatusValidDate : plant.MMSTD
  },

  procurement: {
    procurementTypeId                      : plant.BESKZ,
    procurementTypeDesc                    : plant.BESKZD,
    storageLocationExternalProcurementId   : plant.LGFSB,
    storageLocationExternalProcurementDesc : plant.LGFSBD,
    backflushId                            : plant.RGEKZ,
    backflushDesc                          : plant.RGEKZD,
    specialProcurementTypeId               : plant.SOBSL,
    specialProcurementTypeDesc             : plant.SOBSLD,
    qmControlKeyId                         : plant.SSQSS,
    qmControlKeyDesc                       : plant.SSQSSD,
    batchEntryId                           : plant.KZECH,
    batchEntryDesc                         : plant.KZECHD,
    prodStorageLocationId                  : plant.PLGPRO,
    prodStorageLocationDesc                : plant.PLGPROD,
    stockDeterminationGroupId              : plant.EPRIO,
    stockDeterminationGroupDesc            : plant.EPRIOD,
    coProductIndicator                     : plant.KZKUP,
    bulkMaterialIndicator                  : plant.SCHGT
  },

  mrpProcedure: {
    mrpTypeId         : plant.DISMM,
    mrpTypeDesc       : plant.DISMMD,
    mrpControllerId   : plant.DISPO,
    mrpControllerDesc : plant.DISPOD,
    planningTimeFence : plant.FXHOR,
    reorderPoint      : plant.MINBE,
    planningCycleId   : plant.LFRHY,
    planningCycleDesc : plant.LFRHYD
  },

  lotSize: {
    lotSizeId             : plant.DISLS,
    lotSizeDesc           : plant.DISLSD,
    minimumLotSize        : plant.BSTMI,
    maximumLotSize        : plant.BSTMA,
    fixedLotSize          : plant.BSTFE,
    maximumStockLevel     : plant.MABST,
    assemblyScrapPercent  : plant.AUSSS,
    taktTime              : null,
    roundingProfileId     : plant.RDPRF,
    roundingProfileDesc   : plant.RDPRFD,
    roundingValue         : plant.BSTRF,
    unitOfMeasureGroupId  : plant.MEGRU,
    unitOfMeasureGroupDesc: plant.MEGRUD
  },

  bomExplosition: {
    selectionMethodId                 : plant.ALTSL,
    selectionMethodDesc               : plant.ALTSLD,
    componentScrapPercent             : plant.KAUSF,
    individualCollectiveId            : plant.SBDKZ,
    individualCollectiveDesc          : plant.SBDKZD,
    requirementsGroupingIndicatorId   : plant.KZBED,
    requirementsGroupingIndicatorDesc : plant.KZBEDD,
    versionIndicator                  : plant.VERKZ,
    mrpDepRequirementsId              : plant.AHDIS,
    mrpDepRequirementsDesc            : plant.AHDISD
  },

  discontinuedParts: {
    discontinuationIndicatorId   : plant.KZAUS,
    discontinuationIndicatorDesc : plant.KZAUSD,
    effectiveOutDate             : plant.AUSDT,
    followUpMaterial             : plant.NFMAT
  },

  netRequirementCalculation: {
    safetyStock             : plant.EISBE,
    safetyTimeIndicatorId   : plant.SHFLG,
    safetyTimeIndicatorDesc : plant.SHFLGD,
    safetyTime              : plant.SHZET,
    serviceLevelPer         : plant.LGRAD,
    minSafetyStock          : plant.EISLO,
    coverageProfileId       : plant.RWPRO,
    coverageProfileDesc     : plant.RWPROD,
    PerProfileSafetyTimeId  : plant.SHPRO,
    PerProfileSafetyTimeDesc: plant.SHPROD
  },

  scheduling: {
    schedulingMarginKey     : plant.FHORI,
    plannedDeliveryTimeDays : plant.PLIFZ,
    grProcessingTime        : plant.WEBAZ,
    inHouseProduction       : plant.DZEIT,
    planningCalendarId      : plant.MRPPP,
    planningCalendarDesc    : plant.MRPPPD
  },

  quantityStructureData: {
    productionVersionId               : plant.FVIDK,
    productionVersionDesc             : plant.FVIDKD,
    lotSizeProductCosting             : plant.LOSGR,
    specialProcurementTypeCostingId   : plant.SOBSK,
    specialProcurementTypeCostingDesc : plant.SOBSKD,
    alternativeBOM                    : plant.STLAL,
    bomUsageId                        : plant.STLAN,
    bomUsageDesc                      : plant.STLAND,
    taskListGroup                     : plant.PLNNR,
    taskListType                      : plant.PLNTY,
    groupCounter                      : plant.APLAL
  },

  availabilityCheck: {
    availabilityCheckId   : plant.MTVFP,
    availabilityCheckDesc : plant.MTVFPD,
    totalReplLeadTime     : plant.WZEIT,
    crossProjectId        : plant.KZPSP,
    crossProjectDesc      : plant.KZPSPD
  },

  planning: {
    planningStrategyGroupId   : plant.STRGR,
    planningStrategyGroupDesc : plant.STRGRD,
    backwardConsumptionPeriod : plant.VINT1,
    forwardConsumptionPeriod  : plant.VINT2,
    consumptionModeId         : plant.VRMOD,
    consumptionModeDesc       : plant.VRMODD,
    mixedMRPId                : plant.MISKZ,
    mixedMRPDesc              : plant.MISKZD
  },

  repetitiveManufacturing: {
    repetitiveMFGAllowed               : plant.SAUFT,
    repetitiveManufacturingProfileId   : plant.SFEPR,
    repetitiveManufacturingProfileDesc : plant.SFEPRD,
    actionControlId                    : plant.MDACH,
    actionControlDesc                  : plant.MDACHD,
    fairShareRuleId                    : plant.DPLFS,
    fairShareRuleDesc                  : plant.DPLFSD,
    pushDistributionId                 : plant.DPLPU,
    pushDistributionDesc               : plant.DPLPUD
  },

  forecastRequirement: {
    periodIndicatorId      : plant.PERKZ,
    periodIndicatorDesc    : plant.PERKZD,
    fiscalYearVariantId    : plant.PERIV,
    fiscalYearVariantDesc  : plant.PERIVD,
    splittingIndicatorId   : plant.AUFTL,
    splittingIndicatorDesc : plant.AUFTLD
  },

  tolerance: {
    unlimitedOverdeliveryAllowed : plant.UEETK,
    overdeliveryToleranceLimit   : plant.UEETO,
    underdeliveryToleranceLimit  : plant.UNETO
  },

  customField: {

    generalData: {
      maxOrderQuantityBigHit   : plant.ZZ_MAX_ORD,
      alternateHI              : plant.ZZALTERNATEHI,
      alternateTI              : plant.ZZALTERNATETI,
      skuRatStatusId           : plant.ZZSKU_RAT_STAT,
      skuRatStatusDesc         : plant.ZZSKU_RAT_STATD,
      skuRatCycle              : plant.ZZSKU_RAT_CYCLE,
      mtoLeadTime              : plant.ZZ_MTO_LT,
      producingValueStreamId   : plant.ZZPRVSTR,
      producingValueStreamDesc : plant.ZZPRVSTRD,
      planningPolicyId         : plant.ZZ_PLAN_POLICY,
      planningPolicyDesc       : plant.ZZ_PLAN_POLICYD,
      valueStreamOwnerId       : plant.ZZVSTRID,
      valueStreamOwnerDesc     : plant.ZZVSTRIDD,
      safetyStockMethodId      : plant.ZZ_SAFTY_STK_MET,
      safetyStockMethodDesc    : plant.ZZ_SAFTY_STK_METD,
      conveyableFlag           : plant.ZDE_CONV_FLG,
      rltForecastErrorPer      : plant.ZZ_FRCST_ERR_PRC,
      targetDaysSupply         : plant.ZZ_TARGET_DAYS,
      formQuantity             : plant.ZZFRMQTY,
      hardAllocation           : plant.ZZHARD_ALLOC,
      apoVendor                : plant.ZZ_APO_VENDOR,
      xyzIndicatorId           : plant.ZZXYZ_IND,
      xyzIndicatorDesc         : plant.ZZXYZ_INDD,
      standAloneComponent      : plant.ZZCOMP,
      documentaryBatch         : plant.ZZ_DOCBATCH,
      notStockingLocIPFA       : plant.ZZ_NOT_STK_LOC
    },

    ibpData: {
      relevantForIBP         : plant.ZZ_SNCREL,
      notAStockingLocation   : plant.ZZ_NOT_STK_LOC,
      subNetworkId           : plant.ZZ_SUBNET,
      subNetworkDesc         : plant.ZZ_SUBNETD,
      abcSupplyId            : plant.ZZ_IBPABC,
      abcSupplyDesc          : plant.ZZ_IBPABCD,
      minDaysSupply          : plant.ZZ_IBPMIN,
      maxDaysSupply          : plant.ZZ_IBPMAX,
      supplyProfileId        : plant.ZADDL_COO,
      supplyProfileDesc      : plant.ZADDL_COOD,
      demandProfileId        : plant.ZZMRPA,
      demandProfileDesc      : plant.ZZMRPAD,
      constantSafety         : plant.ZZ_IBPSS,
      deploymentProfileId    : plant.ZZ_DPLEX,
      deploymentProfileDesc  : plant.ZZ_DPLEXD,
      consumptionProfileId   : plant.ZZIMEXP,
      consumptionProfileDesc : plant.ZZIMEXPD,
      minSafetyStockQty      : plant.ZZ_IBPMNSS,
      maxSafetyStockQty      : plant.ZZ_IBPMXSS
    }
  },

  createdAt: exp.EV_ERSDA,
  updatedAt: exp.EV_LAEDA
}