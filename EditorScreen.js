// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import './EditorScreen.css';

import { AssetModal }                                       from './AssetModal';
import { AssetView }                                        from './AssetView';
import { EditorMenu }                                       from './EditorMenu';
import { InventoryController }                              from './InventoryController';
import { InventoryPrintController }                         from './InventoryPrintController';
import { InventoryPrintView }                               from './InventoryPrintView';
import { InventoryView }                                    from './InventoryView';
import { InventoryViewController }                          from './InventoryViewController';
import { ScannerReportModal }                               from './ScannerReportModal';
import { SchemaScannerXLSX }                                from './schema/SchemaScannerXLSX';
import KeyboardEventHandler                                 from 'react-keyboard-event-handler';
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

    const [ scanner, setScanner ]       = useState ( false );
    const inventory                     = hooks.useFinalizable (() => new InventoryController ());
    const controller                    = hooks.useFinalizable (() => new InventoryViewController ( inventory, false ));
    const printController               = hooks.useFinalizable (() => new InventoryPrintController ( controller ));

    const [ batchSelect, setBatchSelect ]           = useState ( false );
    const [ zoomedAssetID, setZoomedAssetID ]       = useState ( false );

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

    const onAssetSelect = ( asset, toggle ) => {
        controller.toggleAssetSelection ( asset );
    }

    const onAssetMagnify = ( asset ) => {
        setZoomedAssetID ( asset.assetID );
    }

    const onDeselect = () => {
        if ( !batchSelect ) {
            controller.clearSelection ();
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
                    controller          = { controller }
                    printController     = { printController}
                    loadFile            = { loadFile }
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
                                key = { printController.pages.length }
                                pages = { printController.pages }
                            />
                        </When>

                        <Otherwise>
                            <KeyboardEventHandler
                                handleKeys      = {[ 'shift', 'alt' ]}
                                handleEventType = 'keydown'
                                onKeyEvent      = {( key, e ) => {
                                    console.log ( 'DOWN' );
                                    setBatchSelect ( true );
                                }}
                            />
                            <KeyboardEventHandler
                                handleKeys      = {[ 'shift', 'alt' ]}
                                handleEventType = 'keyup'
                                onKeyEvent      = {( key, e ) => {
                                    console.log ( 'UP' );
                                    setBatchSelect ( false );
                                }}
                            />
                            <div style = {{ flex: 1 }}>
                                <InventoryView
                                    key         = { `${ controller.sortMode } ${ controller.zoom }` }
                                    controller  = { controller }
                                    onSelect    = { onAssetSelect }
                                    onMagnify   = { batchSelect ? undefined : onAssetMagnify }
                                    onDeselect  = { onDeselect }
                                />
                            </div>
                            <AssetModal
                                controller      = { controller }
                                assetID         = { zoomedAssetID }
                                onClose         = {() => { setZoomedAssetID ( false )}}
                            />
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
