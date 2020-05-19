// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, util } from 'fgc';

import * as consts                                          from './consts';
import { AssetView }                                        from './AssetView';
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

const DPI = 300;

//================================================================//
// InventoryDownloadController
//================================================================//
export class InventoryDownloadController {

    @observable pages       = [];
    @observable total       = 0;

    //----------------------------------------------------------------//
    constructor ( inventory, assets ) {

        this.revocable = new RevocableContext ();

        runInAction (() => {
            this.total = assets.length;
        });

        this.revocable.timeout (() => { this.nextAsset ( inventory, assets )}, 1 );
    }

    //----------------------------------------------------------------//
    finalize () {

        this.revocable.finalize ();

        for ( let page of this.pages ) {
            URL.revokeObjectURL ( page.dataURL );
        }
    }

    //----------------------------------------------------------------//
    @computed get
    isDone () {

        return ( this.pages.length === this.total );
    }

    //----------------------------------------------------------------//
    @action
    nextAsset ( inventory, assets ) {

        if ( this.isDone ) return;

        const asset     = assets [ this.pages.length ];
        const assetID   = asset.assetID;
        const metrics   = inventory.layoutController.getAssetMetrics ( assetID );
        const width     = metrics.docSize.widthInInches * DPI;
        const height    = metrics.docSize.heightInInches * DPI;

        const element = (
            <svg
                version         = "1.1"
                baseProfile     = "basic"
                xmlns           = "http://www.w3.org/2000/svg"
                xmlnsXlink      = "http://www.w3.org/1999/xlink"
                width           = { `${ width }` }
                height          = { `${ height }` }
                viewBox         = { `0 0 ${ width } ${ height }` }
                preserveAspectRatio = "xMidYMid meet"
            >
                <rect width = { width } height = { height } style = {{ fill: '#ffffff' }}/>
                <AssetView inventory = { inventory } assetID = { assetID } dpi = { DPI }/>
            </svg>
        );

        const svg       = ReactDomServer.renderToStaticMarkup ( element );
        const svgBlob   = new Blob ([ svg ], { type: 'image/svg+xml' });
        const svgURL    = URL.createObjectURL ( svgBlob );

        const image     = new Image ();
        image.width     = width;
        image.height    = height;
        image.src       = svgURL;

        image.onload = () => {

            URL.revokeObjectURL ( svgURL );

            const canvas    = document.createElement ( 'canvas' );
            canvas.width    = width;
            canvas.height   = height;

            const ctx = canvas.getContext ( '2d' );
            ctx.drawImage ( image, 0, 0 );

            const dataURL = changedpi.changeDpiDataUrl ( canvas.toDataURL (), DPI );

            const page = {
                name:       inventory.schema.getFriendlyNameForAsset ( asset ),
                assetID:    assetID,
                dataURL:    dataURL,
            }

            runInAction (() => {
                this.pages.push ( page );
            });

            this.revocable.timeout (() => { this.nextAsset ( inventory, assets )}, 1 );
        }
    }

    //----------------------------------------------------------------//
    @computed get
    progress () {
        return Math.floor (( this.processed / this.total ) * 100 );
    }

    //----------------------------------------------------------------//
    @computed get
    processed () {
        return this.pages.length;
    }

    //----------------------------------------------------------------//
    saveAsZip () {

        if ( this.pages.length === 0 ) return;

        const zip = new JSZip ();

        for ( let i in this.pages ) {
            const page = this.pages [ i ];
            const binary = atob ( page.dataURL.split ( ',' )[ 1 ]);
            const filename = page.name ? `${ page.name } - ${ page.assetID }` : page.assetID;

            zip.file ( `${ filename }.png`, binary, { binary: true });
        }

        zip.generateAsync ({ type: 'blob' }).then ( function ( content ) {
            FileSaver.saveAs ( content, 'assets.zip' );
        });
    }
}
