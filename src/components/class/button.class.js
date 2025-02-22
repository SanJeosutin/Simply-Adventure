"use strict";

export default class CreateButton {
    create(action, inventory, reqItem, giveItem, reqQty, cooldown, message) {
        $("#action").on("click", action, () => {
            if (inventory[reqItem] >= reqQty) {  // Access item correctly
                inventory[giveItem] = inventory[giveItem] + 1;
                inventory[reqItem] -= reqQty;
                
                $(action).prop('disabled', true);
                setTimeout(() => {
                    $(action).prop('disabled', false);
                    console.log(`Crafting ${giveItem}`);
                }, cooldown);
            } else {
                alert(message);
            }

            console.log(`Current ${reqItem}: ${inventory[reqItem]}`);
        });
    }
}