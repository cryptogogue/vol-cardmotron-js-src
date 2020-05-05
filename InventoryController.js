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
        this.progress = progressController || new ProgressController ();
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

        this.schema = new Schema ( template );
        this.layoutController = new AssetLayoutController ();

        this.progress.onProgress ( 'Building Layouts' );
        
        await this.layoutController.setSchema ( this.schema );

        this.progress.onProgress ( 'Setting Assets' );

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
        this.layoutController.setAssets ( assets );
    }
}
