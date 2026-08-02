import { splintSettings } from '../data/game.data.js';
import { roundStat } from './survival.js';


function ensureMedicalState(stats) {
    stats.status ??= {};
    stats.status.cooldowns ??= {};
    stats.status.cooldowns.splintReadyAt ??= 0;
}

function getSplintCooldownRemaining(stats, currentTime = Date.now()) {
    ensureMedicalState(stats);

    return Math.max(0, stats.status.cooldowns.splintReadyAt - currentTime);
}

function canApplySplint(stats, currentTime = Date.now()) {
    const health = stats.attributes.health;

    return !stats.status.gameOver &&
        stats.inventory.items[splintSettings.item] >= 1 &&
        health.current < health.max &&
        getSplintCooldownRemaining(stats, currentTime) === 0;
}

function applySplintHealing(stats) {
    const health = stats.attributes.health;

    health.current = roundStat(Math.min(
        health.max,
        health.current + splintSettings.healthRestored,
    ));

    return health.current;
}

function startSplintApplication(
    stats,
    progress,
    options = {},
) {
    const query = options.query ?? globalThis.$;
    const now = options.now ?? (() => Date.now());
    const action = splintSettings.action;

    if (!canApplySplint(stats, now()) || progress.isActive(action)) {
        return false;
    }

    const actionButton = query(action);

    if (!actionButton.length) {
        return false;
    }

    stats.inventory.items[splintSettings.item] -= 1;
    actionButton.prop('disabled', true);

    const started = progress.start(
        action,
        'Applying Splint',
        splintSettings.applicationDuration,
        () => {
            if (stats.status.gameOver) {
                stats.inventory.items[splintSettings.item] += 1;
                actionButton.prop('disabled', true);
                return;
            }

            applySplintHealing(stats);
            stats.status.cooldowns.splintReadyAt = now() + splintSettings.cooldown;
            actionButton.prop('disabled', true);
            progress.announce('Splint applied. Health restored by 0.5.');
        },
    );

    if (!started) {
        stats.inventory.items[splintSettings.item] += 1;
        actionButton.prop('disabled', false);
    }

    return started;
}

function initializeMedicalActions(
    stats,
    progress,
    query = globalThis.$,
) {
    query('#action').on('click', splintSettings.action, () => {
        startSplintApplication(stats, progress, { query });
    });
}

export {
    applySplintHealing,
    canApplySplint,
    ensureMedicalState,
    getSplintCooldownRemaining,
    initializeMedicalActions,
    startSplintApplication,
};
