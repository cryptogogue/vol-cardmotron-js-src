// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, util } from 'fgc';

import { AssetCardView }                                    from './AssetCardView';
import { AssetView }                                        from './AssetView';
import { AssetSizer }                                       from './AssetSizer';
import { InventoryController }                              from './InventoryController';
import handlebars                                           from 'handlebars';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Card, Group, Modal, Divider } from 'semantic-ui-react';

import magnifyIcon from './assets/zoom.png';

import './InventoryView.css';

//================================================================//
// ControlledAssetCardView
//================================================================//
const ControlledAssetCardView = observer (( props ) => {

    const { assetID, controller } = props;

    const inventory             = controller.inventory;
    const assetArray            = controller.sortedAssets || inventory.availableAssetsArray;
    const zoom                  = controller.zoom || 1;

    return (
        <AssetCardView
            assetID         = { assetID }
            inventory       = { controller.inventory }
            zoom            = { zoom }
            onSelect        = { props.onSelect || false }
            onMagnify       = { props.onMagnify || false }
            onEllipsis      = { props.onEllipsis || false }
            count           = { controller.hideDuplicates ? controller.countDuplicates ( assetID, controller.filterFunc ) : 1 }

            isSelected      = { props.isSelected ? props.isSelected ( assetID ) : controller.isSelected ( assetID )}
            disabled        = { props.isDisabled ? props.isDisabled ( assetID ) : false }
        />
    );
});

//================================================================//
// InventoryView
//================================================================//
export const InventoryView = observer (( props ) => {

    const controller            = props.controller;
    const inventory             = controller.inventory;
    const layoutController      = inventory.layoutController;
    const assetArray            = controller.sortedAssets || inventory.availableAssetsArray;
    const zoom                  = controller.zoom || 1;

    const onAssetEvent = ( handler, asset, event ) => {
        event.stopPropagation ();
        if ( handler ) {
            handler ( asset );
        }
    }

    const sizers = {};
    for ( let docSizeName in layoutController.docSizes ) {
        sizers [ docSizeName ] = (
            <Card
                style = {{
                    border:     `2px solid white`,
                    margin:     '1em',
                    padding:    '5px',
                }}
            >
                <AssetSizer
                    docSizes = { layoutController.docSizes }
                    docSizeName = { docSizeName }
                    scale = { zoom }
                />
            </Card>
        );
    }

    const getSizerName = ( i ) => {
        const assetID = assetArray [ i ].assetID;
        const metrics = layoutController.getAssetMetrics ( assetID );
        return metrics.docSizeName;
    }

    const assetLayoutCache = [];
    const getAsset = ( i ) => {
        
        if ( !assetLayoutCache.includes ( i )) {
            
            const assetID = assetArray [ i ].assetID;

            assetLayoutCache [ i ] = (
                <ControlledAssetCardView
                    { ...props }
                    key             = { assetID }
                    assetID         = { assetID }
                    controller      = { controller }
                    zoom            = { zoom }
                />
            );
        }
        return assetLayoutCache [ i ];
    }

    return (
        <Fragment>
            <InfiniteScrollView
                onGetCard       = { getAsset }
                sizers          = { sizers }
                onGetSizerName  = { getSizerName }
                totalCards      = { assetArray.length }
                onClick         = { props.onDeselect }
            />
        </Fragment>
    );
});