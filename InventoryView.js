// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, Service, util } from 'fgc';

import { AssetView }                                        from './AssetView';
import { AssetSizer }                                       from './AssetSizer';
import { InventoryService }                                 from './InventoryService';
import handlebars                                           from 'handlebars';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Card, Group, Modal, Divider } from 'semantic-ui-react';

import magnifyIcon from './assets/zoom.png';

import './InventoryView.css';

//================================================================//
// InventoryView
//================================================================//
export const InventoryView = observer (( props ) => {

    const onSelect      = props.onSelect || false;
    const onMagnify     = props.onMagnify || false;
    const onEllipsis    = props.onEllipsis || false;

    const controller    = props.controller;
    const inventory     = controller.inventory;
    const assetArray    = controller.sortedAssets || inventory.availableAssetsArray;
    const zoom          = controller.zoom || 1;

    const onAssetEvent = ( handler, asset, event ) => {
        event.stopPropagation ();
        if ( handler ) {
            handler ( asset );
        }
    }

    const sizers = {};
    for ( let docSizeName in inventory.docSizes ) {
        sizers [ docSizeName ] = (
            <Card
                style = {{
                    border:     `2px solid white`,
                    margin:     '1em',
                    padding:    '5px',
                }}
            >
                <AssetSizer
                    inventory = { inventory }
                    docSizeName = { docSizeName }
                    scale = { zoom }
                />
            </Card>
        ); 
    }

    const getSizerName = ( i ) => {
        const assetID = assetArray [ i ].assetID;
        const metrics = inventory.getAssetMetrics ( assetID );
        return metrics.docSizeName;
    }

    const assetLayoutCache = [];
    const getAsset = ( i ) => {
        
        if ( !assetLayoutCache.includes ( i )) {
            
            const asset = assetArray [ i ];
            const color = controller.isSelected ( asset ) ? 'red' : 'white';

            assetLayoutCache [ i ] = (
                <Card
                    key = { asset.assetID }
                    style = {{
                        border:     `2px solid ${ color }`,
                        margin:     '1em',
                        padding:    '5px',
                        width:      'auto',
                    }}
                    onClick = {( event ) => { onAssetEvent ( onSelect, asset, event )}}
                >
                    <AssetView
                        assetID = { asset.assetID }
                        inventory = { inventory }
                        inches = { true }
                        scale = { zoom }
                    />
                    <If condition = { onMagnify }>
                        <img className = 'zoom' src = { magnifyIcon } onClick = {( event ) => { onAssetEvent ( onMagnify, asset, event )}}/>
                    </If>
                    <If condition = { onEllipsis }>
                        <Icon name = 'circle' onClick = {( event ) => { onAssetEvent ( onEllipsis, asset, event )}}/>
                        <Icon name = 'ellipsis horizontal'/>
                    </If>
                </Card>
            );
        }
        return assetLayoutCache [ i ];
    }

    return (
        <Fragment>
            <div
                key = { Object.keys ( controller.selection ).length }
                style = {{ display: 'none' }}
            />
            <InfiniteScrollView 
                onGetCard       = { getAsset }
                sizers          = { sizers }
                onGetSizerName  = { getSizerName }
                totalCards      = { assetArray.length }
            />
        </Fragment>
    );
});