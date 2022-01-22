// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, util } from 'fgc';

import * as consts                                          from './consts';
import { AssetView }                                        from './AssetView';
import * as rendering                                       from './rendering';
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
    @observable abort       = false;
    @observable saving      = false;

    //----------------------------------------------------------------//
    @action
    cancel () {

        this.abort = true;
    }

    //----------------------------------------------------------------//
    constructor ( options ) {

        this.revocable = new RevocableContext ();

        let getPageAsync    = false;
        let total           = 0;

        if ( options.assets && options.inventory ) {

            total = options.assets.length;
            getPageAsync = async ( i ) => {
                return await InventoryDownloadController.getAssetPage ( options.inventory, options.assets, i );
            }
            this.filename = 'assets.zip';
        }
        else if ( options.pages ) {

            total = options.pages.length;
            getPageAsync = async ( i ) => {
                return options.pages [ i ];
            }
            this.filename = 'pages.zip';
        }

        if ( getPageAsync && ( total > 0 )) {
            this.renderAsync ( getPageAsync, total );
        }
    }

    //----------------------------------------------------------------//
    static async getAssetPage ( inventory, assets, i ) {

        const asset     = assets [ i ];
        const assetID   = asset.assetID;
        const docSize   = inventory.schema.getAssetDocSize ( asset );
        const width     = docSize.widthInInches * DPI;
        const height    = docSize.heightInInches * DPI;

        const assetSVG = await rendering.verifyImagesAsync ( await inventory.schema.renderAssetSVG ( asset ));

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
                <AssetView inventory = { inventory } assetID = { assetID } dpi = { DPI } svg = { assetSVG }/>
            </svg>
        );

        return {
            width:      width,
            height:     height,
            dpi:        DPI,
            svg:        svg,
            name:       asset.fields.name ? `${ asset.fields.name.value} - ${ asset.assetID }` : asset.assetID,
        };
    }

    //----------------------------------------------------------------//
    finalize () {

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
    @action
    async renderAsync ( getPageAsync, total ) {

        this.total = total;

        for ( let i = 0; i < total; ++i ) {

            if ( this.abort ) return;

            try {

                const page = await getPageAsync ( i );
                const dataURL = await rendering.renderSVGAsync ( page.svg, page.width, page.height, page.dpi );

                runInAction (() => {
                    this.pages.push ({
                        filename:   page.name ? `${ page.name }.png` : `page-${ i + 1 }.png`,
                        dataURL:    dataURL,
                    });
                });
            }
            catch ( error ) {

                console.log ( error );
            }
        }
    }

    //----------------------------------------------------------------//
    @action
    async saveAsZip () {

        if ( this.saving || ( this.pages.length === 0 )) return;

        this.saving = true;
        await new Promise ( r => setTimeout ( r, 1 ));

        try {
            const zip = new JSZip ();

            for ( let i in this.pages ) {
                const page = this.pages [ i ];
                const binary = atob ( page.dataURL.split ( ',' )[ 1 ]);
                zip.file ( page.filename, binary, { binary: true });
            }

            const content = await zip.generateAsync ({ type: 'blob' });
            FileSaver.saveAs ( content, this.filename );
        }
        catch ( error ) {
            console.log ( error );
        }

        runInAction (() => {
            this.saving = false;
        });
    }

    @action
    async print (backCover) {

        if ( this.saving || ( this.pages.length === 0 )) return;

        this.saving = true;
        await new Promise ( r => setTimeout ( r, 1 ));

        try {

            var myWindow = window.open("", "Images");
            for ( let i in this.pages ) {
                const page = this.pages [ i ];
                myWindow.document.write("<img src='"+page.dataURL+"''>");
                if (backCover) {
                    myWindow.document.write("<img src='"+backCover+"''>");
                }
            }
            await new Promise ( r => setTimeout ( r, 4 ));
            myWindow.print();
        }
        catch ( error ) {
            console.log ( error );
        }

        runInAction (() => {
            this.saving = false;
        });
    }
}
