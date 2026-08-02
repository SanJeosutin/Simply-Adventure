import debugLog from '../components/Logic/debug.js';

import { campFireSettings } from '../data/game.data.js';
import {
    consumeDurability,
    finalizeDurabilityBreak,
    hasDurability,
} from './durability.js';


let nextCampFireID = 0;

function getCampFire(stats, fireID) {
    return stats.status.campFires.find(fire => fire.id === fireID);
}

function startCycle(fire, duration, { charcoalPending = false, terminal = false } = {}) {
    const cycleStartedAt = Date.now();

    fire.active = true;
    fire.charcoalPending = charcoalPending;
    fire.cycleDuration = duration;
    fire.cycleStartedAt = cycleStartedAt;
    fire.fuelDueAt = cycleStartedAt + duration;
    fire.terminal = terminal;
}

function markInactive(fire) {
    fire.active = false;
    fire.charcoalPending = false;
    fire.cycleDuration = 0;
    fire.cycleStartedAt = null;
    fire.fuelDueAt = null;
    fire.terminal = false;
    fire.timerID = null;
}

function notifyCampFire(hooks, eventName, fire) {
    hooks?.[eventName]?.(fire);
}

function removeCampFire(stats, fire, hooks = {}) {
    clearTimeout(fire.timerID);
    notifyCampFire(hooks, 'onRemoved', fire);
    stats.status.campFires = stats.status.campFires.filter(currentFire =>
        currentFire.id !== fire.id
    );
}

function finishTerminalCycle(stats, progress, fire, hooks = {}) {
    finalizeDurabilityBreak(stats, 'camp_fire');
    removeCampFire(stats, fire, hooks);
    progress.announce(`Camp Fire ${fire.id} ran out of durability and broke.`);
    debugLog(`Camp Fire ${fire.id} broke.`);
}

function beginLeafCycle(stats, progress, fire, hooks = {}) {
    const items = stats.inventory.items;

    if (items[campFireSettings.fuelItem] < campFireSettings.fuelRequired) {
        notifyCampFire(hooks, 'onInactive', fire);
        markInactive(fire);
        progress.announce(`Camp Fire ${fire.id} is inactive. It needs fuel.`);
        debugLog(`Camp Fire ${fire.id} became inactive.`);
        return false;
    }

    if (!hasDurability(stats, 'camp_fire')) {
        removeCampFire(stats, fire, hooks);
        progress.announce(`Camp Fire ${fire.id} ran out of durability and broke.`);
        return false;
    }

    items[campFireSettings.fuelItem] -= campFireSettings.fuelRequired;

    const durability = consumeDurability(stats, 'camp_fire', { deferBreak: true });

    startCycle(fire, campFireSettings.fuelDuration, { terminal: durability.broke });
    notifyCampFire(hooks, 'onActivated', fire);
    scheduleCampFireUpkeep(stats, progress, fire, hooks);
    progress.announce(
        durability.broke
            ? `Camp Fire ${fire.id} started its final leaf cycle.`
            : `Camp Fire ${fire.id} refueled with ${campFireSettings.fuelRequired} leaves.`
    );
    debugLog(`Camp Fire ${fire.id} consumed ${campFireSettings.fuelRequired} leaves.`);

    return true;
}

function completeCampFireCycle(stats, progress, fire, hooks = {}) {
    const activeFire = getCampFire(stats, fire.id);

    if (!activeFire) {
        return;
    }

    activeFire.timerID = null;

    if (activeFire.terminal) {
        finishTerminalCycle(stats, progress, activeFire, hooks);
        return;
    }

    if (activeFire.charcoalPending) {
        activeFire.charcoalPending = false;

        const durability = consumeDurability(stats, 'camp_fire');

        if (!durability.consumed || durability.broke) {
            removeCampFire(stats, activeFire, hooks);
            progress.announce(`Camp Fire ${fire.id} ran out of durability and broke.`);
            debugLog(`Camp Fire ${fire.id} broke after its charcoal cycle.`);
            return;
        }
    }

    beginLeafCycle(stats, progress, activeFire, hooks);
}

function scheduleCampFireUpkeep(stats, progress, fire, hooks = {}) {
    clearTimeout(fire.timerID);

    if (!fire.active || !fire.fuelDueAt) {
        fire.timerID = null;
        return null;
    }

    const delay = Math.max(0, fire.fuelDueAt - Date.now());

    fire.timerID = setTimeout(
        () => completeCampFireCycle(stats, progress, fire, hooks),
        delay,
    );

    return fire.timerID;
}

function startCampFireUpkeep(stats, progress, hooks = {}) {
    stats.status ??= {};
    stats.status.campFires ??= [];

    const highestFireID = stats.status.campFires.reduce(
        (highestID, fire) => Math.max(highestID, fire.id),
        0,
    );
    const fire = {
        id: Math.max(++nextCampFireID, highestFireID + 1),
        timerID: null,
    };

    nextCampFireID = fire.id;
    startCycle(fire, campFireSettings.fuelDuration);
    stats.status.campFires.push(fire);
    notifyCampFire(hooks, 'onActivated', fire);
    scheduleCampFireUpkeep(stats, progress, fire, hooks);

    return fire;
}

function refuelWithLeaves(stats, progress, fireID, hooks = {}) {
    if (stats.status.gameOver) {
        return false;
    }

    const fire = getCampFire(stats, fireID);

    if (!fire || fire.active || fire.terminal) {
        return false;
    }

    return beginLeafCycle(stats, progress, fire, hooks);
}

function refuelWithCharcoal(stats, progress, fireID, hooks = {}) {
    if (stats.status.gameOver) {
        return false;
    }

    const fire = getCampFire(stats, fireID);
    const items = stats.inventory.items;

    if (!fire || fire.terminal || fire.charcoalPending ||
        !hasDurability(stats, 'camp_fire') ||
        items[campFireSettings.charcoalItem] < campFireSettings.charcoalRequired) {
        return false;
    }

    items[campFireSettings.charcoalItem] -= campFireSettings.charcoalRequired;

    const now = Date.now();
    const currentDeadline = fire.active ? Math.max(now, fire.fuelDueAt) : now;

    fire.active = true;
    fire.charcoalPending = true;
    fire.cycleStartedAt = now;
    fire.fuelDueAt = currentDeadline + campFireSettings.charcoalDuration;
    fire.cycleDuration = fire.fuelDueAt - now;
    notifyCampFire(hooks, 'onActivated', fire);
    scheduleCampFireUpkeep(stats, progress, fire, hooks);
    progress.announce(`Camp Fire ${fire.id} fueled with charcoal for 30 more minutes.`);
    debugLog(`Camp Fire ${fire.id} fueled with charcoal.`);

    return true;
}

function initializeCampFireActions(stats, progress, hooks = {}) {
    $('#action').on('click', '[data-fire-action="leaves"]', event => {
        if (stats.status.gameOver) {
            return;
        }

        refuelWithLeaves(
            stats,
            progress,
            Number(event.currentTarget.dataset.fireId),
            hooks,
        );
    });

    $('#action').on('click', '[data-fire-action="charcoal"]', event => {
        if (stats.status.gameOver) {
            return;
        }

        refuelWithCharcoal(
            stats,
            progress,
            Number(event.currentTarget.dataset.fireId),
            hooks,
        );
    });
}

export {
    initializeCampFireActions,
    refuelWithCharcoal,
    refuelWithLeaves,
    startCampFireUpkeep,
};
