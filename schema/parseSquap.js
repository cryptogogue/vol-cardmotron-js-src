/* eslint-disable no-whitespace-before-property */

import ohm          from 'ohm-js';

const TYPE_BOOLEAN      = 'BOOLEAN';
const TYPE_NUMERIC      = 'NUMERIC';
const TYPE_STRING       = 'STRING';
const TYPE_UNDEFINED    = 'UNDEFINED';

//----------------------------------------------------------------//
function makeAssetFieldValue ( value ) {
    
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
            assert ( false );
    }

    return {
        type:           type,
        value:          value,
        mutable:        false,
        scriptable:     true,
        alternates:     {},
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
            const:      makeAssetFieldValue ( value ),
        };
    };
}

//----------------------------------------------------------------//
// function makeFuncOp ( opname ) {
//     return ( ...args ) => {

//         let cleanArgs = [];

//         args.forEach ( function ( arg ) {

//             let argType = typeof ( arg );

//             if ( argType != 'object' ) {
//                 arg = SQUAP.CONST ( arg );
//             }
//             cleanArgs.push ( arg );
//         });

//         return {
//             op:         opname,
//             args:       cleanArgs,
//         };
//     };
// }

//----------------------------------------------------------------//
function makeIndexOp ( opname ) {
    return ( arg0, arg1 ) => {

        // index args are always assumed to be string literals for now.
        // can add support for operator args later. if we need it.

        if ( arg0 && arg1 ) {
            return {
                op:         opname,
                paramID:    arg0,
                value:      arg1,
            };
        }
        return {
            op:         opname,
            value:      arg0,
        };
    };
}

//----------------------------------------------------------------//
function makeUnaryOp ( opname ) {
    return ( param ) => {
        return {
            op:         opname,
            param:      wrapLiteral ( param ),
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
            | CallExpr

        CallExpr
           = identifier "(" ListOf<Expr, ","> ")"   -- call
           | PrimaryExpr

        PrimaryExpr
            = "(" Expr ")"  -- parens
            | identifier
            | literal

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
    BW_OR:              makeBinaryOp    ( 'BW_OR' ),                // |
    BW_NOT:             makeBinaryOp    ( 'BW_NOT' ),               // ~
    BW_XOR:             makeBinaryOp    ( 'BW_XOR' ),               // ^
    // ASSET_TYPE:         makeIndexOp     ( 'ASSET_TYPE' ),
    CONST:              makeConstOp     ( 'CONST' ),
    DIV:                makeBinaryOp    ( 'DIV' ),                  // /
    EQUAL:              makeBinaryOp    ( 'EQUAL' ),                // ==
    // FIELD:              makeIndexOp     ( 'FIELD' ),                
    GREATER:            makeBinaryOp    ( 'GREATER' ),              // >
    GREATER_OR_EQUAL:   makeBinaryOp    ( 'GREATER_OR_EQUAL' ),     // >=
    // KEYWORD:            makeBinaryOp    ( 'KEYWORD' ),          
    LESS:               makeBinaryOp    ( 'LESS' ),                 // <
    LESS_OR_EQUAL:      makeBinaryOp    ( 'LESS_OR_EQUAL' ),        // <=
    MOD:                makeBinaryOp    ( 'MOD' ),                  // %
    MUL:                makeBinaryOp    ( 'MUL' ),                  // *
    NEG:                makeUnaryOp     ( 'NEG' ),             // -
    NOT:                makeUnaryOp     ( 'NOT' ),                  // !
    NOT_EQUAL:          makeBinaryOp    ( 'NOT_EQUAL' ),            // !=
    OR:                 makeBinaryOp    ( 'OR' ),                   // ||
    SHIFT_LEFT:         makeBinaryOp    ( 'SHIFT_LEFT' ),           // <<
    SHIFT_RIGHT:        makeBinaryOp    ( 'SHIFT_RIGHT' ),          // >>
    SUB:                makeBinaryOp    ( 'SUB' ),                  // -
}

semantics.addOperation ( 'eval', {

    // Expr: function ( e ) {
    //     return 0;
    // },

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

    UnaryExpr_neg: function ( op, v ) {
        return SQUAP.NEG ( v.eval ());
    },

    UnaryExpr_bitwiseNot: function ( op, v ) {
        return SQUAP.BW_NOT ( v.eval ());
    },

    UnaryExpr_logicalNot: function ( op, v ) {
        return SQUAP.NOT ( v.eval ());
    },

    // CallExpr: function () { return 0; },
    PrimaryExpr_parens: function ( lp, e, rp ) {
        return e.eval ();
    },

    identifier: function ( first, rest ) {
        return SQUAP.CONST ( this.stringValue ); // TODO: field op or function op
    },

    literal_true: function ( v ) {
        return SQUAP.CONST ( true );
    },

    literal_false: function ( v ) {
        return SQUAP.CONST ( false );
    },

    number_dec: function ( numerator, dot, denominator, e, sign, exp ) {
        return SQUAP.CONST ( Number ( this.stringValue ));
    },

    number_int: function ( v ) {
        return SQUAP.CONST ( Number ( this.stringValue ));
    },

    string: function ( lq, s, rq ) {
        return SQUAP.CONST ( this.stringValue );
    },
});

//----------------------------------------------------------------//
export function parseSquap ( str ) {

    const matchResult = grammar.match ( str );
    if ( !matchResult.succeeded ()) throw new Error ( matchResult.message );
    return semantics ( matchResult ).eval ();
}
