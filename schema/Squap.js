/* eslint-disable no-whitespace-before-property */

import _                                    from 'lodash';

//================================================================//
// AbstractSquap
//================================================================//
class AbstractSquap {

    //----------------------------------------------------------------//
    eval ( param ) {
        return false;
    }
}

//================================================================//
// AbstractBinarySquap
//================================================================//
class AbstractBinarySquap extends AbstractSquap {

    //----------------------------------------------------------------//
    constructor ( template ) {
        super ( template );
        this.left = makeSquap ( template.left );
        this.right = makeSquap ( template.right );
    }
}

//================================================================//
// AbstractFunctionSquap
//================================================================//
// class AbstractFunctionSquap extends AbstractSquap {

//     //----------------------------------------------------------------//
//     constructor ( template ) {
//         super ( template );
//         this.args = [];

//         for ( let i in template.args ) {
//             this.args [ i ] = makeSquap ( template.args [ i ]);
//         }
//     }
// }

//================================================================//
// AbstractIndexSquap
//================================================================//
class AbstractIndexSquap extends AbstractSquap {

    //----------------------------------------------------------------//
    constructor ( template ) {
        super ( template );
        this.argName    = template.argName;
        this.indexer    = template.indexer;
    }
}

//================================================================//
// AbstractUnarySquap
//================================================================//
class AbstractUnarySquap extends AbstractSquap {

    //----------------------------------------------------------------//
    constructor ( template ) {
        super ( template );
        this.operand = makeSquap ( template.operand );
    }
}

//================================================================//
// AddSquap
//================================================================//
class AddSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal + rightVal;
    }
}

//================================================================//
// AndSquap
//================================================================//
class AndSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal && rightVal;
    }
}

//================================================================//
// BitwiseAndSquap
//================================================================//
class BitwiseAndSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        return false;
    }
}

//================================================================//
// BitwiseNotSquap
//================================================================//
class BitwiseNotSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        return false;
    }
}

//================================================================//
// BitwiseOrSquap
//================================================================//
class BitwiseOrSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        return false;
    }
}

//================================================================//
// BitwiseXORSquap
//================================================================//
class BitwiseXORSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        return false;
    }
}

//================================================================//
// ConstSquap
//================================================================//
class ConstSquap extends AbstractSquap {

    //----------------------------------------------------------------//
    constructor ( template ) {
        super ( template );
        this.const = template.const;
    }

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        return this.const.value;
    }
}

//================================================================//
// DivSquap
//================================================================//
class DivSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal / rightVal;
    }
}

//================================================================//
// EqualSquap
//================================================================//
class EqualSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal === rightVal;
    }
}

//================================================================//
// GreaterSquap
//================================================================//
class GreaterSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal > rightVal;
    }
}

//================================================================//
// GreaterOrEqualSquap
//================================================================//
class GreaterOrEqualSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal >= rightVal;
    }
}

//================================================================//
// IndexSquap
//================================================================//
class IndexSquap extends AbstractIndexSquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {

        const argName       = this.argName || '';
        const indexer       = this.indexer;

        const arg = opArgs [ argName ];
        if ( !arg ) return false;

        if ( indexer ) {
            return arg.fields && _.has ( arg.fields, indexer ) ? arg.fields [ indexer ].value : false;
        }
        return arg.type ? arg.type : arg;
    }
}

//================================================================//
// LengthSquap
//================================================================//
class LengthSquap extends AbstractUnarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const val = this.operand.eval ( opArgs );
        return typeof ( val ) === 'string' ? val.length : false;
    }
}

//================================================================//
// LessSquap
//================================================================//
class LessSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal < rightVal;
    }
}

//================================================================//
// LessOrEqualSquap
//================================================================//
class LessOrEqualSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal <= rightVal;
    }
}

//================================================================//
// ModSquap
//================================================================//
class ModSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal % rightVal;
    }
}

//================================================================//
// MulSquap
//================================================================//
class MulSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal * rightVal;
    }
}

//================================================================//
// NotSquap
//================================================================//
class NotSquap extends AbstractUnarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const val = this.operand.eval ( opArgs );
        return !val;
    }
}

//================================================================//
// NotEqualSquap
//================================================================//
class NotEqualSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal !== rightVal;
    }
}

//================================================================//
// OrSquap
//================================================================//
class OrSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal || rightVal;
    }
}

//================================================================//
// ShiftLeftSquap
//================================================================//
class ShiftLeftSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        return false;
    }
}

//================================================================//
// ShiftRightSquap
//================================================================//
class ShiftRightSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        return false;
    }
}

//================================================================//
// SubSquap
//================================================================//
class SubSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return leftVal - rightVal;
    }
}

//================================================================//
// XorSquap
//================================================================//
/*
class XorSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return !leftVal !== !rightVal;
    }
}
*/

//----------------------------------------------------------------//
const factoryTable = {

    ADD:                ( template ) => new AddSquap ( template ),
    AND:                ( template ) => new AndSquap ( template ),
    //BW_AND:             ( template ) => new BitwiseAddSquap ( template ),
    //BW_OR:              ( template ) => new BitwiseOrSquap ( template ),
    //BW_NOT:             ( template ) => new BitwiseNotSquap ( template ),
    //BW_XOR:             ( template ) => new BitwiseXORSquap ( template ),
    CONST:              ( template ) => new ConstSquap ( template ),
    DIV:                ( template ) => new DivSquap ( template ),
    EQUAL:              ( template ) => new EqualSquap ( template ),
    GREATER:            ( template ) => new GreaterSquap ( template ),
    GREATER_OR_EQUAL:   ( template ) => new GreaterOrEqualSquap ( template ),
    INDEX:              ( template ) => new IndexSquap ( template ),
    LENGTH:             ( template ) => new LengthSquap ( template ),
    LESS:               ( template ) => new LessSquap ( template ),
    LESS_OR_EQUAL:      ( template ) => new LessOrEqualSquap ( template ),
    MOD:                ( template ) => new ModSquap ( template ),
    MUL:                ( template ) => new MulSquap ( template ),
    NOT:                ( template ) => new NotSquap ( template ),
    NOT_EQUAL:          ( template ) => new NotEqualSquap ( template ),
    OR:                 ( template ) => new OrSquap ( template ),
    //SHIFT_LEFT:         ( template ) => new ShiftLeftSquap ( template ),
    //SHIFT_RIGHT:        ( template ) => new ShiftRightSquap ( template ),
    SUB:                ( template ) => new SubSquap ( template ),
}

//----------------------------------------------------------------//
export function makeSquap ( template ) {

    return factoryTable [ template.op ]( template );
}
