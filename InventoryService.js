// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, Service, util } from 'fgc';

import { AssetLayout }                          from './AssetLayout';
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
    constructor ( onProgress ) {
        super ();

        // extendObservable ( this, {
        //     appState:   appState,
        // });

        this.onProgress = onProgress || (( message ) => { console.log ( message )});
        this.templates = {};
        this.layouts = {};
        this.fonts = {};
        this.icons = {};

        this.maxWidthInInches = 0;
        this.maxHeightInInches = 0;

        // if ( appState ) {
        //     this.fetchInventory ( appState.accountID, appState.node );
        // }

        // if ( appState ) {
        //     observe ( appState, 'assetsUtilized', ( change ) => {
        //         console.log ( 'ASSETS UTILIZED DID CHANGE' );
        //         this.refreshBinding ();
        //     });
        // }
    }

    //----------------------------------------------------------------//
    async fetchInventory ( accountID, minerURL ) {

        try {
            console.log ( 'FETCH INVENTORY', accountID, minerURL );

            this.onProgress ( 'Fetching Schema' );
            const schemaJSON        = await this.revocableFetchJSON ( minerURL + '/schemas', null, 20000 );
            console.log ( schemaJSON );

            this.onProgress ( 'Fetching Inventory' );
            const inventoryJSON     = await this.revocableFetchJSON ( minerURL + '/accounts/' + accountID + '/inventory', null, 20000 );
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
        this.finishLoading ();
    }

    //----------------------------------------------------------------//
    @action
    finishLoading () {
        this.loading = false;
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
        console.log ( 'REFRESH BINDING:', availableAssetsByID );
        this.binding = this.schema.generateBinding ( availableAssetsByID );
    }

    //----------------------------------------------------------------//
    @action
    reset ( template ) {

        this.loading = true;

        if ( template ) {
            this.update ([ template ]);
        }
    }

    //----------------------------------------------------------------//
    tokenizeLayoutNames ( layoutNameList ) {

        const LAYOUT_LIST_SEPARATOR_REGEX   = /[\s,]+/;
        return layoutNameList.split ( LAYOUT_LIST_SEPARATOR_REGEX );
    }

    //----------------------------------------------------------------//
    async update ( templates, assets ) {

        const fetchFont = async ( url ) => {
            if ( !url ) return false;

            const fetchOptions = {
                headers: {
                    'Content-Type': 'text/plain',
                },
            };

            const response  = await this.revocableFetch ( url, fetchOptions );
            const buffer    = await response.arrayBuffer ();
            return opentype.parse ( buffer );
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

                try {
                    const fontDesc = template.fonts [ name ];
                    const faces = {};

                    for ( let face in fontDesc ) {
                        const url = fontDesc [ face ];
                        console.log ( 'FETCHING FONT', name, face, url );
                        faces [ face ] = await fetchFont ( url );
                    }
                    this.fonts [ name ] = faces;
                }
                catch ( error ) {
                    console.log ( error );
                }
            }
        }

        if ( !assets ) {
            assets = {};
            for ( let typeName in schema.definitions ) {
                schema.addTestAsset ( assets, typeName );
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

        this.onProgress ( 'Refreshing Binding' );
        this.refreshBinding ( schema, assetsWithLayouts );
        this.refreshAssetLayouts ();
        this.finishLoading ();
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
