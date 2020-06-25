// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, util } from 'fgc';

import * as consts                                          from './consts';
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
// XML helpers
//================================================================//

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
function parseXML ( xml ) {

    const xmlDoc = new DOMParser ().parseFromString ( xml, 'text/xml' );
    if ( xmlDoc.getElementsByTagName ( 'parsererror' ).length > 0 ) {
        throw new Error ( checkErrorXML ( xmlDoc.getElementsByTagName ( 'parsererror' )[ 0 ]));
    }
    return xmlDoc;
}

//----------------------------------------------------------------//
function stringifyXML ( xmlDoc ) {

    return new XMLSerializer ().serializeToString ( xmlDoc );
}

//================================================================//
// rendering
//================================================================//

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
async function embedImagesAsync ( xmlDoc ) {

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

    for ( let element of queue ) {

        const attributes    = element.attributes;

        const width         = attributes.getNamedItem ( 'width' ).value;
        const height        = attributes.getNamedItem ( 'height' ).value;
        const href          = attributes.getNamedItem ( 'xlink:href' ).value;

        const image         = new Image ();
        image.width         = width;
        image.height        = height;
        image.crossOrigin   = 'anonymous';

        try {
            await loadImageAsync ( image, href );

            const canvas    = document.createElement ( 'canvas' );
            canvas.width    = width;
            canvas.height   = height;

            const ctx = canvas.getContext ( '2d' );
            ctx.drawImage ( image, 0, 0 );

            const hrefAttr = xmlDoc.createAttribute( 'href' );
            hrefAttr.value = canvas.toDataURL ();

            attributes.removeNamedItem ( 'xlink:href' );
            attributes.setNamedItem ( hrefAttr );
        }
        catch {
            element.parentNode.removeChild ( element );
        }
    }
    return xmlDoc;
}

//----------------------------------------------------------------//
export async function renderSVGAsync ( svgOrElement, width, height, dpi ) {

    let svgURL = false;

    try {

        const markup    = typeof ( svgOrElement ) === 'string' ? svgOrElement : ReactDomServer.renderToStaticMarkup ( svgOrElement );
        const svg       = stringifyXML ( await embedImagesAsync ( parseXML ( markup )));
        const svgBlob   = new Blob ([ svg ], { type: 'image/svg+xml' });
        svgURL          = URL.createObjectURL ( svgBlob );
        
        const image     = new Image ();
        image.width     = width;
        image.height    = height;

        await loadImageAsync ( image, svgURL );

        URL.revokeObjectURL ( svgURL );

        const canvas    = document.createElement ( 'canvas' );
        canvas.width    = width;
        canvas.height   = height;

        const ctx = canvas.getContext ( '2d' );
        ctx.drawImage ( image, 0, 0 );

        return changedpi.changeDpiDataUrl ( canvas.toDataURL (), dpi );
    }
    catch ( error ) {

        if ( svgURL ) {
            URL.revokeObjectURL ( svgURL );
        }
        throw error;
    }
}
