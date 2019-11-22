// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { AssetView }                                        from './AssetView';
import * as consts                                          from './consts';
// import { NavigationBar }                                    from './NavigationBar';
// import { AppStateService }                                  from './AppStateService';
// import { Service, useService }                              from './Service';
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
import { assert, excel, Service, SingleColumnContainerView, useService, util } from 'fgc';

//================================================================//
// InventoryViewController
//================================================================//
export class InventoryViewController extends Service {

    //----------------------------------------------------------------//
    compareForSort ( asset0, asset1 ) {

        if ( this.sortMode === consts.SORT_MODE.ALPHA_ATOZ ) {
            return asset0.type.localeCompare ( asset1.type );
        }
        return asset1.type.localeCompare ( asset0.type );
    }

    //----------------------------------------------------------------//
    constructor ( inventory ) {
        super ();

        this.inventory = inventory;

        extendObservable ( this, {
            layoutName:     consts.WEB_LAYOUT,
            sortMode:       consts.SORT_MODE.ALPHA_ATOZ,
            zoom:          consts.DEFAULT_ZOOM,
        });
    }

    //----------------------------------------------------------------//
    isPrintLayout () {
        return consts.isPrintLayout ( this.layoutName );
    }

    //----------------------------------------------------------------//
    @computed
    get sortedAssets () {

        let assetArray = this.inventory.availableAssetsArray;
        assetArray.sort (( asset0, asset1 ) => this.compareForSort ( asset0, asset1 ));
        return assetArray;
    }

    //----------------------------------------------------------------//
    @action
    setLayoutMode ( layoutName ) {

        this.layoutName = layoutName;
    }

    //----------------------------------------------------------------//
    @action
    setSortMode ( sortMode ) {

        this.sortMode = sortMode;
    }

    //----------------------------------------------------------------//
    @action
    setZoom ( zoom ) {

        this.zoom = zoom;
    }
}
