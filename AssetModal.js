// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, util } from 'fgc';

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

    const inventory     = props.inventory;
    const assetID       = props.assetID;
    const onClose       = props.onClose || false;

    const isOpen = (( typeof ( assetID ) === 'string' ) && ( assetID.length > 0 ));

    return (
        <Modal
            style = {{ height : 'auto' }}
            size = 'small'
            open = { isOpen }
            onClose = { onClose }
        >
            <Modal.Content>
                <center>
                    <h3>Card Info</h3>
                    <Divider/>
                    <AssetView
                        assetID = { assetID }
                        inventory = { inventory }
                        inches = 'true'
                    />
                    <p>Asset ID: { assetID }</p>
                </center>
            </Modal.Content>
        </Modal>
    );
});
