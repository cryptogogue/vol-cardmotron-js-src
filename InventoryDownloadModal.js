// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import './EditorScreen.css';

import { InventoryDownloadController }                      from './InventoryDownloadController';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import * as UI                                              from 'semantic-ui-react';
import { hooks }                                            from 'fgc';

//================================================================//
// InventoryDownloadModalBody
//================================================================//
const InventoryDownloadModalBody = observer (( props ) => {

    const { inventory, assets, onClose } = props;
    const controller = hooks.useFinalizable (() => new InventoryDownloadController ( inventory, assets ));

    return (
        <UI.Modal
            size = 'small'
            closeIcon
            onClose = {() => { onClose ()}}
            open = {(( assets !== false ) && ( assets.length > 0 ))}
        >
            <UI.Modal.Header>Download Inventory</UI.Modal.Header>
            
            <UI.Modal.Content>
                <Choose>
                    <When condition = { controller.isDone }>
                        <UI.Message
                            icon
                            positive
                        >
                            <UI.Icon name = 'download'/>

                            <UI.Message.Content>
                                <UI.Message.Header>
                                    Your download is ready!
                                </UI.Message.Header>
                                { controller.total > 1 ? `Rendered ${ controller.total } Assets.` : 'Rendered 1 Asset.' }
                            </UI.Message.Content>

                        </UI.Message>
                    </When>

                    <Otherwise>
                        <UI.Progress progress percent = { controller.progress }/>
                    </Otherwise>
                </Choose>
            </UI.Modal.Content>

            <UI.Modal.Actions>
                <UI.Button
                    positive
                    disabled = { !controller.isDone }
                    onClick = {() => { controller.saveAsZip ()}}
                >
                    Download
                </UI.Button>
            </UI.Modal.Actions>

        </UI.Modal>
    );               
});

//================================================================//
// InventoryDownloadModal
//================================================================//
export const InventoryDownloadModal = observer (( props ) => {

    const { assets, setAssets } = props;
    const [ counter, setCounter ] = useState ( 0 );

    const onClose = () => {
        setCounter ( counter + 1 );
        setAssets ( false );
    }

    return (
        <div key = { `${ counter }` }>
            <If condition = {(( assets !== false ) && ( assets.length > 0 ))}>
            <InventoryDownloadModalBody
                { ...props }
                onClose = { onClose }
            />
            </If>
        </div>
    );
});