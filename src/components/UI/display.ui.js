"use strict";

export default class Display {
    constructor(txtProperties = {}) {
        this.txtProperties = {

            txtName: 'A Text',
            txtID: 'display' + '-' + this.txtName,
            txtClass: 'row',
        }
    }

    create(location, txtName, txtClass = 'row') {

        /** REMOVE WHEN DONE **/
        console.log('-----------------');
        console.log('Display is created from Display.ui class');
        console.log("Location: " + location);
        console.log(this.txtProperties);
        /** REMOVE WHEN DONE **/

        this.txtProperties = {
            txtName: txtName.charAt(0).toUpperCase() + txtName.slice(1),
            txtID: 'total-' + txtName,
            txtClass: txtClass,
        }

        $('#' + location).append(
            `<tr>
                <th class="`+ this.txtProperties.txtClass + `">` + this.txtProperties.txtName + `</th>
                <td id="`+ this.txtProperties.txtID + `"></td>
            </tr>`
        );
    }
}