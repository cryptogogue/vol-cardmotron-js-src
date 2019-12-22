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
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//================================================================//
// ScannerReportModal
//================================================================//
export const ScannerReportModal = observer (( props ) => {

    const scanner = props.scanner || false;

    if ( !scanner ) {
        return (<Fragment/>);
    }

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
        <Modal
            style = {{ height : 'auto' }}
            size = "small"
            open = { hasMessages }
            onClose = {() => { setScanner ( false )}}
        >
            <Modal.Content>
                { messages }
            </Modal.Content>
        </Modal>
    );               
});
