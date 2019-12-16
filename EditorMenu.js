// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as consts                                          from './consts';
import * as inventoryMenuItems                              from './inventoryMenuItems';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { useState, useRef }                          from 'react';
import { Link }                                             from 'react-router-dom';
import { Button, Icon, Menu }                               from 'semantic-ui-react';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

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

    const onFilePickerChange = ( event ) => {
        event.stopPropagation ();
        const picked = event.target.files.length > 0 ? event.target.files [ 0 ] : false;
        if ( picked ) {
            setFile ( picked );
            if ( loadFile ) {
                loadFile ( picked );
            }
        }
    }

    const hasFile = ( file !== false );

    return (
        <Menu color = 'blue' inverted >

            <input
                key = { file ? file.name : ':file picker:' }
                style = {{ display:'none' }}
                ref = { filePickerRef }
                type = 'file'
                accept = '.xls, .xlsx'
                onChange = { onFilePickerChange }
            />

            <Menu.Item
                onClick = {() => filePickerRef.current.click ()}
            >
                <Icon name = 'folder open outline'/>
            </Menu.Item>

            <Menu.Item>
                <Button
                    disabled = { !hasFile }
                    onClick = {() => { loadFile && loadFile ( file )}}
                >
                    { hasFile ? file.name : 'No File Chosen' }
                </Button>
            </Menu.Item>

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
