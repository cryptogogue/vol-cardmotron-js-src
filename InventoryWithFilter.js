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

export const INVENTORY_FILTER_STATUS = {
    HIDDEN:         'HIDDEN',
    DISABLED:       'DISABLED',
    VISIBLE:        'VISIBLE',
};

//================================================================//
// InventoryWithFilter
//================================================================//
export class InventoryWithFilter {

    @observable inventory           = false;
    @observable filterFunc          = false;

    //----------------------------------------------------------------//
    @computed get
    assets () {

        const filteredAssets = {};
        for ( let assetID in this.inventory.assets ) {
            if ( !this.isVisible ( assetID )) continue;
            filteredAssets [ assetID ] = this.inventory.assets [ assetID ];
        }
        return filteredAssets;
    }

    //----------------------------------------------------------------//
    @computed get
    assetsArray () {

        return Object.values ( this.assets );
    }

    //----------------------------------------------------------------//
    constructor ( inventory, filterFunc ) {

        runInAction (() => {
            this.inventory      = inventory;
            this.filterFunc     = filterFunc;
        });
    }

    //----------------------------------------------------------------//
    isDisabled ( assetID ) {

        const status = this.filterFunc ? this.filterFunc ( assetID ) : false;
        if ( typeof ( status ) === 'boolean' ) return false;
        return status === INVENTORY_FILTER_STATUS.DISABLED;
    }

    //----------------------------------------------------------------//
    isVisible ( assetID ) {

        const status = this.filterFunc ? this.filterFunc ( assetID ) : true;
        if ( typeof ( status ) === 'boolean' ) return status;
        return status !== INVENTORY_FILTER_STATUS.HIDDEN;
    }

    //----------------------------------------------------------------//
    @computed get
    rawAssets () {

        return this.inventory.assets;
    }

    //----------------------------------------------------------------//
    @computed get
    schema () {

        return this.inventory.schema;
    }
}
