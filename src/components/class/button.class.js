"use strict";

import debugLog from '../Logic/debug.js';


export default class CreateButton {
    create(action, inventory, reqItem, giveItem, reqQty, cooldown, message) {
        $('#action').on('click', action, () => {
            if (inventory[reqItem] >= reqQty) {
                inventory[giveItem] += 1;
                inventory[reqItem] -= reqQty;

                $(action).prop('disabled', true);
                setTimeout(() => {
                    $(action).prop('disabled', false);
                    debugLog(`Crafting ${giveItem} complete.`);
                }, cooldown);
            } else {
                alert(message);
            }

            debugLog(`Current ${reqItem}: ${inventory[reqItem]}`);
        });
    }
}
