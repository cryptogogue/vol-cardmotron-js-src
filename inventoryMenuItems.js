// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as consts                                          from './consts';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Loader }         from 'semantic-ui-react';
import { assert, excel, Service, SingleColumnContainerView, useService, util } from 'fgc/export';

//================================================================//
// SortModeFragment
//================================================================//
export const SortModeFragment = observer (( props ) => {

    const { controller } = props;

    const onSortItemClick = ( event, { name }) => {
        controller.setSortMode ( name );
    }

    return (
        <Fragment>
            <Menu.Item name = { consts.SORT_MODE.ALPHA_ATOZ } active = { controller.sortMode === consts.SORT_MODE.ALPHA_ATOZ } onClick = { onSortItemClick }>
                <Icon name = 'sort alphabet up'/>
            </Menu.Item>

            <Menu.Item name = { consts.SORT_MODE.ALPHA_ZTOA } active = { controller.sortMode === consts.SORT_MODE.ALPHA_ZTOA } onClick = { onSortItemClick }>
                <Icon name = 'sort alphabet down'/>
            </Menu.Item>
        </Fragment>
    );
});

//================================================================//
// LayoutOptionsDropdown
//================================================================//
export const LayoutOptionsDropdown = observer (( props ) => {

    const { controller } = props;

    let layoutOptions = [];
    for ( let layoutName of consts.LAYOUT_DROPDOWN_OPTIONS ) {
        layoutOptions.push (
            <Dropdown.Item
                key         = { layoutName }
                text        = { consts.getFriendlyNameForLayout ( layoutName )}
                onClick     = {() => { controller.setLayoutMode ( layoutName )}}
            />
        );
    }

    return (
        <Dropdown item text = { consts.getFriendlyNameForLayout ( controller.layoutName )}>
            <Dropdown.Menu>
            { layoutOptions }
            </Dropdown.Menu>
        </Dropdown>
    );
});

//================================================================//
// ZoomOptionsDropdown
//================================================================//
export const ZoomOptionsDropdown = observer (( props ) => {

    const { controller } = props;

    let zoomOptions = [];
    for ( let zoom of consts.ZOOM_DROPDOWN_OPTIONS ) {
        zoomOptions.push (
            <Dropdown.Item
                key         = { zoom }
                text        = { consts.getFriendlyNameForZoom ( zoom )}
                onClick     = {() => { controller.setZoom ( zoom )}}
            />
        );
    }

    return (
        <Dropdown
            item
            text = { consts.getFriendlyNameForZoom ( controller.zoom )}
            disabled = { controller.isPrintLayout ()}
        >
            <Dropdown.Menu>
                { zoomOptions }
            </Dropdown.Menu>
        </Dropdown>
    );
});
