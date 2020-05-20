// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, RevocableContext, util } from 'fgc';

import { AssetLayout }                          from './AssetLayout';
import { AssetMetrics }                         from './AssetMetrics';
import * as consts                              from './consts';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { Schema }                               from './schema/Schema';
import { buildSchema, op, LAYOUT_COMMAND }      from './schema/SchemaBuilder';
import handlebars                               from 'handlebars';
import _                                        from 'lodash';
import * as opentype                            from 'opentype.js';

//================================================================//
// AssetLayoutController
//================================================================//
export class AssetLayoutController {

    @observable filters         = [ 'EN', 'RGB' ]; // TODO: pass these in

    @observable assets          = {};
    @observable fonts           = {};
    @observable icons           = {};
    @observable layouts         = {};
    @observable layoutCache     = {};
    @observable metrics         = {};
    @observable docSizes        = {}; // common doc sizes in inches; used to generate sizers

    //----------------------------------------------------------------//
    composeAssetContext ( asset, overrideContext ) {

        let context = {
            [ '@' ]: asset.type,
        };

        for ( let fieldName in asset.fields ) {

            const field = asset.fields [ fieldName ];
            const alternates = field.alternates;

            context [ fieldName ] = field.value;

            for ( let i in this.filters ) {
                const filter = this.filters [ i ];
                if ( _.has ( alternates, filter )) {
                    context [ fieldName ] = alternates [ filter ];
                }
            }
        }
        return Object.assign ( context, overrideContext );
    }

    //----------------------------------------------------------------//
    constructor () {

        this.revocable = new RevocableContext ();
    }

    //----------------------------------------------------------------//
    async fetchFontAsync ( url ) {
        if ( !url ) return false;

        const fetchOptions = {
            headers: {
                'Content-Type': 'text/plain',
            },
        };

        // TODO: all this can be a bit smarter.
        // TODO: handle non-CORS HTTP error responses (400, 500)
        // TODO: use HEAD/OPTIONS to check for CORS?

        try {
            const response  = await this.revocable.fetch ( url, fetchOptions );
            const buffer    = await response.arrayBuffer ();
            return opentype.parse ( buffer );
        }
        catch ( error ) {
            console.log ( 'FONT FETCH FAILED!', error );
            console.log ( 'Retrying with CORS proxy...' );
        }

        try {

            // TODO: warn if CORS proxy used (and worked)

            const response  = await this.revocable.fetch ( consts.CORS_PROXY + url, fetchOptions );
            const buffer    = await response.arrayBuffer ();
            return opentype.parse ( buffer );
        }
        catch ( error ) {
            console.log ( 'FONT FETCH FAILED AGAIN!', error );
        }

        // TODO: report missing font

        return false;
    }

    //----------------------------------------------------------------//
    finalize () {

        this.revocable.finalize ();
    }

    //----------------------------------------------------------------//
    @action
    getAssetLayout ( assetID ) {

        if ( !_.has ( this.layoutCache, assetID )) {
            const asset = _.has ( this.assets, assetID ) ? this.assets [ assetID ] : this.schema.newAsset ( assetID, assetID );
            this.layoutCache [ assetID ] = new AssetLayout ( this, asset, this.filters );
        }
        return this.layoutCache [ assetID ];
    }

    //----------------------------------------------------------------//
    getAssetMetrics ( assetID ) {

        return this.metrics [ assetID ];
    }

    //----------------------------------------------------------------//
    hasLayoutsForAsset ( asset ) {

        let layoutField = this.schema.getAssetField ( asset, 'layout', '' );
        let layoutNames = this.tokenizeLayoutNames ( layoutField );

        for ( let layoutName of layoutNames ) {
            if ( _.has ( this.layouts, layoutName )) {
                return true;
            }
        }
        return false;
    }

    //----------------------------------------------------------------//
    @action
    setAssets ( assets ) {

        const schema = this.schema;

        // TODO: properly handle layout field alternatives; doing this here is a big, fat hack
        let assetsWithLayouts = {};
        for ( let assetID in assets ) {
            const asset = assets [ assetID ];
            if ( this.hasLayoutsForAsset ( asset )) {
                assetsWithLayouts [ assetID ] = asset;
            }
        }
        this.assets = assetsWithLayouts;

        // empty the layout and metrics caches
        this.layoutCache = {};
        this.metricsCahe = {};

        // rebuild the docSizes and metrics
        this.docSizes = {};

        for ( let assetID in this.assets ) {
            const asset = this.assets [ assetID ];
            const metrics = new AssetMetrics ( this, asset );
            this.metrics [ assetID ] = metrics;
            const docSizeName = metrics.docSizeName;

            if ( !_.has ( this.docSizes, docSizeName )) {
                this.docSizes [ docSizeName ] = metrics.docSize;
            }
        }
    }

    //----------------------------------------------------------------//
    @action
    async setSchema ( schema ) {

        this.schema         = schema;
        this.assets         = {};
        this.layouts        = {};
        this.layoutCache    = {};
        this.fonts          = {};
        this.icons          = {};
        this.metrics        = {};
        this.docSizes       = {};

        const COMPILE_OPTIONS = {
            noEscape: true,
        }

        const layouts = {};
        const fonts = {};

        for ( let layoutName in schema.layouts ) {
            
            const layout = _.cloneDeep ( schema.layouts [ layoutName ]);

            for ( let command of layout.commands ) {
                if ( command.type === LAYOUT_COMMAND.DRAW_TEXT_BOX ) {
                    for ( let segment of command.segments ) {
                        segment.template = handlebars.compile ( segment.template, COMPILE_OPTIONS );
                    }
                }
                else {
                    command.template = handlebars.compile ( command.template, COMPILE_OPTIONS );
                }
                command.wrap = command.wrap && handlebars.compile ( command.wrap, COMPILE_OPTIONS );
            }
            layout.wrap = layout.wrap && handlebars.compile ( layout.wrap, COMPILE_OPTIONS );
            layouts [ layoutName ] = layout;
        }

        for ( let name in schema.fonts ) {

            const fontDesc = schema.fonts [ name ];
            const faces = {};

            for ( let face in fontDesc ) {
                const url = fontDesc [ face ];
                console.log ( 'FETCHING FONT', name, face, url );
                faces [ face ] = await this.fetchFontAsync ( url );
            }
            fonts [ name ] = faces;
        }

        runInAction (() => {
            this.layouts    = layouts;
            this.fonts      = fonts;
            this.icons      = schema.icons;
        });
    }

    //----------------------------------------------------------------//
    tokenizeLayoutNames ( layoutNameList ) {

        const LAYOUT_LIST_SEPARATOR_REGEX   = /[\s,]+/;
        return layoutNameList.split ( LAYOUT_LIST_SEPARATOR_REGEX );
    }
}
