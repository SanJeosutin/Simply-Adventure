import Display from '../components/UI/display.ui.js';
import Button from '../components/UI/button.ui.js';
import Progress from '../components/UI/progress.ui.js';

import {
    campFireSettings,
    craftActions,
    getCraftActionID,
} from '../data/game.data.js';


const btn = new Button();
const display = new Display();
const defaultProgress = new Progress();

export default function renderInventory(stats, progress = defaultProgress) {
    const inventoryEntries = Object.values(stats.inventory)
        .flatMap(category => Object.entries(category));

    inventoryEntries.forEach(([item, quantity]) => {
        const totalID = `#total-${item}`;

        if (quantity >= 1 && !$('#display-inventory').find(totalID).length) {
            display.create('display-inventory', item);
        }
    });

    craftActions.forEach(recipe => {
        const hasRequirements = recipe.requirements.every(requirement =>
            stats.inventory[requirement.category][requirement.item] >= requirement.quantity
        );
        const actionID = getCraftActionID(recipe.id);

        if (hasRequirements && !$('#action').find(actionID).length) {
            btn.create(
                'action',
                `craft-${recipe.id}`,
                recipe.craftTime,
                'btn btn-info',
                `Craft ${recipe.label}`,
            );
        }
    });

    progress.renderCampFireTimers(
        stats.status?.campFires ?? [],
        campFireSettings.fuelDuration,
    );

    inventoryEntries.forEach(([item, quantity]) => {
        $(`#total-${item}`).text(quantity.toFixed(0));
    });
}
