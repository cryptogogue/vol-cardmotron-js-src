/* eslint-disable no-whitespace-before-property */

import { InventoryDuplicatesController }    from '../InventoryDuplicatesController';
import { MethodBinding }                    from './MethodBinding';
import { MultiCounter }                     from './MultiCounter';
import { Schema }                           from './Schema';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';

//================================================================//
// Binding
//================================================================//
export class Binding {

    @observable methodBindingsByName        = {};
    @observable methodBindingsByAssetID     = {};
    @observable methodsByName               = {};

    //----------------------------------------------------------------//
    constructor () {
    }

    //----------------------------------------------------------------//
    methodIsValid ( methodName, assetID ) {

        if ( !methodName ) return false;

        if ( assetID ) {
            return _.has ( this.methodBindingsByAssetID, assetID ) && _.has ( this.methodBindingsByAssetID [ assetID ], methodName ) || false;
        }
        return _.has ( this.methodBindingsByName, methodName );
    }

    //----------------------------------------------------------------//
    @action
    processQueue ( state ) {

        if ( !state.busy ) return;

        const method = state.queue.shift ();
        const methodBinding = new MethodBinding ( state.schema, method );

        if ( methodBinding.rebuild ( state.assets, state.filter )) {

            state.methodBindingsByName [ method.name ] = methodBinding;

            const optionsByParamName = methodBinding.optionsByParamName;
            for ( let paramName in optionsByParamName ) {
                for ( let assetID of optionsByParamName [ paramName ]) {

                    const methodBindingsByName = state.methodBindingsByAssetID [ assetID ] || {};
                    methodBindingsByName [ method.name ] = methodBinding;
                    state.methodBindingsByAssetID [ assetID ] = methodBindingsByName;
                }
            } 
        }

        if ( state.queue.length > 0 ) {
            // setTimeout (() => { this.processQueue ( state )}, 10 );
            this.processQueue ( state );
        }
        else {
            state.busy = false;
        }
    }

    //----------------------------------------------------------------//
    @action
    rebuild ( schema, assets, filter ) {

        if ( this.state ) {
            this.state.busy = false;
            this.state = false;
        }

        this.schema = schema;
        this.assets = assets;

        this.methodBindingsByName       = {};
        this.methodBindingsByAssetID    = {};
        this.methodsByName              = {};

        // enqueue all the methods
        const queue = [];
        for ( let methodName in this.schema.methods ) {

            const method = this.schema.methods [ methodName ];
            const methodBinding = new MethodBinding ( this.schema, method );

            this.methodsByName [ methodName ] = method;
            queue.push ( method ); // push mobx proxy
        }

        if ( queue.length > 0 ) {
            this.state = {
                busy:                       true,
                queue:                      queue,
                schema:                     schema,
                assets:                     assets,
                filter:                     filter,
                methodBindingsByName:       this.methodBindingsByName,
                methodBindingsByAssetID:    this.methodBindingsByAssetID,
            };
            // setTimeout (() => { this.processQueue ( this.state )}, 10 );
            this.processQueue ( this.state );
        }
    }

    //----------------------------------------------------------------//
    @computed get
    validMethods () {

        return Object.values ( this.methodBindingsByName );
    }
}
