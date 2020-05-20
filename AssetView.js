// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { LAYOUT_COMMAND }           from './schema/SchemaBuilder';
import handlebars                   from 'handlebars';
import { observer }                 from 'mobx-react';
import React                        from 'react';

//================================================================//
// AssetView
//================================================================//
export const AssetView = ( props ) => {

    const { inventory, assetID, inches } = props;
    const dpi = props.dpi || 300;

    const layout        = inventory.layoutController.getAssetLayout ( assetID );

    const dpiScale      = dpi / layout.dpi;

    const assetWidth    = layout.width * dpiScale;
    const assetHeight   = layout.height * dpiScale;

    const docX          = props.x || 0;
    const docY          = props.y || 0;
    const scale         = props.scale || 1;

    const docWidthInInches      = ( layout.width * scale ) / layout.dpi;
    const docHeightInInches     = ( layout.height * scale ) / layout.dpi;

    return (
        <svg
            x = { docX }
            y = { docY }
            width = { inches ? `${ docWidthInInches }in` : ( docWidthInInches * dpi )}
            height = { inches ? `${ docHeightInInches }in` : ( docHeightInInches * dpi )}
            viewBox = { `0 0 ${ assetWidth } ${ assetHeight }` }
            preserveAspectRatio = 'xMidYMid meet'
        >
            <g transform = { `scale ( ${ dpiScale } ${ dpiScale })` } dangerouslySetInnerHTML = {{ __html: layout.svg }}></g>
        </svg>
    );
}
