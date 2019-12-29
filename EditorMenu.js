// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as consts                                          from './consts';
import * as inventoryMenuItems                              from './inventoryMenuItems';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { useState, useRef }                          from 'react';
import { Link }                                             from 'react-router-dom';
import { Button, Icon, Menu }                               from 'semantic-ui-react';
import { assert, excel, FilePickerMenuItem, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//----------------------------------------------------------------//
function isPrintLayout ( pageType ) {
    return _.has ( consts.PAGE_TYPE, pageType );
}

//================================================================//
// EditorMenu
//================================================================//
export const EditorMenu = observer (( props ) => {

    const { controller, loadFile } = props;

    const [ file, setFile ]                 = useState ( false );
    const filePickerRef                     = useRef ();

    const hasFile = ( file !== false );

    return (
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

            <If condition = { controller.enableSelecting }>
                <Menu.Item>
                    <Icon name = 'tags' disabled = { !controller.hasSelection }/>
                </Menu.Item>
            </If>

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
    );
});
