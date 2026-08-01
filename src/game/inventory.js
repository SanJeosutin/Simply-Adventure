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

function createAction(id, label, className = 'btn btn-info') {
    if ($(`#${id}`).length) {
        return $(`#${id}`);
    }

    btn.create('action', id.replace('action-', ''), 0, className, label);

    return $(`#${id}`);
}

function renderCampFireActions(stats) {
    const activeActionIDs = new Set();
    const items = stats.inventory.items;

    stats.status.campFires.forEach(fire => {
        if (fire.terminal) {
            return;
        }

        const charcoalActionID = `action-fire-${fire.id}-charcoal`;
        const charcoalAction = createAction(
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
    const spearActionID = 'action-hunt-raw-rabbit';
    const spearAction = $(`#${spearActionID}`);

    if (hasDurability(stats, 'basic_spear')) {
        createAction(spearActionID, 'Hunt Raw Rabbit', 'btn btn-danger hunt-action');
    } else if (!progress.isActive(`#${spearActionID}`)) {
        spearAction.remove();
    }

    const trapActionIDs = new Set();

    stats.status.traps.forEach(trap => {
        const actionID = `action-set-trap-${trap.id}`;
        const action = createAction(
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
        const actionID = getCraftActionID(recipe.id);

        if (canCraftRecipe(stats, recipe) && !$('#action').find(actionID).length) {
            btn.create(
                'action',
                `craft-${recipe.id}`,
                recipe.craftTime,
                'btn btn-info',
                `Craft ${recipe.label}`,
            );
        }
    });

    renderCampFireActions(stats);
    renderHuntingActions(stats, progress);
    progress.renderCampFireTimers(stats.status.campFires);

    inventoryEntries.forEach(([item, quantity]) => {
        $(`#total-${item}`).text(formatInventoryTotal(stats, item, quantity));
    });
}
