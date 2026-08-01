import GameLoop from './game/mechanics/gameloop.js';

import initializeActions from './game/actions.js';
import renderInventory from './game/inventory.js';

import Progress from './components/UI/progress.ui.js';

import { settings, stats } from './data/game.data.js';


const loop = new GameLoop();
const progress = new Progress();

$(document).ready(() => {
    initializeActions(stats, progress);

    loop.onUpdate = () => {};
    loop.onRender = () => renderInventory(stats, progress);

    $('#current-version').text(settings.gameVersion);
    loop.start();
});
