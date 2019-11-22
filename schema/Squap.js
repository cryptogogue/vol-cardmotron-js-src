/* eslint-disable no-whitespace-before-property */

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
        this.paramID = template.paramID;
        this.value = template.value;
    }
}

//================================================================//
// AbstractUnarySquap
//================================================================//
class AbstractUnarySquap extends AbstractSquap {

    //----------------------------------------------------------------//
    constructor ( template ) {
        super ( template );
        this.param = makeSquap ( template.param );
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
// AssetTypeSquap
//================================================================//
class AssetTypeSquap extends AbstractIndexSquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {

        const arg           = opArgs.assets [ this.paramID || 0 ];
        const className     = this.value;

        return ( arg.type === className );
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
// FieldSquap
//================================================================//
class FieldSquap extends AbstractIndexSquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {

        const arg           = opArgs.assets [ this.paramID || 0 ];
        const fieldName     = this.value;

        if ( arg.fields.hasOwnProperty ( fieldName )) {
            return arg.fields [ fieldName ];
        }
        return false;
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
// KeywordSquap
//================================================================//
class KeywordSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal       = this.left.eval ( opArgs );
        const rightVal      = this.right.eval ( opArgs );
        return ( leftVal.split ( ' ' ).indexOf ( rightVal ) >= 0 );
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
        const val = this.param.eval ( opArgs );
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
class XorSquap extends AbstractBinarySquap {

    //----------------------------------------------------------------//
    eval ( opArgs ) {
        const leftVal = this.left.eval ( opArgs );
        const rightVal = this.right.eval ( opArgs );
        return !leftVal !== !rightVal;
    }
}

//----------------------------------------------------------------//
const factoryTable = {

    ADD:                ( template ) => new AddSquap ( template ),
    AND:                ( template ) => new AndSquap ( template ),
    ASSET_TYPE:         ( template ) => new AssetTypeSquap ( template ),
    CONST:              ( template ) => new ConstSquap ( template ),
    DIV:                ( template ) => new DivSquap ( template ),
    EQUAL:              ( template ) => new EqualSquap ( template ),
    FIELD:              ( template ) => new FieldSquap ( template ),
    GREATER:            ( template ) => new GreaterSquap ( template ),
    GREATER_OR_EQUAL:   ( template ) => new GreaterOrEqualSquap ( template ),
    KEYWORD:            ( template ) => new KeywordSquap ( template ),
    LESS:               ( template ) => new LessSquap ( template ),
    LESS_OR_EQUAL:      ( template ) => new LessOrEqualSquap ( template ),
    MOD:                ( template ) => new ModSquap ( template ),
    MUL:                ( template ) => new MulSquap ( template ),
    NOT:                ( template ) => new NotSquap ( template ),
    NOT_EQUAL:          ( template ) => new NotEqualSquap ( template ),
    OR:                 ( template ) => new OrSquap ( template ),
    SUB:                ( template ) => new SubSquap ( template ),
    XOR:                ( template ) => new XorSquap ( template ),
}

//----------------------------------------------------------------//
export function makeSquap ( template ) {

    return factoryTable [ template.op ]( template );
}
