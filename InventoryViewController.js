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
    @observable hideDuplicates      = false;

    //----------------------------------------------------------------//
    @action
    clearSelection () {

        this.selection = {};
    }

    //----------------------------------------------------------------//
    compareForSort ( asset0, asset1 ) {

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
                return asset1.type.localeCompare ( asset0.type );

            default:
            case consts.SORT_MODE.ALPHA_ATOZ:
                return asset0.type.localeCompare ( asset1.type );
        }

        if ( this.sortMode === consts.SORT_MODE.ALPHA_ATOZ ) {
            return asset0.type.localeCompare ( asset1.type );
        }
        return asset1.type.localeCompare ( asset0.type );
    }

    //----------------------------------------------------------------//
    constructor ( inventory ) {

        this.inventory = inventory;
    }

    //----------------------------------------------------------------//
    @action
    deselectAsset ( asset ) {

        if ( this.hideDuplicates && this.inventory.isPrimary ( asset.assetID )) {
            const duplicates = this.inventory.primaries [ asset.assetID ].duplicates;
            for ( let duplicate of duplicates ) {
                delete this.selection [ duplicate.assetID ];
            }
        }
        else {
            delete this.selection [ asset.assetID ];
        }
    }

    //----------------------------------------------------------------//
    finalize () {
    }

    //----------------------------------------------------------------//
    @computed
    get hasSelection () {

        return Object.keys ( this.selection ).length !== 0;
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
    @computed
    get selectionSize () {

        return Object.keys ( this.selection ).length;
    }

    //----------------------------------------------------------------//
    @computed
    get sortedAssets () {

        const availableAssetArray = this.inventory.availableAssetsArray;
        let assetArray = availableAssetArray;

        if ( this.hideDuplicates || this.filterFunc ) {

            assetArray = [];

            for ( let asset of availableAssetArray ) {

                const isPrimary = (( this.layoutName == consts.WEB_LAYOUT ) && this.hideDuplicates ) ? this.inventory.isPrimary ( asset.assetID ) : true;
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
    @action
    selectAsset ( asset ) {

        if ( this.hideDuplicates && this.inventory.isPrimary ( asset.assetID )) {
            const duplicates = this.inventory.primaries [ asset.assetID ].duplicates;
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
