// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, Service, util } from 'fgc';

import { AssetLayout }                          from './AssetLayout';
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
    @observable assetLayouts    = {};
    @observable schema          = new Schema (); // empty schema
    @observable binding         = new Binding (); // empty binding

    //----------------------------------------------------------------//
    composeAssetContext ( asset, filters, overrideContext ) {

        let context = {};

        for ( let fieldName in asset.fields ) {

            const field = asset.fields [ fieldName ];
            const alternates = field.alternates;

            context [ fieldName ] = field.value;

            for ( let i in filters ) {
                const filter = filters [ i ];
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
        this.templates = {};
        this.layouts = {};
        this.fonts = {};
        this.icons = {};

        this.maxWidthInInches = 0;
        this.maxHeightInInches = 0;

        if ( accountID && nodeURL ) {
            this.fetchInventory ( nodeURL, accountID );
        }

        // if ( appState ) {
        //     observe ( appState, 'assetsUtilized', ( change ) => {
        //         console.log ( 'ASSETS UTILIZED DID CHANGE' );
        //         this.refreshBinding ();
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
        if ( !_.has ( this.assetLayouts, assetID )) {
            this.assetLayouts [ assetID ] = new AssetLayout ( this, assetID, [ 'EN', 'RGB' ]);
        }
        return this.assetLayouts [ assetID ];
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
    refreshAssetLayouts () {
        this.assetLayouts = {};
    }

    //----------------------------------------------------------------//
    @action
    refreshBinding ( schema, assets ) {

        this.schema = schema || this.schema;
        this.assets = assets || this.assets;

        const availableAssetsByID = this.availableAssetsByID;
        this.binding = this.schema.generateBinding ( availableAssetsByID );
    }

    //----------------------------------------------------------------//
    @action
    reset ( template, assets, inventory ) {

        this.loading = true;

        if ( template ) {
            this.update ([ template ], assets, inventory );
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

        this.maxWidthInInches = 0;
        this.maxHeightInInches = 0;

        for ( let template of templates ) {

            this.onProgress ( 'Applying Template' );
            await schema.applyTemplate ( template );

            this.onProgress ( 'Compiling Layouts' );
            for ( let layoutName in template.layouts ) {
                
                const layout = _.cloneDeep ( template.layouts [ layoutName ]);

                const widthInInches = layout.width / layout.dpi;
                const heightInInches = layout.height / layout.dpi;

                this.maxWidthInInches = ( this.maxWidthInInches > widthInInches ) ? this.maxWidthInInches : widthInInches;
                this.maxHeightInInches = ( this.maxHeightInInches > heightInInches ) ? this.maxHeightInInches : heightInInches;

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

        // TODO: properly handle layout field alternatives; doing this here is a big, fat hack
        let assetsWithLayouts = {};
        for ( let assetID in assets ) {
            const asset = assets [ assetID ];
            if ( this.hasLayoutsForAsset ( asset )) {
                assetsWithLayouts [ assetID ] = asset;
            }
        }

        this.refreshAssetLayouts ();

        this.onProgress ( 'Refreshing Binding' );
        this.refreshBinding ( schema, assetsWithLayouts );
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
