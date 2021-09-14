import CryptoJS                                             from 'crypto-js';
import { assert, hooks, InfiniteScrollView, RevocableContext, SingleColumnContainerView, util } from 'fgc';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { observer }                                         from 'mobx-react';
import React, { useState, useRef, useLayoutEffect }         from 'react';
import * as UI                                              from 'semantic-ui-react';
import url                                                  from 'url';

//================================================================//
// HashUtilController
//================================================================//
class HashUtilController {

    @observable hash    = false;
    @observable isBusy  = false;

    //----------------------------------------------------------------//
    constructor () {
        this.revocable = new RevocableContext ();
    }

    //----------------------------------------------------------------//
    async fetchAndHashAsync ( nodeURL ) {

        this.setHash ( false );
        this.setBusy ( true );

        try {
            const result = await this.revocable.fetch ( nodeURL );
            const arrayBuffer = await result.arrayBuffer ();
            const hash = CryptoJS.SHA256 ( CryptoJS.lib.WordArray.create ( arrayBuffer )).toString ( CryptoJS.enc.Hex );
            this.setHash ( hash );
        }
        catch ( error ) {
            console.log ( '@HASH:', error );
        }

        this.setBusy ( false );
    }

    //----------------------------------------------------------------//
    finalize () {
        this.revocable.finalize ();
    }

    //----------------------------------------------------------------//
    @action setBusy ( busy ) {
        this.isBusy = busy;
    }

    //----------------------------------------------------------------//
    @action setHash ( hash ) {
        this.hash = hash;
    }
}

//================================================================//
// HashUtilScreen
//================================================================//
export const HashUtilScreen = observer (( props ) => {

    const controller                        = hooks.useFinalizable (() => new HashUtilController ());
    const [ resourceURL, setResourceURL ]   = useState ( '' );

    let onCheck = () => {
        controller.fetchAndHashAsync ( resourceURL );
    }

    const isBusy        = controller.isBusy;
    const testEnabled   = Boolean ( resourceURL );

    return (
        <SingleColumnContainerView title = 'Fetch and Hash Resources'>
            <UI.Segment>
                <UI.Form>
                    <p><span>Enter the URL of a resource then press </span><UI.Icon name = 'sync alternate'/><span>to hash:</span></p>
                    <UI.Form.Field>
                        <UI.Input
                            fluid
                            loading = { isBusy }
                            action = {
                                <If condition = { !isBusy }>
                                    <UI.Button
                                        icon = 'sync alternate'
                                        color = { testEnabled ? 'green' : 'grey' }
                                        disabled = { !testEnabled }
                                        onClick = { onCheck }
                                    />
                                </If>
                            }
                            placeholder     = "Resource URL"
                            name            = "resourceURL"
                            type            = "url"
                            value           = { resourceURL }
                            onChange        = {( event ) => { setResourceURL ( event.target.value )}}
                        />
                    </UI.Form.Field>

                    <If condition = { controller.hash }>
                        <UI.Form.TextArea
                            style = {{ fontFamily: 'monospace' }}
                            rows = { 4 }
                            name = 'hash'
                            value = { controller.hash }
                        />
                    </If>

                </UI.Form>
            </UI.Segment>
        </SingleColumnContainerView>
    );
});
