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
// InventoryCard
//================================================================//
const InventoryCard = observer (( props ) => {

    const [ toggle, setToggle ] = useState ( false );

    const {
        asset,
        controller,
        zoom,
    } = props;

    const inventory     = controller.inventory;

    const onSelect      = props.onSelect || false;
    const onMagnify     = props.onMagnify || false;
    const onEllipsis    = props.onEllipsis || false;

    const onClickCard = ( event ) => {
        event.stopPropagation ();
        setToggle ( !toggle );
        if ( onSelect ) {
            onSelect ( asset );
        }
    }

    const onClickOverlay = ( handler, event ) => {
        event.stopPropagation ();
        if ( handler ) {
            handler ( asset );
        }
    }

    const color = controller.isSelected ( asset ) ? 'cyan' : 'white';

    return (
        <Card
            key = { asset.assetID }
            style = {{
                border:             `2px solid ${ color }`,
                margin:             '1em',
                padding:            '5px',
                width:              'auto',
                backgroundColor:    color,
            }}
            onClick = { onClickCard }
        >
            <AssetView
                assetID = { asset.assetID }
                inventory = { inventory }
                inches = { true }
                scale = { zoom }
            />
            <If condition = { onMagnify }>
                <img className = 'zoom' src = { magnifyIcon } onClick = {( event ) => { onClickOverlay ( onMagnify, event )}}/>
            </If>
            <If condition = { onEllipsis }>
                <Icon name = 'circle' onClick = {( event ) => { onClickOverlay ( onEllipsis, event )}}/>
                <Icon name = 'ellipsis horizontal'/>
            </If>
        </Card>
    );
});

//================================================================//
// InventoryView
//================================================================//
export const InventoryView = observer (( props ) => {

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

            assetLayoutCache [ i ] = (
                <InventoryCard
                    key             = { asset.assetID }
                    asset           = { asset }
                    controller      = { controller }
                    zoom            = { zoom }
                    onSelect        = { props.onSelect || false }
                    onMagnify       = { props.onMagnify || false }
                    onEllipsis      = { props.onEllipsis || false }
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