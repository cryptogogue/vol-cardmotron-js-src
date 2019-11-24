/* eslint-disable no-whitespace-before-property */

import { assert, excel, Service, SingleColumnContainerView, textLayout, useService, util } from 'fgc';
import { buildSchema, op }      from './SchemaBuilder';
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

        this.schemaBuilder = buildSchema ( 'TEST_SCHEMA' );
        this.macros     = {};
        this.errors     = [];
        this.warnings   = [];
        this.inventory  = {};

        this.book = book;
        this.readSheet ( 0 );
        delete ( this.book );

        this.schema = this.schemaBuilder.done ();
    }

    //----------------------------------------------------------------//
    escapeDefinitionType ( name ) {

        const baseName = ( name || '' ).toLowerCase ().replace ( /[^a-z0-9]+/g, '-' );

        let postfix = 0;
        name = baseName;
        
        while ( _.has ( this.inventory, name )) {
            name = `${ baseName }-${ postfix++ }`;
        }
        return name;
    }

    //----------------------------------------------------------------//
    hasMessages () {

        return (( this.errors.length + this.warnings.length ) > 0 );
    }

    //----------------------------------------------------------------//
    readDefinitions ( macros, sheet, name, row ) {

        // read in the field definitions
        const fieldDefs = {};
        for ( let col = 1; col < sheet.width; ++col ) {

            const name = sheet.getValueByCoord ( col, row, false );
            let type = false;

            switch ( name ) {
                case '*':
                    type = 'number';
                    break;

                case '@':
                    type = 'string';
                    break;

                default:
                    type = sheet.getValueByCoord ( col, row + 1, 'string' );
                    break;
            };

            if ( name && type ) {
                fieldDefs [ col ] = {
                    name:   name,
                    type:   type,
                }
            }
        }

        // skip the field definitions
        row += 2;

        for ( ; row < sheet.height; ++row ) {

            const nextDirective = sheet.getValueByCoord ( 0, row, false );
            if ( nextDirective ) break;

            let definition = {};
            let fieldCount = 0;

            for ( let col = 1; col < sheet.width; ++col ) {

                const fieldDef = fieldDefs [ col ];
                if ( !fieldDef ) continue;

                const raw = sheet.getValueByCoord ( col, row, '' );
                let value;

                switch ( fieldDef.type ) {
                    case 'number':
                        value = Number ( raw );
                        if ( typeof ( value ) !== fieldDef.type ) continue;
                        break;
                    case 'string':
                        value = String ( raw );
                        if ( typeof ( value ) !== fieldDef.type ) continue;
                        value = handlebars.compile ( value, COMPILE_OPTIONS )( macros );
                        break;
                    default:
                        continue;
                }

                definition [ fieldDef.name ] = value;
                fieldCount++;
            }
            
            // if there's a count column, use the value there. if not, default count is 1.
            const definitionCount = _.has ( definition, '*' ) ? ( definition [ '*' ] || 0 ): 1;

            // type column could be '@' or 'name'. prefer '@'.
            const typeColumnName = _.has ( definition, '@' ) ? '@' : 'name';
            const hasTypeColumn = _.has ( definition, typeColumnName );

            // if there's a name column, use the value there. if not, default name is 'definition'.
            let definitionType = hasTypeColumn ? ( definition [ typeColumnName ] || false ):  'definition';

            if ( definitionType && ( definitionCount > 0 ) && ( fieldCount > 0 )) {

                definitionType = this.escapeDefinitionType ( definitionType );
                this.inventory [ definitionType ] = definitionCount;

                this.schemaBuilder.definition ( definitionType );
                for ( let fieldName in definition ) {
                    if (( fieldName === '*' ) || ( fieldName === '@' )) continue; // ignore control fields
                    this.schemaBuilder.field ( fieldName, definition [ fieldName ]);
                }
            }
        }
    }

    //----------------------------------------------------------------//
    readFonts ( sheet, name, row, paramNames ) {

        const params = this.readParams ( sheet, row++, paramNames, [
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

    //----------------------------------------------------------------//
    readIcons ( sheet, name, row, paramNames ) {

        const params = this.readParams ( sheet, row++, paramNames, [
            stringParam ( 'name' ),
            numberParam ( 'width' ),
            numberParam ( 'height' ),
            stringParam ( 'svg' ),
        ]);

        this.schemaBuilder.icon ( name, params.width, params.height, params.svg );
    }

    //----------------------------------------------------------------//
    readLayouts ( sheet, name, row, paramNames ) {

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

        const params = this.readParams ( sheet, row++, paramNames, [
            stringParam ( 'name' ),
            stringParam ( 'svg', false ),
            numberParam ( 'width' ),
            numberParam ( 'height' ),
            numberParam ( 'dpi' ),
        ]);

        const docWidth     = params.width;
        const docHeight    = params.height;

        this.schemaBuilder.layout ( name, docWidth, docHeight, params.dpi, params.svg );

        for ( ; row < sheet.height; ++row ) {

            const draw = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.draw, row ));
            if ( !draw ) break;

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
    readMacros ( macros, sheet, name, row, paramNames ) {
        const params = this.readParams ( sheet, row++, paramNames, [
            stringParam ( 'name' ),
            stringParam ( 'value', '' ),
        ]);
        const val = String ( params.value || '' );
        macros [ name ] = val;
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
    readSheet ( sheetName ) {

        const sheet = this.book.getSheet ( sheetName );
        if ( !sheet ) return;

        let handlers = {
            FONTS:          ( name, row, paramNames ) => { this.readFonts       ( sheet, name, row, paramNames )},
            ICONS:          ( name, row, paramNames ) => { this.readIcons       ( sheet, name, row, paramNames )},
            INCLUDES:       ( name, row, paramNames ) => { this.readSheet       ( name )},
            LAYOUTS:        ( name, row, paramNames ) => { this.readLayouts     ( sheet, name, row, paramNames )},
            MACROS:         ( name, row, paramNames ) => { this.readMacros      ( this.macros, sheet, name, row, paramNames )},
        }

        let mode = false;
        let paramNames = false;

        for ( let row = 0; row < sheet.height; ++row ) {

            const nextMode = util.toStringOrFalse ( sheet.getValueByCoord ( 0, row ));

            if ( nextMode === 'DEFINITIONS' ) {
                this.readDefinitions  ( this.macros, sheet, name, row );
            }
            else {
                if ( nextMode ) {
                    mode = nextMode;
                    paramNames = this.readParamNames ( sheet, row );
                }
                else if ( paramNames ) {
                    const name = util.toStringOrFalse ( sheet.getValueByCoord ( paramNames.name, row ));
                    if ( name ) {
                        handlers [ mode ]( name, row, paramNames );
                    }
                }
            }
        }
    }

    //----------------------------------------------------------------//
    reportError ( body, col, row ) {
        this.errors.push ({
            header:     `${ excel.coordToAddr ( col, row )}: ERROR`,
            body:       body,
        });
    }

    //----------------------------------------------------------------//
    reportWarning ( body, col, row ) {
        this.warnings.push ({
            header:     `${ excel.coordToAddr ( col, row )}: WARNING`,
            body:       body,
        });
    }
};
