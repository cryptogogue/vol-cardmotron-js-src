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

    const layout        = inventory.getAssetLayout ( assetId );

    const docX          = props.x || 0;
    const docY          = props.y || 0;
    const scale         = props.scale || 1;

    const docWidth      = layout.width;
    const docHeight     = layout.height;
    const dpi           = layout.dpi;

    return (
        <svg
            x = { docX }
            y = { docY }
            width = { inches ? `${( docWidth * scale ) / dpi }in` : docWidth * scale }
            height = { inches ? `${( docHeight * scale ) / dpi }in` : docHeight * scale }
            viewBox = { `0 0 ${ docWidth } ${ docHeight }` }
            preserveAspectRatio = 'none'
        >
            <g dangerouslySetInnerHTML = {{ __html: layout.svg }}/>
        </svg>
    );
}
