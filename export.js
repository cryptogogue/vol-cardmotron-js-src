// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

module.exports = {

    debug: {
        SquapScreen:            require ( './debug/SquapScreen.js' ).SquapScreen,
        SVGtoPNGScreen:         require ( './debug/SVGtoPNGScreen.js' ).SVGtoPNGScreen,
    },
    parseSquap:                 require ( './schema/parseSquap.js' ).parseSquap,

    AssetCardView:              require ( './AssetCardView.js' ).AssetCardView,
    AssetLayout:                require ( './AssetLayout.js' ).AssetLayout,
    AssetMetrics:               require ( './AssetMetrics.js' ).AssetMetrics,
    AssetModal:                 require ( './AssetModal.js' ).AssetModal,
    AssetSizer:                 require ( './AssetSizer.js' ).AssetSizer,
    AssetView:                  require ( './AssetView.js' ).AssetView,
    Binding:                    require ( './schema/Binding.js' ).Binding,
    EditorScreen:               require ( './EditorScreen.js' ).EditorScreen,
    InventoryController:        require ( './InventoryController.js' ).InventoryController,
    inventoryMenuItems:         require ( './inventoryMenuItems.js' ),
    InventoryPrintView:         require ( './InventoryPrintView.js' ).InventoryPrintView,
    InventoryView:              require ( './InventoryView.js' ).InventoryView,
    InventoryViewController:    require ( './InventoryViewController.js' ).InventoryViewController,
    ScannerReportModal:         require ( './ScannerReportModal.js' ).ScannerReportModal,
    Schema:                     require ( './schema/Schema.js' ).Schema,
    SchemaScannerXLSX:          require ( './schema/SchemaScannerXLSX.js' ).SchemaScannerXLSX,

    LAYOUT_COMMAND:             require ( './schema/SchemaBuilder.js' ).LAYOUT_COMMAND,
};
