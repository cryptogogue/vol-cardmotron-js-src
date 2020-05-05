// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, pdf417, qrcode, textLayout } from 'fgc';
import { LAYOUT_COMMAND }           from './schema/SchemaBuilder';
import _                            from 'lodash';

//================================================================//
// AssetLayout
//================================================================//
export class AssetMetrics {

    //----------------------------------------------------------------//
    constructor ( layoutController, asset ) {

        const schema    = layoutController.schema;
        const context   = schema.composeAssetContext ( asset, {[ '$' ]: asset.assetID });

        this.width      = 0;
        this.height     = 0;
        this.dpi        = false;
        this.context    = context;

        const layoutNameList = schema.getAssetField ( asset, 'layout', '' );
        this.layoutList ( layoutNameList, context, layoutController, []);

        this.docSize = {
            widthInInches: this.width / this.dpi,
            heightInInches: this.height / this.dpi,
        };
        this.docSizeName = `[${ this.docSize.widthInInches }in x ${ this.docSize.heightInInches }in]`;
    }

    //----------------------------------------------------------------//
    layoutList ( layoutNameList, context, layoutController, stack ) {

        const layoutNames = layoutController.tokenizeLayoutNames ( layoutNameList );

        for ( const layoutName of layoutNames ) {
            this.layoutSingle ( layoutName, context, layoutController, stack );
        }
    }

    //----------------------------------------------------------------//
    layoutSingle ( layoutName, context, layoutController, stack ) {

        const layout = layoutController.layouts [ layoutName ]; 
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
                this.layoutList ( layoutNameList, context, layoutController, stack );
            }
        }

        stack.pop ();
    }
}
