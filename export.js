// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

module.exports = {

    debug: {
        SquapScreen:                require ( './debug/SquapScreen.js' ).SquapScreen,
        SVGtoPNGScreen:             require ( './debug/SVGtoPNGScreen.js' ).SVGtoPNGScreen,
    },
    makeSquap:                      require ( './schema/Squap.js' ).makeSquap,
    parseSquap:                     require ( './schema/parseSquap.js' ).parseSquap,
    renderSVGAsync:                 require ( './rendering.js' ).renderSVGAsync,

    AssetCardView:                  require ( './AssetCardView.js' ).AssetCardView,
    AssetLayout:                    require ( './AssetLayout.js' ).AssetLayout,
    AssetModal:                     require ( './AssetModal.js' ).AssetModal,
    AssetSizer:                     require ( './AssetSizer.js' ).AssetSizer,
    AssetView:                      require ( './AssetView.js' ).AssetView,
    Binding:                        require ( './schema/Binding.js' ).Binding,
    EditorScreen:                   require ( './EditorScreen.js' ).EditorScreen,
    Inventory:                      require ( './Inventory.js' ).Inventory,
    InventoryDownloadController:    require ( './InventoryDownloadController.js' ).InventoryDownloadController,
    InventoryDownloadModal:         require ( './InventoryDownloadModal.js' ).InventoryDownloadModal,
    inventoryMenuItems:             require ( './inventoryMenuItems.js' ),
    InventoryPrintController:       require ( './InventoryPrintController.js' ).InventoryPrintController,
    InventoryPrintView:             require ( './InventoryPrintView.js' ).InventoryPrintView,
    InventoryView:                  require ( './InventoryView.js' ).InventoryView,
    InventoryViewController:        require ( './InventoryViewController.js' ).InventoryViewController,
    InventoryWithFilter:            require ( './InventoryWithFilter.js' ).InventoryWithFilter,
    MethodBinding:                  require ( './schema/MethodBinding.js' ).MethodBinding,
    ScannerReportMessages:          require ( './ScannerReportMessages.js' ).ScannerReportMessages,
    ScannerReportModal:             require ( './ScannerReportModal.js' ).ScannerReportModal,
    Schema:                         require ( './schema/Schema.js' ).Schema,
    SchemaScannerXLSX:              require ( './schema/SchemaScannerXLSX.js' ).SchemaScannerXLSX,

    INVENTORY_FILTER_STATUS:        require ( './InventoryWithFilter.js' ).INVENTORY_FILTER_STATUS,
    LAYOUT_COMMAND:                 require ( './schema/SchemaBuilder.js' ).LAYOUT_COMMAND,
};
