// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { AssetView }                                        from './AssetView';
import * as consts                                          from './consts';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import { computedFn }                                       from 'mobx-utils'
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//================================================================//
// InventoryViewController
//================================================================//
export class InventoryViewController {

    @observable layoutName          = consts.WEB_LAYOUT;
    @observable selection           = {};
    @observable sortMode            = consts.SORT_MODE.ALPHA_ATOZ;
    @observable rankDefinitions     = false;
    @observable zoom                = consts.DEFAULT_ZOOM;
    @observable hideDuplicates      = true;

    //----------------------------------------------------------------//
    @action
    clearSelection () {

        this.selection = {};
    }

    //----------------------------------------------------------------//
    compareForSort ( asset0, asset1 ) {

        const key0 = this.inventory.schema.getFriendlyNameForSort ( asset0 );
        const key1 = this.inventory.schema.getFriendlyNameForSort ( asset1 );

        switch ( this.sortMode ) {

            case consts.SORT_MODE.RANK_DEFINITIONS:

                if ( this.rankDefinitions ) {

                    const sort0 = this.rankDefinitions [ asset0.type ];
                    const sort1 = this.rankDefinitions [ asset1.type ];

                    if ( sort0 !== sort1 ) {
                        return sort0 < sort1 ? -1 : 1;
                    }
                }
                return asset0.type.localeCompare ( asset1.type );

            case consts.SORT_MODE.ALPHA_ZTOA:
                return key1.localeCompare ( key0 );

            default:
            case consts.SORT_MODE.ALPHA_ATOZ:
                return key0.localeCompare ( key1 );
        }
    }

    //----------------------------------------------------------------//
    constructor ( inventory ) {

        this.inventory = inventory;
    }

    //----------------------------------------------------------------//
    countDuplicates ( assetID, filterFunc ) {

        const primary = this.primaries [ this.duplicates [ assetID ]];
        
        let count = 0;
        for ( let duplicate of primary.duplicates ) {
            if ( filterFunc && !filterFunc ( duplicate.assetID )) continue;
            count++;
        }
        return count;
    }

    //----------------------------------------------------------------//
    @action
    deselectAsset ( asset ) {

        if ( this.hideDuplicates && this.isPrimary ( asset.assetID )) {
            const duplicates = this.primaries [ asset.assetID ].duplicates;
            for ( let duplicate of duplicates ) {
                delete this.selection [ duplicate.assetID ];
            }
        }
        else {
            delete this.selection [ asset.assetID ];
        }
    }

    //----------------------------------------------------------------//
    @computed get
    duplicates () {
    
        return this.duplicatesMeta.duplicates;
    }

    //----------------------------------------------------------------//
    @computed get
    duplicatesMeta () {

        // these are sets of metadata objects. each object contains the
        // primary asset itself along with the total number of duplicates and an
        // array of assetIDs.
        // bot sets share the same metadata entires and only represent different
        // ways of indexing them.
        const meta = {
            primaries: {},
            duplicates: {},
        };

        const isDuplicate = ( asset0, asset1 ) => {
            return (( asset0.type === asset1.type ) && _.isEqual ( asset0.fields, asset1.fields ));
        }

        const findPrimary = ( asset ) => {
            for ( let primaryID in meta.primaries ) {
                const primary = meta.primaries [ primaryID ];
                if ( isDuplicate ( asset, primary.asset )) return primary;
            }
            return false;
        }

        const assets = this.inventory.assets;
        for ( let assetID in assets ) {

            if ( this.filterFunc && !this.filterFunc ( assetID )) continue;

            const asset = assets [ assetID ];
            const primary = findPrimary ( asset );

            if ( primary === false ) {
                const newPrimary = {
                    asset: asset,
                    count: 1,
                    duplicates: [ asset ],
                }
                meta.primaries [ assetID ] = newPrimary;
                meta.duplicates [ assetID ] = asset.assetID;
            }
            else {
                primary.count = primary.count + 1;
                primary.duplicates.push ( asset );
                meta.duplicates [ assetID ] = primary.asset.assetID;
            }
        }

        return meta;
    }

    //----------------------------------------------------------------//
    finalize () {
    }

    //----------------------------------------------------------------//
    getDuplicateIDs ( assetID, filterFunc ) {

        const primary = this.primaries [ this.duplicates [ assetID ]];
        
        const duplicateIDs = [];
        for ( let duplicate of primary.duplicates ) {
            if ( filterFunc && !filterFunc ( duplicate.assetID )) continue;
            duplicateIDs.push ( duplicate.assetID );
        }
        return duplicateIDs;
    }

    //----------------------------------------------------------------//
    getSortedAssets ( hideDuplicates ) {

        const availableAssetArray = this.inventory.availableAssetsArray;
        let assetArray = availableAssetArray;

        if ( hideDuplicates || this.filterFunc ) {

            assetArray = [];

            for ( let asset of availableAssetArray ) {

                const isPrimary = (( this.layoutName == consts.WEB_LAYOUT ) && hideDuplicates ) ? this.isPrimary ( asset.assetID ) : true;
                const isVisible = this.filterFunc ? this.filterFunc ( asset.assetID ) : true;

                if ( isPrimary && isVisible ) {
                    assetArray.push ( asset );
                }
            }
        }

        assetArray.sort (( asset0, asset1 ) => this.compareForSort ( asset0, asset1 ));
        return assetArray;
    }

    //----------------------------------------------------------------//
    @computed
    get hasDuplicates () {

        return ( _.size ( this.duplicates ) > _.size ( this.primaries ));
    }

    //----------------------------------------------------------------//
    @computed
    get hasSelection () {

        return Object.keys ( this.selection ).length !== 0;
    }

    //----------------------------------------------------------------//
    isPrimary ( assetID ) {

        return ( this.primaries [ assetID ] !== undefined );
    }

    //----------------------------------------------------------------//
    @computed
    get isPrintLayout () {

        return consts.isPrintLayout ( this.layoutName );
    }

    //----------------------------------------------------------------//
    isSelected ( assetID ) {

        return ( this.selection [ assetID ] !== undefined );
    }

    //----------------------------------------------------------------//
    @computed get
    primaries () {
    
        return this.duplicatesMeta.primaries;
    }

    //----------------------------------------------------------------//
    @computed
    get selectionSize () {

        return Object.keys ( this.selection ).length;
    }

    //----------------------------------------------------------------//
    @computed
    get sortedAssets () {

        return this.getSortedAssets ( this.hideDuplicates );
    }

    //----------------------------------------------------------------//
    @action
    selectAsset ( asset ) {

        if ( this.hideDuplicates && this.isPrimary ( asset.assetID )) {
            const duplicates = this.primaries [ asset.assetID ].duplicates;
            for ( let duplicate of duplicates ) {
                this.selection [ duplicate.assetID ] = duplicate;
            }
        }
        else {
            this.selection [ asset.assetID ] = asset;
        }
    }

    //----------------------------------------------------------------//
    setFilterFunc ( filterFunc ) {

        this.filterFunc = filterFunc;
    }

    //----------------------------------------------------------------//
    @action
    setHideDuplicates ( hidden ) {

        this.hideDuplicates = hidden;
        if ( hidden ) {
            this.clearSelection ();
        }
    }

    //----------------------------------------------------------------//
    @action
    setLayoutMode ( layoutName ) {

        this.layoutName = layoutName;
    }

    //----------------------------------------------------------------//
    @action
    setRankDefinitions ( rankDefinitions ) {

        this.rankDefinitions = rankDefinitions || {};
    }

    //----------------------------------------------------------------//
    @action
    setSortMode ( sortMode ) {

        this.sortMode = ( this.sortMode === sortMode ) ? consts.SORT_MODE.RANK_DEFINITIONS : sortMode;
    }

    //----------------------------------------------------------------//
    @action
    setZoom ( zoom ) {

        this.zoom = zoom;
    }

    //----------------------------------------------------------------//
    @action
    toggleAssetSelection ( asset ) {

        if ( this.isSelected ( asset.assetID ) ) {
            this.deselectAsset ( asset );
        }
        else {
            this.selectAsset ( asset );
        }
    }
}
