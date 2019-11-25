// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, pdf417, qrcode, textLayout } from 'fgc';
import { LAYOUT_COMMAND }           from './schema/SchemaBuilder';
import _                            from 'lodash';

//================================================================//
// AssetLayout
//================================================================//
export class AssetMetrics {

    //----------------------------------------------------------------//
    constructor ( inventory, assetID ) {

        const asset     = inventory.assets [ assetID ];
        const context   = inventory.composeAssetContext ( asset, {[ '$' ]: assetID });

        const resources = {
            fonts:      inventory.fonts,
            icons:      inventory.icons,
        };

        this.width      = 0;
        this.height     = 0;
        this.dpi        = false;
        this.context    = context;

        const layoutNameList = inventory.getAssetField ( asset, 'layout', '' );
        this.layoutList ( layoutNameList, context, inventory, []);

        this.docSize = {
            widthInInches: this.width / this.dpi,
            heightInInches: this.height / this.dpi,
        };
        this.docSizeName = `[${ this.docSize.widthInInches }in x ${ this.docSize.heightInInches }in]`;
    }

    //----------------------------------------------------------------//
    layoutList ( layoutNameList, context, inventory, stack ) {

        const layoutNames = inventory.tokenizeLayoutNames ( layoutNameList );

        for ( const layoutName of layoutNames ) {
            this.layoutSingle ( layoutName, context, inventory, stack );
        }
    }

    //----------------------------------------------------------------//
    layoutSingle ( layoutName, context, inventory, stack ) {

        const layout = inventory.layouts [ layoutName ]; 
        if ( !layout ) return;

        if ( this.dpi && ( layout.dpi !== this.dpi )) return;

        if ( stack.includes ( layoutName )) return;
        stack.push ( layoutName );
        
        this.width      = Math.max ( this.width, layout.width );
        this.height     = Math.max ( this.height, layout.height );
        this.dpi        = layout.dpi;

        for ( let i in layout.commands ) {
            const command = layout.commands [ i ];
            if ( command.type === LAYOUT_COMMAND.DRAW_LAYOUT ) {
                this.layoutList ( layoutNameList, context, inventory, stack );
            }
        }

        stack.pop ();
    }
}
