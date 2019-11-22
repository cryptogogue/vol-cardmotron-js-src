// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, Service, util } from 'fgc';

import { AssetView }                                        from './AssetView';
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
    const scale         = controller.scale || 1;

    const onClickCard = ( asset ) => {

        if ( controller.isSelected ( asset ) ) {
            controller.deselectAsset ( asset );
        }
        else {
            controller.selectAsset ( asset );
        }
    }

    const onClickZoom = ( asset, e ) => {
        setZoomedAsset ( asset );
        e.stopPropagation ();
    }

    const assetLayoutCache = [];
    const getAsset = ( i, targetRef ) => {
        
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
                    onClick = {() => { onClickCard ( asset )}}
                >
                    <AssetView
                        assetId = { asset.assetID }
                        inventory = { inventory }
                        inches = { true }
                        scale = { scale }
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
                                    assetId = { asset.assetID }
                                    inventory = { inventory }
                                    inches = 'true'
                                    scale = '1.3'
                                />
                                <p>Asset ID: { asset.assetID }</p>
                            </center>
                        </Modal.Content>
                    </Modal>
                    <Icon name = 'circle' />
                    <Icon name = 'ellipsis horizontal'/>
                    <img className = 'zoom' src = { zoom } onClick = {( e ) => onClickZoom ( asset, e )}/>
                </Card>
            );
        }
        return assetLayoutCache [ i ];
    }

    return (
        <Fragment>
            <div key = { Object.keys (controller.selection).length } style = {{ display: 'none' }}/>
            <InfiniteScrollView 
                onGetAsset  = { getAsset }
                totalCards  = { assetArray.length }
            />
        </Fragment>
    );
});