// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { LAYOUT_COMMAND }           from './schema/SchemaBuilder';
import handlebars                   from 'handlebars';
import { observer }                 from 'mobx-react';
import React, { useState }          from 'react';

//================================================================//
// AssetView
//================================================================//
export const AssetView = ( props ) => {

    const { inventory, assetID, inches } = props;
    const [ layout, setLayout ] = useState ( false );

    const dpi           = props.dpi || 300;

    const layouts       = inventory.layoutController;

    const metrics       = layouts.getAssetMetrics ( assetID );

    const dpiScale      = dpi / metrics.dpi;

    const assetWidth    = metrics.width * dpiScale;
    const assetHeight   = metrics.height * dpiScale;

    const docX          = props.x || 0;
    const docY          = props.y || 0;
    const scale         = props.scale || 1;

    const docWidthInInches      = ( metrics.width * scale ) / metrics.dpi;
    const docHeightInInches     = ( metrics.height * scale ) / metrics.dpi;

    const getLayout = async () => {
        setLayout ( await layouts.getAssetLayoutAsync ( assetID ));
    }
    getLayout ();

    return (
        <svg
            x = { docX }
            y = { docY }
            width = { inches ? `${ docWidthInInches }in` : ( docWidthInInches * dpi )}
            height = { inches ? `${ docHeightInInches }in` : ( docHeightInInches * dpi )}
            viewBox = { `0 0 ${ assetWidth } ${ assetHeight }` }
            preserveAspectRatio = 'xMidYMid meet'
        >
            <Choose>
                <When condition = { layout }>
                    <g transform = { `scale ( ${ dpiScale } ${ dpiScale })` } dangerouslySetInnerHTML = {{ __html: layout.svg }}></g>
                </When>
                <Otherwise>
                    <rect width = { docWidthInInches * dpi } height = { docHeightInInches * dpi  } fill = "gray"/>
                </Otherwise>
            </Choose>
        </svg>   
    );
}
