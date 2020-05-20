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

// TODO: all this should be moved to a utility library
// TODO: rewrite clunky callbacks using promises/async/await

//----------------------------------------------------------------//
function checkErrorXML ( x ) {

    let xt      = '';
    let h3OK    = 1;

    const checkXML = ( n ) => {

        if ( n.nodeName == 'h3' ) {
            if ( h3OK == 0 ) return;
            h3OK = 0;
        }

        if ( n.nodeName == '#text' ) {
            xt = xt + n.nodeValue + "\n";
        }
        
        const l = n.childNodes.length;
        for ( let i = 0; i < l; i++ ) {
            checkXML ( n.childNodes [ i ]);
        }
    }

    checkXML ( x );
    return xt;
}

//----------------------------------------------------------------//
async function loadImageAsync ( image, src ) {

    return new Promise (( resolve, reject ) => {

        image.onload = () => {
            resolve ();
        }

        image.onerror = () => {
            reject ();
        }

        image.src = src;
    });
}

//----------------------------------------------------------------//
async function embedImages ( svg, callback ) {

    const xmlDoc = new DOMParser ().parseFromString ( svg, 'text/xml' );

    const queue = [];

    const embedRecurse = ( element ) => {

        if ( element.nodeName == 'image' ) {
            queue.push ( element );
            return;
        }

        const l = element.childNodes.length;
        for ( let i = 0; i < l; i++ ) {
            embedRecurse ( element.childNodes [ i ]);
        }
    }

    embedRecurse ( xmlDoc.firstChild );

    const nextElement = () => {

        if ( queue.length === 0 ) {
            callback ( new XMLSerializer ().serializeToString ( xmlDoc ));
            return;
        }
    
        const element       = queue.shift ();
        const attributes    = element.attributes;

        const width         = attributes.getNamedItem ( 'width' ).value;
        const height        = attributes.getNamedItem ( 'height' ).value;
        const href          = attributes.getNamedItem ( 'xlink:href' ).value;

        const image         = new Image ();
        image.width         = width;
        image.height        = height;
        image.crossOrigin   = 'anonymous';

        image.onload = () => {

            const canvas    = document.createElement ( 'canvas' );
            canvas.width    = width;
            canvas.height   = height;

            const ctx = canvas.getContext ( '2d' );
            ctx.drawImage ( image, 0, 0 );

            const hrefAttr = xmlDoc.createAttribute( 'href' );
            hrefAttr.value = canvas.toDataURL ();

            attributes.removeNamedItem ( 'xlink:href' );
            attributes.setNamedItem ( hrefAttr );

            nextElement ();
        }

        image.onerror = () => {
            element.parentNode.removeChild ( element );
            nextElement ();
        }

        image.src = href;
    }

    nextElement ();
}

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

        embedImages ( ReactDomServer.renderToStaticMarkup ( element ), ( svg ) => {

            const svgBlob   = new Blob ([ svg ], { type: 'image/svg+xml' });
            const svgURL    = URL.createObjectURL ( svgBlob );

            const image     = new Image ();
            image.width     = width;
            image.height    = height;

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

            image.onerror = () => {
                console.log ( 'ERROR LOADING SVG:' );
                const xmlDoc = new DOMParser ().parseFromString ( svg, 'text/xml' );
                if ( xmlDoc.getElementsByTagName ( 'parsererror' ).length > 0 ) {
                    console.log ( checkErrorXML ( xmlDoc.getElementsByTagName ( 'parsererror' )[ 0 ]));
                }
                console.log ( '' )
                console.log ( svg );
            }

            image.src = svgURL;
        });
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
