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

function removeCampFire(stats, fire) {
    clearTimeout(fire.timerID);
    stats.status.campFires = stats.status.campFires.filter(currentFire =>
        currentFire.id !== fire.id
    );
}

function finishTerminalCycle(stats, progress, fire) {
    finalizeDurabilityBreak(stats, 'camp_fire');
    removeCampFire(stats, fire);
    progress.announce(`Camp Fire ${fire.id} ran out of durability and broke.`);
    debugLog(`Camp Fire ${fire.id} broke.`);
}

function beginLeafCycle(stats, progress, fire) {
    const items = stats.inventory.items;

    if (items[campFireSettings.fuelItem] < campFireSettings.fuelRequired) {
        markInactive(fire);
        progress.announce(`Camp Fire ${fire.id} is inactive. It needs fuel.`);
        debugLog(`Camp Fire ${fire.id} became inactive.`);
        return false;
    }

    if (!hasDurability(stats, 'camp_fire')) {
        removeCampFire(stats, fire);
        progress.announce(`Camp Fire ${fire.id} ran out of durability and broke.`);
        return false;
    }

    items[campFireSettings.fuelItem] -= campFireSettings.fuelRequired;

    const durability = consumeDurability(stats, 'camp_fire', { deferBreak: true });

    startCycle(fire, campFireSettings.fuelDuration, { terminal: durability.broke });
    scheduleCampFireUpkeep(stats, progress, fire);
    progress.announce(
        durability.broke
            ? `Camp Fire ${fire.id} started its final leaf cycle.`
            : `Camp Fire ${fire.id} refueled with ${campFireSettings.fuelRequired} leaves.`
    );
    debugLog(`Camp Fire ${fire.id} consumed ${campFireSettings.fuelRequired} leaves.`);

    return true;
}

function completeCampFireCycle(stats, progress, fire) {
    const activeFire = getCampFire(stats, fire.id);

    if (!activeFire) {
        return;
    }

    activeFire.timerID = null;

    if (activeFire.terminal) {
        finishTerminalCycle(stats, progress, activeFire);
        return;
    }

    if (activeFire.charcoalPending) {
        activeFire.charcoalPending = false;

        const durability = consumeDurability(stats, 'camp_fire');

        if (!durability.consumed || durability.broke) {
            removeCampFire(stats, activeFire);
            progress.announce(`Camp Fire ${fire.id} ran out of durability and broke.`);
            debugLog(`Camp Fire ${fire.id} broke after its charcoal cycle.`);
            return;
        }
    }

    beginLeafCycle(stats, progress, activeFire);
}

function scheduleCampFireUpkeep(stats, progress, fire) {
    clearTimeout(fire.timerID);

    if (!fire.active || !fire.fuelDueAt) {
        fire.timerID = null;
        return null;
    }

    const delay = Math.max(0, fire.fuelDueAt - Date.now());

    fire.timerID = setTimeout(
        () => completeCampFireCycle(stats, progress, fire),
        delay,
    );

    return fire.timerID;
}

function startCampFireUpkeep(stats, progress) {
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
    scheduleCampFireUpkeep(stats, progress, fire);

    return fire;
}

function refuelWithLeaves(stats, progress, fireID) {
    const fire = getCampFire(stats, fireID);

    if (!fire || fire.active || fire.terminal) {
        return false;
    }

    return beginLeafCycle(stats, progress, fire);
}

function refuelWithCharcoal(stats, progress, fireID) {
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
    scheduleCampFireUpkeep(stats, progress, fire);
    progress.announce(`Camp Fire ${fire.id} fueled with charcoal for 30 more minutes.`);
    debugLog(`Camp Fire ${fire.id} fueled with charcoal.`);

    return true;
}

function initializeCampFireActions(stats, progress) {
    $('#action').on('click', '[data-fire-action="leaves"]', event => {
        refuelWithLeaves(stats, progress, Number(event.currentTarget.dataset.fireId));
    });

    $('#action').on('click', '[data-fire-action="charcoal"]', event => {
        refuelWithCharcoal(stats, progress, Number(event.currentTarget.dataset.fireId));
    });
}

export {
    initializeCampFireActions,
    refuelWithCharcoal,
    refuelWithLeaves,
    startCampFireUpkeep,
};
