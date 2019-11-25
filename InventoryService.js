// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, Service, util } from 'fgc';

import { AssetLayout }                          from './AssetLayout';
import { AssetMetrics }                         from './AssetMetrics';
import * as consts                              from './consts';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { Binding }                              from './schema/Binding';
import { Schema }                               from './schema/Schema';
import { buildSchema, op, LAYOUT_COMMAND }      from './schema/SchemaBuilder';
import handlebars                               from 'handlebars';
import _                                        from 'lodash';
import * as opentype                            from 'opentype.js';

//================================================================//
// InventoryService
//================================================================//
export class InventoryService extends Service {

    @observable loading         = false;

    @observable assets          = {};
    @observable schema          = new Schema (); // empty schema
    @observable binding         = new Binding (); // empty binding

    @observable filters         = [ 'EN', 'RGB' ];

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
    constructor ( onProgress, nodeURL, accountID ) {
        super ();

        this.onProgress = onProgress || (( message ) => { console.log ( message )});

        this.layouts = {};
        this.fonts = {};
        this.icons = {};

        if ( accountID && nodeURL ) {
            this.fetchInventory ( nodeURL, accountID );
        }

        // if ( appState ) {
        //     observe ( appState, 'assetsUtilized', ( change ) => {
        //         console.log ( 'ASSETS UTILIZED DID CHANGE' );
        //         this.setAssets ();
        //     });
        // }
    }

    //----------------------------------------------------------------//
    async fetchInventory ( nodeURL, accountID ) {

        try {
            console.log ( 'FETCH INVENTORY', nodeURL, accountID );

            this.setLoading ( true );

            this.onProgress ( 'Fetching Schema' );
            const schemaJSON        = await this.revocableFetchJSON ( nodeURL + '/schemas', null, 20000 );
            console.log ( schemaJSON );

            this.onProgress ( 'Fetching Inventory' );
            const inventoryJSON     = await this.revocableFetchJSON ( nodeURL + '/accounts/' + accountID + '/inventory', null, 20000 );
            console.log ( inventoryJSON );

            let assets = {};
            for ( let asset of inventoryJSON.inventory ) {
                assets [ asset.assetID ] = asset;
            }
            await this.update ( schemaJSON.schemas, assets );
        }
        catch ( error ) {
            console.log ( error );
        }
        this.setLoading ( false );
    }

    //----------------------------------------------------------------//
    getAssetField ( asset, fieldName, fallback ) {

        return _.has ( asset.fields, fieldName ) ? asset.fields [ fieldName ].value : fallback;
    }

    //----------------------------------------------------------------//
    @action
    getAssetLayout ( assetID ) {
        if ( !_.has ( this.layoutCache, assetID )) {
            this.layoutCache [ assetID ] = new AssetLayout ( this, assetID, this.filters );
        }
        return this.layoutCache [ assetID ];
    }

    //----------------------------------------------------------------//
    getAssetMetrics ( assetID ) {

        return this.metrics [ assetID ];
    }

    //----------------------------------------------------------------//
    @computed
    get availableAssetsArray () {

        // TODO: get rid of appState
        const assetsUtilized = this.appState ? this.appState.assetsUtilized : [];

        let assets = [];
        for ( let assetID in this.assets ) {
            if ( !assetsUtilized.includes ( assetID )) {
                assets.push ( this.assets [ assetID ]);
            }
        }
        return assets;
    }

    //----------------------------------------------------------------//
    @computed
    get availableAssetsByID () {

        // TODO: get rid of appState
        const assetsUtilized = this.appState ? this.appState.assetsUtilized : [];

        let assets = {};
        for ( let assetID in this.assets ) {
            if ( !assetsUtilized.includes ( assetID )) {
                assets [ assetID ] = this.assets [ assetID ];
            }
        }
        return assets;
    }

    //----------------------------------------------------------------//
    getCraftingMethodBindings () {
        return this.binding.methodBindingsByName;
    }

    //----------------------------------------------------------------//
    getCraftingMethodBindingsForAssetID ( assetID ) {
        return this.binding.methodBindingsByAssetID [ assetID ];
    }

    //----------------------------------------------------------------//
    hasLayoutsForAsset ( asset ) {

        let layoutField = this.getAssetField ( asset, 'layout', '' );
        let layoutNames = this.tokenizeLayoutNames ( layoutField );

        for ( let layoutName of layoutNames ) {
            if ( _.has ( this.layouts, layoutName )) {
                return true;
            }
        }
        return false;
    }

    //----------------------------------------------------------------//
    methodIsValid ( methodName, assetID ) {
        return ( methodName !== '' ) && this.binding.methodIsValid ( methodName, assetID );
    }

    //----------------------------------------------------------------//
    @action
    reset ( template, assets, inventory ) {

        if ( !template ) return;

        this.loading = true;

        this.layouts = {};
        this.fonts = {};
        this.icons = {};

        this.update ([ template ], assets, inventory );
    }

    //----------------------------------------------------------------//
    @action
    setAssets ( schema, assets ) {

        assets = assets || {};

        // TODO: properly handle layout field alternatives; doing this here is a big, fat hack
        let assetsWithLayouts = {};
        for ( let assetID in assets ) {
            const asset = assets [ assetID ];
            if ( this.hasLayoutsForAsset ( asset )) {
                assetsWithLayouts [ assetID ] = asset;
            }
        }
        assets = assetsWithLayouts;

        this.schema = schema || this.schema;
        this.assets = assets || this.assets;

        const availableAssetsByID = this.availableAssetsByID;
        this.binding = this.schema.generateBinding ( availableAssetsByID );

        // empty the layout and metrics caches
        this.layoutCache = {};
        this.metricsCahe = {};

        // rebuild the docSizes and metrics
        this.docSizes = {};

        for ( let assetID in this.assets ) {
            const metrics = new AssetMetrics ( this, assetID );
            this.metrics [ assetID ] = metrics;
            const docSizeName = metrics.docSizeName;

            if ( !_.has ( this.docSizes, docSizeName )) {
                this.docSizes [ docSizeName ] = metrics.docSize;
            }
        }
    }

    //----------------------------------------------------------------//
    @action
    setLoading ( loading ) {
        this.loading = loading || false;
    }

    //----------------------------------------------------------------//
    tokenizeLayoutNames ( layoutNameList ) {

        const LAYOUT_LIST_SEPARATOR_REGEX   = /[\s,]+/;
        return layoutNameList.split ( LAYOUT_LIST_SEPARATOR_REGEX );
    }

    //----------------------------------------------------------------//
    async update ( templates, assets, inventory ) {

        const fetchFont = async ( url ) => {
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
                const response  = await this.revocableFetch ( url, fetchOptions );
                const buffer    = await response.arrayBuffer ();
                return opentype.parse ( buffer );
            }
            catch ( error ) {
                console.log ( 'FONT FETCH FAILED!', error );
                console.log ( 'Retrying with CORS proxy...' );
            }

            try {

                // TODO: warn if CORS proxy used (and worked)

                const response  = await this.revocableFetch ( consts.CORS_PROXY + url, fetchOptions );
                const buffer    = await response.arrayBuffer ();
                return opentype.parse ( buffer );
            }
            catch ( error ) {
                console.log ( 'FONT FETCH FAILED AGAIN!', error );
            }

            // TODO: report missing font

            return false;
        }

        const COMPILE_OPTIONS = {
            noEscape: true,
        }

        let schema = new Schema ();

        for ( let template of templates ) {

            this.onProgress ( 'Applying Template' );
            await schema.applyTemplate ( template );

            this.onProgress ( 'Compiling Layouts' );
            for ( let layoutName in template.layouts ) {
                
                const layout = _.cloneDeep ( template.layouts [ layoutName ]);

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
                this.layouts [ layoutName ] = layout;
            }

            for ( let iconName in template.icons ) {
                this.icons [ iconName ] = _.cloneDeep ( template.icons [ iconName ]);
            }

            this.onProgress ( 'Fetching Fonts' );
            for ( let name in template.fonts ) {

                const fontDesc = template.fonts [ name ];
                const faces = {};

                for ( let face in fontDesc ) {
                    const url = fontDesc [ face ];
                    console.log ( 'FETCHING FONT', name, face, url );
                    faces [ face ] = await fetchFont ( url );
                }
                this.fonts [ name ] = faces;
            }
        }

        if ( !( assets || inventory )) {
            inventory = {};
            for ( let typeName in schema.definitions ) {
                inventory [ typeName ] = 1;
            }
        }

        assets = assets || {};
        
        if ( inventory ) {
            for ( let typeName in inventory ) {
                const count = Number ( inventory [ typeName ]) || 0;
                for ( let i = 0; i < count; ++i ) {
                    schema.addTestAsset ( assets, typeName );
                }
            }
        }

        this.onProgress ( 'Refreshing Binding' );
        this.setAssets ( schema, assets );
        this.setLoading ( false );
    }

    //----------------------------------------------------------------//
    @computed get
    validMethods () {

        let methods = [];
        const bindingsByName = this.binding.methodBindingsByName;
        for ( let name in bindingsByName ) {
            if ( bindingsByName [ name ].valid ) {
                methods.push ( name );
            }
        }
        return methods;
    }
}
