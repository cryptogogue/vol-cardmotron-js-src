// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, InfiniteScrollView, util } from 'fgc';

import { AssetCardView }                                    from './AssetCardView';
import { AssetSizer }                                       from './AssetSizer';
import { Inventory }                                        from './Inventory';
import handlebars                                           from 'handlebars';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Card, Group, Modal, Divider } from 'semantic-ui-react';

import magnifyIcon from './assets/zoom.png';

import './InventoryView.css';

//================================================================//
// ControlledAssetCardView
//================================================================//
const ControlledAssetCardView = observer (( props ) => {

    const { assetID, controller } = props;

    const inventory             = controller.inventory;
    const assetArray            = controller.sortedAssets || inventory.assetsArray;
    const zoom                  = controller.zoom || 1;
    const renderAsync           = props.renderAsync || controller.renderAsync || false;

    return (
        <AssetCardView
            assetID         = { assetID }
            inventory       = { controller.inventory }
            zoom            = { zoom }
            onSelect        = { props.onSelect || false }
            onMagnify       = { props.onMagnify || false }
            onEllipsis      = { props.onEllipsis || false }
            count           = { controller.hideDuplicates ? controller.countDuplicates ( assetID ) : 1 }

            isSelected      = { props.isSelected ? props.isSelected ( assetID ) : controller.isSelected ( assetID )}
            disabled        = { props.isDisabled ? props.isDisabled ( assetID ) : controller.isDisabled ( assetID )}

            renderAsync     = { renderAsync }
        />
    );
});

//================================================================//
// InventoryView
//================================================================//
export const InventoryView = observer (( props ) => {

    const controller            = props.controller;
    const inventory             = controller.inventory;
    const schema                = inventory.schema;
    const assetArray            = controller.sortedAssets || inventory.assetsArray;
    const zoom                  = controller.zoom || 1;

    const onAssetEvent = ( handler, asset, event ) => {
        event.stopPropagation ();
        if ( handler ) {
            handler ( asset );
        }
    }

    const sizers = {};
    for ( let docSizeName in schema.docSizes ) {

        sizers [ docSizeName ] = (
            <Card
                style = {{
                    border:     `2px solid white`,
                    margin:     '1em',
                    padding:    '5px',
                }}
            >
                <AssetSizer
                    docSizes = { schema.docSizes }
                    docSizeName = { docSizeName }
                    scale = { zoom }
                />
            </Card>
        );
    }

    const getSizerName = ( i ) => {
        const asset = assetArray [ i ];
        const metrics = schema.getAssetDocSize ( asset );
        return metrics.docSizeName;
    }

    const getAsset = ( i ) => {
                    
        const assetID = assetArray [ i ].assetID;

        return (
            <ControlledAssetCardView
                { ...props }
                key             = { assetID }
                assetID         = { assetID }
                controller      = { controller }
                zoom            = { zoom }
                renderAsync     = { props.renderAsync }
            />
        );
    }

    return (
        <Fragment>
            <InfiniteScrollView
                onGetCard       = { getAsset }
                sizers          = { sizers }
                onGetSizerName  = { getSizerName }
                totalCards      = { assetArray.length }
                onClick         = { props.onDeselect }
            />
        </Fragment>
    );
});