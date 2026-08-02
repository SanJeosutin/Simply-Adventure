import debugLog from '../components/Logic/debug.js';

import { huntingSettings } from '../data/game.data.js';
import { consumeDurability, hasDurability } from './durability.js';


let nextTrapID = 0;

function randomDuration(minimum, maximum) {
    const minimumSeconds = Math.ceil(minimum / 1000);
    const maximumSeconds = Math.floor(maximum / 1000);

    return (
        Math.floor(Math.random() * (maximumSeconds - minimumSeconds + 1)) +
        minimumSeconds
    ) * 1000;
}

function createTrap(stats) {
    stats.status ??= {};
    stats.status.traps ??= [];

    const highestTrapID = stats.status.traps.reduce(
        (highestID, trap) => Math.max(highestID, trap.id),
        0,
    );
    const trap = {
        active: false,
        catchDueAt: null,
        catchDuration: 0,
        catchStartedAt: null,
        id: Math.max(++nextTrapID, highestTrapID + 1),
    };

    nextTrapID = trap.id;
    stats.status.traps.push(trap);

    return trap;
}

function startSpearHunt(stats, progress) {
    if (stats.status.gameOver) {
        return false;
    }

    const settings = huntingSettings.spear;
    const action = '#action-hunt-raw-rabbit';

    if (!hasDurability(stats, settings.tool) || progress.isActive(action)) {
        return false;
    }

    const duration = randomDuration(settings.minDuration, settings.maxDuration);
    const durationRange = settings.maxDuration - settings.minDuration;
    const bonusChance = durationRange > 0
        ? ((duration - settings.minDuration) / durationRange) * settings.maxBonusChance
        : settings.maxBonusChance;
    const actionButton = $(action).prop('disabled', true);
    const started = progress.start(action, 'Hunting Raw Rabbit', duration, () => {
        const hasBonusRabbit = Math.random() < bonusChance;
        const rabbitsCaught = hasBonusRabbit ? 2 : 1;
        const durability = consumeDurability(stats, settings.tool);
        const breakMessage = durability.broke ? ' Your Basic Spear broke.' : '';

        stats.inventory.items.raw_rabbit += rabbitsCaught;
        actionButton.prop('disabled', !hasDurability(stats, settings.tool));
        progress.announce(
            hasBonusRabbit
                ? `Hunt complete: you caught 2 Raw Rabbits.${breakMessage}`
                : `Hunt complete: you caught 1 Raw Rabbit.${breakMessage}`
        );

        if (durability.broke) {
            debugLog('A Basic Spear broke after the hunt.');
        }
    });

    if (!started) {
        actionButton.prop('disabled', false);
    }

    return started;
}

function startTrapHunt(stats, progress, trapID) {
    if (stats.status.gameOver) {
        return false;
    }

    const settings = huntingSettings.trap;
    const trap = stats.status.traps.find(currentTrap => currentTrap.id === trapID);
    const action = `#action-set-trap-${trapID}`;

    if (!trap || trap.active || !hasDurability(stats, settings.furniture) ||
        progress.isActive(action)) {
        return false;
    }

    const duration = randomDuration(settings.minDuration, settings.maxDuration);
    const actionButton = $(action).prop('disabled', true);

    trap.active = true;
    trap.catchDuration = duration;
    trap.catchStartedAt = Date.now();
    trap.catchDueAt = trap.catchStartedAt + duration;

    const started = progress.start(action, `Trap ${trapID} hunting`, duration, () => {
        const durability = consumeDurability(stats, settings.furniture);

        stats.inventory.items.raw_rabbit += 1;
        trap.active = false;
        trap.catchDuration = 0;
        trap.catchStartedAt = null;
        trap.catchDueAt = null;

        if (durability.broke) {
            stats.status.traps = stats.status.traps.filter(currentTrap =>
                currentTrap.id !== trapID
            );
            progress.announce(`Trap ${trapID} caught a Raw Rabbit and broke.`);
            debugLog(`Trap ${trapID} broke after catching a rabbit.`);
            return;
        }

        actionButton.prop('disabled', false);
        progress.announce(`Trap ${trapID} caught a Raw Rabbit.`);
    });

    if (!started) {
        trap.active = false;
        trap.catchDuration = 0;
        trap.catchStartedAt = null;
        trap.catchDueAt = null;
        actionButton.prop('disabled', false);
    }

    return started;
}

function initializeHuntingActions(stats, progress) {
    $('#action').on('click', '#action-hunt-raw-rabbit', () => {
        if (stats.status.gameOver) {
            return;
        }

        startSpearHunt(stats, progress);
    });

    $('#action').on('click', '[data-trap-action="hunt"]', event => {
        if (stats.status.gameOver) {
            return;
        }

        startTrapHunt(stats, progress, Number(event.currentTarget.dataset.trapId));
    });
}

export {
    createTrap,
    initializeHuntingActions,
    startSpearHunt,
    startTrapHunt,
};
