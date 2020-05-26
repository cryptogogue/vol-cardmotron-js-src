// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { AssetView }                                        from './AssetView';
import * as consts                                          from './consts';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable, reaction } from 'mobx';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//================================================================//
// InventoryDuplicatesController
//================================================================//
export class InventoryDuplicatesController {

    @observable primaries           = {};
    @observable duplicates          = {};

    //----------------------------------------------------------------//
    @computed get
    assets () {

        const assets = {};
        for ( let assetID in this.primaries ) {
            assets [ assetID ] = this.primaries [ assetID ].asset;
        }
        return assets;
    }

    //----------------------------------------------------------------//
    constructor ( getAssetsFunc ) {

        this.cancelRebuildReaction = reaction (
            () => {
                return getAssetsFunc (); // gotta access the computed value *inside* the reaction query
            },
            ( params ) => {
                this.rebuild ( params );
            }
        );
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
    finalize () {

        this.cancelRebuildReaction && this.cancelRebuildReaction ();
    }

    //----------------------------------------------------------------//
    getDuplicateAssets ( assetID, filterFunc ) {

        const primary = this.primaries [ this.duplicates [ assetID ]];
        
        const duplicates = [];
        for ( let duplicate of primary.duplicates ) {
            if ( filterFunc && !filterFunc ( duplicate.assetID )) continue;
            duplicates.push ( duplicate );
        }
        return duplicates;
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
    @computed get
    hasDuplicates () {

        return ( _.size ( this.duplicates ) > _.size ( this.primaries ));
    }

    //----------------------------------------------------------------//
    isPrimary ( assetID ) {

        return ( this.primaries [ assetID ] !== undefined );
    }

    //----------------------------------------------------------------//
    @action
    rebuild ( assets, filterFunc ) {

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

        for ( let assetID in assets ) {

            if ( filterFunc && !filterFunc ( assetID )) continue;

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

        this.primaries = primaries;
        this.duplicates = duplicates;
    }
}
