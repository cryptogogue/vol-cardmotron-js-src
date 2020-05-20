// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as consts                                          from './consts';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Button, Checkbox, Dropdown, Grid, Icon, Input, List, Menu, Modal, Loader } from 'semantic-ui-react';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//----------------------------------------------------------------//
function getIconNameForSortMode ( sortMode ) {

    switch ( sortMode ) {
        case consts.SORT_MODE.ALPHA_ATOZ:           return 'sort alphabet down';
        case consts.SORT_MODE.ALPHA_ZTOA:           return 'sort alphabet up';
        case consts.SORT_MODE.RANK_DEFINITIONS:     return 'book';
    }
    return '';
}

//================================================================//
// SortModeFragment
//================================================================//
export const SortModeFragment = observer (( props ) => {

    const { controller } = props;

    return (
        <Dropdown
            item
            icon = { getIconNameForSortMode ( controller.sortMode )}
        >
            <Dropdown.Menu>
                <Dropdown.Item
                    icon        = { getIconNameForSortMode ( consts.SORT_MODE.ALPHA_ATOZ )}
                    onClick     = {() => { controller.setSortMode ( consts.SORT_MODE.ALPHA_ATOZ )}}
                />
                <Dropdown.Item
                    icon        = { getIconNameForSortMode ( consts.SORT_MODE.ALPHA_ZTOA )}
                    onClick     = {() => { controller.setSortMode ( consts.SORT_MODE.ALPHA_ZTOA )}}
                />
                <Dropdown.Item
                    icon        = { getIconNameForSortMode ( consts.SORT_MODE.RANK_DEFINITIONS )}
                    onClick     = {() => { controller.setSortMode ( consts.SORT_MODE.RANK_DEFINITIONS )}}
                />
            </Dropdown.Menu>
        </Dropdown>
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
            disabled = { controller.isPrintLayout }
        >
            <Dropdown.Menu>
                { zoomOptions }
            </Dropdown.Menu>
        </Dropdown>
    );
});
