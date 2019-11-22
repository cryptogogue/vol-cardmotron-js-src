// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, pdf417, qrcode, textLayout } from 'fgc/export';
import { LAYOUT_COMMAND }           from './schema/SchemaBuilder';
import _                            from 'lodash';

const { TextFitter, JUSTIFY } = textLayout;

//================================================================//
// AssetLayout
//================================================================//
export class AssetLayout {

    //----------------------------------------------------------------//
    constructor ( inventory, assetID, filters ) {

        const asset     = inventory.assets [ assetID ];
        const context   = inventory.composeAssetContext ( asset, filters, {[ '$' ]: assetID });

        const resources = {
            fonts:      inventory.fonts,
            icons:      inventory.icons,
        };

        this.width      = 0;
        this.height     = 0;
        this.dpi        = false;
        this.context    = context;

        // this.context    = context;

        const layoutNameList = inventory.getAssetField ( asset, 'layout', '' );
        this.svg = this.layoutList ( layoutNameList, context, inventory, []);
    }

    //----------------------------------------------------------------//
    layoutList ( layoutNameList, context, inventory, stack ) {

        const layoutNames = inventory.tokenizeLayoutNames ( layoutNameList );

        let items = [];
        for ( const layoutName of layoutNames ) {
            context [ '$$' ] = '';
            items.push ( this.layoutSingle ( layoutName, context, inventory, stack ));
        }
        return `<g>${ items.join ( '' )}</g>`;
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

        let items = [];

        for ( let i in layout.commands ) {
            
            context [ '$$' ] = '';

            const command = layout.commands [ i ];
            
            const x = command.x || 0;
            const y = command.y || 0;
            const w = command.width || 0;
            const h = command.height || 0;

            let svg = false;

            switch ( command.type ) {

                case LAYOUT_COMMAND.DRAW_BARCODE: {

                    const value = command.template && command.template ( context ) || null;
                    if ( !value ) break;

                    let svgTag = '<g/>';

                    switch ( command.codeType || pdf417.CONSTS.ID ) {

                        case pdf417.CONSTS.ID: {
                            svgTag = pdf417.makeSVGTag ( value, x, y, w, h );
                            break;
                        }

                        case qrcode.CONSTS.ID: {

                            const valueUpper = value.toUpperCase ();

                            if ( qrcode.isLegal ( valueUpper )) {

                                const options = command.options || {};
                                const qrErr = options.qrErr || qrcode.CONSTS.ERROR_LEVEL.LOW;
                                let qrType = options.qrType || qrcode.CONSTS.AUTOSELECT_TYPE;
                                qrType = ( qrType !== qrcode.CONSTS.AUTOSELECT_TYPE )
                                    ? qrType
                                    : qrcode.autoSelectType ( qrErr, valueUpper.length );

                                svgTag = qrcode.makeSVGTag ( valueUpper, x, y, w, h, qrErr, qrType );
                            }
                            break;
                        }
                    }

                    svg = `
                        <rect x = ${ x } y = ${ y } width = ${ w } height = ${ h } fill = 'white'/>
                        ${ svgTag }
                    `;
                    break;
                }

                case LAYOUT_COMMAND.DRAW_LAYOUT: {

                    const layoutNameList = command.template ( context );
                    svg = this.layoutList ( layoutNameList, context, inventory, stack );

                    break;
                }

                case LAYOUT_COMMAND.DRAW_SVG: {

                    svg = command.template && command.template ( context ) || false;
                    break;
                }

                case LAYOUT_COMMAND.DRAW_TEXT_BOX: {

                    const resources = {
                        fonts:  inventory.fonts,
                        icons:  inventory.icons,
                    };

                    const fitter = new TextFitter ( resources, x, y, w, h, command.vJustify );

                    for ( let segment of command.segments ) {

                        const value = segment.template && segment.template ( context ) || null;
                        if ( !value ) continue;

                        fitter.pushSection ( value, segment.fontName, segment.fontSize, segment.hJustify );
                    }
                    fitter.fit ();
                    svg = fitter.toSVG ();
                    break;
                }
            }

            if ( svg ) {
                context [ '$$' ] = svg;
                svg = command.wrap ? command.wrap ( context ) : `<g>${ svg }</g>`;
                items.push ( svg );
            }
        }

        stack.pop ();

        const svg = items.join ( '' );
        context [ '$$' ] = svg;
        return layout.wrap ? layout.wrap ( context ) : `<g>${ svg }</g>`;
    }
}
