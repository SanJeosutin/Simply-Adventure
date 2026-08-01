"use strict";

import debugLog from '../Logic/debug.js';


export default class Button {
    constructor(btnProperties = {}) {
        const btnName = btnProperties.btnName ?? 'A Button';

        this.btnProperties = {
            btnName,
            btnID: `UI-${btnName}`,
            btnClass: 'btn btn-sm btn-dark m-2',
            btnTimeout: 500,
            ...btnProperties
        };
    }

    create(btnLocation, btnName, btnTimeout = 500, btnClass = 'btn btn-info', btnLabel = null) {
        this.btnProperties = {
            btnName: btnLabel ?? btnName.charAt(0).toUpperCase() + btnName.slice(1),
            btnID: `${btnLocation}-${btnName}`,
            btnClass,
            btnTimeout,
        };

        debugLog('Button created:', {
            location: btnLocation,
            ...this.btnProperties,
        });

        $(`#${btnLocation}`).append(
            $(document.createElement('button')).prop({
                type: 'button',
                innerHTML: this.btnProperties.btnName,
                class: this.btnProperties.btnClass,
                id: this.btnProperties.btnID,
            })
        );
    }

    edit() {

    }

    destroy() {

    }
}
