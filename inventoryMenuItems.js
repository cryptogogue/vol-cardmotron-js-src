// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as consts                                          from './consts';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Button, Checkbox, Dropdown, Grid, Icon, Input, List, Menu, Modal, Loader } from 'semantic-ui-react';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

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
// SelectionTags
//================================================================//
export const SelectionTags = observer (( props ) => {

    const [ tagInput, setTagInput ]     = useState ( '' );
    const [ isOpen, setIsOpen ]         = useState ( false );

    const { controller, tags } = props;

    const onTagInputKey = ( key ) => {
        if ( key === 'Enter' ) {
            tags.affirmTag ( tagInput );
            setTagInput ( '' );
        }
    }

    const tagNames          = tags.tagNames;
    const selectionSize     = controller.selectionSize;

    let tagList = [];
    for ( let tagName of tagNames ) {

        const withTag           = tags.countSelectedAssetsWithTag ( controller.selection, tagName );
        const allTagged         = (( withTag > 0 ) && ( withTag === selectionSize ));
        const noneTagged        = (( withTag > 0 ) && ( withTag === 0 ));
        const indeterminate     = (( withTag > 0 ) && !( allTagged || noneTagged ));

        console.log ( 'TAGS', tagName, selectionSize, withTag, allTagged, noneTagged, indeterminate );

        tagList.push (
            <div
                key = { tagName }
            >
                <Checkbox
                    label           = { tagName }
                    checked         = { allTagged }
                    indeterminate   = { indeterminate }
                    disabled        = { selectionSize === 0 }
                    onChange        = {( event ) => {
                        tags.tagSelection ( controller.selection, tagName, !allTagged );
                        event.stopPropagation ();
                    }}
                />
                <Button
                    icon            = 'trash'
                    onClick         = {() => { tags.deleteTag ( tagName )}}
                />
            </div>
        );
    }

    // disabled = { !controller.hasSelection }

    return (
        <Menu.Item
            onClick = {() => { setIsOpen ( true )}}
        >
            <Icon name = 'tags'/>
            <Modal
                style = {{ height : 'auto' }}
                size = 'small'
                open = { isOpen }
                onClose = {() => {
                    controller.clearSelection ();
                    setIsOpen ( false )
                }}
            >
                <Modal.Content>
                    <div>
                        { tagList }
                        <Input
                            placeholder = 'New Tag...'
                            value = { tagInput }
                            onChange = {( event ) => { setTagInput ( event.target.value )}}
                            onKeyPress = {( event ) => { onTagInputKey ( event.key )}}
                        />
                    </div>
                </Modal.Content>
            </Modal>
        </Menu.Item>
    );
});

//================================================================//
// VisibilityDropdown
//================================================================//
export const VisibilityDropdown = observer (( props ) => {

    const { tags } = props;

    const tagNames = tags.tagNames;

    let options = [];

    options.push (
        <Dropdown.Item
            key         = { '' }
            icon        = 'eye'
            onClick     = {() => { tags.setFilter ( '' )}}
        />
    );

    for ( let tagName of tagNames ) {
        options.push (
            <Dropdown.Item
                key         = { tagName }
                text        = { tagName }
                onClick     = {() => { tags.setFilter ( tagName )}}
            />
        );
    }

    return (
        <Dropdown
            item
            icon = { tags.filter === '' ? 'eye' : null }
            text = { tags.filter }
        >
            <Dropdown.Menu>
                { options }
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
