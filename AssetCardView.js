// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { AssetView }                from './AssetView';
import _                            from 'lodash';
import { observer }                 from 'mobx-react';
import React, { useState }          from 'react';
import * as UI                      from 'semantic-ui-react';

import magnifyIcon from './assets/zoom.png';
import './InventoryView.css';

//================================================================//
// AssetCardView
//================================================================//
export const AssetCardView = observer (( props ) => {

    const [ toggle, setToggle ] = useState ( false );
    const { assetID, inventory } = props;

    const onSelect      = props.onSelect || false;
    const onMagnify     = props.onMagnify || false;
    const onEllipsis    = props.onEllipsis || false;

    const zoom          = props.zoom || 1.0;
    const disabled      = props.disabled || false;

    const asset         = inventory.assets [ assetID ];

    const onClickCard = ( event ) => {
        event.stopPropagation ();
        setToggle ( !toggle );
        if ( onSelect ) {
            onSelect ( asset, !toggle );
        }
    }

    const onClickOverlay = ( handler, event ) => {
        event.stopPropagation ();
        if ( handler ) {
            handler ( asset );
        }
    }

    const controller = props.controller || false;
    const isSelected = props.isSelected || controller && controller.isSelected ( asset ); // because mobX
    const color = isSelected ? 'cyan' : 'white';

    return (
        <UI.Card
            key = { assetID }
            style = {{
                border:             `2px solid ${ color }`,
                margin:             '1em',
                padding:            '5px',
                width:              'auto',
                backgroundColor:    color,
                opacity:            disabled ? 0.2 : 1.0,
            }}
            onClick = { props.disabled ? undefined : onClickCard }
        >
            <AssetView
                assetID = { assetID }
                inventory = { inventory }
                inches = { true }
                scale = { zoom }
            />
            <If condition = { onMagnify }>
                <img className = 'zoom' src = { magnifyIcon } onClick = {( event ) => { onClickOverlay ( onMagnify, event )}}/>
            </If>
            <If condition = { onEllipsis }>
                <UI.Icon name = 'circle' onClick = {( event ) => { onClickOverlay ( onEllipsis, event )}}/>
                <UI.Icon name = 'ellipsis horizontal'/>
            </If>
        </UI.Card>
    );
});
