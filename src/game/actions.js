import CreateButton from '../components/class/button.class.js';
import debugLog from '../components/Logic/debug.js';

import {
    actionIDs,
    craftActions,
    scavengeItems,
} from '../data/game.data.js';


export default function initializeActions(stats) {
    const createAction = new CreateButton();

    $('#action').on('click', actionIDs.scavenge, () => {
        scavengeItems.forEach(item => {
            stats.inventory.items[item] += Math.random() * 6;
        });

        const scavengeButton = $(actionIDs.scavenge);

        scavengeButton.prop('disabled', true);
        setTimeout(() => {
            scavengeButton.prop('disabled', false);
            debugLog('Scavenging complete.');
        }, 1000);
    });

    craftActions.forEach(action => {
        createAction.create(
            actionIDs.craft[action.giveItem],
            stats.inventory.items,
            action.requiredItem,
            action.giveItem,
            action.required,
            action.cooldown,
            action.message,
        );
    });
}
