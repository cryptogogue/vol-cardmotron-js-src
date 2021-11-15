// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as consts                                          from './consts';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable, runInAction } from 'mobx';
import { observer }                                         from 'mobx-react';
import { computedFn }                                       from 'mobx-utils'
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, StorageContext, util } from 'fgc';

const STORE_INVENTORY_VIEW_PREFS        = '.cadmotron.inventoryViewPrefs';

//const debugLog = function () {}
const debugLog = function ( ...args ) { console.log ( '@INVENTORY VIEW:', ...args ); }

//================================================================//
// InventoryViewController
//================================================================//
export class InventoryViewController {

    @observable inventory           = false;
    @observable selection           = {};
    @observable rankDefinitions     = false;

    @computed get hideDuplicates    () { return this.prefs.hideDuplicates; }
    @computed get layoutName        () { return this.prefs.layoutName; }
    @computed get sortMode          () { return this.prefs.sortMode; }
    @computed get zoom              () { return this.prefs.zoom; }

    //----------------------------------------------------------------//
    @computed get
    assets () {

        return this.inventory ? this.inventory.assets : {};
    }

    //----------------------------------------------------------------//
    @computed get
    assetsArray () {

        return Object.values ( this.assets );
    }

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
    constructor ( inventory, hideDuplicates, persist, renderAsync ) {

        this.renderAsync = renderAsync || false;

        const prefs = {
            hideDuplicates:     hideDuplicates === undefined ? true : hideDuplicates,
            layoutName:         consts.WEB_LAYOUT,
            sortMode:           consts.SORT_MODE.ALPHA_ATOZ,
            zoom:               consts.DEFAULT_ZOOM,
        };

        this.storage = new StorageContext ();

        if ( persist ) {
            this.storage.persist ( this, 'prefs',   STORE_INVENTORY_VIEW_PREFS, prefs );
        }
        else {
            extendObservable ( this, {
                prefs: prefs,
            });
        }

        runInAction (() => {
            this.inventory      = inventory || false;
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

        const processAssets = ( assets, skipDisabled ) => {

            for ( let assetID in assets ) {

                if ( skipDisabled === this.inventory.isDisabled ( assetID )) continue;

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
        }

        processAssets ( this.assets, true );
        processAssets ( this.assets, false );

        return {
            primaries:      primaries,
            duplicates:     duplicates,
        }
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

        const availableAssetArray = this.assetsArray;
        let assetArray = availableAssetArray;

        if ( hideDuplicates && this.hasDuplicates ) {

            assetArray = [];

            for ( let assetID in this.duplicatesReport.primaries ) {
                assetArray.push ( this.assets [ assetID ]);
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
    isDisabled ( assetID ) {

        return this.inventory ? this.inventory.isDisabled ( assetID ) : false;
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
                if ( !this.inventory.isDisabled ( duplicate.assetID )) {
                    this.selection [ duplicate.assetID ] = duplicate;
                }
            }
        }
        else {
            this.selection [ asset.assetID ] = asset;
        }
    }

    //----------------------------------------------------------------//
    @action
    setHideDuplicates ( hidden ) {

        this.prefs.hideDuplicates = hidden;
        if ( hidden ) {
            this.clearSelection ();
        }
    }

    //----------------------------------------------------------------//
    @action
    setInventory ( inventory ) {

        this.inventory = inventory || false;
    }

    //----------------------------------------------------------------//
    @action
    setLayoutMode ( layoutName ) {

        this.prefs.layoutName = layoutName;
    }

    //----------------------------------------------------------------//
    @action
    setRankDefinitions ( rankDefinitions ) {

        this.rankDefinitions = rankDefinitions || {};
    }

    //----------------------------------------------------------------//
    @action
    setSortMode ( sortMode ) {

        this.prefs.sortMode = ( this.prefs.sortMode === sortMode ) ? consts.SORT_MODE.RANK_DEFINITIONS : sortMode;
    }

    //----------------------------------------------------------------//
    @action
    setZoom ( zoom ) {

        this.prefs.zoom = zoom;
    }

    //----------------------------------------------------------------//
    @action
    toggleAssetSelection ( asset ) {

        if ( this.isSelected ( asset.assetID )) {
            this.deselectAsset ( asset );
        }
        else {
            this.selectAsset ( asset );
        }
    }
}
