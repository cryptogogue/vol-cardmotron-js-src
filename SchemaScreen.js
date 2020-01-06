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

    const loadFile = ( binary ) => {

        setSchema ( false );

        const book = new excel.Workbook ( binary, { type: 'binary' });
        if ( book ) {
            const scanner = new SchemaScannerXLSX ( book );
            setSchema ( scanner.schema );
            if ( scanner.hasMessages ()) {
                setScanner ( scanner );
            }
        }
    }

    return (
        <React.Fragment>

            <ScannerReportModal scanner = { scanner }/>

            <SingleColumnContainerView title = 'Load Schema'>
                <Menu>
                    <FilePickerMenuItem
                        loadFile = { loadFile }
                        format = 'binary'
                        accept = { '.xls, .xlsx' }
                    />
                    <Menu.Menu position = "right">
                        <ClipboardMenuItem
                            value = { schema ? JSON.stringify ( schema, null, 4 ) : false }
                        />
                    </Menu.Menu>
                </Menu>

                <If condition = { schema }>
                    <JSONTree data = { schema } theme = 'bright'/>
                </If>

            </SingleColumnContainerView>

        </React.Fragment>
    );
});
