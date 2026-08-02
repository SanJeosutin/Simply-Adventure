import Display from '../components/UI/display.ui.js';
import Button from '../components/UI/button.ui.js';
import Progress from '../components/UI/progress.ui.js';

import {
    baitSettings,
    berryConsumableSettings,
    cascerationSettings,
    campFireSettings,
    cookedFoodSettings,
    cookingSettings,
    craftActions,
    getCraftActionID,
    splintSettings,
} from '../data/game.data.js';
import { canCascerate } from './casceration.js';
import {
    canConsumeBerry,
    canConsumeCookedFood,
    getCookedFoodAction,
} from './consumables.js';
import {
    getCookableRawItems,
    getCookingJobProgress,
    getEligibleCampFires,
} from './cooking.js';
import { isAttributeUnlocked, updateAttributeUnlocks } from './discovery.js';
import { getDurability, hasDurability } from './durability.js';
import { getAvailableBaits } from './hunting.js';
import { canApplySplint, getSplintCooldownRemaining } from './medical.js';
import { canCraftRecipe } from './requirements.js';


const btn = new Button();
const display = new Display();
const defaultProgress = new Progress();
const playerAttributeNames = ['health', 'hunger', 'thirst'];
const inventoryDisplayLocations = {
    furnitures: 'display-furnitures',
    items: 'display-inventory',
    tools: 'display-tools',
};
const actionDisplayLocations = {
    actions: 'action-actions',
    building: 'action-building',
    cooking: 'action-cooking-buttons',
    crafting: 'action-crafting',
    hunting: 'action-hunting',
};
const unlockableTabContents = Object.freeze({
    'building-tab': '#action-building button',
    'cooking-tab': '#action-cooking-buttons button, ' +
        '#cooking-job-status .cooking-job, ' +
        '#casceration-controls:not([hidden]) #action-cascerate',
    'crafting-tab': '#action-crafting button',
    'furnitures-tab': '#display-furnitures tr',
    'hunting-tab': '#action-hunting button',
    'inventory-tab': '#display-inventory tr',
    'tools-tab': '#display-tools tr',
});

function getActionDisplayLocation(category) {
    return actionDisplayLocations[category] ?? null;
}

function getInventoryDisplayLocation(category) {
    return inventoryDisplayLocations[category] ?? null;
}

function getRenderableInventoryEntries(stats) {
    return Object.entries(stats.inventory).flatMap(([category, entries]) => {
        const location = getInventoryDisplayLocation(category);

        if (!location) {
            return [];
        }

        return Object.entries(entries).map(([item, quantity]) => ({
            category,
            item,
            location,
            quantity,
        }));
    });
}

function revealAvailableTabs(query = globalThis.$) {
    Object.entries(unlockableTabContents).forEach(([tabID, contentSelector]) => {
        if (!query(contentSelector).length) {
            return;
        }

        query(`#${tabID}`)
            .closest('.nav-item')
            .prop('hidden', false);
    });
}

function createAction(category, id, label, className = 'btn btn-info') {
    if ($(`#${id}`).length) {
        return $(`#${id}`);
    }

    btn.create(
        getActionDisplayLocation(category),
        id.replace('action-', ''),
        0,
        className,
        label,
        id,
    );

    return $(`#${id}`);
}

function renderCampFireActions(stats) {
    if (stats.status.gameOver) {
        $('.camp-fire-action').prop('disabled', true);
        return;
    }

    const activeActionIDs = new Set();
    const items = stats.inventory.items;

    stats.status.campFires.forEach(fire => {
        if (fire.terminal) {
            return;
        }

        const charcoalActionID = `action-fire-${fire.id}-charcoal`;
        const charcoalAction = createAction(
            'building',
            charcoalActionID,
            `Use Charcoal · Fire ${fire.id}`,
            'btn btn-warning camp-fire-action',
        );

        activeActionIDs.add(charcoalActionID);
        charcoalAction
            .attr('data-fire-action', 'charcoal')
            .attr('data-fire-id', fire.id)
            .prop(
                'disabled',
                fire.charcoalPending || !hasDurability(stats, 'camp_fire') ||
                items[campFireSettings.charcoalItem] < campFireSettings.charcoalRequired,
            );

        if (fire.active) {
            return;
        }

        const leafActionID = `action-fire-${fire.id}-leaves`;
        const leafAction = createAction(
            'building',
            leafActionID,
            `Use ${campFireSettings.fuelRequired} Leaves · Fire ${fire.id}`,
            'btn btn-success camp-fire-action',
        );

        activeActionIDs.add(leafActionID);
        leafAction
            .attr('data-fire-action', 'leaves')
            .attr('data-fire-id', fire.id)
            .prop(
                'disabled',
                !hasDurability(stats, 'camp_fire') ||
                items[campFireSettings.fuelItem] < campFireSettings.fuelRequired,
            );
    });

    $('.camp-fire-action').each((_, action) => {
        if (!activeActionIDs.has(action.id)) {
            action.remove();
        }
    });
}

function renderHuntingActions(stats, progress) {
    if (stats.status.gameOver) {
        $('.hunt-action, .trap-action').prop('disabled', true);
        return;
    }

    const spearActionID = 'action-hunt-raw-rabbit';
    const spearAction = $(`#${spearActionID}`);

    if (hasDurability(stats, 'basic_spear')) {
        createAction(
            'hunting',
            spearActionID,
            'Hunt Raw Rabbit',
            'btn btn-danger hunt-action',
        );
    } else if (!progress.isActive(`#${spearActionID}`)) {
        spearAction.remove();
    }

    const trapActionIDs = new Set();
    const hasBait = getAvailableBaits(stats).length > 0;

    stats.status.traps.forEach(trap => {
        const actionID = `action-set-trap-${trap.id}`;
        const action = createAction(
            'hunting',
            actionID,
            `Set Trap ${trap.id}`,
            'btn btn-danger trap-action',
        );

        trapActionIDs.add(actionID);
        action
            .attr('data-trap-action', 'hunt')
            .attr('data-trap-id', trap.id)
            .prop(
                'disabled',
                trap.active || !hasDurability(stats, 'trap') || !hasBait,
            );
    });

    $('.trap-action').each((_, action) => {
        if (!trapActionIDs.has(action.id) && !progress.isActive(`#${action.id}`)) {
            action.remove();
        }
    });
}

function formatInventoryTotal(stats, item, quantity) {
    if (cookedFoodSettings[item]) {
        const servings = stats.status.preparedFoods
            .filter(food => food.cookedItem === item)
            .reduce((total, food) => total + food.servingsRemaining, 0);
        const servingLabel = servings === 1 ? 'serving' : 'servings';

        return `${quantity.toFixed(0)} (${servings} ${servingLabel})`;
    }

    const durability = getDurability(stats, item);
    const total = quantity.toFixed(0);

    if (quantity < 1 || !durability) {
        return total;
    }

    return `${total} (${durability.usesLeft} / ${durability.maxUses})`;
}

function formatStatValue(value) {
    return Number(value.toFixed(2)).toString();
}

function formatItemName(item) {
    return item
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatRemainingTime(durationMs) {
    const totalSeconds = Math.ceil(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function populateSelect(select, options, selectedValue) {
    const currentOptions = Array.from(select.get(0)?.options ?? []).map(option => ({
        label: option.text,
        value: option.value,
    }));
    const normalizedOptions = options.map(({ label, value }) => ({
        label,
        value: String(value),
    }));

    if (JSON.stringify(currentOptions) !== JSON.stringify(normalizedOptions)) {
        select.empty();

        normalizedOptions.forEach(({ label, value }) => {
            select.append(
                $('<option>').val(value).text(label)
            );
        });
    }

    if (selectedValue !== null && selectedValue !== undefined) {
        select.val(String(selectedValue));
    }
}

function renderPlayerAttributes(stats) {
    playerAttributeNames.forEach(name => {
        if (!isAttributeUnlocked(stats, name)) {
            $(`#display-${name}`).remove();
            return;
        }

        if (!$(`#display-${name}`).length) {
            display.create('display-stats', name);
        }

        const attribute = stats.attributes[name];

        $(`#total-${name}`).text(
            `${formatStatValue(attribute.current)} / ${formatStatValue(attribute.max)}`
        );
    });
}

function renderBerryActions(stats, progress) {
    const actionSelector = berryConsumableSettings.action;
    const action = $(actionSelector);
    const actionIsActive = progress.isActive(actionSelector);

    if ((canConsumeBerry(stats) || actionIsActive) && !action.length) {
        createAction('actions', actionSelector.slice(1), 'Eat Berry');
    } else if (!canConsumeBerry(stats) && !actionIsActive) {
        action.remove();
    }

    const hungerUnlocked = isAttributeUnlocked(stats, 'hunger');

    $('#auto-eat-berry-control').prop('hidden', !hungerUnlocked);
    $(berryConsumableSettings.autoEatControl)
        .prop('checked', Boolean(stats.status.autoEatBerry))
        .prop('disabled', stats.status.gameOver);
}

function renderCookedFoodActions(stats, progress) {
    Object.entries(cookedFoodSettings).forEach(([cookedItem, food]) => {
        const actionSelector = getCookedFoodAction(cookedItem);
        const actionIsActive = progress.isActive(actionSelector);
        let action = $(actionSelector);

        if ((canConsumeCookedFood(stats, cookedItem) || actionIsActive) &&
            !action.length) {
            action = createAction(
                'actions',
                actionSelector.slice(1),
                `Eat ${food.cookedLabel}`,
                'btn btn-info cooked-food-action',
            );
            action.attr('data-eat-cooked-food', cookedItem);
        } else if (!canConsumeCookedFood(stats, cookedItem) && !actionIsActive) {
            action.remove();
        }

        if (action.length) {
            action.prop(
                'disabled',
                actionIsActive || !canConsumeCookedFood(stats, cookedItem),
            );
        }
    });
}

function renderCookingControls(stats) {
    const eligibleFires = getEligibleCampFires(stats);
    const rawItems = getCookableRawItems(stats);
    const activeActionIDs = new Set();
    const controlsVisible = !stats.status.gameOver &&
        eligibleFires.length > 0 && rawItems.length > 0;

    $('#cooking-controls').prop('hidden', !controlsVisible);

    if (controlsVisible) {
        const eligibleFireIDs = eligibleFires.map(({ id }) => id);

        if (!eligibleFireIDs.includes(Number(stats.status.selectedCampFireID))) {
            stats.status.selectedCampFireID = eligibleFireIDs[0];
        }

        populateSelect(
            $('#camp-fire-selector'),
            eligibleFires.map(fire => ({
                label: `Camp Fire ${fire.id}`,
                value: fire.id,
            })),
            stats.status.selectedCampFireID,
        );
        $('#camp-fire-selector-control').prop(
            'hidden',
            eligibleFires.length < 2,
        );

        rawItems.forEach(rawItem => {
            const actionID = `action-cook-${rawItem.replaceAll('_', '-')}`;
            const action = createAction(
                'cooking',
                actionID,
                `Cook ${cookingSettings[rawItem].label}`,
                'btn btn-info cook-action',
            );

            activeActionIDs.add(actionID);
            action
                .attr('data-cook-item', rawItem)
                .prop('disabled', false);
        });
    }

    $('.cook-action').each((_, action) => {
        if (!activeActionIDs.has(action.id)) {
            action.remove();
        }
    });

    const activeJobIDs = new Set();
    const currentTime = Date.now();

    stats.status.cookingJobs.forEach(job => {
        const jobID = `cooking-job-${job.id}`;
        const food = cookingSettings[job.rawItem];
        const jobProgress = getCookingJobProgress(job, currentTime);

        activeJobIDs.add(jobID);

        if (!$(`#${jobID}`).length) {
            $('#cooking-job-status').append(
                `<div class="cooking-job mb-2" id="${jobID}">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="cooking-job-label"></span>
                        <span class="cooking-job-value text-muted" aria-hidden="true"></span>
                    </div>
                    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar bg-warning"></div>
                    </div>
                </div>`
            );
        }

        const stateLabel = job.state === 'paused' ? 'Paused' : 'Cooking';

        $(`#${jobID} .cooking-job-label`).text(
            `Camp Fire ${job.fireID} · ${food.label}`
        );
        $(`#${jobID} .cooking-job-value`).text(
            job.state === 'paused'
                ? 'Paused'
                : formatRemainingTime(jobProgress.remainingMs)
        );
        $(`#${jobID} .progress`)
            .attr('aria-label', `Camp Fire ${job.fireID} cooking ${food.label}`)
            .attr('aria-valuenow', jobProgress.percentage)
            .attr(
                'aria-valuetext',
                `${stateLabel}; ${jobProgress.percentage}% complete`,
            );
        $(`#${jobID} .progress-bar`).css(
            'width',
            `${jobProgress.percentage}%`,
        );
    });

    $('#cooking-job-status .cooking-job').each((_, job) => {
        if (!activeJobIDs.has(job.id)) {
            job.remove();
        }
    });
}

function renderCascerationControls(stats, progress) {
    const action = cascerationSettings.action;
    const actionIsActive = progress.isActive(action);
    const eligibleFoods = Object.keys(cascerationSettings.foods).filter(item =>
        stats.inventory.items[item] >= 1
    );
    const controlsVisible = actionIsActive || (
        !stats.status.gameOver && eligibleFoods.length > 0 &&
        hasDurability(stats, cascerationSettings.tool)
    );

    $('#casceration-controls').prop('hidden', !controlsVisible);

    if (!controlsVisible) {
        return;
    }

    const foodControl = $(cascerationSettings.foodControl);
    const quantityControl = $(cascerationSettings.quantityControl);

    if (!actionIsActive) {
        if (!eligibleFoods.includes(stats.status.selectedCascerationFood)) {
            stats.status.selectedCascerationFood = eligibleFoods[0];
        }

        populateSelect(
            foodControl,
            eligibleFoods.map(item => ({
                label: cascerationSettings.foods[item].label,
                value: item,
            })),
            stats.status.selectedCascerationFood,
        );

        const maximum = Math.floor(
            stats.inventory.items[stats.status.selectedCascerationFood]
        );
        const requestedQuantity = Number(quantityControl.val());
        const quantityInputIsFocused = document.activeElement ===
            quantityControl.get(0);

        quantityControl.attr('max', maximum);

        if (requestedQuantity > maximum) {
            quantityControl.val(maximum);
        } else if ((!Number.isInteger(requestedQuantity) || requestedQuantity < 1) &&
            !quantityInputIsFocused) {
            quantityControl.val(1);
        }
    }

    const selectedFood = foodControl.val();
    const selectedQuantity = Number(quantityControl.val());

    foodControl.prop('disabled', actionIsActive || stats.status.gameOver);
    quantityControl.prop('disabled', actionIsActive || stats.status.gameOver);
    $(action).prop(
        'disabled',
        actionIsActive || !canCascerate(stats, selectedFood, selectedQuantity),
    );
}

function renderBaitControls(stats) {
    const availableBaits = getAvailableBaits(stats);
    const controlsVisible = stats.status.traps.length > 0 &&
        availableBaits.length > 0 && !stats.status.gameOver;

    $('#trap-bait-control').prop('hidden', !controlsVisible);

    if (!controlsVisible) {
        return;
    }

    if (!availableBaits.includes(stats.status.selectedBait)) {
        stats.status.selectedBait = availableBaits[0];
    }

    populateSelect(
        $(baitSettings.control),
        availableBaits.map(item => ({
            label: formatItemName(item),
            value: item,
        })),
        stats.status.selectedBait,
    );
}

function renderMedicalActions(stats, progress) {
    const actionSelector = splintSettings.action;
    const actionIsActive = progress.isActive(actionSelector);
    const cooldownRemaining = getSplintCooldownRemaining(stats);
    const shouldExist = actionIsActive || (
        stats.inventory.items[splintSettings.item] >= 1 &&
        stats.attributes.health.current < stats.attributes.health.max &&
        !stats.status.gameOver
    );
    let action = $(actionSelector);

    if (shouldExist && !action.length) {
        action = createAction(
            'actions',
            actionSelector.slice(1),
            'Apply Splint',
            'btn btn-info splint-action',
        );
    } else if (!shouldExist) {
        action.remove();
        return;
    }

    if (!actionIsActive) {
        action.text(
            cooldownRemaining > 0
                ? `Apply Splint (${formatRemainingTime(cooldownRemaining)})`
                : 'Apply Splint'
        );
    }

    action.prop(
        'disabled',
        actionIsActive || !canApplySplint(stats),
    );
}

function renderDeathStatus(stats) {
    if (!stats.status.gameOver) {
        return;
    }

    if (!$('#display-player_status').length) {
        display.create('display-stats', 'player_status');
        display.create('display-stats', 'death_drop');
    }

    const deathDrop = stats.status.deathDrop;
    const coordinates = `${deathDrop.location.x}, ${deathDrop.location.y}`;
    const dropStatus = deathDrop.persisted
        ? coordinates
        : `${coordinates} (save failed; retained for this page only)`;

    $('#total-player_status').text('Dead');
    $('#total-death_drop').text(dropStatus);
}

export default function renderInventory(stats, progress = defaultProgress) {
    updateAttributeUnlocks(stats);
    renderPlayerAttributes(stats);

    const inventoryEntries = getRenderableInventoryEntries(stats);

    inventoryEntries.forEach(({ item, location, quantity }) => {
        const totalID = `#total-${item}`;

        if (quantity >= 1 && !$(`#${location}`).find(totalID).length) {
            display.create(location, item);
        }
    });

    if (!stats.status.gameOver) {
        craftActions.forEach(recipe => {
            const actionID = getCraftActionID(recipe.id);

            if (canCraftRecipe(stats, recipe) && !$('#action').find(actionID).length) {
                btn.create(
                    getActionDisplayLocation('crafting'),
                    `craft-${recipe.id}`,
                    recipe.craftTime,
                    'btn btn-info',
                    `Craft ${recipe.label}`,
                    actionID.slice(1),
                );
            }
        });
    }

    renderCampFireActions(stats);
    renderBaitControls(stats);
    renderHuntingActions(stats, progress);
    renderBerryActions(stats, progress);
    renderCookedFoodActions(stats, progress);
    renderCookingControls(stats);
    renderCascerationControls(stats, progress);
    renderMedicalActions(stats, progress);
    progress.renderCampFireTimers(stats.status.campFires);
    revealAvailableTabs();

    inventoryEntries.forEach(({ item, quantity }) => {
        $(`#total-${item}`).text(formatInventoryTotal(stats, item, quantity));
    });

    renderDeathStatus(stats);

    if (stats.status.gameOver) {
        $('#action button, #action input, #action select').prop('disabled', true);
    }
}

export {
    formatStatValue,
    getActionDisplayLocation,
    getInventoryDisplayLocation,
    getRenderableInventoryEntries,
    revealAvailableTabs,
    renderBaitControls,
    renderBerryActions,
    renderCascerationControls,
    renderCookedFoodActions,
    renderCookingControls,
    renderMedicalActions,
    renderPlayerAttributes,
    unlockableTabContents,
};
