// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, RevocableContext, util } from 'fgc';

import { AssetLayout }                          from './AssetLayout';
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
    @observable assets              = {};

    //----------------------------------------------------------------//
    @computed get
    assetsArray () {

        return Object.values ( this.assets );
    }

    //----------------------------------------------------------------//
    constructor ( progressController ) {

        this.revocable = new RevocableContext ();
        this.progress = progressController || new ProgressController ( false );
    }

    //----------------------------------------------------------------//
    @action
    deleteAsset ( assetID ) {

        delete this.assets [ assetID ];
    }

    //----------------------------------------------------------------//
    finalize () {

        this.revocable.finalize ();
    }

    //----------------------------------------------------------------//
    async reset ( schema, assets, inventory ) {

        if ( !template ) return;

        this.progress.setLoading ( true );
        await this.update ( schema, assets, inventory );
        this.progress.setLoading ( false );
    }

    //----------------------------------------------------------------//
    @action
    setAsset ( asset ) {

        if ( !this.schema ) return;

        asset = this.schema.expandAsset ( asset );
        if ( asset && this.schema.hasLayoutsForAsset ( asset )) {
            this.assets [ asset.assetID ] = asset;
        }
    }

    //----------------------------------------------------------------//
    @action
    setAssets ( assets ) {

        this.assets = {};
        for ( let assetID in assets ) {
            this.setAsset ( assets [ assetID ]);
        }
    }

    //----------------------------------------------------------------//
    @action
    setSchema ( schema ) {

        this.schema = schema;
    }

    //----------------------------------------------------------------//
    @action
    async update ( schema, assets, inventory ) {

        await this.progress.onProgress ( 'Preparing Inventory' );

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

        this.setSchema ( schema );
        this.setAssets ( assets );
    }
}
