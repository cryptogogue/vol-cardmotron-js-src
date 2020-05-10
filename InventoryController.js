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
    @observable duplicates          = {};

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
    countDuplicates ( assetID ) {

        return this.primaries [ this.duplicates [ assetID ]].count;
    }

    //----------------------------------------------------------------//
    finalize () {

        this.revocable.finalize ();
    }

    //----------------------------------------------------------------//
    isPrimary ( assetID ) {

        return ( this.primaries [ assetID ] !== undefined );
    }

    //----------------------------------------------------------------//
    @action
    processDuplicates ( assets ) {

        // these are sets of metadata objects. each object contains the
        // primary asset itself along with the total number of duplicates and an
        // array of assetIDs.
        // bot sets share the same metadata entires and only represent different
        // ways of indexing them.
        this.primaries = {};
        this.duplicates = {};

        const isDuplicate = ( asset0, asset1 ) => {
            return (( asset0.type === asset1.type ) && _.isEqual ( asset0.fields, asset1.fields ));
        }

        const findPrimary = ( asset ) => {
            for ( let primaryID in this.primaries ) {
                const primary = this.primaries [ primaryID ];
                if ( isDuplicate ( asset, primary.asset )) return primary;
            }
            return false;
        }

        for ( let assetID in assets ) {
            const asset = assets [ assetID ];
            const primary = findPrimary ( asset );

            if ( primary === false ) {
                const newPrimary = {
                    asset: asset,
                    count: 1,
                    duplicates: [ asset ],
                }
                this.primaries [ assetID ] = newPrimary;
                this.duplicates [ assetID ] = asset.assetID;
            }
            else {
                primary.count = primary.count + 1;
                primary.duplicates.push ( asset );
                this.duplicates [ assetID ] = primary.asset.assetID;
            }
        }
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

        this.processDuplicates ( assets );

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
