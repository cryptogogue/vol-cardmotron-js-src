/* eslint-disable no-whitespace-before-property */

import { Binding }          from './Binding';
import * as squap           from './Squap';
import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, util } from 'fgc';
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

                const method = _.cloneDeep ( json.methods [ methodName ]);

                method.name = methodName;

                for ( let argname in method.assetArgs ) {
                    method.assetArgs [ argname ] = squap.makeSquap ( method.assetArgs [ argname ]);
                }

                for ( let argname in method.constArgs ) {
                    method.constArgs [ argname ] = squap.makeSquap ( method.constArgs [ argname ]);
                }

                for ( let i in method.constraints ) {
                    method.constraints [ i ] = squap.makeSquap ( method.constraints [ i ]);
                }

                method.totalAssetsArgs = _.size ( method.assetArgs );
                method.totalConstArgs = _.size ( method.constArgs );

                this.methods [ methodName ] = method;
            }
        }
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
    getFriendlyNameForSort ( asset ) {

        const definition = this.definitions [ asset.type ];
        const fallback = definition.fields.name ? definition.fields.name.value : asset.assetID;
        return asset.fields.name ? asset.fields.name.value : fallback;
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
