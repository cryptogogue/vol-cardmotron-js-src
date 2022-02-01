// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as consts                                          from './consts';
import { InventoryDownloadModal }                           from './InventoryDownloadModal';
import * as inventoryMenuItems                              from './inventoryMenuItems';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { useState, useRef }                          from 'react';
import { Link }                                             from 'react-router-dom';
import { Button, Icon, Menu }                               from 'semantic-ui-react';
import { FilePickerMenuItem }                               from 'fgc';

//----------------------------------------------------------------//
function isPrintLayout ( pageType ) {
    return _.has ( consts.PAGE_TYPE, pageType );
}

//================================================================//
// EditorMenu
//================================================================//
export const EditorMenu = observer (( props ) => {

    const { controller, printController, loadFile } = props;
    const [ downloadOptions, setDownloadOptions ] = useState ( false );
    const [ file, setFile ]                 = useState ( false );
    const filePickerRef                     = useRef ();

    const onClickDownload = () => {
        
        if ( controller.isPrintLayout ) {
            if ( printController.hasPages ) {
                setDownloadOptions ({
                    pages:  printController.pages,
                });
            }
        }
        else {
            const assets = controller.hasSelection ? Object.values ( controller.selection ) : controller.getSortedAssets ( false );
            if ( assets && ( assets.length > 0 )) {
                setDownloadOptions ({
                    assets:     assets,
                    inventory:  controller.inventory,
                });
            }
        }
    }

    const hasFile = ( file !== false );

    return (
        <React.Fragment>
            <Menu color = 'blue' inverted >

                <If condition = { loadFile }>
                    <FilePickerMenuItem
                        loadFile    = { loadFile }
                        format = 'binary'
                        accept = { '.xls, .xlsx' }
                    />
                </If>

                <inventoryMenuItems.SortModeFragment controller = { controller }/>
                <inventoryMenuItems.LayoutOptionsDropdown controller = { controller }/>
                <inventoryMenuItems.ZoomOptionsDropdown controller = { controller }/>

                <Menu.Item
                    name        = 'Download'
                    onClick     = { onClickDownload }
                    disabled    = { controller.isPrintLayout ? !printController.hasPages : controller.sortedAssets.length === 0 }
                >
                    <Icon name = 'download'/>
                </Menu.Item>

                <Menu.Menu position = "right">
                    <Menu.Item
                        name = "Print"
                        onClick = {() => { window.print ()}}
                        disabled = { !controller.isPrintLayout }
                    >
                        <Icon name = 'print'/>
                    </Menu.Item>
                    <Menu.Item
                        href = 'https://github.com/cryptogogue/vol-cardmotron-js#cardmotron'
                        target = '_blank'
                    >
                        Help
                    </Menu.Item>
                </Menu.Menu>
            </Menu>

            <InventoryDownloadModal
                options     = { downloadOptions }
                setOptions  = { setDownloadOptions }
            />
        </React.Fragment>
    );
});
