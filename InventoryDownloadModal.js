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

    const { options } = props;
    const controller = hooks.useFinalizable (() => new InventoryDownloadController ( options ));

    const onClose = () => {
        controller.cancel ();
        props.onClose ();
    }

    const singular = options.assets ? 'Asset' : 'Page';
    const plural = options.assets ? 'Assets' : 'Pages';

    return (
        <UI.Modal
            size = 'small'
            closeIcon
            onClose = {() => { onClose ()}}
            open = { true }
        >
            <UI.Modal.Header>{ `Download ${ plural }` }</UI.Modal.Header>
            
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
                                { controller.total > 1 ? `Rendered ${ controller.total } ${ plural }.` : `Rendered 1 ${ singular }.` }
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
                    disabled = { controller.saving || !controller.isDone }
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

    const { options, setOptions } = props;
    const [ counter, setCounter ] = useState ( 0 );

    const onClose = () => {
        setOptions ( false );
        setCounter ( counter + 1 );
    }

    return (
        <div key = { `${ counter }` }>
            <If condition = {( options !== false )}>
                <InventoryDownloadModalBody
                    options = { options }
                    onClose = { onClose }
                />
            </If>
        </div>
    );
});