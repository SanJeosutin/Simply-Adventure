import GameLoop from './game/mechanics/gameloop.js';

import initializeActions from './game/actions.js';
import DeathDropStore from './game/death-drops.js';
import { updateAttributeUnlocks } from './game/discovery.js';
import renderInventory from './game/inventory.js';
import SurvivalSystem from './game/survival.js';

import Progress from './components/UI/progress.ui.js';

import { settings } from './data/game.data.js';
import { createPlayerStats, loadPlayerData } from './data/player.js';


const loop = new GameLoop();
const progress = new Progress();
const deathDropSyncInterval = 250;

function showInitializationError(error) {
    const errorMessage = 'Unable to start the game. Check player.data.json.';

    $('#action button, #action input, #action select').prop('disabled', true);
    $('#display-stats').append(
        '<tr id="display-initialization-error"><th>Status</th><td class="text-danger"></td></tr>'
    );
    $('#display-initialization-error td').text(errorMessage);
    progress.announce(errorMessage);
    console.error(error);
}

function endRun(stats, deathDrops) {
    if (stats.status.gameOver) {
        return;
    }

    stats.status.gameOver = true;
    $('#action button, #action input, #action select').prop('disabled', true);

    const result = deathDrops.create(stats);

    stats.status.deathDrop = {
        error: result.error?.message ?? null,
        id: result.record.id,
        location: result.record.location,
        persisted: result.persisted,
    };
    progress.announce(
        `You died. Your items were dropped at ${result.record.location.x}, ` +
        `${result.record.location.y}.`
    );
}

$(document).ready(async () => {
    let stats;

    try {
        stats = createPlayerStats(await loadPlayerData());
    } catch (error) {
        showInitializationError(error);
        return;
    }

    const deathDrops = new DeathDropStore();
    const survival = new SurvivalSystem(stats, {
        onDeath: () => endRun(stats, deathDrops),
    });
    let lastDeathDropSyncAt = 0;

    const actionController = initializeActions(stats, progress, {
        onNeedRestored: name => survival.refreshNeed(name),
    });

    loop.onUpdate = () => {
        actionController.update();
        updateAttributeUnlocks(stats);
        survival.syncUnlockedNeeds();
    };
    loop.onRender = () => {
        const currentTime = Date.now();

        if (stats.status.gameOver &&
            currentTime - lastDeathDropSyncAt >= deathDropSyncInterval) {
            const result = deathDrops.syncIfChanged(stats);

            lastDeathDropSyncAt = currentTime;
            stats.status.deathDrop.persisted = result.persisted;
            stats.status.deathDrop.error = result.error?.message ?? null;
        }

        renderInventory(stats, progress);
    };

    window.addEventListener('beforeunload', () => {
        if (stats.status.gameOver) {
            deathDrops.syncIfChanged(stats);
        }
    });

    $('#current-version').text(settings.gameVersion);
    renderInventory(stats, progress);
    survival.start();
    loop.start();
});
