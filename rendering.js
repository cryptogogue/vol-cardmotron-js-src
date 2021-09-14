// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as changedpi                   from 'changedpi';
import CryptoJS                         from 'crypto-js';
import ReactDomServer                   from 'react-dom/server';

//const debugLog = function () {}
const debugLog = function ( ...args ) { console.log ( '@RENDERING:', ...args ); }

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
function findAllNodesByName ( xmlDoc, name ) {

    const results = [];

    const recurse = ( element ) => {

        if ( element.nodeName == name ) {
            results.push ( element );
            return;
        }

        const l = element.childNodes.length;
        for ( let i = 0; i < l; i++ ) {
            recurse ( element.childNodes [ i ]);
        }
    }

    recurse ( xmlDoc.firstChild );
    return results;
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
async function embedImagesAsync ( xmlDoc ) {

    const queue = findAllNodesByName ( xmlDoc, 'image' );

    for ( let element of queue ) {

        const attributes    = element.attributes;

        const width         = attributes.getNamedItem ( 'width' ).value;
        const height        = attributes.getNamedItem ( 'height' ).value;
        const href          = attributes.getNamedItem ( 'href' ).value;

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

            const hrefAttr = xmlDoc.createAttribute ( 'href' );
            hrefAttr.value = canvas.toDataURL ();

            attributes.removeNamedItem ( 'href' );
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
        const xmlDoc    = parseXML ( markup );

        await verifyXMLDocImagesAsync ( xmlDoc );
        await embedImagesAsync ( xmlDoc );

        const svg       = stringifyXML ( xmlDoc );
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

        return changedpi.changeDpiDataUrl ( canvas.toDataURL ( 'image/jpeg', 0.5 ), dpi );
    }
    catch ( error ) {

        if ( svgURL ) {
            URL.revokeObjectURL ( svgURL );
        }
        throw error;
    }
}

//----------------------------------------------------------------//
export async function verifyImagesAsync ( svg, searchPaths ) {

    const xmlDoc = parseXML ( svg );
    await verifyXMLDocImagesAsync ( xmlDoc, searchPaths );
    return stringifyXML ( xmlDoc );
}

//----------------------------------------------------------------//
export async function verifyXMLDocImagesAsync ( xmlDoc, searchPaths ) {

    const queue = findAllNodesByName ( xmlDoc, 'image' );

    for ( let element of queue ) {

        const attributes    = element.attributes;
        const sha256Attr    = attributes.getNamedItem ( 'data-sha256' );

        if ( !sha256Attr ) continue;

        const sha256        = sha256Attr.value;
        const href          = attributes.getNamedItem ( 'href' ).value;

        debugLog ( 'found an image element with data-sha256; checking hash against resource at URL.' );
        debugLog ( 'href', href );
        debugLog ( 'data-sha256', sha256 );

        try {
            const result        = await fetch ( href );
            const arrayBuffer   = await result.arrayBuffer ();
            const hash          = CryptoJS.SHA256 ( CryptoJS.lib.WordArray.create ( arrayBuffer )).toString ( CryptoJS.enc.Hex );

            debugLog ( '---------->', hash );

            if ( hash !== sha256 ) {
                debugLog ( 'svg image element hash did not match data-sha256; removing element.' );
                element.parentNode.removeChild ( element );
            }
        }
        catch ( error ) {
            console.log ( error );
            element.parentNode.removeChild ( element );
        }
    }

    return xmlDoc;
}
