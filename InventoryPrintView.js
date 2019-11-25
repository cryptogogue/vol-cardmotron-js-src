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

    const initMetrics = ( width, height, rotate90 ) => {

        const xScale = ( width < assetMetrics.width ) ? ( width / assetMetrics.width ) : 1;
        const yScale = ( height < assetMetrics.height ) ? ( height / assetMetrics.height ) : 1;

        const scale = Math.min ( xScale, yScale );

        const cols = Math.floor ( width / ( assetMetrics.width * scale ));
        const rows = Math.floor ( height / ( assetMetrics.height * scale ));

        return {
            width:      width,
            height:     height,
            cols:       cols,
            rows:       rows,
            step:       cols * rows,
            scale:      scale,
            rotate90:   rotate90 || false,
        };
    }

    let { width, height } = consts.getInchesForPage ( pageType );

    width   = width - PAGE_MARGIN_IN_INCHES;
    height  = height - PAGE_MARGIN_IN_INCHES;

    const metrics0 = initMetrics ( width, height );
    const metrics1 = initMetrics ( height, width, true );

    if ( metrics0.scale === metrics1.scale ) {
        return metrics0.step >= metrics1.step ? metrics0 : metrics1;
    }
    return metrics0.scale >= metrics1.scale ? metrics0 : metrics1;
}

//================================================================//
// InventoryPageView
//================================================================//
const InventoryPageView = ( props ) => {

    const { assetIDs, inventory, assetMetrics, pageMetrics } = props;

    const assetScale            = props.assetScale || 1;
    const rotate90              = props.rotate90 || false;

    const assetWidthInPoints    = assetMetrics.width * DPI * assetScale;
    const assetHeightInPoints   = assetMetrics.height * DPI * assetScale;

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
                <g
                    key = { i }
                    transform = { `translate ( ${ x }, ${ y }) scale ( ${ assetScale } ${ assetScale })` } 
                >
                    <AssetView inventory = { inventory } assetID = { assetIDs [ i ]} dpi = { DPI }/>
                    <rect width = { assetMetrics.width * DPI } height = { assetMetrics.height * DPI } style = { ASSET_FRAME_STYLE }/>
                </g>
            );
        }
    }

    const docWidth      = rotate90 ? pageMetrics.height : pageMetrics.width;
    const docHeight     = rotate90 ? pageMetrics.width : pageMetrics.height;
    const transform     = rotate90 ? `translate ( 0 ${ docHeight * DPI }) rotate ( -90 )` : ``;
    
    return (
        <svg
            version = "1.1"
            baseProfile = "basic"
            xmlns = "http://www.w3.org/2000/svg"
            xmlnsXlink = "http://www.w3.org/1999/xlink"
            width = { `${ docWidth }in` }
            height = { `${ docHeight }in` }
            viewBox = { `0 0 ${ docWidth * DPI } ${ docHeight * DPI }` }
            preserveAspectRatio = "xMidYMid meet"
        >
            <g transform = { transform }>
                <g style = { GUIDE_LINE_STYLE }>
                    { guidelines }
                </g>
                { assets }
            </g>
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

    const batches = [];
    const batchesByName = {};

    for ( let asset of assetArray ) {

        const metrics = inventory.getAssetMetrics ( asset.assetID );
        let batch = batchesByName [ metrics.docSizeName ];

        if ( !batch ) {

            const assetMetrics = {
                width:      metrics.docSize.widthInInches,
                height:     metrics.docSize.heightInInches,
            }

            batch = {
                assets:         [],
                assetMetrics:   assetMetrics,
            };

            batchesByName [ metrics.docSizeName ] = batch;
            batches.push ( batch );
        }
        batch.assets.push ( asset );
    }
    
    let pages = [];

    for ( let batch of batches ) {

        const pageNumber = pages.length;

        const assetMetrics = batch.assetMetrics;
        const pageMetrics = getPageMetrics ( layoutName, assetMetrics );
        
        const batchAssetArray = batch.assets;

        for ( let i = 0; i < batchAssetArray.length; i += pageMetrics.step ) {

            let pageAssetIDs = [];

            for ( let j = 0; ( j < pageMetrics.step ) && (( i + j ) < batchAssetArray.length ); ++j ) {
                pageAssetIDs.push ( batchAssetArray [ i + j ].assetID );
            }

            if ( pageAssetIDs.length > 0 ) {
                pages.push (
                    <div
                        className = 'page-break'
                        key = { `${ pageNumber }-${ i }` }
                    >
                        <InventoryPageView
                            assetIDs = { pageAssetIDs }
                            inventory = { inventory }
                            assetMetrics = { assetMetrics }
                            assetScale = { pageMetrics.scale }
                            pageMetrics = { pageMetrics }
                            rotate90 = { pageMetrics.rotate90 }
                        />
                    </div>
                );
            }
        }
    }

    return (
        <div className = "asset-wrapper">
            { pages }
        </div>
    );
});