// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { AssetView }                                        from './AssetView';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Card, Group, Modal, Divider } from 'semantic-ui-react';

import zoom from './assets/zoom.png';

//================================================================//
// AssetModal
//================================================================//
export const AssetModal = observer (( props ) => {

    const controller    = props.controller;
    const inventory     = props.inventory || controller && controller.inventory || false;
    const schema        = props.schema || inventory && inventory.schema || false;
    const asset         = props.asset || inventory && inventory.assets [ props.assetID ] || false;
    const assetID       = asset && asset.assetID;

    const isOpen        = (( typeof ( assetID ) === 'string' ) && ( assetID.length > 0 ));

    let formatAssetID   = props.formatAssetID || (( assetID ) => { return assetID; });

    let footer = formatAssetID ( assetID );
    if (( assetID !== false ) && controller && controller.hideDuplicates ) {

        footer = [];

        const duplicates = controller.getDuplicateIDs ( assetID );
        for ( let i = 0; i < duplicates.length; ++i ) {

            footer.push (
                <span key = { i }>
                    <span>{ formatAssetID ( duplicates [ i ])}</span>
                    <If condition = { i < ( duplicates.length - 1 )}>
                        <span>{ ', ' }</span>
                    </If>
                </span>
            );
        }
    }

    return (
        <Modal
            size        = 'small'
            style       = {{ height : 'auto' }}
            open        = { isOpen }
            onClose     = { props.onClose || false }
        >
            <Modal.Content>
                <center>
                    <h3>Card Info</h3>
                    <Divider/>
                    <AssetView
                        inches
                        schema          = { schema }
                        asset           = { asset }
                        renderAsync     = { props.renderAsync }
                    />
                    <p>{ footer }</p>
                </center>
            </Modal.Content>
        </Modal>
    );
});
