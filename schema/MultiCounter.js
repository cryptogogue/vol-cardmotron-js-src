/* eslint-disable no-whitespace-before-property */

//================================================================//
// MultiCounter
//================================================================//
export class MultiCounter {

    //----------------------------------------------------------------//
    constructor ( size ) {

        this.size = size;
        this.counters = [];
        this.limits = [];
        this.cycles = 0;

        for ( let i = 0; i < size; ++i ) {
            this.counters [ i ] = 0;
            this.limits [ i ] = 0;
        }
    }

    //----------------------------------------------------------------//
    check ( ...args ) {

        for ( let i = 0; i < this.size; ++i ) {
            if ( args [ i ] !== this.counters [ i ]) return false;
        }
        return true;
    }

    //----------------------------------------------------------------//
    count ( i ) {

        return this.counters [ i ];
    }

    //----------------------------------------------------------------//
    increment () {
        this.incrementRecurse ( this.size - 1 ); // start at the top
    }

    //----------------------------------------------------------------//
    incrementRecurse ( index ) {

        // increment the counter
        this.counters [ index ]++;

        // handle overflow
        if ( this.counters [ index ] >= this.limits [ index ]) {
            this.counters [ index ] = 0;
            if ( index > 0 ) {
                this.incrementRecurse ( index - 1 );
            }
            else {
                this.cycles++;
            }
        }
    }

    //----------------------------------------------------------------//
    reset () {

        for ( let i = 0; i < this.size; ++i ) {
            this.counters [ i ] = 0;
        }
        this.cycles = 0;
    }

    //----------------------------------------------------------------//
    setLimit ( i, limit ) {
        this.limits [ i ] = limit;
    }
}
