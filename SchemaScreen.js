// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import './EditorScreen.css';

import { AssetView }                                        from './AssetView';
import { EditorMenu }                                       from './EditorMenu';
import { InventoryService }                                 from './InventoryService';
import { InventoryPrintView }                               from './InventoryPrintView';
import { InventoryView }                                    from './InventoryView';
import { InventoryViewController }                          from './InventoryViewController';
import { ScannerReportModal }                               from './ScannerReportModal';
import { SchemaScannerXLSX }                                from './schema/SchemaScannerXLSX';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState, useRef }                from 'react';
import JSONTree                                             from 'react-json-tree';
import { Link }                                             from 'react-router-dom';
import { Button, Dropdown, Grid, Icon, List, Menu, Message, Modal, Segment } from 'semantic-ui-react';
import { assert, ClipboardMenuItem, excel, FilePickerMenuItem, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//================================================================//
// SchemaScreen
//================================================================//
export const SchemaScreen = observer (( props ) => {

    const [ scanner, setScanner ]                   = useState ( false );
    const [ schema, setSchema ]                     = useState ( false );

    const loadFile = ( picked ) => {

        setSchema ( false );
        const reader = new FileReader ();

        // reader.onabort = () => { console.log ( 'file reading was aborted' )}
        // reader.onerror = () => { console.log ( 'file reading has failed' )}
        reader.onload = () => {
            const book = new excel.Workbook ( reader.result, { type: 'binary' });
            if ( book ) {
                const scanner = new SchemaScannerXLSX ( book );
                setSchema ( scanner.schema );
                if ( scanner.hasMessages ()) {
                    setScanner ( scanner );
                }
            }
        }
        reader.readAsBinaryString ( picked );
    }

    return (
        <React.Fragment>

            <ScannerReportModal scanner = { scanner }/>

            <SingleColumnContainerView title = 'Load Schema'>
                <Menu>
                    <FilePickerMenuItem loadFile = { loadFile }/>

                    <Menu.Menu position = "right">
                        <ClipboardMenuItem
                            value = { schema ? JSON.stringify ( schema, null, 4 ) : false }
                        />
                    </Menu.Menu>
                </Menu>
            </SingleColumnContainerView>

            <If condition = { schema }>
                <JSONTree data = { schema }/>
            </If>

        </React.Fragment>
    );
});
