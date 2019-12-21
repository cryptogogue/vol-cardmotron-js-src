/* eslint-disable no-whitespace-before-property */
/* eslint-disable no-loop-func */

import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, storage, util } from 'fgc';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { parseSquap }                   from '../schema/parseSquap.js';
import { observer }                     from 'mobx-react';
import React, { useState }              from 'react';
import JSONTree                         from 'react-json-tree';
import { Button, Divider, Dropdown, Form, Grid, Header, Icon, Input, Modal, Segment } from 'semantic-ui-react';

//================================================================//
// SquapScreen
//================================================================//
export const SquapScreen = observer (( props ) => {

    const [ expression, setExpression ]     = useState ( '' );
    const [ error, setError ]               = useState ( false );
    const [ squap, setSquap ]               = useState ( false );

    const onTagInputKey = ( key ) => {
        if ( key === 'Enter' ) {
            try {
                setSquap ( parseSquap ( expression ));
                setError ( false );
            }
            catch ( err ) {
                setSquap ( false );
                setError ( err.message );
            }
        }
    }

    return (
        <React.Fragment>

            <SingleColumnContainerView title = 'Test Squap Parser'>
                <Segment stacked>
                    <Input
                        fluid
                        placeholder     = "Expression"
                        type            = "text"
                        value           = { expression }
                        onChange        = {( event ) => { setExpression ( event.target.value )}}
                        onKeyPress      = {( event ) => { onTagInputKey ( event.key )}}
                    />
                </Segment>
            </SingleColumnContainerView>

            <If condition = { squap }>
                <JSONTree data = { squap }/>
            </If>

            <If condition = { error }>
                <h3>{ error }</h3>
            </If>

        </React.Fragment>
    );
});
