// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as changedpi               from 'changedpi';
import { hooks }                    from 'fgc';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { observer }                 from 'mobx-react';
import React                        from 'react';
import ReactDomServer               from 'react-dom/server';

const TEST_SVG = `
    <svg version="1.1" baseProfile="basic" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="8.375in" height="10.875in" viewBox="0 0 2512.5 3262.5" preserveAspectRatio="xMidYMid meet">
        <g transform="">
            <g style="fill:none;stroke:#000000;stroke-width:1">
                <line x1="131.25" y1="0" x2="131.25" y2="3262.5"></line>
                <line x1="881.25" y1="0" x2="881.25" y2="3262.5"></line>
                <line x1="1631.25" y1="0" x2="1631.25" y2="3262.5"></line>
                <line x1="2381.25" y1="0" x2="2381.25" y2="3262.5"></line>
                <line x1="0" y1="56.25" x2="2512.5" y2="56.25"></line>
                <line x1="0" y1="1106.25" x2="2512.5" y2="1106.25"></line>
                <line x1="0" y1="2156.25" x2="2512.5" y2="2156.25"></line>
                <line x1="0" y1="3206.25" x2="2512.5" y2="3206.25"></line>
            </g>

            <g transform="translate ( 131.25, 56.25) scale ( 1 1)">
                <svg x="0" y="0" width="750" height="1050" viewBox="0 0 750 1050" preserveAspectRatio="xMidYMid meet">
                    <g transform="scale ( 1 1)">
                        <g>
                            <rect x = '0' y = '0' width = '750' height = '1050' fill = 'red'/>
                            <circle cx = '375' cy = '525' r = '375' fill = 'black'/>
                        </g>
                    </g>
                </svg>
                <rect width="750" height="1050" style="fill:none;stroke:#ffffff;stroke-width:3"></rect>
            </g>

            <g transform="translate ( 881.25, 56.25) scale ( 1 1)">
                <svg x="0" y="0" width="750" height="1050" viewBox="0 0 750 1050" preserveAspectRatio="xMidYMid meet">
                    <g transform="scale ( 1 1)">
                        <g>
                            <rect x = '0' y = '0' width = "750" height = "1050" fill = 'red'/>
                            <circle cx = '375' cy = '525' r = '375' fill = 'black'/>
                        </g>
                    </g>
                </svg>
                <rect width="750" height="1050" style="fill:none;stroke:#ffffff;stroke-width:3"></rect>
            </g>

            <g transform="translate ( 1631.25, 56.25) scale ( 1 1)">
                <svg x="0" y="0" width="750" height="1050" viewBox="0 0 750 1050" preserveAspectRatio="xMidYMid meet">
                    <g transform="scale ( 1 1)">
                        <g>
                            <rect x = '0' y = '0' width = "750" height = "1050" fill = 'red'/>
                            <circle cx = '375' cy = '525' r = '375' fill = 'black'/>
                        </g>
                    </g>
                </svg>
                <rect width="750" height="1050" style="fill:none;stroke:#ffffff;stroke-width:3">
                </rect>
            </g>
        </g>
    </svg>
`;

//================================================================//
// VectorToImageViewController
//================================================================//
class VectorToImageViewController {

    @observable dataURL     = false;

    //----------------------------------------------------------------//
    constructor ( svg, width, height, dpi ) {

        const svgBlob   = new Blob ([ svg ], { type: 'image/svg+xml' });
        const svgURL    = URL.createObjectURL ( svgBlob );

        const image     = new Image ();
        image.width     = width;
        image.height    = height;
        image.src       = svgURL;

        image.onload = () => {

            URL.revokeObjectURL ( svgURL );

            const canvas    = document.createElement ( 'canvas' );
            canvas.width    = width;
            canvas.height   = height;

            const ctx = canvas.getContext ( '2d' );
            ctx.drawImage ( image, 0, 0 );

            const dataURL = changedpi.changeDpiDataUrl ( canvas.toDataURL (), dpi );

            runInAction (() => {
                this.dataURL = dataURL;
            });
        }
    }

    //----------------------------------------------------------------//
    finalize () {

        if ( this.dataURL ) {
            URL.revokeObjectURL ( this.dataURL );
        }
    }
}

//================================================================//
// VectorToImageView
//================================================================//
export const VectorToImageView = observer (( props ) => {

    const { width, height } = props;

    const svg = ReactDomServer.renderToStaticMarkup ( props.svg );
    const dpi = props.dpi || 300;

    const controller = hooks.useFinalizable (() => new VectorToImageViewController ( svg, width, height, dpi ));

    return (
        <div style = {{
            width: `${ width / dpi }in`,
            height: `${ height / dpi }in`,
        }}>
            <If condition = { controller.dataURL !== false }>
                <img
                    src     = { controller.dataURL }
                    width   = { width }
                    height  = { height }
                    style   = {{ width: '100%', height: '100%' }}
                />
            </If>
        </div>
    );
});
