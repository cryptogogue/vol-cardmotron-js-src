// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import './EditorScreen.css';

import { AssetView }                                        from './AssetView';
import { EditorMenu }                                       from './EditorMenu';
import { InventoryController }                              from './InventoryController';
import { InventoryPrintView }                               from './InventoryPrintView';
import { InventoryView }                                    from './InventoryView';
import { InventoryViewController }                          from './InventoryViewController';
import { ScannerReportModal }                               from './ScannerReportModal';
import { SchemaScannerXLSX }                                from './schema/SchemaScannerXLSX';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Message, Modal, Loader }  from 'semantic-ui-react';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//================================================================//
// EditorScreen
//================================================================//
export const EditorScreen = observer (( props ) => {

    const [ scanner, setScanner ]                   = useState ( false );
    const inventory                                 = hooks.useFinalizable (() => new InventoryController ());
    const controller                                = hooks.useFinalizable (() => new InventoryViewController ( inventory ));

    const loadFile = ( binary ) => {

        const book = new excel.Workbook ( binary, { type: 'binary' });
        if ( book ) {
            const scanner = new SchemaScannerXLSX ( book );
            const schema = scanner.schema;
            inventory.reset ( schema, {}, scanner.inventory );
            controller.setRankDefinitions ( scanner.rankDefinitions );
            if ( scanner.hasMessages ) {
                setScanner ( scanner );
            }
        }
    }

    const hasAssets = (( inventory.progress.loading === false ) && ( inventory.availableAssetsArray.length > 0 ));
    const hasMessages = (( inventory.progress.loading === false ) && ( scanner && scanner.hasMessages ()));

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
                <ScannerReportModal scanner = { scanner }/>
            </If>

            <Choose>

                <When condition = { inventory.progress.loading }>
                    <Loader
                        active
                        inline = 'centered'
                        size = 'massive'
                        style = {{ marginTop:'5%' }}
                    >
                        { inventory.progress.message }
                    </Loader>
                </When>

                <When condition = { hasAssets }>
                    <Choose>
                        <When condition = { controller.isPrintLayout }>
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
                                    controller  = { controller }
                                />
                            </div>
                        </Otherwise>
                    </Choose>
                </When>

                <Otherwise>
                    <img 
                        src = { './cardmotron-png8.png' }
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
