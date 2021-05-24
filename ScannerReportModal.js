// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import './EditorScreen.css';

import { EditorMenu }                                       from './EditorMenu';
import { ScannerReportMessages }                            from './ScannerReportMessages';
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

    const { setScanner } = props;
    const scanner = props.scanner || false;

    if ( !scanner ) {
        return (<Fragment/>);
    }

    let count = scanner.errors.length + scanner.warnings.length;

    return (
        <Modal
            closeIcon
            size = 'small'
            open = { messages.length > 0 }
            onClose = {() => { setScanner ( false )}}
        >
            <Modal.Header>Found Schema Issues</Modal.Header>
            <Modal.Content>
                <ScannerReportMessages
                    errors      = { scanner.errors }
                    warnings    = { scanner.warnings }
                />
            </Modal.Content>
        </Modal>
    );               
});
