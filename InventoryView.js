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

import zoom from './assets/zoom.png';

import './InventoryView.css';

//================================================================//
// InventoryView
//================================================================//
export const InventoryView = observer (( props ) => {

    const [ zoomedAsset, setZoomedAsset ]   = useState ( false );

    const controller    = props.controller;
    const inventory     = controller.inventory;
    const assetArray    = controller.sortedAssets || inventory.availableAssetsArray;
    const zoom          = controller.zoom || 1;

    const onClickZoom = ( asset, event ) => {
        setZoomedAsset ( asset );
        event.stopPropagation ();
    }

    const onClickCard = ( asset, event ) => {

        if ( controller.enableSelecting ) {

            if ( controller.isSelected ( asset ) ) {
                controller.deselectAsset ( asset );
            }
            else {
                controller.selectAsset ( asset );
            }
        }
        else {
            onClickZoom ( asset, event );
        }
    }

    const sizers = {};
    for ( let docSizeName in inventory.docSizes ) {
        sizers [ docSizeName ] = (
            <AssetSizer
                inventory = { inventory }
                docSizeName = { docSizeName }
                scale = { zoom }
            />
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
                        border: `2px solid ${ color }`,
                        width: 'auto',
                    }}
                    onClick = {( event ) => { onClickCard ( asset, event )}}
                >
                    <AssetView
                        assetID = { asset.assetID }
                        inventory = { inventory }
                        inches = { true }
                        scale = { zoom }
                    />
                    <Modal
                        style = {{ height : 'auto' }}
                        size = 'small'
                        open = { asset === zoomedAsset }
                        onClose = {() => setZoomedAsset ( false )}
                    >
                        <Modal.Content>
                            <center>
                                <h3>Card Info</h3>
                                <Divider/>
                                <AssetView
                                    assetID = { asset.assetID }
                                    inventory = { inventory }
                                    inches = 'true'
                                    scale = '1.3'
                                />
                                <p>Asset ID: { asset.assetID }</p>
                            </center>
                        </Modal.Content>
                    </Modal>
                    <If condition = { controller.enableSelecting }>
                        <Icon name = 'circle' />
                        <Icon name = 'ellipsis horizontal'/>
                        <img className = 'zoom' src = { zoom } onClick = {( e ) => onClickZoom ( asset, e )}/>
                    </If>
                </Card>
            );
        }
        return assetLayoutCache [ i ];
    }

    return (
        <Fragment>
            <div key = { Object.keys (controller.selection).length } style = {{ display: 'none' }}/>
            <InfiniteScrollView 
                onGetCard       = { getAsset }
                sizers          = { sizers }
                onGetSizerName  = { getSizerName }
                totalCards      = { assetArray.length }
            />
        </Fragment>
    );
});