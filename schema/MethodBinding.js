/* eslint-disable no-whitespace-before-property */

import { MultiCounter }     from './MultiCounter';
import { Schema }           from './Schema';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';

const PERMUTATIONS = false; // disabled; for future work.

//================================================================//
// Binding
//================================================================//
export class MethodBinding {

    @observable optionsByParamName = {};

    //----------------------------------------------------------------//
    checkOptions ( paramsByName, optionsByParamName ) {

        const constraints = this.method.constraints;

        // check the constraints
        for ( let constraint of constraints ) {
            if ( !constraint.eval ( paramsByName )) return false;
        }

        for ( let paramName in paramsByName ) {
            
            const asset = paramsByName [ paramName ];

            const options = optionsByParamName [ paramName ];
            if ( !options.includes ( asset.assetID )) {
                options.push ( asset.assetID );
            }
        }
        return true;
    }

    //----------------------------------------------------------------//
    checkParams ( assetParamsByName, constParamsByName ) {

        const schema = this.schema;
        const method = this.method;
        const constraints = method.constraints;

        const argsByParamName = {};

        const errorReport = {
            paramErrors:        {},
            constraintErrors:   0,
            totalErrors:        0,
        }

        let isComplete = true;
        for ( let paramName in assetParamsByName ) {            

            if ( assetParamsByName [ paramName ] === false ) {
                isComplete = false;
                continue;
            }

            const asset = this.assetsByAssetID [ assetParamsByName [ paramName ]];
            argsByParamName [ paramName ] = asset;

            if ( !method.assetArgs [ paramName ].qualifier.eval ({[ '' ]: asset })) {
                errorReport.paramErrors [ paramName ] = true;
                errorReport.totalErrors++;
            }
        }

        for ( let paramName in constParamsByName ) {

            const argDesc = method.constArgs [ paramName ];
            const param = constParamsByName [ paramName ];

            argsByParamName [ paramName ] = param;
            
            if ( !argDesc.qualifier.eval ({[ '' ]: param.value })) {
                errorReport.paramErrors [ paramName ] = true;
                errorReport.totalErrors++;
            }
        }

        // check the constraints
        if ( isComplete ) {
            for ( let constraint of constraints ) {
                if ( !constraint.eval ( argsByParamName )) {
                    errorReport.constraintErrors++;
                    errorReport.totalErrors++;
                }
            }
        }
        return errorReport.totalErrors ? errorReport : undefined;
    }

    //----------------------------------------------------------------//
    checkPermutations ( utilizedByParamName ) {

        const schema            = this.schema;
        const method            = this.method;
        const assetsByAssetID   = this.assetsByAssetID;
        const multiCounter      = this.multiCounter;

        const optionsByParamName = {};

        for ( let paramName of this.paramNamesByIndex ) {
            optionsByParamName [ paramName ] = [];
        }

        // try every permutation of args.
        multiCounter.reset ();
        for ( ; multiCounter.cycles < 1; multiCounter.increment ()) {

            const assetsUsed = {};
            const paramsByName = {};

            for ( let i = 0; i < multiCounter.size; ++i ) {

                const paramName = this.paramNamesByIndex [ i ];
                const paramList = this.paramListsByIndex [ i ];
                const assetID = paramList [ multiCounter.count ( i )];

                if ( assetsUsed [ assetID ] === true ) break;
                if ( utilizedByParamName && utilizedByParamName [ paramName ] && ( utilizedByParamName [ paramName ] !== assetID )) break;

                paramsByName [ paramName ] = assetsByAssetID [ assetID ];
                assetsUsed [ assetID ] = true;
            }

            if ( Object.keys ( paramsByName ).length !== multiCounter.size ) continue;

            // if no constraints and we found at least one permutation that works, we can early out.
            if ( method.constraints.length === 0 ) {
                return this.paramListsByName; // in this case, the unpermuted param lists *are* the options.
            }

            this.checkOptions ( paramsByName, optionsByParamName );
        }

        return optionsByParamName;
    }

    //----------------------------------------------------------------//
    constructor ( schema, method ) {

        this.schema = schema;
        this.method = method;
    }

    //----------------------------------------------------------------//
    getParamOptions ( paramName, utilizedByParamName ) {

        if ( utilizedByParamName ) {

            utilizedByParamName = _.cloneDeep ( utilizedByParamName );
            utilizedByParamName [ paramName ] = false;

            const options = ( PERMUTATIONS ? this.checkPermutations ( utilizedByParamName )[ paramName ] : this.optionsByParamName [ paramName ]) || [];
            const utilized = Object.values ( utilizedByParamName );

            return options.filter (( assetID ) => { return !utilized.includes ( assetID )});
        }
        return this.optionsByParamName [ paramName ] || [];
    }

    //----------------------------------------------------------------//
    @computed get
    isValid () {

        if ( !this.optionsByParamName ) return false;

        for ( let paramName in this.optionsByParamName ) {
            if ( this.optionsByParamName [ paramName ].length === 0 ) return false;
        }
        return true;
    }

    //----------------------------------------------------------------//
    @action
    rebuild ( assetsByAssetID, filter ) {

        this.optionsByParamName = false;
        this.assetsByAssetID = {};

        const schema        = this.schema;
        const method        = this.method;
        const assetArgs     = method.assetArgs;

        this.paramListsByName = {};

        // check every argument of method
        for ( let paramName in assetArgs ) {

            this.paramListsByName [ paramName ] = [];

            // check every asset
            const squap = assetArgs [ paramName ].qualifier; // arg qualifier
            for ( let assetID in assetsByAssetID ) {

                if ( filter && ( filter ( assetID ) === false )) continue;

                const asset = assetsByAssetID [ assetID ];
                if ( squap.eval ({[ 'this' ]: asset })) {
                    this.paramListsByName [ paramName ].push ( assetID ); // asset is qualified!
                    this.assetsByAssetID [ assetID ] = asset;
                }
            }
        }

        if ( PERMUTATIONS ) {

            this.paramNamesByIndex  = Object.keys ( assetArgs );
            this.paramListsByIndex  = [];
            this.multiCounter       = new MultiCounter ();

            for ( let paramName of this.paramNamesByIndex ) {

                const paramList = this.paramListsByName [ paramName ];
                if ( paramList.length === 0 ) return false;

                this.multiCounter.push ( paramList.length );
                this.paramListsByIndex.push ( paramList );
            }

            this.optionsByParamName = this.checkPermutations ();
        }
        else {

            this.optionsByParamName = this.paramListsByName; 
        }
        return this.isValid;
    }
}
