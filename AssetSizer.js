// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { LAYOUT_COMMAND }           from './schema/SchemaBuilder';
import handlebars                   from 'handlebars';
import { observer }                 from 'mobx-react';
import React                        from 'react';

//================================================================//
// AssetView
//================================================================//
export const AssetSizer = ( props ) => {

    const { docSizes, docSizeName } = props;
    const dpi = props.dpi || 300;

    const docSize       = docSizes [ docSizeName ];

    const scale         = props.scale || 1;

    const assetWidth    = docSize.widthInInches * dpi * scale;
    const assetHeight   = docSize.heightInInches * dpi * scale;

    const docWidth      = docSize.widthInInches * scale;
    const docHeight     = docSize.heightInInches * scale;

    return (
        <svg
            width = { `${ docWidth }in` }
            height = { `${ docHeight }in` }
            viewBox = { `0 0 ${ assetWidth } ${ assetHeight }` }
            preserveAspectRatio = 'xMidYMid meet'
        >
            <rect width = { assetWidth } height = { assetHeight } fill = 'white' />
        </svg>
    );
}
