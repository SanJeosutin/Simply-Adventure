import GameLoop from './gameloop.js';


function lerp(v1, v2, p) {
    return v1 * (1 - p) + v2 * p;
}

const loop = new GameLoop();

const stats = {
    general: {
        gameVersion: 'EXPERIMENTAL - 0.0.1',
    },
    inventory: {
        pebble: 0,
    }
};

let prevStats = { ...stats };

let lastAmount = 0;
let lastInterval = 0;



$(document).ready(() => {

    $('#action-scavenge').on("click", () => {
        stats.inventory.pebble += 1;
        console.log("adding pebble");
    });


    loop.onUpdate = (dt, t) => {
        prevStats.general.timeSpent = t - lastInterval;

        prevStats.inventory.pebble = stats.inventory.pebble;

        if (t - lastInterval >= 1000) {
            lastInterval = t;
            lastAmount = stats.pebble;
        }
    };


    loop.onRender = (i) => {
        const iStats = {
            inventory: {
                pebble: lerp(prevStats.inventory.pebble, stats.inventory.pebble, i),
            }
        };

        if (iStats.inventory.pebble >= 5) {
            $('#action-craft').removeAttr('hidden');
        }
        $('#pebble-total').text(iStats.inventory.pebble.toFixed(0));
    };

    $('#current-version').text(stats.general.gameVersion);

    loop.start();

});

