/* eslint-disable no-whitespace-before-property */

import { AssetLayout }                  from '../AssetLayout';
import { Binding }                      from './Binding';
import * as consts                      from '../consts';
import { LAYOUT_COMMAND }               from './SchemaBuilder';
import * as squap                       from './Squap';
import { assert, RevocableContext }     from 'fgc-core';
import handlebars                       from 'handlebars';
import _                                from 'lodash';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import * as opentype                    from 'opentype.js';

const LAYOUT_LIST_SEPARATOR_REGEX = /[\s,]+/;

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
    async affirmFontsAsync () {

        this.fonts = this.fonts || {};

        // get all the fonts
        for ( let name in this.json.fonts ) {

            if ( this.fonts [ name ]) continue;

            const fontDesc = this.json.fonts [ name ];
            const faces = {};

            for ( let face in fontDesc ) {
                const url = fontDesc [ face ];
                faces [ face ] = await this.fetchFontAsync ( url );
            }
            this.fonts [ name ] = faces;
        }
    }

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
            [ '$' ]: asset.assetID,
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

        this.revocable      = new RevocableContext ();

        this.json           = json ? _.cloneDeep ( json ) : false;

        this.definitions    = this.json ? this.json.definitions : {};
        this.icons          = this.json ? this.json.icons : {};
        this.layouts        = this.json ? this.json.layouts : {};
        this.upgrades       = this.json ? this.json.upgrades : {};

        this.docSizesCache  = {};
    }

    //----------------------------------------------------------------//
    @computed get
    docSizes () {

        const docSizes = {};

        const COMPILE_OPTIONS = {
            noEscape: true,
        }

        for ( let layoutName in this.templates ) {

            const layout = this.templates [ layoutName ];
            if ( this.dpi && ( layout.dpi !== this.dpi )) continue;

            const docSize = Schema.makeDocSize ( layout.width, layout.height, layout.dpi );
            docSizes [ docSize.docSizeName ] = docSize;
        }

        return docSizes;
    }

    //----------------------------------------------------------------//
    expandAsset ( asset ) {

        if ( asset.isExpanded ) return asset;

        asset = _.cloneDeep ( asset );

        const definition = this.definitions [ asset.type ];
        if ( !definition ) return false;

        for ( let fieldName in definition.fields ) {

            if ( !asset.fields [ fieldName ]) {

                const field = definition.fields [ fieldName ];
                asset.fields [ fieldName ] = {
                    type:   field.type,
                    value:  field.value,
                };
            }
        }

        if ( !asset.svg ) {
            asset.svg = this.renderAssetSVG ( asset );
        }

        asset.isExpanded = true;
        return asset;
    }

    //----------------------------------------------------------------//
    async fetchFontAsync ( url ) {

        if ( !url ) return false;

        const fetchOptions = {
            headers: {
                'Content-Type': 'text/plain',
            },
        };

        // TODO: all this can be a bit smarter.
        // TODO: handle non-CORS HTTP error responses (400, 500)
        // TODO: use HEAD/OPTIONS to check for CORS?

        try {
            const response  = await this.revocable.fetch ( url, fetchOptions );
            const buffer    = await response.arrayBuffer ();
            return opentype.parse ( buffer );
        }
        catch ( error ) {
            console.log ( 'FONT FETCH FAILED!', error );
            console.log ( 'Retrying with CORS proxy...' );
        }

        try {

            // TODO: warn if CORS proxy used (and worked)

            const response  = await this.revocable.fetch ( consts.CORS_PROXY + url, fetchOptions );
            const buffer    = await response.arrayBuffer ();
            return opentype.parse ( buffer );
        }
        catch ( error ) {
            console.log ( 'FONT FETCH FAILED AGAIN!', error );
        }

        // TODO: report missing font

        return false;
    }

    //----------------------------------------------------------------//
    getAssetDocSize ( asset ) {

        const layoutNameList = this.getAssetField ( asset, 'layout', '' );

        let docSize = this.docSizesCache [ layoutNameList ];
        if ( docSize ) return docSize;

        const context = this.composeAssetContext ( asset );

        let widthInInches   = 0;
        let heightInInches  = 0;
        let maxDPI          = 0;

        let layoutList      = false;
        let layoutSingle    = false;

        const visited = {};

        layoutList = ( layoutNameList ) => {

            const layoutNames = this.tokenizeLayoutNames ( layoutNameList );

            for ( const layoutName of layoutNames ) {
                layoutSingle ( layoutName );
            }
        }

        layoutSingle = ( layoutName ) => {

            if ( visited [ layoutName ]) return;
            visited [ layoutName ] = true;
            
            const layout = this.templates [ layoutName ]; 
            if ( !layout ) return;

            widthInInches   = Math.max ( widthInInches, layout.width ) / layout.dpi;
            heightInInches  = Math.max ( heightInInches, layout.height ) / layout.dpi;
            maxDPI          = Math.max ( layout.dpi )

            for ( let i in layout.commands ) {
                const command = layout.commands [ i ];
                if ( command.type === LAYOUT_COMMAND.DRAW_LAYOUT ) {
                    this.layoutList ( layoutNameList );
                }
            }
        }

        layoutList ( layoutNameList );

        const docSizeName = Schema.makeDocSizeName ( widthInInches * maxDPI, heightInInches * maxDPI, maxDPI );
        docSize = this.docSizes [ docSizeName ];
        this.docSizesCache [ layoutNameList ] = docSize;
        
        return docSize;
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
    hasLayoutsForAsset ( asset ) {

        let layoutField = this.getAssetField ( asset, 'layout', '' );
        let layoutNames = this.tokenizeLayoutNames ( layoutField );

        for ( let layoutName of layoutNames ) {
            if ( _.has ( this.layouts, layoutName )) {
                return true;
            }
        }
        return false;
    }

    //----------------------------------------------------------------//
    static makeDocSize ( width, height, dpi ) {

        return {
            widthInInches:      width / dpi,
            heightInInches:     height / dpi,
            width:              width,
            height:             height,
            dpi:                dpi,
            docSizeName:        Schema.makeDocSizeName ( width, height, dpi ),
        };
    }

    //----------------------------------------------------------------//
    static makeDocSizeName ( width, height, dpi ) {

        return `[${ width / dpi }in x ${ height / dpi }in]`;
    }

    //----------------------------------------------------------------//
    @ computed get
    methods () {

        const methods = {};

        if ( this.json && this.json.methods ) {
            for ( let methodName in this.json.methods ) {

                const method = _.cloneDeep ( this.json.methods [ methodName ]);

                method.name = methodName;

                for ( let argname in method.assetArgs ) {
                    method.assetArgs [ argname ].qualifier = squap.makeSquap ( method.assetArgs [ argname ].qualifier );
                }

                for ( let argname in method.constArgs ) {
                    method.constArgs [ argname ].qualifier = squap.makeSquap ( method.constArgs [ argname ].qualifier );
                }

                for ( let i in method.constraints ) {
                    method.constraints [ i ] = squap.makeSquap ( method.constraints [ i ]);
                }

                method.totalAssetsArgs = _.size ( method.assetArgs );
                method.totalConstArgs = _.size ( method.constArgs );

                methods [ methodName ] = method;
            }
        }

        return methods;
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

    //----------------------------------------------------------------//
    renderAssetSVG ( asset ) {

        const layout = new AssetLayout ( this, asset );
        return layout.svg;
    }

    //----------------------------------------------------------------//
    @computed get
    templates () {

        const templates = {};

        const COMPILE_OPTIONS = {
            noEscape: true,
        }

        for ( let layoutName in this.layouts ) {
            
            const layout = _.cloneDeep ( this.layouts [ layoutName ]);

            for ( let command of layout.commands ) {
                if ( command.type === LAYOUT_COMMAND.DRAW_TEXT_BOX ) {
                    for ( let segment of command.segments ) {
                        segment.template = handlebars.compile ( segment.template, COMPILE_OPTIONS );
                    }
                }
                else {
                    command.template = handlebars.compile ( command.template, COMPILE_OPTIONS );
                }
                command.wrap = command.wrap && handlebars.compile ( command.wrap, COMPILE_OPTIONS );
            }
            layout.wrap = layout.wrap && handlebars.compile ( layout.wrap, COMPILE_OPTIONS );

            templates [ layoutName ] = layout;
        }

        return templates;
    }

    //----------------------------------------------------------------//
    tokenizeLayoutNames ( layoutNameList ) {

        this.layoutNameListCache = this.layoutNameListCache || {};
        if ( !this.layoutNameListCache [ layoutNameList ]) {
            this.layoutNameListCache [ layoutNameList ] = layoutNameList.split ( LAYOUT_LIST_SEPARATOR_REGEX );
        }
        return this.layoutNameListCache [ layoutNameList ];
    }
}
