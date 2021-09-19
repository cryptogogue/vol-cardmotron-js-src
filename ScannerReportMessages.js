// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import './EditorScreen.css';

import { EditorMenu }                                       from './EditorMenu';
import _                                                    from 'lodash';
import { action, computed, extendObservable, observable }   from "mobx";
import { observer }                                         from 'mobx-react';
import React, { Fragment, useState }                        from 'react';
import { Link }                                             from 'react-router-dom';
import * as UI                                              from 'semantic-ui-react';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';

//================================================================//
// ScannerReportMessages
//================================================================//
export const ScannerReportMessages = observer (( props ) => {

    const errors        = props.errors || [];
    const warnings      = props.warnings || [];

    const messages = [];
    let count = 0;

    for ( let message of errors ) {
        messages.push (
            <UI.Message visible icon negative key = { count++ }>
                <UI.Icon name = 'bug' />
                <UI.Message.Content>
                    <UI.Message.Header>{ message.header }</UI.Message.Header>
                    { message.body }
                </UI.Message.Content>
            </UI.Message>
        );
    }

    for ( let message of warnings ) {
        messages.push (
            <UI.Message visible icon warning key = { count++ }>
                <UI.Icon name = 'exclamation triangle' />
                <UI.Message.Content>
                    <UI.Message.Header>{ message.header }</UI.Message.Header>
                    { message.body }
                </UI.Message.Content>
            </UI.Message>
        );
    }

    return (
        <div>
            { messages }
        </div>
    );               
});
