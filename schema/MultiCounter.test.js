/* eslint-disable no-whitespace-before-property */

const multiCounter      = require ( './multiCounter' );

//----------------------------------------------------------------//
it ( 'counts correctly', () => {

    let counter = new multiCounter.MultiCounter ( 3 );

    counter.setLimit ( 0, 10 );
    counter.setLimit ( 1, 10 );
    counter.setLimit ( 2, 10 );

    for ( let i = 0; i < 150; ++i, counter.increment ()) {

        let hundreds    = Math.trunc ( i / 100 ) % 10;
        let tens        = Math.trunc ( i / 10 ) % 10;
        let ones        = i % 10;

        expect ( counter.check ( hundreds, tens, ones )).toEqual ( true );
    }
});


//----------------------------------------------------------------//
it ( 'cycles correctly', () => {

    let counter = new multiCounter.MultiCounter ( 2 );

    counter.setLimit ( 0, 10 );
    counter.setLimit ( 1, 10 );

    for ( let i = 0; i < 100; ++i, counter.increment ()) {}
    expect ( counter.cycles ).toEqual ( 1 );
});

//----------------------------------------------------------------//
it ( 'handles weird counting schemes', () => {

    let counter = new multiCounter.MultiCounter ( 3 );

    counter.setLimit ( 0, 3 );
    counter.setLimit ( 1, 0 );
    counter.setLimit ( 2, 2 );

    for ( let i = 0; i < 3; ++i ) {
        for ( let j = 0; j < 2; ++j ) {
            expect ( counter.check ( i, 0, j )).toEqual ( true );
            counter.increment ();
        }
    }
    expect ( counter.check ( 0, 0, 0 )).toEqual ( true );
    expect ( counter.cycles ).toEqual ( 1 );
});
