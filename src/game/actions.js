import CreateButton from '../components/class/button.class.js';
import debugLog from '../components/Logic/debug.js';
import Progress from '../components/UI/progress.ui.js';

import {
    actionIDs,
    craftActions,
    getCraftActionID,
    scavengeItems,
    scavengeSettings,
} from '../data/game.data.js';
import { initializeCampFireActions, startCampFireUpkeep } from './camp-fire.js';
import { initializeCascerationActions } from './casceration.js';
import {
    initializeBerryActions,
    initializeCookedFoodActions,
} from './consumables.js';
import CookingSystem, { initializeCookingActions } from './cooking.js';
import { createTrap, initializeHuntingActions } from './hunting.js';
import { initializeMedicalActions } from './medical.js';

export default function initializeActions(
    stats,
    progress = new Progress(),
    options = {},
) {
    const createAction = new CreateButton(progress);
    const cooking = new CookingSystem(stats, progress);
    const berryActions = initializeBerryActions(
        stats,
        progress,
        globalThis.$,
        options.onNeedRestored,
    );

    initializeCookedFoodActions(
        stats,
        progress,
        globalThis.$,
        options.onNeedRestored,
    );
    initializeCookingActions(stats, cooking);
    initializeCascerationActions(stats, progress);
    initializeMedicalActions(stats, progress);
    initializeCampFireActions(stats, progress, cooking.campFireHooks);
    initializeHuntingActions(stats, progress);

    $('#action').on('click', actionIDs.scavenge, () => {
        if (stats.status.gameOver) {
            return;
        }

        if (progress.isActive(actionIDs.scavenge)) {
            return;
        }

        const scavengeButton = $(actionIDs.scavenge);

        scavengeButton.prop('disabled', true);
        const started = progress.start(
            actionIDs.scavenge,
            'Scavenging',
            1000,
            () => {
                scavengeItems.forEach(item => {
                    stats.inventory.items[item] += Math.random() * scavengeSettings.maxAmount;
                });

                if (Math.random() < scavengeSettings.flintChance) {
                    const flintFound = Math.random() * scavengeSettings.maxAmount;

                    stats.inventory.items.flint += flintFound;
                    debugLog(`Found ${flintFound.toFixed(0)} flint.`);
                }

                scavengeButton.prop('disabled', false);
                debugLog('Scavenging complete.');
            },
        );

        if (!started) {
            scavengeButton.prop('disabled', false);
        }
    });

    craftActions.forEach(recipe => {
        const onComplete = {
            'camp-fire': () => startCampFireUpkeep(
                stats,
                progress,
                cooking.campFireHooks,
            ),
            trap: () => createTrap(stats),
        }[recipe.id];

        createAction.createRecipe(
            getCraftActionID(recipe.id),
            stats,
            recipe,
            onComplete,
        );
    });

    return {
        update() {
            cooking.update();
            berryActions.update();
        },
    };
}
