// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { LAYOUT_COMMAND }           from './schema/SchemaBuilder';
import handlebars                   from 'handlebars';
import { observer }                 from 'mobx-react';
import React                        from 'react';

//================================================================//
// AssetView
//================================================================//
export const AssetView = ( props ) => {

    const { inventory, assetId, inches } = props;
    const dpi = props.dpi || 300;

    const layout        = inventory.getAssetLayout ( assetId );

    const dpiScale      = dpi / layout.dpi;

    const assetWidth    = layout.width * dpiScale;
    const assetHeight   = layout.height * dpiScale;

    const docX          = props.x || 0;
    const docY          = props.y || 0;
    const scale         = props.scale || 1;

    const docWidth      = inventory.maxWidthInInches * dpi;
    const docHeight     = inventory.maxHeightInInches * dpi;

    return (
        <svg
            x = { docX }
            y = { docY }
            width = { inches ? `${( docWidth * scale ) / dpi }in` : docWidth * scale }
            height = { inches ? `${( docHeight * scale ) / dpi }in` : docHeight * scale }
            viewBox = { `0 0 ${ assetWidth } ${ assetHeight }` }
            preserveAspectRatio = 'xMidYMid meet'
        >
            <g transform = { `scale ( ${ dpiScale } ${ dpiScale })` } dangerouslySetInnerHTML = {{ __html: layout.svg }}/>
        </svg>
    );
}
