import Display from '../components/UI/display.ui.js';
import Button from '../components/UI/button.ui.js';

import { actionIDs, craftActions } from '../data/game.data.js';


const btn = new Button();
const display = new Display();

export default function renderInventory(stats) {
    const materials = Object.keys(stats.inventory.items);

    materials.forEach(material => {
        const totalID = `#total-${material}`;

        if (stats.inventory.items[material] >= 1 && !$('#display-inventory').find(totalID).length) {
            display.create('display-inventory', material);
        }
    });

    craftActions.forEach(action => {
        if (stats.inventory.items[action.requiredItem] >= action.required &&
            !$('#action').find(actionIDs.craft[action.giveItem]).length) {
            btn.create('action', action.buttonID);
        }
    });

    materials.forEach(material => {
        $(`#total-${material}`).text(stats.inventory.items[material].toFixed(0));
    });
}
