// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, util } from 'fgc';

import * as consts                                          from './consts';
import { AssetView }                                        from './AssetView';
import * as rendering                                       from './rendering'
import { VectorToImageView }                                from './VectorToImageView';
import * as changedpi                                       from 'changedpi';
import { RevocableContext }                                 from 'fgc';
import FileSaver                                            from 'file-saver';
import JSZip                                                from 'jszip';
import { action, computed, extendObservable, observable, observe, reaction, runInAction } from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { useState }                                  from 'react';
import ReactDomServer                                       from 'react-dom/server';
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

//================================================================//
// InventoryPrintController
//================================================================//
export class InventoryPrintController {

    @observable queue       = [];
    @observable pages       = [];

    //----------------------------------------------------------------//
    constructor ( inventoryViewController, renderAsync ) {

        this.renderAsync = renderAsync || false;

        this.revocable = new RevocableContext ();

        this.cancelRefreshReaction = reaction (
            () => {
                return {
                    layoutName:     inventoryViewController.layoutName,
                    inventory:      inventoryViewController.inventory,
                    assetArray:     inventoryViewController.sortedAssets,
                };
            },
            ({ layoutName, inventory, assetArray }) => {
                this.refresh ( layoutName, inventory, assetArray );
            }
        );
    }

    //----------------------------------------------------------------//
    finalize () {

        this.cancelRefreshReaction ();
        this.revocable.finalize ();

        for ( let page of this.pages ) {
            URL.revokeObjectURL ( page.dataURL );
        }
    }

    //----------------------------------------------------------------//
    getPageMetrics ( pageType, assetMetrics ) {

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

    //----------------------------------------------------------------//
    @computed get
    hasPages () {

        return (( this.pages.length > 0 ) && ( this.queue.length === 0 ));
    }

    //----------------------------------------------------------------//
    @action
    async nextPageAsync () {

        if ( this.queue.length === 0 ) return;

        const { assetIDs, inventory, assetMetrics, pageMetrics } = this.queue.shift ();

        const assetScale            = pageMetrics.scale || 1;
        const rotate90              = pageMetrics.rotate90 || false;

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

                const assetID = assetIDs [ i ];
                const assetSVG = this.renderAsync ? await this.renderAsync ( inventory.schema, inventory.assets [ assetID ]) : false;

                assets.push (
                    <g
                        key = { i }
                        transform = { `translate ( ${ x }, ${ y }) scale ( ${ assetScale } ${ assetScale })` } 
                    >
                        <AssetView
                            inventory       = { inventory }
                            assetID         = { assetID }
                            dpi             = { DPI }
                            svg             = { assetSVG }
                        />
                        <rect width = { assetMetrics.width * DPI } height = { assetMetrics.height * DPI } style = { ASSET_FRAME_STYLE }/>
                    </g>
                );
            }
        }

        const docWidth      = rotate90 ? pageMetrics.height : pageMetrics.width;
        const docHeight     = rotate90 ? pageMetrics.width : pageMetrics.height;

        const width         = docWidth * DPI;
        const height        = docHeight * DPI;
        const transform     = rotate90 ? `translate ( 0 ${ height }) rotate ( -90 )` : ``;
        
        const svg = ReactDomServer.renderToStaticMarkup (
            <svg
                version         = "1.1"
                baseProfile     = "basic"
                xmlns           = "http://www.w3.org/2000/svg"
                width           = { `${ width }` }
                height          = { `${ height }` }
                viewBox         = { `0 0 ${ width } ${ height }` }
                preserveAspectRatio = "xMidYMid meet"
            >
                <rect width = { width } height = { height } style = {{ fill: '#ffffff' }}/>
                <g transform    = { transform }>
                    <g style    = { GUIDE_LINE_STYLE }>
                        { guidelines }
                    </g>
                    { assets }
                </g>
            </svg>
        );

        const page = {
            width:      width,
            height:     height,
            dpi:        DPI,
            svg:        svg,
        }

        runInAction (() => {
            this.pages.push ( page );
        });
        this.revocable.timeout (() => { this.nextPageAsync ()}, 1 );
    }

    //----------------------------------------------------------------//
    @action
    refresh ( layoutName, inventory, assetArray ) {

        layoutName    = layoutName || consts.PAGE_TYPE.US_LETTER;
        inventory     = inventory;
        assetArray    = assetArray || inventory.assetsArray;

        this.queue = [];
        this.pages = [];

        if ( !consts.isPrintLayout ( layoutName )) return;

        const batches = [];
        const batchesByName = {};

        for ( let asset of assetArray ) {

            const docSize = inventory.schema.getAssetDocSize ( asset );
            let batch = batchesByName [ docSize.docSizeName ];

            if ( !batch ) {

                const assetMetrics = {
                    width:      docSize.widthInInches,
                    height:     docSize.heightInInches,
                };

                batch = {
                    assets:         [],
                    assetMetrics:   assetMetrics,
                };

                batchesByName [ docSize.docSizeName ] = batch;
                batches.push ( batch );
            }
            batch.assets.push ( asset );
        }
        
        let queue = [];

        for ( let batch of batches ) {

            const assetMetrics = batch.assetMetrics;
            const pageMetrics = this.getPageMetrics ( layoutName, assetMetrics );
            
            const batchAssetArray = batch.assets;

            for ( let i = 0; i < batchAssetArray.length; i += pageMetrics.step ) {

                let pageAssetIDs = [];

                for ( let j = 0; ( j < pageMetrics.step ) && (( i + j ) < batchAssetArray.length ); ++j ) {
                    pageAssetIDs.push ( batchAssetArray [ i + j ].assetID );
                }

                if ( pageAssetIDs.length > 0 ) {
                    queue.push ({
                        assetIDs:       pageAssetIDs,
                        inventory:      inventory,
                        assetMetrics:   assetMetrics,
                        pageMetrics:    pageMetrics,
                    });
                }
            }
        }

        this.queue = queue;
        this.revocable.timeout (() => { this.nextPageAsync ()}, 1 );
    }
}
