/* eslint-disable no-whitespace-before-property */

import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';
import { MultiCounter }     from './MultiCounter';
import * as squap           from './Squap';

//================================================================//
// SchemaMethod
//================================================================//
export class SchemaMethod {

    //----------------------------------------------------------------//
    bindAsset ( schema, asset, methodBinding, methodBindingsForAssetByMethodName ) {

        let opArgs = {
            schema:     schema,
            assets:     [ asset ],
        }

        for ( let argname in this.assetArgs ) {

            if ( this.assetArgs [ argname ].eval ( opArgs )) {

                methodBinding.assetIDsByArgName [ argname ].push ( asset.assetID );
                methodBindingsForAssetByMethodName [ this.name ] = methodBinding;
            }
        }
    }

    //----------------------------------------------------------------//
    constructor ( name, template ) {

        //console.log ( 'SCHEMA METHOD:', name );

        this.name = name;
        this.assetArgs = {};
        this.constArgs = {};
        this.constraints = {};

        for ( let argname in template.assetArgs ) {
            this.assetArgs [ argname ] = squap.makeSquap ( template.assetArgs [ argname ]);
        }

        for ( let argname in template.constArgs ) {
            this.constArgs [ argname ] = squap.makeSquap ( template.constArgs [ argname ]);
        }

        this.weight     = template.weight;
        this.maturity   = template.maturity;

        // TODO: constraints
        //console.log ( this )
    }

    //----------------------------------------------------------------//
    newBinding () {

        let binding = {
            assetIDsByArgName: {},
            valid: false,
        };
        for ( let argname in this.assetArgs ) {
            binding.assetIDsByArgName [ argname ] = [];
        }
        return binding;
    }

    //----------------------------------------------------------------//
    validate ( methodBinding, filterAssets ) {

        const assetArgs = this.assetArgs;

        const nArgs = Object.keys ( assetArgs ).length;
        let multiCounter = new MultiCounter ( nArgs );
        let argListsByIndex = [];
        let argCount = 0;
        
        // build the tables and initialize the counter.
        for ( let argName in assetArgs ) {

            const argList = methodBinding.assetIDsByArgName [ argName ].filter ( filterAssets );
            if ( argList.length === 0 ) return; // bail; method can never be valid.

            multiCounter.setLimit ( argCount, argList.length );
            argListsByIndex.push ( argList );
            argCount++
        }

        // try every permutation of args until a valid configuration is found.
        for ( ; multiCounter.cycles < 1; multiCounter.increment ()) {

            let visitedAssetIDs = {}; // object to hold visited asset args.
            let passed = 0;

            for ( let i = 0; i < nArgs; ++i, ++passed ) {

                //const argname = indexedArgNames [ i ];
                const argList       = argListsByIndex [ i ];
                const assetID       = argList [ multiCounter.count ( i )];

                if ( visitedAssetIDs [ assetID ] === true ) break;
                visitedAssetIDs [ assetID ] = true;
            }

            if ( passed === nArgs ) {
                // TODO: evaluate constraints
                // TODO: this early out is a hack for now
                // console.log ( 'IT IS VALID!' );
                methodBinding.valid = true;
            }
        }
    }
}
