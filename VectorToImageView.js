// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import * as changedpi               from 'changedpi';
import { hooks }                    from 'fgc';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { observer }                 from 'mobx-react';
import React                        from 'react';
import ReactDomServer               from 'react-dom/server';

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
