// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { AssetLayout }              from './AssetLayout';
import { LAYOUT_COMMAND }           from './schema/SchemaBuilder';
import handlebars                   from 'handlebars';
import { observer }                 from 'mobx-react';
import React, { useState }          from 'react';

//================================================================//
// AssetView
//================================================================//
export const AssetView = ( props ) => {

    const { inventory, assetID, inches } = props;

    const schema        = inventory.schema;

    const asset         = _.has ( inventory.assets, assetID ) ? inventory.assets [ assetID ] : schema.newAsset ( assetID, assetID );

    const [ layout ]    = useState ( new AssetLayout ( schema, asset ));
    const [ metrics ]   = useState ( schema.getAssetDocSize ( asset ));

    const dpi           = props.dpi || 300;
    const dpiScale      = dpi / metrics.dpi;

    const assetWidth    = metrics.width * dpiScale;
    const assetHeight   = metrics.height * dpiScale;

    const docX          = props.x || 0;
    const docY          = props.y || 0;
    const scale         = props.scale || 1;

    const docWidthInInches      = ( metrics.width * scale ) / metrics.dpi;
    const docHeightInInches     = ( metrics.height * scale ) / metrics.dpi;

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
