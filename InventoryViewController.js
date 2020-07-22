// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as consts                                          from './consts';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable, runInAction } from 'mobx';
import { observer }                                         from 'mobx-react';
import { computedFn }                                       from 'mobx-utils'
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//================================================================//
// InventoryViewController
//================================================================//
export class InventoryViewController {

    @observable inventory           = false;
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
    constructor ( inventory, hideDuplicates ) {

        runInAction (() => {
            this.inventory = inventory || false;
            this.hideDuplicates = hideDuplicates === undefined ? true : hideDuplicates;
        })
    }

    //----------------------------------------------------------------//
    countDuplicates ( assetID ) {

        const report = this.duplicatesReport;
        const primary = report.primaries [ report.duplicates [ assetID ]];
        return primary.count;
    }

    //----------------------------------------------------------------//
    @action
    deselectAsset ( asset ) {

        if ( this.hideDuplicates && this.isPrimary ( asset.assetID )) {
            const duplicates = this.getDuplicateAssets ( asset.assetID );
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
    duplicatesReport () {

        const primaries = {};
        const duplicates = {};

        const isDuplicate = ( asset0, asset1 ) => {
            return (( asset0.type === asset1.type ) && _.isEqual ( asset0.fields, asset1.fields ));
        }

        const findPrimary = ( asset ) => {
            for ( let primaryID in primaries ) {
                const primary = primaries [ primaryID ];
                if ( isDuplicate ( asset, primary.asset )) return primary;
            }
            return false;
        }

        const assets = this.inventory.assets;
        for ( let assetID in assets ) {

            const asset = assets [ assetID ];
            const primary = findPrimary ( asset );

            if ( primary === false ) {
                const newPrimary = {
                    asset: asset,
                    count: 1,
                    duplicates: [ asset ],
                }
                primaries [ assetID ] = newPrimary;
                duplicates [ assetID ] = asset.assetID;
            }
            else {
                primary.count = primary.count + 1;
                primary.duplicates.push ( asset );
                duplicates [ assetID ] = primary.asset.assetID;
            }
        }

        return {
            primaries:      primaries,
            duplicates:     duplicates,
        }
    }

    //----------------------------------------------------------------//
    finalize () {
    }

    //----------------------------------------------------------------//
    getDuplicateAssets ( assetID ) {

        const report = this.duplicatesReport;
        const primary = report.primaries [ report.duplicates [ assetID ]];
        
        const duplicates = [];
        for ( let duplicate of primary.duplicates ) {
            duplicates.push ( duplicate );
        }
        return duplicates;
    }

    //----------------------------------------------------------------//
    getDuplicateIDs ( assetID, ) {

        const report = this.duplicatesReport;
        const primary = report.primaries [ report.duplicates [ assetID ]];
        
        const duplicateIDs = [];
        for ( let duplicate of primary.duplicates ) {
            duplicateIDs.push ( duplicate.assetID );
        }
        return duplicateIDs;
    }

    //----------------------------------------------------------------//
    getSortedAssets ( hideDuplicates ) {

        const availableAssetArray = this.inventory.assetsArray;
        let assetArray = availableAssetArray;

        if ( hideDuplicates && this.hasDuplicates ) {

            assetArray = [];

            for ( let assetID in this.duplicatesReport.primaries ) {
                assetArray.push ( this.inventory.assets [ assetID ]);
            }
        }

        assetArray.sort (( asset0, asset1 ) => this.compareForSort ( asset0, asset1 ));
        return assetArray;
    }

    //----------------------------------------------------------------//
    @computed get
    hasDuplicates () {

        const report = this.duplicatesReport;
        return ( _.size ( report.duplicates ) > _.size ( report.primaries ));
    }

    //----------------------------------------------------------------//
    @computed get
    hasSelection () {

        return Object.keys ( this.selection ).length !== 0;
    }

    //----------------------------------------------------------------//
    isPrimary ( assetID ) {

        return ( this.duplicatesReport.primaries [ assetID ] !== undefined );
    }

    //----------------------------------------------------------------//
    @computed get
    isPrintLayout () {

        return consts.isPrintLayout ( this.layoutName );
    }

    //----------------------------------------------------------------//
    isSelected ( assetID ) {

        return ( this.selection [ assetID ] !== undefined );
    }

    //----------------------------------------------------------------//
    @computed get
    selectionSize () {

        return Object.keys ( this.selection ).length;
    }

    //----------------------------------------------------------------//
    @computed get
    sortedAssets () {

        return this.getSortedAssets (( this.layoutName == consts.WEB_LAYOUT ) && this.hideDuplicates );
    }

    //----------------------------------------------------------------//
    @action
    selectAsset ( asset ) {

        if ( this.hideDuplicates && this.isPrimary ( asset.assetID )) {
            const duplicates = this.getDuplicateAssets ( asset.assetID );
            for ( let duplicate of duplicates ) {
                this.selection [ duplicate.assetID ] = duplicate;
            }
        }
        else {
            this.selection [ asset.assetID ] = asset;
        }
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
    setInventory ( inventory ) {

        this.inventory = inventory;
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
