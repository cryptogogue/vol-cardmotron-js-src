// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

export const CORS_PROXY = 'https://www.cardmotron.com/cors/';

export const DEFAULT_ZOOM = 1.00;

export const MM_TO_IN = 0.03937007874;

export const PAGE_TYPE = {
    US_LETTER:          'US_LETTER',
    US_LEGAL:           'US_LEGAL',
    US_LEDGER:          'US_LEDGER',
    A4:                 'A4',
    A3:                 'A3',
    A2:                 'A2',
};

export const SORT_MODE = {
    ALPHA_ATOZ:     'ALPHA_ATOZ',
    ALPHA_ZTOA:     'ALPHA_ZTOA',
};

export const WEB_LAYOUT = 'WEB';

export const LAYOUT_DROPDOWN_OPTIONS = [
    WEB_LAYOUT,
    PAGE_TYPE.US_LETTER,
    PAGE_TYPE.US_LEGAL,
    PAGE_TYPE.US_LEDGER,
    PAGE_TYPE.A4,
    PAGE_TYPE.A3,
];

export const ZOOM_DROPDOWN_OPTIONS = [
    0.25,
    0.50,
    0.75,
    1.00,
    1.25,
    1.50,
    2.00
];

//----------------------------------------------------------------//
export function getFriendlyNameForLayout ( layoutName ) {

    switch ( layoutName ) {
        case WEB_LAYOUT:                return 'Web';
        case PAGE_TYPE.US_LETTER:       return 'US Letter (8.5" x 11")';
        case PAGE_TYPE.US_LEGAL:        return 'US Legal (8.5" x 14")';
        case PAGE_TYPE.US_LEDGER:       return 'US Ledger (11" x 17")';
        case PAGE_TYPE.A4:              return 'A4 (210mm x 297mm)';
        case PAGE_TYPE.A3:              return 'A3 (297mm x 420mm)';
        case PAGE_TYPE.A2:              return 'A2 (420mm x 594mm)';
    }
}

//----------------------------------------------------------------//
export function getInchesForPage ( pageType ) {

    switch ( pageType ) {
        case PAGE_TYPE.US_LETTER:       return { width: 8.5, height: 11 };
        case PAGE_TYPE.US_LEGAL:        return { width: 8.5, height: 14 };
        case PAGE_TYPE.US_LEDGER:       return { width: 11, height: 17 };
        case PAGE_TYPE.A4:              return { width: 210 * MM_TO_IN, height: 297 * MM_TO_IN };
        case PAGE_TYPE.A3:              return { width: 297 * MM_TO_IN, height: 420 * MM_TO_IN };
        case PAGE_TYPE.A2:              return { width: 420 * MM_TO_IN, height: 594 * MM_TO_IN };
    }
}

//----------------------------------------------------------------//
export function getFriendlyNameForZoom ( zoom ) {
    return `${ zoom * 100 }%`;
}

//----------------------------------------------------------------//
export function isPrintLayout ( pageType ) {
    return _.has ( PAGE_TYPE, pageType );
}
