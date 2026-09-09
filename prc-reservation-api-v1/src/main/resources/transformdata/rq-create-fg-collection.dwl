%dw 2.0
output application/xml
ns soapenv http://schemas.xmlsoap.org/soap/envelope/
ns tns     http://nisservice.plm.nwl.com/
---
{
    soapenv#Envelope: {
        soapenv#Header: {},
        soapenv#Body: {
            tns#createOrUpdateFGCollectionAndFGs: {
                (payload.request map (req) -> {
                    arg0: {
                        division:  req.division  default "",
                        fgcNumber: req.fgcNumber default "",
                        projectID: req.projectID default "",
                        (req.fgRecords map (fg) -> {
                            fgRecords: {
                                brand:                  fg.brand                  default "",
                                casePackQuantity:       fg.casePackQuantity       default "",
                                dimensionalUpdate:      fg.dimensionalUpdate      default "",
                                division:               fg.division               default "",
                                exclusivity:            fg.exclusivity            default "",
                                fgNumber:               fg.fgNumber               default "",
                                graphicsUpdate:         fg.graphicsUpdate         default "",
                                likeItem:               fg.likeItem               default "",
                                materialDescription:    fg.materialDescription    default "",
                                modelNumber:            fg.modelNumber            default "",
                                nisSKUIdentifier:       fg.nisSKUIdentifier       default "",
                                otherUpdate:            fg.otherUpdate            default "",
                                pieceCount:             fg.pieceCount             default "",
                                pigmentUniqueItemCode:  fg.pigmentUniqueItemCode  default "",
                                productCategory:        fg.productCategory        default "",
                                productHierarchyLevel5: fg.productHierarchyLevel5 default "",
                                productUpdate:          fg.productUpdate          default "",
                                refSAPNumber:           fg.refSAPNumber           default "",
                                region:                 fg.region                 default "",
                                (fg.sapPlant map (plant) -> {
                                    sapPlant: plant
                                }),
                                shelfPackQuantity:      fg.shelfPackQuantity      default "",
                                source:                 fg.source                 default "",
                                subBrand:               fg.subBrand               default "",
                                unspscCode:             fg.unspscCode             default "",
                                uom:                    fg.uom                    default "",
                                upcBarcodeToReuse:      fg.upcBarcodeToReuse      default "",
                                upcReuseMode:           fg.upcReuseMode           default ""
                            }
                        })
                    }
                })
            }
        }
    }
}
