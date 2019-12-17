// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { AssetView }                                        from './AssetView';
import * as consts                                          from './consts';
// import { NavigationBar }                                    from './NavigationBar';
// import { AppStateService }                                  from './AppStateService';
// import { InventoryService }                                 from './InventoryService';
// import * as util                                            from './util/util';
// import { InventoryPrintView, PRINT_LAYOUT }                 from './InventoryPrintView';
// import { InventoryView }                                    from './InventoryView';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { useState }                                  from 'react';
// import { Link }                                             from 'react-router-dom';
// import { Dropdown, Grid, Icon, List, Menu, Loader }         from 'semantic-ui-react';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//================================================================//
// InventoryViewController
//================================================================//
export class InventoryViewController {

    @observable layoutName          = consts.WEB_LAYOUT;
    @observable selection           = {};
    @observable sortMode            = consts.SORT_MODE.RANK_DEFINITIONS;
    // @observable tags                = { foo: false, bar: false, baz: false };
    @observable rankDefinitions     = false;
    @observable zoom                = consts.DEFAULT_ZOOM;

    // @observable assetTags           = {}; // TODO: this will move to inventory service after refactor
    // @observable filter              = '';

    // //----------------------------------------------------------------//
    // @action
    // affirmTag ( tag ) {
    
    //     if (( tag.length > 0 ) && ( !_.has ( this.tags, tag ))) {
    //         this.tags [ tag ] = false;
    //     }
    // }

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

    // //----------------------------------------------------------------//
    // countSelectedAssetsWithTag ( tagName ) {

    //     let count = 0;

    //     for ( let assetID in this.selection ) {
    //         let tagsForAsset = this.assetTags [ assetID ];
    //         if ( tagsForAsset && ( tagsForAsset [ tagName ] === true )) {
    //             count++;
    //         }
    //     }
    //     return count;
    // }

    // //----------------------------------------------------------------//
    // @action
    // deleteTag ( tag ) {
    
    //     delete this.tags [ tag ];
    // }

    //----------------------------------------------------------------//
    @action
    deselectAsset ( asset ) {

        delete this.selection [ asset.assetID ];
    }

    //----------------------------------------------------------------//
    finalize () {
    }

    //----------------------------------------------------------------//
    @computed
    get hasSelection () {

        return Object.keys ( this.selection ).length !== 0;
    }

    // //----------------------------------------------------------------//
    // @computed
    // get hasTags () {

    //     return Object.keys ( this.tags ).length !== 0;
    // }

    //----------------------------------------------------------------//
    @computed
    get isPrintLayout () {
        return consts.isPrintLayout ( this.layoutName );
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

        if ( this.filterFunc ) {

            assetArray = [];

            for ( let asset of availableAssetArray ) {
                if ( this.filterFunc ( asset.assetID )) {
                    assetArray.push ( asset );
                }
            }
        }

        assetArray.sort (( asset0, asset1 ) => this.compareForSort ( asset0, asset1 ));
        return assetArray;
    }

    // //----------------------------------------------------------------//
    // isTagActive ( tagName ) {
    //     return this.tags [ tagName ] || false;
    // }

    //----------------------------------------------------------------//
    isSelected ( asset ) {
        return _.has ( this.selection, asset.assetID );
    }

    //----------------------------------------------------------------//
    @action
    selectAsset ( asset ) {

        this.selection [ asset.assetID ] = asset;
    }

    // //----------------------------------------------------------------//
    // @action
    // setFilter ( filter ) {

    //     this.filter = filter;
    // }

    //----------------------------------------------------------------//
    setFilterFunc ( filterFunc ) {

        this.filterFunc = filterFunc;
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

    // //----------------------------------------------------------------//
    // @action
    // tagSelection ( tagName, value ) {

    //     value = value || false;

    //     for ( let assetID in this.selection ) {

    //         // do this here to work around mobx
    //         if ( !_.has ( this.assetTags, assetID )) {
    //             this.assetTags [ assetID ] = {};
    //         }
    //         this.assetTags [ assetID ][ tagName ] = value;
    //     }
    // }

    //----------------------------------------------------------------//
    @action
    toggleAssetSelection ( asset ) {

        if ( this.isSelected ( asset ) ) {
            this.deselectAsset ( asset );
        }
        else {
            this.selectAsset ( asset );
        }
    }

    // //----------------------------------------------------------------//
    // @action
    // toggleTag ( tagName ) {

    //     if ( _.has ( this.tags, tagName )) {
    //         this.tags [ tagName ] = !this.tags [ tagName ];
    //     }
    // }
}
