"use strict";

export default class Button {
    constructor(btnProperties = {}) {
        this.btnProperties = {
            btnName: 'A Button',
            btnID: 'UI' + '-' + this.btnName,
            btnClass: 'btn btn-sm btn-dark',
            timeout: 500,

            ...btnProperties
        }
    }

    create(btnLocation, btnName, btnTimeout = 500, btnClass = 'btn btn-sm btn-dark') {
        this.btnProperties = {
            btnName: btnName.charAt(0).toUpperCase() + btnName.slice(1),
            btnID: btnLocation + '-' + btnName,
            btnClass: btnClass,
            btnTimeout: btnTimeout,
        }

        /** REMOVE WHEN DONE **/
        console.log('-----------------');
        console.log('Button is created from Button.ui class');
        console.log("Location: " + btnLocation);
        console.log(this.btnProperties);
        /** REMOVE WHEN DONE **/

        $('#'+btnLocation).append(
            $(document.createElement('button')).prop({
                type: 'button',
                innerHTML: this.btnProperties.btnName,
                class: this.btnProperties.btnClass,
                id: this.btnProperties.btnID
            })
        );
    }

    edit() {

    }

    destroy() {

    }
}