"use strict";

import debugLog from '../Logic/debug.js';


export default class Display {
    constructor(txtProperties = {}) {
        const txtName = txtProperties.txtName ?? 'A Text';

        this.txtProperties = {
            txtName,
            txtID: `display-${txtName}`,
            txtClass: 'row',
            ...txtProperties
        };
    }

    create(location, txtName, txtClass = 'row') {
        this.txtProperties = {
            txtName: txtName.charAt(0).toUpperCase() + txtName.slice(1),
            txtID: `total-${txtName}`,
            txtClass,
        };

        debugLog('Display created:', {
            location,
            ...this.txtProperties,
        });

        $(`#${location}`).append(
            `<tr>
                <th class="${this.txtProperties.txtClass}">${this.txtProperties.txtName}</th>
                <td id="${this.txtProperties.txtID}"></td>
            </tr>`
        );
    }
}
