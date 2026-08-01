import GameLoop from './game/mechanics/gameloop.js';

import initializeActions from './game/actions.js';
import renderInventory from './game/inventory.js';

import { settings, stats } from './data/game.data.js';


const loop = new GameLoop();

$(document).ready(() => {
    initializeActions(stats);

    loop.onUpdate = () => {};
    loop.onRender = () => renderInventory(stats);

    $('#current-version').text(settings.gameVersion);
    loop.start();
});
