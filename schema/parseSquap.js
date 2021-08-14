/* eslint-disable no-whitespace-before-property */
import { assert }   from 'fgc-core';
import ohm          from 'ohm-js';

// Schema QUAlifier oPerator
// TODO: yeah, it's weak. change it to something better later.

const TYPE_BOOLEAN      = 'BOOLEAN';
const TYPE_NUMERIC      = 'NUMERIC';
const TYPE_STRING       = 'STRING';
const TYPE_UNDEFINED    = 'UNDEFINED';

//----------------------------------------------------------------//
function makeAssetFieldVariant ( value ) {
    
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
    }
}

//----------------------------------------------------------------//
function makeBinaryOp ( opname ) {
    return ( left, right ) => {
        return {
            op:         opname,
            left:       wrapLiteral ( left ),
            right:      wrapLiteral ( right ),
        };
    };
}

//----------------------------------------------------------------//
function makeConstOp ( opname ) {
    return ( value ) => {
        return {
            op:         opname,
            const:      makeAssetFieldVariant ( value ),
        };
    };
}

//----------------------------------------------------------------//
function makeFuncOp () {
    return ( funcName, args ) => {
        return {
            op:        'FUNC',
            func:       funcName,
            args:       args,
        };
    };
}

//----------------------------------------------------------------//
function makeIndexOp ( opname ) {
    return ( arg0, arg1 ) => {
        return {
            op:         opname,
            argName:    arg0 === 'this' ? '' : arg0,
            indexer:    arg1 || '',
        };
    };
}

//----------------------------------------------------------------//
function makeUnaryOp ( opname ) {
    return ( param ) => {
        return {
            op:         opname,
            operand:    wrapLiteral ( param ),
        };
    };
}

//----------------------------------------------------------------//
function wrapLiteral ( param ) {

    return ( typeof ( param ) === 'object' ) && param || SQUAP.CONST ( param );
}

//================================================================//
// parseSquap
//================================================================//

//https://raw.githubusercontent.com/harc/ohm/master/examples/ecmascript/es5.ohm

// the comments here (in the grammer) get appended to the rule results; they aren't just for meaning (see
// 'semantics.addOperation' below.

const grammar = ohm.grammar ( `
    Squap {

        Expr
            = LogicalORExpr

        LogicalORExpr
            = LogicalORExpr "||" LogicalANDExpr     -- or
            | LogicalANDExpr

        LogicalANDExpr
            = LogicalANDExpr "&&" BitwiseORExpr     -- and
            | BitwiseORExpr

        BitwiseORExpr
            = BitwiseORExpr "|" BitwiseXORExpr      -- or
            | BitwiseXORExpr

        BitwiseXORExpr
            = BitwiseXORExpr "^" BitwiseANDExpr     -- xor
            | BitwiseANDExpr

        BitwiseANDExpr
            = BitwiseANDExpr "&" EqualityExpr       -- and
            | EqualityExpr

        EqualityExpr
            = EqualityExpr "==" RelationalExpr      -- equal
            | EqualityExpr "!=" RelationalExpr      -- notEqual
            | RelationalExpr

        RelationalExpr
            = RelationalExpr "<" ShiftExpr          -- less
            | RelationalExpr ">" ShiftExpr          -- greater
            | RelationalExpr "<=" ShiftExpr         -- lessEqual
            | RelationalExpr ">=" ShiftExpr         -- greaterEqual
            | ShiftExpr

        ShiftExpr
            = ShiftExpr "<<" AdditiveExpr           -- left
            | ShiftExpr ">>" AdditiveExpr           -- right
            | AdditiveExpr

        AdditiveExpr
            = AdditiveExpr "+" MultiplicativeExpr   -- add
            | AdditiveExpr "-" MultiplicativeExpr   -- sub
            | MultiplicativeExpr

        MultiplicativeExpr
            = MultiplicativeExpr "*" UnaryExpr      -- mul
            | MultiplicativeExpr "/" UnaryExpr      -- div
            | MultiplicativeExpr "%" UnaryExpr      -- mod
            | UnaryExpr

        UnaryExpr
            = "-"    UnaryExpr  -- neg
            | "~"    UnaryExpr  -- bitwiseNot
            | "!"    UnaryExpr  -- logicalNot
            | "#"    UnaryExpr  -- length
            | FuncExpr

        FuncExpr
           = funcname "(" ListOf<Expr, ","> ")"     -- call
           | FieldExpr

        FieldExpr
            = identifier "[" ( string ) "]"         -- index
            | "[" ( string ) "]"                    -- indexThis
            | identifier                            -- param
            | PrimaryExpr

        PrimaryExpr
            = "(" Expr ")"  -- parens
            | literal

        funcname
            = "has"

        identifier
            = letter ( "_" | alnum )*

        literal
            = "true"        -- true
            | "false"       -- false
            | string
            | number

        number
            = digit+ "." digit+ (("E"|"e") ("+"|"-")? digit+)?      -- dec
            | digit+                                                -- int

        string
            = "\\\"" ( ~"\\\"" any )* "\\\""
            | "'" ( ~"'" any )* "'"
    }
` );

const semantics = grammar.createSemantics ();

const SQUAP = {
    ADD:                makeBinaryOp    ( 'ADD' ),                  // +
    AND:                makeBinaryOp    ( 'AND' ),                  // &&
    BW_AND:             makeBinaryOp    ( 'BW_AND' ),               // &
    BW_NOT:             makeBinaryOp    ( 'BW_NOT' ),               // ~
    BW_OR:              makeBinaryOp    ( 'BW_OR' ),                // |
    BW_XOR:             makeBinaryOp    ( 'BW_XOR' ),               // ^
    CONST:              makeConstOp     ( 'CONST' ),
    DIV:                makeBinaryOp    ( 'DIV' ),                  // /
    EQUAL:              makeBinaryOp    ( 'EQUAL' ),                // ==     
    FUNC:               makeFuncOp      (),
    GREATER:            makeBinaryOp    ( 'GREATER' ),              // >
    GREATER_OR_EQUAL:   makeBinaryOp    ( 'GREATER_OR_EQUAL' ),     // >=
    INDEX:              makeIndexOp     ( 'INDEX' ),
    LESS:               makeBinaryOp    ( 'LESS' ),                 // <
    LESS_OR_EQUAL:      makeBinaryOp    ( 'LESS_OR_EQUAL' ),        // <=
    LENGTH:             makeUnaryOp     ( 'LENGTH' ),               // #
    MOD:                makeBinaryOp    ( 'MOD' ),                  // %
    MUL:                makeBinaryOp    ( 'MUL' ),                  // *
    NEG:                makeUnaryOp     ( 'NEG' ),                  // -
    NOT:                makeUnaryOp     ( 'NOT' ),                  // !
    NOT_EQUAL:          makeBinaryOp    ( 'NOT_EQUAL' ),            // !=
    OR:                 makeBinaryOp    ( 'OR' ),                   // ||
    SHIFT_LEFT:         makeBinaryOp    ( 'SHIFT_LEFT' ),           // <<
    SHIFT_RIGHT:        makeBinaryOp    ( 'SHIFT_RIGHT' ),          // >>
    SUB:                makeBinaryOp    ( 'SUB' ),                  // -
}

semantics.addOperation ( 'eval', {

    LogicalORExpr_or: function ( l, op, r ) {
        return SQUAP.OR ( l.eval (), r.eval ());
    },

    LogicalANDExpr_and: function ( l, op, r ) {
        return SQUAP.AND ( l.eval (), r.eval ());
    },

    BitwiseORExpr_or: function ( l, op, r ) {
        return SQUAP.BW_OR ( l.eval (), r.eval ());
    },

    BitwiseXORExpr_xor: function ( l, op, r ) {
        return SQUAP.BW_XOR ( l.eval (), r.eval ());
    },

    BitwiseANDExpr_and: function ( l, op, r ) {
        return SQUAP.BW_AND ( l.eval (), r.eval ());
    },

    EqualityExpr_equal: function ( l, op, r ) {
        return SQUAP.EQUAL ( l.eval (), r.eval ());
    },

    EqualityExpr_notEqual: function ( l, op, r ) {
        return SQUAP.NOT_EQUAL ( l.eval (), r.eval ());
    },

    RelationalExpr_less: function ( l, op, r ) {
        return SQUAP.LESS ( l.eval (), r.eval ());
    },

    RelationalExpr_greater: function ( l, op, r ) {
        return SQUAP.GREATER ( l.eval (), r.eval ());
    },

    RelationalExpr_lessEqual: function ( l, op, r ) {
        return SQUAP.LESS_OR_EQUAL ( l.eval (), r.eval ());
    },

    RelationalExpr_greaterEqual: function ( l, op, r ) {
        return SQUAP.GREATER_OR_EQUAL ( l.eval (), r.eval ());
    },

    ShiftExpr_left: function ( l, op, r ) {
        return SQUAP.SHIFT_LEFT ( l.eval (), r.eval ());
    },

    ShiftExpr_right: function ( l, op, r ) {
        return SQUAP.SHIFT_RIGHT ( l.eval (), r.eval ());
    },

    AdditiveExpr_add: function ( l, op, r ) {
        return SQUAP.ADD ( l.eval (), r.eval ());
    },

    AdditiveExpr_sub: function ( l, op, r ) {
        return SQUAP.SUB ( l.eval (), r.eval ());
    },

    MultiplicativeExpr_mul: function ( l, op, r ) {
        return SQUAP.MUL ( l.eval (), r.eval ());
    },

    MultiplicativeExpr_div: function ( l, op, r ) {
        return SQUAP.DIV ( l.eval (), r.eval ());
    },

    MultiplicativeExpr_mod: function ( l, op, r ) {
        return SQUAP.MOD ( l.eval (), r.eval ());
    },

    UnaryExpr_length: function ( op, v ) {
        return SQUAP.LENGTH ( v.eval ());
    },

    UnaryExpr_neg: function ( op, v ) {
        return SQUAP.NEG ( v.eval ());
    },

    UnaryExpr_bitwiseNot: function ( op, v ) {
        return SQUAP.BW_NOT ( v.eval ());
    },

    UnaryExpr_logicalNot: function ( op, v ) {
        return SQUAP.NOT ( v.eval ());
    },

    FuncExpr_call: function ( funcname, lp, args, rp ) {
        return SQUAP.FUNC ( funcname.sourceString, args.asIteration ().eval ());
    },

    FieldExpr_index: function ( id, lb, e, rb ) {
        e = e.sourceString;
        return SQUAP.INDEX ( id.sourceString, e === '@' ? e : e.slice ( 1, -1 )); // can be a fieldname or a symbol
    },

    FieldExpr_indexThis: function ( lb, e, rb ) {
        e = e.sourceString;
        return SQUAP.INDEX ( 'this', e === '@' ? e : e.slice ( 1, -1 )); // can be a fieldname or a symbol
    },

    FieldExpr_param: function ( v ) {
        return SQUAP.INDEX ( this.sourceString );
    },

    PrimaryExpr_parens: function ( lp, e, rp ) {
        return e.eval ();
    },

    literal_true: function ( v ) {
        return SQUAP.CONST ( true );
    },

    literal_false: function ( v ) {
        return SQUAP.CONST ( false );
    },

    number_dec: function ( numerator, dot, denominator, e, sign, exp ) {
        return SQUAP.CONST ( Number ( this.sourceString ));
    },

    number_int: function ( v ) {
        return SQUAP.CONST ( Number ( this.sourceString ));
    },

    string: function ( lq, s, rq ) {
        return SQUAP.CONST ( this.sourceString.slice ( 1, -1 ));
    },
});

//----------------------------------------------------------------//
export function parseSquap ( str ) {

    if ( !str ) return SQUAP.CONST ( true );

    const matchResult = grammar.match ( str );
    if ( !matchResult.succeeded ()) throw new Error ( matchResult.message );
    return semantics ( matchResult ).eval ();
}
