import CreateButton from '../components/class/button.class.js';
import debugLog from '../components/Logic/debug.js';
import Progress from '../components/UI/progress.ui.js';

import {
    actionIDs,
    campFireSettings,
    craftActions,
    getCraftActionID,
    scavengeItems,
    scavengeSettings,
} from '../data/game.data.js';


let nextCampFireID = 0;

function scheduleCampFireUpkeep(stats, progress, fire) {
    const delay = Math.max(0, fire.fuelDueAt - Date.now());

    return setTimeout(() => {
        const items = stats.inventory.items;
        const furnitures = stats.inventory.furnitures;
        const activeFires = stats.status.campFires;
        const activeFire = activeFires.find(currentFire => currentFire.id === fire.id);

        if (!activeFire) {
            return;
        }

        if (furnitures.camp_fire >= 1 &&
            items[campFireSettings.fuelItem] >= campFireSettings.fuelRequired) {
            items[campFireSettings.fuelItem] -= campFireSettings.fuelRequired;
            activeFire.cycleStartedAt = Date.now();
            activeFire.fuelDueAt = activeFire.cycleStartedAt + campFireSettings.fuelDuration;
            progress.announce(`Camp Fire ${fire.id} refueled.`);
            debugLog(`Camp Fire consumed ${campFireSettings.fuelRequired} leaves.`);
            scheduleCampFireUpkeep(stats, progress, activeFire);
            return;
        }

        stats.status.campFires = activeFires.filter(currentFire => currentFire.id !== fire.id);
        furnitures.camp_fire = Math.max(0, furnitures.camp_fire - 1);
        progress.announce(`Camp Fire ${fire.id} went out.`);
        debugLog(`Camp Fire ${fire.id} went out.`);
    }, delay);
}

function startCampFireUpkeep(stats, progress = new Progress()) {
    stats.status ??= {};
    stats.status.campFires ??= [];

    const highestFireID = stats.status.campFires.reduce(
        (highestID, fire) => Math.max(highestID, fire.id),
        0,
    );
    const cycleStartedAt = Date.now();
    const fire = {
        id: Math.max(++nextCampFireID, highestFireID + 1),
        cycleStartedAt,
        fuelDueAt: cycleStartedAt + campFireSettings.fuelDuration,
    };

    nextCampFireID = fire.id;
    stats.status.campFires.push(fire);
    scheduleCampFireUpkeep(stats, progress, fire);

    return fire;
}

export default function initializeActions(stats, progress = new Progress()) {
    const createAction = new CreateButton(progress);

    $('#action').on('click', actionIDs.scavenge, () => {
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
        const onComplete = recipe.id === 'camp-fire'
            ? () => startCampFireUpkeep(stats, progress)
            : undefined;

        createAction.createRecipe(
            getCraftActionID(recipe.id),
            stats.inventory,
            recipe,
            onComplete,
        );
    });
}

export { startCampFireUpkeep };
