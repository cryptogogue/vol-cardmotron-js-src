// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, RevocableContext, util } from 'fgc';

import { AssetLayout }                          from './AssetLayout';
import { AssetLayoutController }                from './AssetLayoutController';
import { AssetMetrics }                         from './AssetMetrics';
import * as consts                              from './consts';
import { ProgressController }                   from 'fgc';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { Schema }                               from './schema/Schema';
import { buildSchema, op, LAYOUT_COMMAND }      from './schema/SchemaBuilder';
import handlebars                               from 'handlebars';
import _                                        from 'lodash';
import * as opentype                            from 'opentype.js';

//================================================================//
// InventoryController
//================================================================//
export class InventoryController {

    @observable schema              = new Schema (); // empty schema
    @observable layoutController    = new AssetLayoutController ();
    @observable primaries           = {};

    //----------------------------------------------------------------//
    @computed get
    assets () {

        return this.layoutController.assets; // assets with layouts
    }

    //----------------------------------------------------------------//
    @computed get
    availableAssetsArray () {

        return Object.values ( this.assets );
    }

    //----------------------------------------------------------------//
    constructor ( progressController ) {

        this.revocable = new RevocableContext ();
        this.progress = progressController || new ProgressController ( false );
    }

    //----------------------------------------------------------------//
    finalize () {

        this.revocable.finalize ();
    }
    //----------------------------------------------------------------//
    async reset ( template, assets, inventory ) {

        if ( !template ) return;

        this.progress.setLoading ( true );
        await this.update ( template, assets, inventory );
        this.progress.setLoading ( false );
    }

    //----------------------------------------------------------------//
    @action
    async update ( template, assets, inventory ) {

        await this.progress.onProgress ( 'Preparing Inventory' );

        assets = _.cloneDeep ( assets );

        for ( let assetID in assets ) {
            const asset = assets [ assetID ];

            const definition = template.definitions [ asset.type ];
            if ( !definition ) continue;

            for ( let fieldName in definition.fields ) {

                if ( !asset.fields [ fieldName ]) {

                    const field = definition.fields [ fieldName ];
                    asset.fields [ fieldName ] = {
                        type:   field.type,
                        value:  field.value,
                    };
                }
            }
        }

        const schema = new Schema ( template );

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

        const layoutController = new AssetLayoutController ();
        await layoutController.setSchema ( schema, this.progress );
        await layoutController.setAssets ( assets, this.progress );

        runInAction (() => {
            this.schema = schema;
            this.layoutController = layoutController;
        });
    }
}
