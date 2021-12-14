// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { AssetLayout }                          from './AssetLayout';
import { LAYOUT_COMMAND }                       from './schema/SchemaBuilder';
import * as rendering                           from './rendering';
import * as fgc                                 from 'fgc';
import handlebars                               from 'handlebars';
import { observer }                             from 'mobx-react';
import React, { useEffect, useRef, useState }   from 'react';

//================================================================//
// AssetView
//================================================================//
export const AssetView = ( props ) => {

    const { inches, renderAsync } = props;

    const componentIsMounted = useRef ( true );
    useEffect (() => {
        return () => {
            componentIsMounted.current = false;
        }
    }, []);

    const [ svg, setSVG ] = useState ( '' );

    const schema        = props.schema || props.inventory.schema;
    const asset         = props.asset || ( _.has ( props.inventory.assets, props.assetID ) ? props.inventory.assets [ props.assetID ] : schema.newAsset ( assetID, props.assetID ));

    fgc.assert ( schema );
    fgc.assert ( asset );

    const [ metrics ]   = useState ( schema.getAssetDocSize ( asset ));

    fgc.assert ( metrics );

    const dpi           = props.dpi || 300;
    const dpiScale      = dpi / metrics.dpi;

    const assetWidth    = metrics.width * dpiScale;
    const assetHeight   = metrics.height * dpiScale;

    const docX          = props.x || 0;
    const docY          = props.y || 0;
    const scale         = props.scale || 1;

    const docWidthInInches      = ( metrics.width * scale ) / metrics.dpi;
    const docHeightInInches     = ( metrics.height * scale ) / metrics.dpi;

    const affirmSVG = async () => {

        const renderedSVG = props.svg || asset.svg || ( renderAsync && await renderAsync ( schema, asset )) || false;
        if ( componentIsMounted.current ) {
            setSVG ( renderedSVG || await rendering.verifyImagesAsync ( await schema.renderAssetSVG ( asset )));
        }
    }

    if ( !svg ) {
        affirmSVG ();
    }

    return (
        <svg
            x       = { docX }
            y       = { docY }
            width   = { inches ? `${ docWidthInInches }in` : ( docWidthInInches * dpi )}
            height  = { inches ? `${ docHeightInInches }in` : ( docHeightInInches * dpi )}
            viewBox = { `0 0 ${ assetWidth } ${ assetHeight }` }
            preserveAspectRatio = 'xMidYMid meet'
        >
            <g transform = { `scale ( ${ dpiScale } ${ dpiScale })` } dangerouslySetInnerHTML = {{ __html: svg }}></g>
        </svg>
    );
}
