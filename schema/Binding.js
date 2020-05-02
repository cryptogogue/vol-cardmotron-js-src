/* eslint-disable no-whitespace-before-property */

import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';
import { Schema }           from './Schema';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';

//================================================================//
// Binding
//================================================================//
export class Binding {

    @observable methodBindingsByName        = {}
    @observable methodBindingsByAssetID     = {}
    @observable methodsByName               = {}

    //----------------------------------------------------------------//
    constructor ( schema, assets, primaryFilter, secondaryFilter ) {

        this.rebuild ( schema, assets, primaryFilter, secondaryFilter );
    }

    //----------------------------------------------------------------//
    getCraftingMethodBindings () {
        return this.methodBindingsByName;
    }

    //----------------------------------------------------------------//
    getCraftingMethodBindingsForAssetID ( assetID ) {
        return this.methodBindingsByAssetID [ assetID ];
    }

    //----------------------------------------------------------------//
    getMethodParamBindings ( methodName ) {

        return this.methodBindingsByName [ methodName ].paramBindings;
    }

    //----------------------------------------------------------------//
    methodIsValid ( methodName, assetID ) {

        if ( methodName == '' ) return false;

        if ( assetID ) {
            let methodBinding = this.methodBindingsByAssetID [ assetID ][ methodName ];
            return methodBinding ? methodBinding.valid : false;
        }
        return ( methodName in this.methodBindingsByName ) && this.methodBindingsByName [ methodName ].valid;
    }

    //----------------------------------------------------------------//
    @action
    rebuild ( schema, assets, primaryFilter, secondaryFilter ) {

        this.methodBindingsByName        = {};
        this.methodBindingsByAssetID     = {};
        this.methodsByName               = {};

        // generate all the empty method bindings.
        for ( let methodName in schema.methods ) {
            const method = schema.methods [ methodName ];
            this.methodsByName [ methodName ] = method;
            this.methodBindingsByName [ methodName ] = method.newBinding ();
        }

        // bind each asset and each method...
        for ( let assetID in assets ) {

            if ( primaryFilter && ( primaryFilter ( assetID ) === false )) continue;

            this.methodBindingsByAssetID [ assetID ] = {};

            for ( let methodName in this.methodsByName ) {

                this.methodsByName [ methodName ].bindAsset (
                    schema,
                    assets [ assetID ],
                    this.methodBindingsByName [ methodName ],
                    this.methodBindingsByAssetID [ assetID ]
                );
            }
        }

        // at this stage, assets are populated and linked to methods.
        // all methods and method params track assets that qualify.
        // now we have to iterate through all the methods and find out if they can be executed.
        for ( let methodName in this.methodsByName ) {

            // create a relationship if the asset qualifies.
            this.methodsByName [ methodName ].validate ( this.methodBindingsByName [ methodName ], secondaryFilter );
        }

        for ( let methodName in this.methodBindingsByName ) {

            // we'll need the method template (from the schema) *and* the binding
            const methodBinding = this.methodBindingsByName [ methodName ];

            // form fields, by name
            const paramBindings = {};

            // for each asset field, set the type and the list of qualified assets
            for ( let argname in methodBinding.assetIDsByArgName ) {

                const options = [];
                const assetIDsForArg = methodBinding.assetIDsByArgName [ argname ];
                for ( let i in assetIDsForArg ) {
                    const assetID = assetIDsForArg [ i ];
                    options.push ( assetID );
                }
                paramBindings [ argname ] = options;
            }

            methodBinding.paramBindings = paramBindings;
        }
    }

    //----------------------------------------------------------------//
    @computed get
    validMethods () {

        let methods = [];
        const bindingsByName = this.methodBindingsByName;
        for ( let name in bindingsByName ) {
            if ( bindingsByName [ name ].valid ) {
                methods.push ( name );
            }
        }
        return methods;
    }
}
