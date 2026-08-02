import Display from '../components/UI/display.ui.js';
import Button from '../components/UI/button.ui.js';
import Progress from '../components/UI/progress.ui.js';

import {
    campFireSettings,
    craftActions,
    getCraftActionID,
} from '../data/game.data.js';
import { getDurability, hasDurability } from './durability.js';
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
    crafting: 'action-crafting',
    hunting: 'action-hunting',
};
const unlockableTabContents = Object.freeze({
    'building-tab': '#action-building button',
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
            .prop('disabled', trap.active || !hasDurability(stats, 'trap'));
    });

    $('.trap-action').each((_, action) => {
        if (!trapActionIDs.has(action.id) && !progress.isActive(`#${action.id}`)) {
            action.remove();
        }
    });
}

function formatInventoryTotal(stats, item, quantity) {
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

function renderPlayerAttributes(stats) {
    playerAttributeNames.forEach(name => {
        if (!$(`#display-${name}`).length) {
            display.create('display-stats', name);
        }

        const attribute = stats.attributes[name];

        $(`#total-${name}`).text(
            `${formatStatValue(attribute.current)} / ${formatStatValue(attribute.max)}`
        );
    });
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
    renderHuntingActions(stats, progress);
    progress.renderCampFireTimers(stats.status.campFires);
    revealAvailableTabs();

    inventoryEntries.forEach(({ item, quantity }) => {
        $(`#total-${item}`).text(formatInventoryTotal(stats, item, quantity));
    });

    renderDeathStatus(stats);

    if (stats.status.gameOver) {
        $('#action button').prop('disabled', true);
    }
}

export {
    formatStatValue,
    getActionDisplayLocation,
    getInventoryDisplayLocation,
    getRenderableInventoryEntries,
    revealAvailableTabs,
    renderPlayerAttributes,
    unlockableTabContents,
};
