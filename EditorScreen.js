// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import './EditorScreen.css';

import { AssetView }                                        from './AssetView';
import { EditorMenu }                                       from './EditorMenu';
import { InventoryService }                                 from './InventoryService';
import { InventoryPrintView }                               from './InventoryPrintView';
import { InventoryView }                                    from './InventoryView';
import { InventoryViewController }                          from './InventoryViewController';
import { SchemaScannerXLSX }                                from './schema/SchemaScannerXLSX';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Message, Modal, Loader }  from 'semantic-ui-react';
import { assert, excel, Service, SingleColumnContainerView, useService, util } from 'fgc';

//================================================================//
// ScannerReport
//================================================================//
export const ScannerReport = observer (( props ) => {

    const scanner = props.scanner;

    const messages = [];
    let count = 0;

    for ( let message of scanner.errors ) {
        messages.push (
            <Message icon negative key = { count++ }>
                <Icon name = 'bug' />
                <Message.Content>
                    <Message.Header>{ message.header }</Message.Header>
                    { message.body }
                </Message.Content>
            </Message>
        );
    }

    for ( let message of scanner.warnings ) {
        messages.push (
            <Message icon warning key = { count++ }>
                <Icon name = 'exclamation triangle' />
                <Message.Content>
                    <Message.Header>{ message.header }</Message.Header>
                    { message.body }
                </Message.Content>
            </Message>
        );
    }

    return (
        <Fragment>
            { messages }
        </Fragment>
    );
});

//================================================================//
// EditorScreen
//================================================================//
export const EditorScreen = observer (( props ) => {

    const [ progressMessage, setProgressMessage ]   = useState ( '' );
    const [ scanner, setScanner ]                   = useState ( false );
    const inventory                                 = useService (() => new InventoryService ( setProgressMessage ));
    const controller                                = useService (() => new InventoryViewController ( inventory ));

    const loadFile = ( picked ) => {

        const reader = new FileReader ();

        reader.onabort = () => { console.log ( 'file reading was aborted' )}
        reader.onerror = () => { console.log ( 'file reading has failed' )}
        reader.onload = () => {
            const book = new excel.Workbook ( reader.result, { type: 'binary' });
            if ( book ) {
                const scanner = new SchemaScannerXLSX ( book );
                const schema = scanner.schema;
                console.log ( schema );
                inventory.reset ( schema );
                if ( scanner.hasMessages ) {
                    setScanner ( scanner );
                }
            }
        }
        reader.readAsBinaryString ( picked );
    }

    const hasAssets = (( inventory.loading === false ) && ( inventory.availableAssetsArray.length > 0 ));
    const hasMessages = (( inventory.loading === false ) && ( scanner && scanner.hasMessages ()));

    return (
        <div style = {{
            display: 'flex',
            flexFlow: 'column',
            height: '100vh',
        }}>
            <div className = "no-print">
                <EditorMenu
                    controller = { controller }
                    loadFile = { loadFile }
                />
            </div>

            <If condition = { hasMessages }>
                <Modal
                    style = {{ height : 'auto' }}
                    size = "small"
                    open = { hasMessages }
                    onClose = {() => { setScanner ( false )}}
                >
                    <Modal.Content>
                        <ScannerReport scanner = { scanner }/>
                    </Modal.Content>
                </Modal>
            </If>

            <Choose>

                <When condition = { inventory.loading }>
                    <Loader
                        active
                        inline = 'centered'
                        size = 'massive'
                        style = {{ marginTop:'5%' }}
                    >
                        { progressMessage }
                    </Loader>
                </When>

                <When condition = { hasAssets }>
                    <Choose>
                        <When condition = { controller.isPrintLayout ()}>
                            <InventoryPrintView
                                key             = { controller.sortMode }
                                inventory       = { controller.inventory }
                                assetArray      = { controller.sortedAssets }
                                layoutName      = { controller.layoutName }
                            />
                        </When>
                        <Otherwise>
                            <div style = {{ flex: 1 }}>
                                <InventoryView
                                    key         = { `${ controller.sortMode } ${ controller.zoom }` }
                                    inventory   = { controller.inventory }
                                    assetArray  = { controller.sortedAssets }
                                    scale       = { controller.zoom }
                                />
                            </div>
                        </Otherwise>
                    </Choose>
                </When>

                <Otherwise>
                    <img 
                        src = { './cardmotron.png' }
                        style = {{
                            width: '100%',
                            height: 'auto',
                        }}
                    />
                </Otherwise>

            </Choose>
        </div>
    );
});
