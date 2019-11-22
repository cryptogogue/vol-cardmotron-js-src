/* eslint-disable no-whitespace-before-property */

import { Schema }                                           from '../schema/Schema';
import { buildSchema, op }                                  from '../schema/SchemaBuilder';

//----------------------------------------------------------------//
test ( 'test json escaping', () => {

    const jsonStringIn = `{"escape":"\\"123\\""}`;
    console.log ( 'ESCAPE', jsonStringIn );
    
    const json = JSON.parse ( jsonStringIn );
    expect ( json.escape === '\"123\"' ).toBe ( true );

    const jsonStringOut = JSON.stringify ( json );
    expect ( jsonStringOut === jsonStringIn ).toBe ( true );
});

//----------------------------------------------------------------//
test ( 'define schema', () => {

    let schemaTemplate = buildSchema ( 'TEST_SCHEMA', 'schema.lua' )

        //----------------------------------------------------------------//
        .definition ( 'pack' )
            .field ( 'displayName', 'Booster Pack' )
     
        .definition ( 'common' )
            .field ( 'displayName', 'Common' )
            .field ( 'keywords', 'card common' )
     
        .definition ( 'rare' )
            .field ( 'displayName', 'Rare' )
            .field ( 'keywords', 'card rare' )
     
        .definition ( 'ultraRare' )
            .field ( 'displayName', 'Ultra-Rare' )
            .field ( 'keywords', 'card ultra-rare' )

        //----------------------------------------------------------------//
        .method ( 'makeRare', 'Combine two commons to make a rare.' )
            .assetArg ( 'common0', op.ASSET_TYPE ( 'common' ))
            .assetArg ( 'common1', op.ASSET_TYPE ( 'common' ))

        .method ( 'makeUltraRare', 'Combine two rares to make an ultra-rare.' )
            .assetArg ( 'rare0', op.ASSET_TYPE ( 'rare' ))
            .assetArg ( 'rare1', op.ASSET_TYPE ( 'rare' ))

        .method ( 'openPack', 'Open a booster pack.' )
            .assetArg ( 'pack', op.ASSET_TYPE ( 'pack' ))

        .done ()

    let schema = new Schema ( schemaTemplate );

    let assets = {};

    const pack0         = schema.addTestAsset ( assets, 'pack' );
    const common0       = schema.addTestAsset ( assets, 'common' );
    const common1       = schema.addTestAsset ( assets, 'common' );
    const rare0         = schema.addTestAsset ( assets, 'rare' );
    const rare1         = schema.addTestAsset ( assets, 'rare' );
    const ultraRare0    = schema.addTestAsset ( assets, 'ultraRare' );

    let binding = schema.generateBinding ( assets );

    // test binding analysis

    // all of the schema methods should be valid for this binding.
    expect ( binding.methodIsValid ( 'makeRare' )).toBe ( true );
    expect ( binding.methodIsValid ( 'makeUltraRare' )).toBe ( true );
    expect ( binding.methodIsValid ( 'openPack' )).toBe ( true );

    // 'makeRare' only valid on two commons.
    expect ( binding.methodIsValid ( 'makeRare', pack0 )).toBe ( false );
    expect ( binding.methodIsValid ( 'makeRare', common0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'makeRare', common1 )).toBe ( true );
    expect ( binding.methodIsValid ( 'makeRare', rare0 )).toBe ( false );
    expect ( binding.methodIsValid ( 'makeRare', rare1 )).toBe ( false );
    expect ( binding.methodIsValid ( 'makeRare', ultraRare0 )).toBe ( false );

    // 'makeUltraRare' only valid on two rares.
    expect ( binding.methodIsValid ( 'makeUltraRare', pack0 )).toBe ( false );
    expect ( binding.methodIsValid ( 'makeUltraRare', common0 )).toBe ( false );
    expect ( binding.methodIsValid ( 'makeUltraRare', common1 )).toBe ( false );
    expect ( binding.methodIsValid ( 'makeUltraRare', rare0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'makeUltraRare', rare1 )).toBe ( true );
    expect ( binding.methodIsValid ( 'makeUltraRare', ultraRare0 )).toBe ( false );

    // 'openPack' only valid on packs.
    expect ( binding.methodIsValid ( 'openPack', pack0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'openPack', common0 )).toBe ( false );
    expect ( binding.methodIsValid ( 'openPack', common1 )).toBe ( false );
    expect ( binding.methodIsValid ( 'openPack', rare0 )).toBe ( false );
    expect ( binding.methodIsValid ( 'openPack', rare1 )).toBe ( false );
    expect ( binding.methodIsValid ( 'openPack', ultraRare0 )).toBe ( false );
});

//----------------------------------------------------------------//
test ( 'test operators', () => {

    let schemaTemplate = buildSchema ( 'TEST_SCHEMA', 'schema.lua' )

        //----------------------------------------------------------------//
        .definition ( 'testAsset' )
            .field ( 'numberField', 123 )
            .field ( 'stringField', 'oneTwoThree' )
            .field ( 'keywordField', 'one two three' )

        //----------------------------------------------------------------//
        .method ( 'assetType' )
            .assetArg ( 'arg0', op.ASSET_TYPE ( 'testAsset' ))

        .method ( 'keyword' )
            .assetArg ( 'arg0', op.KEYWORD ( op.FIELD ( 'keywordField' ), 'two' ))

        //----------------------------------------------------------------//
        .method ( 'numericEqual' )
            .assetArg ( 'arg0', op.EQUAL ( op.FIELD ( 'numberField' ), 123 ))

        .method ( 'stringEqual' )
            .assetArg ( 'arg0', op.EQUAL ( op.FIELD ( 'stringField' ), 'oneTwoThree' ))

        .method ( 'numericNotEqual' )
            .assetArg ( 'arg0', op.NOT_EQUAL ( op.FIELD ( 'numberField' ), 321 ))

        .method ( 'stringNotEqual' )
            .assetArg ( 'arg0', op.NOT_EQUAL ( op.FIELD ( 'stringField' ), 'threeTwoOne' ))

        .method ( 'numericGreater' )
            .assetArg ( 'arg0', op.GREATER ( op.FIELD ( 'numberField' ), 100 ))

        .method ( 'numericGreaterOrEqual' )
            .assetArg ( 'arg0', op.GREATER_OR_EQUAL ( op.FIELD ( 'numberField' ), 123 ))

        .method ( 'numericLess' )
            .assetArg ( 'arg0', op.LESS ( op.FIELD ( 'numberField' ), 200 ))

        .method ( 'numericLessOrEqual' )
            .assetArg ( 'arg0', op.LESS_OR_EQUAL ( op.FIELD ( 'numberField' ), 123 ))

        .method ( 'logicalAnd' )
            .assetArg ( 'arg0', op.AND (
                op.EQUAL ( op.FIELD ( 'numberField' ), 123 ),                   // true
                op.EQUAL ( op.FIELD ( 'stringField' ), 'oneTwoThree' )          // true
            )
        )
        .method ( 'logicalNotAnd' )
            .assetArg ( 'arg0', op.NOT (
                op.AND (
                    op.EQUAL ( op.FIELD ( 'numberField' ), 123 ),               // true
                    op.EQUAL ( op.FIELD ( 'stringField' ), 'threeTwoOne' )      // false
                )
            )
        )
        .method ( 'logicalOr' )
            .assetArg ( 'arg0', op.OR (
                op.EQUAL ( op.FIELD ( 'numberField' ), 123 ),                   // true
                op.EQUAL ( op.FIELD ( 'stringField' ), 'threeTwoOne' )          // false
            )
        )
        .method ( 'logicalNot' )
            .assetArg ( 'arg0', op.NOT ( op.EQUAL ( op.FIELD ( 'numberField' ), 321 )))

        .method ( 'logicalXor' )
            .assetArg ( 'arg0', op.XOR (
                op.EQUAL ( op.FIELD ( 'numberField' ), 123 ),                   // true
                op.EQUAL ( op.FIELD ( 'stringField' ), 'threeTwoOne' )          // false
            )
        )
        .method ( 'logicalNotXor' )
            .assetArg ( 'arg0', op.NOT (
                op.XOR (
                    op.EQUAL ( op.FIELD ( 'numberField' ), 123 ),               // true
                    op.EQUAL ( op.FIELD ( 'stringField' ), 'oneTwoThree' )      // true
                )
            )
        )

        .method ( 'add' )
            .assetArg ( 'arg0', op.EQUAL ( op.ADD ( op.FIELD ( 'numberField' ), 2 ), 125 ))

        .method ( 'div' )
            .assetArg ( 'arg0', op.EQUAL ( op.DIV ( op.FIELD ( 'numberField' ), 2 ), 61.5 ))

        .method ( 'mod' )
            .assetArg ( 'arg0', op.EQUAL ( op.MOD ( op.FIELD ( 'numberField' ), 120 ), 3 ))

        .method ( 'mul' )
            .assetArg ( 'arg0', op.EQUAL ( op.MUL ( op.FIELD ( 'numberField' ), 2 ), 246 ))

        .method ( 'sub' )
            .assetArg ( 'arg0', op.EQUAL ( op.SUB ( op.FIELD ( 'numberField' ), 3 ), 120 ))

        .done ()

    let schema = new Schema ( schemaTemplate );

    let assets = {};
    const testAsset0 = schema.addTestAsset ( assets, 'testAsset' );

    let binding = schema.generateBinding ( assets );

    // test binding analysis

    // all of the schema methods should be valid for this binding.
    expect ( binding.methodIsValid ( 'assetType' )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericEqual' )).toBe ( true );
    expect ( binding.methodIsValid ( 'stringEqual' )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericNotEqual' )).toBe ( true );
    expect ( binding.methodIsValid ( 'stringNotEqual' )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericGreater' )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericGreaterOrEqual' )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericLess' )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericLessOrEqual' )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalAnd' )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalNotAnd' )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalOr' )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalNot' )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalXor' )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalNotXor' )).toBe ( true );

    expect ( binding.methodIsValid ( 'add' )).toBe ( true );
    expect ( binding.methodIsValid ( 'div' )).toBe ( true );
    expect ( binding.methodIsValid ( 'mod' )).toBe ( true );
    expect ( binding.methodIsValid ( 'mul' )).toBe ( true );
    expect ( binding.methodIsValid ( 'sub' )).toBe ( true );

    expect ( binding.methodIsValid ( 'assetType', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericEqual', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'stringEqual', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericNotEqual', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'stringNotEqual', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericGreater', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericGreaterOrEqual', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericLess', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'numericLessOrEqual', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalAnd', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalNotAnd', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalOr', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalNot', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalXor', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'logicalNotXor', testAsset0 )).toBe ( true );

    expect ( binding.methodIsValid ( 'add', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'div', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'mod', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'mul', testAsset0 )).toBe ( true );
    expect ( binding.methodIsValid ( 'sub', testAsset0 )).toBe ( true );
});
