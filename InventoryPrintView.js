// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, util } from 'fgc';

import * as consts                                          from './consts';
import { AssetView }                                        from './AssetView';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { useState }                                  from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Card, Group, Modal, Divider } from 'semantic-ui-react';

const PAGE_MARGIN_IN_INCHES = 0.125;

const DPI = 300;

const ASSET_FRAME_STYLE = {
    fill:           'none',
    stroke:         '#ffffff',
    strokeWidth:    3,
};

const GUIDE_LINE_STYLE = {
    fill:           'none',
    stroke:         '#000000',
    strokeWidth:    1,
};

//----------------------------------------------------------------//
function getPageMetrics ( pageType, assetMetrics ) {

    let { width, height } = consts.getInchesForPage ( pageType );

    width = width - PAGE_MARGIN_IN_INCHES;
    height = height - PAGE_MARGIN_IN_INCHES;

    const initMetrics = ( pageWidth, pageHeight ) => {

        const cols = Math.floor ( pageWidth / assetMetrics.width );
        const rows = Math.floor ( pageHeight / assetMetrics.height );

        return {
            width:      pageWidth,
            height:     pageHeight,
            cols:       cols,
            rows:       rows,
            step:       cols * rows,
        };
    }

    const metrics0 = initMetrics ( width, height );
    const metrics1 = initMetrics ( height, width );

    return metrics0.step >= metrics1.step ? metrics0 : metrics1;
}

//================================================================//
// InventoryPageView
//================================================================//
const InventoryPageView = ( props ) => {

    const { assetIDs, inventory, assetMetrics, pageMetrics } = props;

    const assetWidthInPoints    = assetMetrics.width * DPI;
    const assetHeightInPoints   = assetMetrics.height * DPI;

    const pageWidthInPoints     = pageMetrics.width * DPI;
    const pageHeightInPoints    = pageMetrics.height * DPI;

    const maxCols               = pageMetrics.cols;
    const maxRows               = pageMetrics.rows;

    const xOff = ( pageWidthInPoints - ( maxCols * assetWidthInPoints )) / 2;
    const yOff = ( pageHeightInPoints - ( maxRows * assetHeightInPoints )) / 2;

    let guidelines = [];

    for ( let col = 0; col < ( maxCols + 1 ); ++col ) {
        const x = xOff + ( col * assetWidthInPoints );
        guidelines.push (<line key = { guidelines.length } x1 = { x } y1 = { 0 } x2 = { x } y2 = { pageHeightInPoints }/>);
    }

    for ( let row = 0; row < ( maxRows + 1 ); ++row ) {
        const y = yOff + ( row * assetHeightInPoints );
        guidelines.push (<line key = { guidelines.length } x1 = { 0 } y1 = { y } x2 = { pageWidthInPoints } y2 = { y }/>); 
    }

    let assets = [];

    for ( let row = 0; row < maxRows; ++row ) {
        for ( let col = 0; col < maxCols; ++col ) {

            const i = (( row * maxCols ) + col );
            if ( i >= assetIDs.length ) break;

            let x = xOff + ( col * assetWidthInPoints );
            let y = yOff + ( row * assetHeightInPoints );

            assets.push (
                <g key = { i }>
                    <AssetView x = { x } y = { y } inventory = { inventory } assetId = { assetIDs [ i ]} dpi = { DPI }/>
                    <rect x = { x } y = { y } width = { assetWidthInPoints } height = { assetHeightInPoints } style = { ASSET_FRAME_STYLE }/>
                </g>
            );
        }
    }

    return (
        <svg
            version = "1.1"
            baseProfile = "basic"
            xmlns = "http://www.w3.org/2000/svg"
            xmlnsXlink = "http://www.w3.org/1999/xlink"
            width = { `${ pageMetrics.width }in` }
            height = { `${ pageMetrics.height }in` }
            viewBox = { `0 0 ${ pageWidthInPoints } ${ pageHeightInPoints }` }
            preserveAspectRatio = "none"
        >
            <g style = { GUIDE_LINE_STYLE }>
                { guidelines }
            </g>
            { assets }
        </svg>
    );
}

//================================================================//
// InventoryPrintView
//================================================================//
export const InventoryPrintView = observer (( props ) => {

    const layoutName    = props.layoutName || consts.PAGE_TYPE.US_LETTER;
    const inventory     = props.inventory;
    const assetArray    = props.assetArray || inventory.availableAssetsArray;

    let assetLayouts = [];

    const assetMetrics = {
        width:      inventory.maxWidthInInches,
        height:     inventory.maxHeightInInches,
    }

    const pageMetrics = getPageMetrics ( layoutName, assetMetrics, assetMetrics );
    
    for ( let i = 0; i < assetArray.length; i += pageMetrics.step ) {

        let pageAssetIDs = [];

        for ( let j = 0; ( j < pageMetrics.step ) && (( i + j ) < assetArray.length ); ++j ) {
            pageAssetIDs.push ( assetArray [ i + j ].assetID );
        }

        if ( pageAssetIDs.length > 0 ) {
            assetLayouts.push (
                <div
                    className = 'page-break'
                    key = { i }
                >
                    <InventoryPageView
                        assetIDs = { pageAssetIDs }
                        inventory = { inventory }
                        assetMetrics = { assetMetrics }
                        pageMetrics = { pageMetrics }
                    />
                </div>
            );
        }
    }

    return (
        <div className = "asset-wrapper">
            { assetLayouts }
        </div>
    );
});