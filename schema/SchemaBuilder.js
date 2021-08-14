/* eslint-disable no-whitespace-before-property */

import { assert, pdf417, qrcode, textLayout, util } from 'fgc-core';
import fs                       from 'fs';

const { FONT_FACE, JUSTIFY } = textLayout;

const TYPE_BOOLEAN      = 'BOOLEAN';
const TYPE_NUMERIC      = 'NUMERIC';
const TYPE_STRING       = 'STRING';
const TYPE_UNDEFINED    = 'UNDEFINED';

const MEDIA_AUDIO       = 'MEDIA_AUDIO';
const MEDIA_IMAGE       = 'MEDIA_IMAGE';
const MEDIA_TEXT        = 'MEDIA_TEXT';
const MEDIA_VIDEO       = 'MEDIA_VIDEO';

const SCHEMA_BUILDER_ADDING_ASSET_DEFINITION            = 'SCHEMA_BUILDER_ADDING_ASSET_DEFINITION';
const SCHEMA_BUILDER_ADDING_ASSET_DEFINITION_FIELD      = 'SCHEMA_BUILDER_ADDING_ASSET_DEFINITION_FIELD';
const SCHEMA_BUILDER_ADDING_DRAW_BARCODE                = 'SCHEMA_BUILDER_ADDING_DRAW_BARCODE';
const SCHEMA_BUILDER_ADDING_DRAW_LAYOUT                 = 'SCHEMA_BUILDER_ADDING_DRAW_LAYOUT';
const SCHEMA_BUILDER_ADDING_DRAW_SVG                    = 'SCHEMA_BUILDER_ADDING_DRAW_SVG';
const SCHEMA_BUILDER_ADDING_DRAW_TEXT                   = 'SCHEMA_BUILDER_ADDING_DRAW_TEXT';
const SCHEMA_BUILDER_ADDING_DRAW_TEXT_BOX               = 'SCHEMA_BUILDER_ADDING_DRAW_TEXT_BOX';
const SCHEMA_BUILDER_ADDING_DECK                        = 'SCHEMA_BUILDER_ADDING_DECK';
const SCHEMA_BUILDER_ADDING_FONT                        = 'SCHEMA_BUILDER_ADDING_FONT';
const SCHEMA_BUILDER_ADDING_ICON                        = 'SCHEMA_BUILDER_ADDING_ICON';
const SCHEMA_BUILDER_ADDING_LAYOUT                      = 'SCHEMA_BUILDER_ADDING_LAYOUT';
const SCHEMA_BUILDER_ADDING_METHOD                      = 'SCHEMA_BUILDER_ADDING_METHOD';
const SCHEMA_BUILDER_ADDING_REWARD                      = 'SCHEMA_BUILDER_ADDING_REWARD';
const SCHEMA_BUILDER_ADDING_SCHEMA                      = 'SCHEMA_BUILDER_ADDING_SCHEMA';
const SCHEMA_BUILDER_ADDING_SET                         = 'SCHEMA_BUILDER_ADDING_SET';
const SCHEMA_BUILDER_ADDING_UPGRADE                     = 'SCHEMA_BUILDER_ADDING_UPGRADE';

export const LAYOUT_COMMAND = {
    DRAW_BARCODE:       'DRAW_BARCODE',
    DRAW_LAYOUT:        'DRAW_LAYOUT',
    DRAW_SVG:           'DRAW_SVG',
    DRAW_TEXT_BOX:      'DRAW_TEXT_BOX',
};

//----------------------------------------------------------------//
function makeAssetFieldValue ( value, mutable ) {
    
    let type = TYPE_UNDEFINED;

    switch ( typeof ( value )) {
        case 'boolean':
            type = TYPE_BOOLEAN;
            break;
        case 'number':
            type = TYPE_NUMERIC;
            break;
        case 'string':
            type = TYPE_STRING;
            break;
        default:
            assert ( false, `Error: '${ value }' has unsupported type.` );
    }

    return {
        type:           type,
        value:          value,
        mutable:        mutable || false,
    }
}

//================================================================//
// SchemaBuilder
//================================================================//
class SchemaBuilder {

    //----------------------------------------------------------------//
    alternate ( key, value ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_ASSET_DEFINITION_FIELD ));
        this.top ().alternates [ key ] = value;
        return this;
    }

    //----------------------------------------------------------------//
    assetArg ( name, qualifier, isSubject ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_METHOD ));
        this.top ().assetArgs [ name ] = {
            qualifier:  qualifier,
            isSubject:  isSubject,
        }
        return this;
    }

    //----------------------------------------------------------------//
    bold ( url ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_FONT ));
        this.top ()[ FONT_FACE.BOLD ] = url;
        return this;
    }

    //----------------------------------------------------------------//
    boldItalic ( url ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_FONT ));
        this.top ()[ FONT_FACE.BOLD_ITALIC ] = url;
        return this;
    }

    //----------------------------------------------------------------//
    constArg ( name, qualifier, defaultValue, inputType ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_METHOD ));
        this.top ().constArgs [ name ] = {
            qualifier:      qualifier,
            defaultValue:   defaultValue,
            inputScheme: {
                type:   inputType,
            },
        }
        return this;
    }

    //----------------------------------------------------------------//
    constraint ( qualifier ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_METHOD ));
        this.top ().constraints.push ( qualifier );
        return this;
    }

    //----------------------------------------------------------------//
    constructor () {

        this.stack = [];

        this.schema = {
            decks:              {},
            fonts:              {},
            icons:              {},
            lua:                '',
            definitions:        {},
            layouts:            {},
            meta:               '',
            methods:            {},
            rewards:            {},
            sets:               {},
            upgrades:           {},
        };

        this.push (
            SCHEMA_BUILDER_ADDING_SCHEMA,
            this.schema
        );
    }

    //----------------------------------------------------------------//
    deck ( name ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_DECK,
            {},
            ( schema, deck ) => {
                schema.decks [ name ] = deck;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    deckMember ( assetType, amount ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_DECK ));
        this.top ()[ assetType ] = amount;
        return this;
    }

    //----------------------------------------------------------------//
    definition ( name ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_ASSET_DEFINITION,
            {
                fields:         {},
            },
            ( schema, definition ) => {
                schema.definitions [ name ] = definition;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    done () {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));
        return this.schema;
    }

    //----------------------------------------------------------------//
    drawBarcode ( template, x, y, width, height, codeType, options ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_LAYOUT ));

        this.push (
            SCHEMA_BUILDER_ADDING_DRAW_BARCODE,
            {
                type:           LAYOUT_COMMAND.DRAW_BARCODE,
                template:       template,
                x:              x || 0,
                y:              y || 0,
                width:          width || 0,
                height:         height || 0,
                codeType:       codeType || pdf417.CONSTS.ID,
                options:        options || {},
                wrap:           false,
            },
            ( layout, item ) => {
                layout.commands.push ( item );
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    drawBarcodePDF417 ( template, x, y, width, height ) {
        return this.drawBarcode ( template, x, y, width, height, pdf417.CONSTS.ID );
    }

    //----------------------------------------------------------------//
    drawBarcodeQR ( template, x, y, size, qrErr, qrType ) {

        const options = {
            qrErr:      qrErr || qrcode.CONSTS.ERROR_LEVEL.LOW,
            qrType:     qrType || qrcode.CONSTS.AUTOSELECT_TYPE,
        };
        return this.drawBarcode ( template, x, y, size, size, qrcode.CONSTS.ID, options );
    }

    //----------------------------------------------------------------//
    drawLayout ( template, x, y, wrap ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_LAYOUT ));

        this.push (
            SCHEMA_BUILDER_ADDING_DRAW_LAYOUT,
            {
                type:           LAYOUT_COMMAND.DRAW_LAYOUT,
                template:       template || '',
                x:              x || 0,
                y:              y || 0,
                wrap:           wrap || false,
            },
            ( layout, item ) => {
                layout.commands.push ( item );
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    drawSVG ( template ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_LAYOUT ));

        this.push (
            SCHEMA_BUILDER_ADDING_DRAW_SVG,
            {
                type:           LAYOUT_COMMAND.DRAW_SVG,
                template:       template || '',
            },
            ( layout, item ) => {
                layout.commands.push ( item );
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    drawText ( template, fontName, fontSize, hJustify ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_DRAW_TEXT_BOX ));

        this.push (
            SCHEMA_BUILDER_ADDING_DRAW_TEXT,
            {
                template:       template,
                fontName:       fontName,
                fontSize:       fontSize,
                hJustify:       hJustify || JUSTIFY.HORIZONTAL.LEFT,
            },
            ( textBox, segment ) => {
                textBox.segments.push ( segment );
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    drawTextBox ( x, y, width, height, vJustify ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_LAYOUT ));

        this.push (
            SCHEMA_BUILDER_ADDING_DRAW_TEXT_BOX,
            {
                type:           LAYOUT_COMMAND.DRAW_TEXT_BOX,
                segments:       [],
                x:              x || 0,
                y:              y || 0,
                width:          width || 0,
                height:         height || 0,
                vJustify:       vJustify || JUSTIFY.VERTICAL.TOP,
                wrap:           false,
            },
            ( layout, item ) => {
                layout.commands.push ( item );
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    extends ( base ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_ASSET_TEMPLATE ));
        this.top ().extends = base;
        return this;
    }

    //----------------------------------------------------------------//
    field ( name, value, mutable ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_ASSET_DEFINITION ));

        let field = makeAssetFieldValue ( value, mutable );

        this.push (
            SCHEMA_BUILDER_ADDING_ASSET_DEFINITION_FIELD,
            field,
            ( definition, field ) => {
                definition.fields [ name ] = field;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    font ( name, url ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_FONT,
            {
                [ FONT_FACE.REGULAR ]:  url,
            },
            ( schema, font ) => {
                schema.fonts [ name ] = font;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    getState () {

        return this.stack [ this.stack.length - 1 ].state;
    }

    //----------------------------------------------------------------//
    icon ( name, width, height, template ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_ICON,
            {
                svg:        template,
                width:      width || 1,
                height:     height || 1,
            },
            ( schema, icon ) => {
                schema.icons [ name ] = icon;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    italic ( url ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_FONT ));
        this.top ()[ FONT_FACE.ITALIC ] = url;
        return this;
    }

    //----------------------------------------------------------------//
    layout ( name, width, height, dpi, wrap ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_LAYOUT,
            {
                width:          width || 0,
                height:         height || 0,
                dpi:            dpi || 300,
                commands:       [],
                wrap:           wrap || false,
            },
            ( schema, layout ) => {
                schema.layouts [ name ] = layout;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    lua ( lua ) {

        // pop to adding method first
        assert (
            this.popTo ( SCHEMA_BUILDER_ADDING_METHOD ) ||
            this.popTo ( SCHEMA_BUILDER_ADDING_REWARD ) ||
            this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA )
        );
        this.top ().lua = lua;
        return this;
    }

    //----------------------------------------------------------------//
    luaFile ( filename ) {

        // pop to adding method first
        assert (
            this.popTo ( SCHEMA_BUILDER_ADDING_METHOD ) ||
            this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA )
        );

        let lua = fs.readFileSync ( filename, 'utf8' );
        assert ( lua );

        this.top ().lua = lua;
        return this;
    }

    //----------------------------------------------------------------//
    meta ( meta ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));
        this.top ().meta = meta;
        return this;
    }

    //----------------------------------------------------------------//
    metaFile ( filename ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        let meta = fs.readFileSync ( filename, 'utf8' );
        assert ( meta );

        this.top ().meta = JSON.parse ( meta );
        return this;
    }

    //----------------------------------------------------------------//
    method ( name, friendlyName, description ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_METHOD,
            {
                weight:         1,
                maturity:       0,
                friendlyName:   friendlyName || '',
                description:    description || '',
                assetArgs:      {},
                constArgs:      {},
                constraints:    [],
                lua:            '',
            },
            ( schema, method ) => {
                schema.methods [ name ] = method;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    mutable ( value ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_ASSET_DEFINITION_FIELD ));
        this.top ().mutable = typeof ( value ) === 'boolean' ? value : true;
        return this;
    }

    //----------------------------------------------------------------//
    pen ( fill ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_DRAW_TEXT ));
        const top = this.top ();
        top.fill = fill;
        return this;
    }

    //----------------------------------------------------------------//
    popTo ( state ) {

        let found = false;
        for ( let i in this.stack ) {
            if ( this.stack [ i ].state === state ) {
                found = true;
                break;
            }
        }
        if ( !found ) return false;

        let i = this.stack.length - 1;
        while ( this.stack [ i ].state !== state ) {
            this.stack [ i ].resolve ( this.stack [ i - 1 ].container, this.stack [ i ].container );
            this.stack.pop ();
            i--;
        }
        return true;
    }

    //----------------------------------------------------------------//
    push ( state, container, resolve ) {

        this.stack.push ({
            state:          state,
            container:      container,
            resolve:        resolve,
        });
    }

    //----------------------------------------------------------------//
    reward ( name, friendlyName, description, quantity ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_REWARD,
            {
                friendlyName:   friendlyName || '',
                description:    description || '',
                lua:            '',
                quantity:       quantity || 0,
            },
            ( schema, method ) => {
                schema.rewards [ name ] = method;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    scriptable ( value ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_ASSET_DEFINITION_FIELD ));
        this.top ().scriptable = typeof ( value ) === 'boolean' ? value : true;
        return this;
    }

    //----------------------------------------------------------------//
    set ( name ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_SET,
            {},
            ( schema, set ) => {
                schema.sets [ name ] = set;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    setMember ( assetType, amount ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SET ));
        this.top ()[ assetType ] = amount;
        return this;
    }

    //----------------------------------------------------------------//
    string () {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_ASSET_TEMPLATE_FIELD ));
        this.top ().type = TYPE_STRING;
        return this;
    }

    //----------------------------------------------------------------//
    top () {
        return this.stack [ this.stack.length - 1 ].container;
    }

    //----------------------------------------------------------------//
    upgrade ( type, upgrade ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.push (
            SCHEMA_BUILDER_ADDING_UPGRADE,
            {
                type:       type,
                upgrade:    upgrade,
            },
            ( schema, upgrade ) => {
                schema.upgrades [ upgrade.type ] = upgrade.upgrade;
            }
        );
        return this;
    }

    //----------------------------------------------------------------//
    version ( release, major, minor, revision ) {

        assert ( this.popTo ( SCHEMA_BUILDER_ADDING_SCHEMA ));

        this.top ().version = {
            release:    release || '',
            major:      major || 0,
            minor:      minor || 0,
            revision:   revision || 0,
        };
        return this;
    }

    //----------------------------------------------------------------//
    wrapSVG ( template ) {

        assert (
            this.popTo ( SCHEMA_BUILDER_ADDING_DRAW_BARCODE ) ||
            this.popTo ( SCHEMA_BUILDER_ADDING_DRAW_LAYOUT ) ||
            this.popTo ( SCHEMA_BUILDER_ADDING_DRAW_SVG ) ||
            this.popTo ( SCHEMA_BUILDER_ADDING_DRAW_TEXT_BOX )
        );
        this.top ().wrap = template;
        return this;
    }
}

export const buildSchema = () => { return new SchemaBuilder ()}
