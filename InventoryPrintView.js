// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { assert, util } from 'fgc';

import * as consts                                          from './consts';
import { AssetView }                                        from './AssetView';
import { InventoryPrintController }                         from './InventoryPrintController';
import { hooks }                                            from 'fgc';
import { action, computed, extendObservable, observable }   from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { useState }                                  from 'react';
import { Link }                                             from 'react-router-dom';
import { Dropdown, Grid, Icon, List, Menu, Card, Group, Modal, Divider } from 'semantic-ui-react';

//================================================================//
// InventoryPageView
//================================================================//
const InventoryPageView = ( props ) => {

    const { page } = props;

    return (
        <div style = {{
            width: `${ page.width / page.dpi }in`,
            height: `${ page.height / page.dpi }in`,
        }}>
            <img
                src     = { page.dataURL }
                width   = { page.width }
                height  = { page.height }
                style   = {{ width: '100%', height: '100%' }}
            />
        </div>
    );
}

//================================================================//
// InventoryPrintView
//================================================================//
export const InventoryPrintView = observer (( props ) => {

    const { pages } = props;

    const pageViews = [];
    for ( let i in pages ) {

        const page = pages [ i ];

        pageViews.push (
            <div
                className = 'page-break'
                key = { i }
            >
                <div style = {{
                    width: `${ page.width / page.dpi }in`,
                    height: `${ page.height / page.dpi }in`,
                }}>
                    <img
                        src     = { page.dataURL }
                        width   = { page.width }
                        height  = { page.height }
                        style   = {{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className = 'asset-wrapper'>
            <center>
                { pageViews }
            </center>
        </div>
    );
});