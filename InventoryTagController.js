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
// InventoryTagController
//================================================================//
export class InventoryTagController {

    @observable tags                = { foo: false, bar: false, baz: false };
    @observable assetTags           = {};
    @observable filter              = '';

    //----------------------------------------------------------------//
    @action
    affirmTag ( tag ) {
    
        if (( tag.length > 0 ) && ( !_.has ( this.tags, tag ))) {
            this.tags [ tag ] = false;
        }
    }

    //----------------------------------------------------------------//
    constructor ( userID ) {
    }

    //----------------------------------------------------------------//
    countSelectedAssetsWithTag ( selection, tagName ) {

        let count = 0;

        for ( let assetID in selection ) {
            let tagsForAsset = this.assetTags [ assetID ];
            if ( tagsForAsset && ( tagsForAsset [ tagName ] === true )) {
                count++;
            }
        }
        return count;
    }

    //----------------------------------------------------------------//
    @action
    deleteTag ( tag ) {
    
        delete this.tags [ tag ];

        for ( let assetID in this.assetTags ) {
            const tagsForAsset = this.assetTags [ assetID ];
            delete tagsForAsset [ tag ];
        }
    }

    //----------------------------------------------------------------//
    finalize () {
    }

    //----------------------------------------------------------------//
    @computed
    get hasTags () {

        return Object.keys ( this.tags ).length !== 0;
    }

    //----------------------------------------------------------------//
    @computed
    get tagNames () {
        return Object.keys ( this.tags ).sort ();
    }

    //----------------------------------------------------------------//
    isAssetVisible ( assetID ) {

        if ( this.filter.length === 0 ) return true;

        const tagsForAsset = this.assetTags [ assetID ];
        if ( tagsForAsset && ( tagsForAsset [ this.filter ] === true )) {
            return true;
        }
        return false;
    }

    //----------------------------------------------------------------//
    isTagActive ( tagName ) {
        return this.tags [ tagName ] || false;
    }

    //----------------------------------------------------------------//
    @action
    setFilter ( filter ) {

        this.filter = filter;
    }

    //----------------------------------------------------------------//
    @action
    tagSelection ( selection, tagName, value ) {

        value = value || false;

        for ( let assetID in selection ) {

            // do this here to work around mobx
            if ( !_.has ( this.assetTags, assetID )) {
                this.assetTags [ assetID ] = {};
            }
            this.assetTags [ assetID ][ tagName ] = value;
        }
    }

    //----------------------------------------------------------------//
    @action
    toggleTag ( tagName ) {

        if ( _.has ( this.tags, tagName )) {
            this.tags [ tagName ] = !this.tags [ tagName ];
        }
    }
}
