/* eslint-disable no-whitespace-before-property */

import { assert, excel, hooks, RevocableContext, SingleColumnContainerView, textLayout, util } from 'fgc';
import { buildSchema, op }      from './SchemaBuilder';
import { parseSquap }           from './parseSquap.js';
import fs                       from 'fs';
import handlebars               from 'handlebars';
import _                        from 'lodash';

const { TextFitter, JUSTIFY } = textLayout;

const COMPILE_OPTIONS = {
    noEscape: true,
}

//================================================================//
// util
//================================================================//

//----------------------------------------------------------------//
export function makeSchemaTransaction ( schema, accountName, keyName, gratuity, nonce ) {

    return {
        type:       'PUBLISH_SCHEMA',
        maker: {
            accountName:    accountName,
            keyName:        keyName || 'master',
            gratuity:       gratuity || 0,
            nonce:          nonce || 0,
        },
        name:       schema.name,
        schema:     schema,
    }
}

//----------------------------------------------------------------//
function numberParam ( name, fallback ) {
    return {
        type:       'number',
        name:       name,
        fallback:   fallback,
    }
}

//----------------------------------------------------------------//
function scanMore ( sheet, row ) {

    return (( row < sheet.height ) && ( sheet.getValueByCoord ( 0, row, false ) === false ));
}

//----------------------------------------------------------------//
function stringParam ( name, fallback ) {
    return {
        type:       'string',
        name:       name,
        fallback:   fallback,
    }
}

//----------------------------------------------------------------//
export function writeJavascriptToFile ( schema, filename ) {

    const out = `export const ${ schema.name } = JSON.parse ( \`${ JSON.stringify ( schema ).replace ( /(\\)/g, `\\\\` )}\` );`;
    fs.writeFileSync ( filename, out, 'utf8' );
}

//----------------------------------------------------------------//
export function writeJSONToFile ( schema, filename ) {

    fs.writeFileSync ( filename, JSON.stringify ( schema, null, 4 ), 'utf8' );
}

//----------------------------------------------------------------//
export function writeTransactionToFile ( schema, filename ) {

    fs.writeFileSync ( filename, JSON.stringify ( makeSchemaTransaction ( schema, '9090' ), null, 4 ), 'utf8' );
}

//================================================================//
// SchemaScannerXLSX
//================================================================//
export class SchemaScannerXLSX {

    //----------------------------------------------------------------//
    constructor ( book ) {

        this.schemaBuilder          = buildSchema ();
        this.decks                  = {};
        this.sets                   = {};
        this.macros                 = {};
        this.errors                 = [];
        this.warnings               = [];
        this.inventory              = {};
        this.rankDefinitions        = {};
        this.version                = {};

        this.book = book;
        this.readSheet ( 0 );
        delete ( this.book );

        for ( let deckName in this.decks ) {

            const deck = this.decks [ deckName ];
            if ( Object.keys ( deck ).length === 0 ) continue;

            this.schemaBuilder.deck ( deckName );
            
            for ( let assetType in deck ) {
                this.schemaBuilder.deckMember ( assetType, deck [ assetType ]);
            }
        }

        for ( let setName in this.sets ) {

            const set = this.sets [ setName ];
            if ( Object.keys ( set ).length === 0 ) continue;

            this.schemaBuilder.set ( setName );
            
            for ( let assetType in set ) {
                this.schemaBuilder.setMember ( assetType, set [ assetType ]);
            }
        }

        this.schemaBuilder.version (
            this.version.release,
            this.version.major,
            this.version.minor,
            this.version.revision
        );

        this.schema = this.schemaBuilder.done ();
    }

    //----------------------------------------------------------------//
    escapeDefinitionType ( name ) {

        const baseName = ( name || '' ).replace ( /[^a-zA-Z0-9]+/g, '-' );

        let postfix = 0;
        name = baseName;
        
        while ( _.has ( this.inventory, name )) {
            name = `${ baseName }-${ postfix++ }`;
        }
        return name;
    }

    //----------------------------------------------------------------//
    hasErrors () {

        return ( this.errors.length > 0 );
    }

    //----------------------------------------------------------------//
    hasMessages () {

        return (( this.errors.length + this.warnings.length ) > 0 );
    }

    //----------------------------------------------------------------//
    hasWarnings () {

        return ( this.warnings.length > 0 );
    }

    //----------------------------------------------------------------//
    readDefinitions ( sheet, row ) {

        // read in the field definitions
        let definitionTypeCol = false;
        const fieldDefs = {};
        for ( let col = 1; col < sheet.width; ++col ) {

            const name = sheet.getValueByCoord ( col, row, false );
            if ( !name ) continue;

            let type        = false;
            let mutable     = false;
            let isDeck      = false;

            const firstChar = name.charAt ( 0 );

            switch ( firstChar ) {
                case '#':
                case '*':

                    type = 'number';
                    isDeck = true;
                    if ( name.length > 1 ) {
                        const deckName = name.slice ( 1 );
                        if ( firstChar === '#' ) {
                            this.sets [ deckName ] = this.sets [ deckName ] || {};
                        }
                        else {
                            this.decks [ deckName ] = this.decks [ deckName ] || {};
                        }
                    }
                    break;

                case '@':
                    type = 'string';
                    definitionTypeCol = col;
                    break;

                default:
                    type = sheet.getValueByCoord ( col, row + 1, 'string' );
                    if ( type.charAt ( 0 ) === '*' ) {
                        mutable = true;
                        type = type.slice ( 1 );
                    }
                    break;
            };

            if ( !type ) {
                this.reportWarning ( `Could not find type for field '${ name }'. Field will be ignored.`, col, row );
                continue; 
            }

            if ( !(( type === 'number' ) || ( type === 'string' ))) {
                this.reportError ( `Unrecognized type '${ type }'. Type must be 'number' or 'string'.`, col, row ); 
                continue;
            }

            fieldDefs [ col ] = {
                name:       name,
                type:       type,
                mutable:    mutable,
                isDeck:     isDeck,
            }
        }

        if ( definitionTypeCol === false ) {
            this.reportError ( `No '@' definition type found on field name row.`, 1, row ); 
        }

        // skip the field definitions
        row += 2;

        for ( ; scanMore ( sheet, row ); ++row ) {

            if ( !String ( sheet.getValueByCoord ( definitionTypeCol, row, '' ))) continue;

            let definition = {};
            let fieldCount = 0;
            let definitionCount = 0;
            let definitionType = 'definition';

            for ( let col = 1; col < sheet.width; ++col ) {

                const fieldDef = fieldDefs [ col ];
                if ( !fieldDef ) continue;

                const raw = sheet.getValueByCoord ( col, row, '' );
                let value;

                switch ( fieldDef.type ) {

                    case 'number':
                        value = Number ( raw ? raw : '' );
                        if ( isNaN ( value )) {
                            this.reportError ( `Type mismatch: could not coerce '${ raw }' to number.`, col, row ); 
                            continue;
                        }
                        break;

                    case 'string':
                        value = String ( raw );
                        value = handlebars.compile ( value, COMPILE_OPTIONS )( this.macros );
                        break;

                    default:
                        this.reportError ( `Unrecognized field type '${ fieldDef.type }'.`, col, row ); 
                        continue;
                }

                if ( !(( typeof ( value ) === 'number' ) || ( typeof ( value ) === 'string' ))) {
                    this.reportError ( `Type of '${ raw }' is '${ typeof ( value )}'.`, col, row ); 
                    continue;
                }

                if ( fieldDef.isDeck ) {
                    definitionCount += value;
                }

                if ( fieldDef.name === '@' ) {
                    definitionType = this.escapeDefinitionType ( value );
                    if ( definitionType !== value ) {
                        this.reportWarning ( `Definition type '${ value }' contained illegal characters. Escaped to '${ definitionType }'.`, col, row ); 
                    }
                }
                else {
                    definition [ fieldDef.name ] = { value: value, mutable: fieldDef.mutable };
                    fieldCount++;
                }   
            }

            if ( definitionType && ( definitionCount > 0 ) && ( fieldCount > 0 )) {

                this.rankDefinitions [ definitionType ] = Object.keys ( this.inventory ).length;
                this.inventory [ definitionType ] = definitionCount;

                this.schemaBuilder.definition ( definitionType );
                for ( let fieldName in definition ) {

                    const firstChar = fieldName.charAt ( 0 );

                    switch ( firstChar ) {

                        case '#':
                        case '*': {

                            if ( fieldName.length > 1 ) {
                                
                                const deckCount = definition [ fieldName ].value || 0;
                                if ( deckCount > 0 ) {

                                    const deckName = fieldName.slice ( 1 );

                                    if ( firstChar === '#' ) {
                                        this.sets [ deckName ][ definitionType ] = deckCount;
                                    }
                                    else {
                                        this.decks [ deckName ][ definitionType ] = deckCount;
                                    }
                                }
                            }
                            continue;
                        }

                        case '@':
                            continue;

                        default:
                            const field = definition [ fieldName ];
                            this.schemaBuilder.field ( fieldName, field.value, field.mutable );
                            break;
                    }
                }
            }
        }
    }

    //----------------------------------------------------------------//
    readFonts ( sheet, row ) {

        const paramNames = this.readParamNames ( sheet, row++ );

        for ( ; scanMore ( sheet, row ); ++row ) {

            const name = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.name, row ));
            if ( !name ) continue;

            const params = this.readParams ( sheet, row, paramNames, [
                stringParam ( 'name' ),
                stringParam ( 'regular' ),
                stringParam ( 'bold', false ),
                stringParam ( 'italic', false ),
                stringParam ( 'boldItalic', false ),
            ]);

            this.schemaBuilder.font ( name, params.regular );

            if ( params.bold ) {
                this.schemaBuilder.bold ( params.bold );
            }

            if ( params.italic ) {
                this.schemaBuilder.italic ( params.italic );
            }

            if ( params.boldItalic ) {
                this.schemaBuilder.boldItalic ( params.boldItalic );
            }
        }
    }

    //----------------------------------------------------------------//
    readIcons ( sheet, row ) {

        const paramNames = this.readParamNames ( sheet, row++ );

        for ( ; scanMore ( sheet, row ); ++row ) {

            const name = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.name, row ));
            if ( !name ) continue;

            const params = this.readParams ( sheet, row, paramNames, [
                stringParam ( 'name' ),
                numberParam ( 'width' ),
                numberParam ( 'height' ),
                stringParam ( 'svg' ),
            ]);

            this.schemaBuilder.icon ( name, params.width, params.height, params.svg );
        }
    }

    //----------------------------------------------------------------//
    readIncludes ( sheet, row ) {

        const paramNames = this.readParamNames ( sheet, row++ );

        for ( ; scanMore ( sheet, row ); ++row ) {

            const sheetName = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.sheet, row ));
            if ( !sheetName ) continue;

            this.readSheet ( sheetName );
        }
    }

    //----------------------------------------------------------------//
    readLayouts ( sheet, row ) {

        const paramNames = this.readParamNames ( sheet, row++ );

        const H_JUSTIFY = {
            left:       JUSTIFY.HORIZONTAL.LEFT,
            center:     JUSTIFY.HORIZONTAL.CENTER,
            right:      JUSTIFY.HORIZONTAL.RIGHT,
        };

        const V_JUSTIFY = {
            bottom:     JUSTIFY.VERTICAL.BOTTOM,
            center:     JUSTIFY.VERTICAL.CENTER,
            top:        JUSTIFY.VERTICAL.TOP,
        };

        let docWidth     = 0;
        let docHeight    = 0;

        for ( ; scanMore ( sheet, row ); ++row ) {

            const name = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.name, row ));

            if ( name ) {
                const layoutParams = this.readParams ( sheet, row, paramNames, [
                    stringParam ( 'name' ),
                    stringParam ( 'svg', false ),
                    numberParam ( 'width' ),
                    numberParam ( 'height' ),
                    numberParam ( 'dpi' ),
                ]);

                docWidth = layoutParams.width;
                docHeight = layoutParams.height;

                this.schemaBuilder.layout ( name, docWidth, docHeight, layoutParams.dpi, layoutParams.svg );
                continue;
            }

            const draw = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.draw, row ));
            if ( !draw ) continue;

            switch ( draw ) {

                case 'pdf417': {

                    const drawParams = this.readParams ( sheet, row, paramNames, [
                        stringParam ( 'draw' ),
                        stringParam ( 'text' ),
                        stringParam ( 'svg', false ),
                        numberParam ( 'x', 0 ),
                        numberParam ( 'y', 0 ),
                        numberParam ( 'width' ),
                        numberParam ( 'height' ),
                    ]);

                    this.schemaBuilder.drawBarcodePDF417 (
                        drawParams.text,
                        drawParams.x,
                        drawParams.y,
                        drawParams.width,
                        drawParams.height
                    );

                    this.schemaBuilder.wrapSVG ( drawParams.svg );

                    break;
                }

                case 'qr': {

                    const drawParams = this.readParams ( sheet, row, paramNames, [
                        stringParam ( 'draw' ),
                        stringParam ( 'text' ),
                        stringParam ( 'svg', false ),
                        numberParam ( 'x', 0 ),
                        numberParam ( 'y', 0 ),
                        numberParam ( 'width' ),
                        stringParam ( 'qrErr', false ),
                        numberParam ( 'qrType', false ),
                    ]);

                    this.schemaBuilder.drawBarcodeQR (
                        drawParams.text,
                        drawParams.x,
                        drawParams.y,
                        drawParams.width,
                        drawParams.qrErr,
                        drawParams.qrType
                    );

                    this.schemaBuilder.wrapSVG ( drawParams.svg );

                    break;
                }

                case 'ref': {

                    const drawParams = this.readParams ( sheet, row, paramNames, [
                        stringParam ( 'draw' ),
                        stringParam ( 'text' ),
                        stringParam ( 'svg', false ),
                        stringParam ( 'x', 0 ),
                        stringParam ( 'y', 0 ),
                    ]);

                    this.schemaBuilder.drawLayout (
                        drawParams.text,
                        drawParams.x,
                        drawParams.y,
                        drawParams.svg
                    );

                    break;
                }

                case 'svg': {
                    
                    const drawParams = this.readParams ( sheet, row, paramNames, [
                        stringParam ( 'draw' ),
                        stringParam ( 'svg' )
                    ]);

                    this.schemaBuilder.drawSVG (
                        drawParams.svg,
                    );

                    break;
                }

                case 'textbox': {

                    const drawParams = this.readParams ( sheet, row, paramNames, [
                        stringParam ( 'draw' ),
                        stringParam ( 'text' ),
                        stringParam ( 'svg', false ),
                        numberParam ( 'x', 0 ),
                        numberParam ( 'y', 0 ),
                        numberParam ( 'width', docWidth ),
                        numberParam ( 'height', docHeight ),
                        stringParam ( 'font' ),
                        numberParam ( 'fontSize' ),
                        stringParam ( 'hAlign', 'left' ),
                        stringParam ( 'vAlign', 'top' ),
                    ]);

                    this.schemaBuilder.drawTextBox (
                        drawParams.x,
                        drawParams.y,
                        drawParams.width,
                        drawParams.height,
                        V_JUSTIFY [ drawParams.vAlign ]
                    );

                    this.schemaBuilder.wrapSVG ( drawParams.svg );

                    this.schemaBuilder.drawText (
                        drawParams.text,
                        drawParams.font,
                        drawParams.fontSize,
                        H_JUSTIFY [ drawParams.hAlign ]
                    );

                    break;
                }

                case '+text': {

                    const drawParams = this.readParams ( sheet, row, paramNames, [
                        stringParam ( 'draw' ),
                        stringParam ( 'text' ),
                        stringParam ( 'font' ),
                        numberParam ( 'fontSize' ),
                        stringParam ( 'hAlign', 'left' ),
                    ]);

                    this.schemaBuilder.drawText (
                        drawParams.text,
                        drawParams.font,
                        drawParams.fontSize,
                        H_JUSTIFY [ drawParams.hAlign ]
                    );

                    break;
                }
            }
        }
    }

    //----------------------------------------------------------------//
    readMacros ( sheet, row ) {

        const paramNames = this.readParamNames ( sheet, row++ );

        for ( ; scanMore ( sheet, row ); ++row ) {

            const name = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.name, row ));
            if ( !name ) continue;

            const params = this.readParams ( sheet, row, paramNames, [
                stringParam ( 'name' ),
                stringParam ( 'value', '' ),
            ]);
            const val = String ( params.value || '' );
            this.macros [ name ] = val;
        }
    }

    //----------------------------------------------------------------//
    readMethods ( sheet, row ) {

        // NOTE: the inputType field is used here to derive the input base type
        // (ASSET or CONST) and ALSO the 'input scheme,' which is an opaque field
        // used only by the wallet.

        const paramNames = this.readParamNames ( sheet, row++ );

        const parseSquapSafe = ( test, row, col ) => {
            try {
                return parseSquap ( test );
            }
            catch ( error ) {
                this.reportError ( error.message, col, row );
            }
        }

        for ( ; scanMore ( sheet, row ); ++row ) {

            const name = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.name, row ));

            if ( name ) {
                const params = this.readParams ( sheet, row, paramNames, [
                    stringParam ( 'name' ),
                    stringParam ( 'script' ),
                    stringParam ( 'friendlyName', '' ),
                    stringParam ( 'description', '' ),
                ]);

                this.schemaBuilder.method ( params.name, params.friendlyName, params.description );
                this.schemaBuilder.lua ( params.script );
                continue;
            }

            const param = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.param, row ));

            if ( param ) {
                const params = this.readParams ( sheet, row, paramNames, [
                    stringParam ( 'param' ),
                    stringParam ( 'inputType', 'asset' ),
                    stringParam ( 'qualifier', '' ),
                ]);
                const squap = parseSquapSafe ( params.qualifier, row, paramNames.qualifier );


                switch ( params.inputType ) {
                    case 'asset':
                        this.schemaBuilder.assetArg ( params.param, squap );
                        break;

                    case 'image':
                        this.schemaBuilder.constArg ( params.param, squap, { type: 'STRING', value: '' }, 'image' );
                        break;
                }
                continue;
            }
            else {

                const qualifier = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.qualifier, row ));

                if ( qualifier ) {
                    const params = this.readParams ( sheet, row, paramNames, [
                        stringParam ( 'qualifier', '' ),
                    ]);
                    const squap = parseSquapSafe ( params.qualifier, row, paramNames.qualifier );
                    this.schemaBuilder.constraint ( squap );
                    continue;
                }
            }
        }
    }

    //----------------------------------------------------------------//
    readParamNames ( sheet, row ) {

        const paramNames = {};
        for ( let col = 1; col < sheet.width; ++col ) {
            const name = util.toStringOrFalse ( sheet.getValueByCoord ( col, row ));
            if ( name ) {
                paramNames [ name ] = col;
            }
        }
        return paramNames;
    }

    //----------------------------------------------------------------//
    readParams ( sheet, row, paramNames, paramDecls ) {

        paramDecls = paramDecls || [];

        const params = {};
        const validNames = {};

        for ( let decl of paramDecls ) {

            const name = decl.name;
            validNames [ name ] = true;

            const col = paramNames [ name ];
            let val = sheet.getValueByCoord ( col, row );

            if ( val === undefined ) {
                val = decl.fallback;
            }
            else {
                switch ( decl.type ) {
                    case 'number':
                        val = Number ( val );
                        break;
                    case 'string':
                        val = String ( val );
                        break;
                }
            }

            if ( val === undefined ) {
                this.reportError ( `Param "${ name }" is required.`, col, row );
            }
            else {
                params [ name ] = val;
            }
        }

        for ( const name in paramNames ) {
            const col = paramNames [ name ];
            const val = sheet.getValueByCoord ( col, row );
            if (( val !== undefined ) && ( _.has ( validNames, name ) === false )) {
                this.reportWarning ( `Param "${ name }: ${ val }" will be ignored.`, col, row );
            }
        }

        return params;
    }

    //----------------------------------------------------------------//
    readRewards ( sheet, row ) {

        const paramNames = this.readParamNames ( sheet, row++ );

        for ( ; scanMore ( sheet, row ); ++row ) {

            const name = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.name, row ));

            if ( name ) {
                const params = this.readParams ( sheet, row, paramNames, [
                    stringParam ( 'name' ),
                    stringParam ( 'script' ),
                    stringParam ( 'friendlyName', '' ),
                    stringParam ( 'description', '' ),
                ]);

                this.schemaBuilder.reward ( params.name, params.friendlyName, params.description );
                this.schemaBuilder.lua ( params.script );
                continue;
            }
        }
    }

    //----------------------------------------------------------------//
    readSheet ( sheetName ) {

        const sheet = this.book.getSheet ( sheetName );
        if ( !sheet ) return;

        let handlers = {
            DEFINITIONS:    ( name, row ) => { this.readDefinitions     ( sheet, row )},
            FONTS:          ( name, row ) => { this.readFonts           ( sheet, row )},
            ICONS:          ( name, row ) => { this.readIcons           ( sheet, row )},
            INCLUDES:       ( name, row ) => { this.readIncludes        ( sheet, row )},
            LAYOUTS:        ( name, row ) => { this.readLayouts         ( sheet, row )},
            MACROS:         ( name, row ) => { this.readMacros          ( sheet, row )},
            METHODS:        ( name, row ) => { this.readMethods         ( sheet, row )},
            REWARDS:        ( name, row ) => { this.readRewards         ( sheet, row )},
            UPGRADES:       ( name, row ) => { this.readUpgrades        ( sheet, row )},
            VERSION:        ( name, row ) => { this.readVersion         ( sheet, row )},
        }

        for ( let row = 0; row < sheet.height; ++row ) {

            const directive = util.toStringOrFalse ( sheet.getValueByCoord ( 0, row ));
            if ( directive && _.has ( handlers, directive )) {
                handlers [ directive ]( sheet, row );
            }
        }
    }

    //----------------------------------------------------------------//
    readUpgrades ( sheet, row ) {

        const paramNames = this.readParamNames ( sheet, row++ );

        for ( ; scanMore ( sheet, row ); ++row ) {

            const params = this.readParams ( sheet, row, paramNames, [
                stringParam ( 'type' ),
                stringParam ( 'upgrade' ),
            ]);

            if ( !( params.type && params.upgrade )) continue;

            this.schemaBuilder.upgrade ( params.type, params.upgrade );
        }
    }

    //----------------------------------------------------------------//
    readVersion ( sheet, row ) {

        const paramNames = this.readParamNames ( sheet, row++ );

        for ( ; scanMore ( sheet, row ); ++row ) {

            const release = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.release, row ));
            if ( !release ) continue;

            const params = this.readParams ( sheet, row, paramNames, [
                stringParam ( 'release' ),
                numberParam ( 'major' ),
                numberParam ( 'minor' ),
                numberParam ( 'revision' ),
            ]);

            this.version = {
                release:    params.release,
                major:      params.major,
                minor:      params.minor,
                revision:   params.revision,
            };
        }
    }

    //----------------------------------------------------------------//
    reportError ( body, col, row ) {

        const cell = ( col && row ) ? `${ excel.coordToAddr ( col, row )}: ` : '';

        this.errors.push ({
            header:     `${ cell }ERROR`,
            body:       body,
        });
    }

    //----------------------------------------------------------------//
    reportWarning ( body, col, row ) {

        const cell = ( col && row ) ? `${ excel.coordToAddr ( col, row )}: ` : '';

        this.warnings.push ({
            header:     `${ cell }WARNING`,
            body:       body,
        });
    }
};
