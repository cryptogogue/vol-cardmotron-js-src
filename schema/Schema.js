/* eslint-disable no-whitespace-before-property */

import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';
import { Binding }          from './Binding';
import { SchemaMethod }     from './SchemaMethod';
import _                    from 'lodash';

//----------------------------------------------------------------//
function randChars ( characters, length ) {

    let result = '';
    length = length || 1;
    for ( let i = 0; i < length; ++i ) {
        result += characters.charAt ( Math.floor ( Math.random () * characters.length ));
    }
    return result;
}

//----------------------------------------------------------------//
function randomAssetID () {

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    return `${ randChars ( letters, 5 )}.${ randChars ( letters, 5 )}.${ randChars ( letters, 5 )}-${ randChars ( digits, 3 )}`;
}

//================================================================//
// Schema
//================================================================//
export class Schema {

    //----------------------------------------------------------------//
    addTestAsset ( assets, typeName, assetID ) {

        if ( !Boolean ( assetID )) {
            do {
                assetID = randomAssetID ();
            }
            while ( _.has ( assets, assetID ));
        }

        let asset = this.newAsset ( assetID, typeName );
        assert ( Boolean ( asset ));
        assets [ assetID ] = asset;

        return assetID;
    }

    //----------------------------------------------------------------//
    composeAssetContext ( asset, overrideContext ) {

        let context = {
            [ '@' ]: asset.type,
        };

        for ( let fieldName in asset.fields ) {

            const field = asset.fields [ fieldName ];
            const alternates = field.alternates;

            context [ fieldName ] = field.value;

            for ( let i in this.filters ) {
                const filter = this.filters [ i ];
                if ( _.has ( alternates, filter )) {
                    context [ fieldName ] = alternates [ filter ];
                }
            }
        }
        return Object.assign ( context, overrideContext );
    }

    //----------------------------------------------------------------//
    constructor ( json ) {

        this.definitions    = json ? _.cloneDeep ( json.definitions ) : {};
        this.fonts          = json ? _.cloneDeep ( json.fonts ) : {};
        this.icons          = json ? _.cloneDeep ( json.icons ) : {};
        this.layouts        = json ? _.cloneDeep ( json.layouts ) : {};
        this.upgrades       = json ? _.cloneDeep ( json.upgrades ) : {};

        this.methods = {};
            if ( json && json.methods ) {
            for ( let methodName in json.methods ) {
                this.methods [ methodName ] = new SchemaMethod ( methodName, json.methods [ methodName ]);
            }
        }
    }

    //----------------------------------------------------------------//
    generateBinding ( assets ) {

        console.log ( 'GENERATE BINDING', assets );

        let methodBindingsByAssetID     = {};
        let methodBindingsByName        = {};

        // generate all the empty method bindings.
        for ( let methodName in this.methods ) {
            methodBindingsByName [ methodName ] = this.methods [ methodName ].newBinding ();
        }

        // bind each asset and each method...
        for ( let assetID in assets ) {

            methodBindingsByAssetID [ assetID ] = {};

            for ( let methodName in this.methods ) {

                this.methods [ methodName ].bindAsset (
                    this,
                    assets [ assetID ],
                    methodBindingsByName [ methodName ],
                    methodBindingsByAssetID [ assetID ]
                );
            }
        }

        // at this stage, assets are populated and linked to methods.
        // all methods and method params track assets that qualify.
        // now we have to iterate through all the methods and find out if they can be executed.
        for ( let methodName in this.methods ) {

            console.log ( 'METHOD:', methodName );

            // create a relationship if the asset qualifies.
            this.methods [ methodName ].validate ( methodBindingsByName [ methodName ]);
        }

        return new Binding ( methodBindingsByName, methodBindingsByAssetID );
    }

    //----------------------------------------------------------------//
    getAssetField ( asset, fieldName, fallback ) {

        return _.has ( asset.fields, fieldName ) ? asset.fields [ fieldName ].value : fallback;
    }

    //----------------------------------------------------------------//
    getFriendlyNameForAsset ( asset ) {

        return asset.fields.name ? asset.fields.name.value : asset.assetID;
    }

    //----------------------------------------------------------------//
    getFriendlyNameForType ( type ) {

        const definition = this.definitions [ type ];
        return definition.fields.name ? definition.fields.name.value : type;
    }

    //----------------------------------------------------------------//
    getUpgradesForAsset ( asset ) {

        let type = asset.type;
        const upgrades = [ type ];
        while ( this.upgrades [ type ]) {
            const upgrade = this.upgrades [ type ];
            upgrades.push ( upgrade );
            type = upgrade;
        }
        return upgrades.length > 1 ? upgrades : false;
    }

    //----------------------------------------------------------------//
    newAsset ( assetID, typeName ) {

        let definition = this.definitions [ typeName ];
        assert ( Boolean ( definition ));

        let asset = {
            type:           typeName,
            assetID:        assetID,
            fields:         {},
            alternates:     {},
        };

        for ( let fieldName in definition.fields ) {
            let field = definition.fields [ fieldName ];
            asset.fields [ fieldName ] = {
                value:          field.value,
                alternates:     _.cloneDeep ( field.alternates ),
            }
        }
        return asset;
    }
}
