import GameLoop from './gameloop.js';
import Button from './components/UI/button.ui.js';

function lerp(v1, v2, p) {
    return v1 * (1 - p) + v2 * p;
}

const loop = new GameLoop();
const btn = new Button();

const stats = {
    general: {
        gameVersion: 'EXPERIMENTAL - 0.0.1',
    },
    inventory: {
        pebble: 0,
        sword: 0,
    }
};

const createButtonID = {
    actions: {
        scavenge: '#action-scavenge',
        craft: '#action-craft',
        attack: '#action-attack',
    },
};

const displayTotalID = {
    items: {
        materials: {
            pebble: '#total-pebble',
        },
        weapons: {
            sword: '#total-sword',
        }
    },
}



let prevStats = { ...stats };

let lastInterval = 0;


$(document).ready(() => {
    $('#action').on('click', createButtonID.actions.scavenge, () => {
        stats.inventory.pebble += 1;
        console.log("adding pebble");

        $(createButtonID.actions.scavenge).prop('disabled', true);
        setTimeout(() => {
            $(createButtonID.actions.scavenge).prop('disabled', false);
            console.log('scavenging');
        }, 1000);
    });

    $('#action').on("click", createButtonID.actions.craft, () => {
        if (stats.inventory.pebble >= 5) {
            stats.inventory.sword += 1;
            stats.inventory.pebble -= 5;
            console.log("crafting sword");

            $(createButtonID.actions.craft).prop('disabled', true);

            setTimeout(() => {
                $(createButtonID.actions.craft).prop('disabled', false);
                console.log('Crafting');
            }, 3000);
        } else {
            alert("You need 5 pebbles to craft a Sword.");
        }

        console.log("Curent Pebble: " + stats.inventory.pebble);
    });


    loop.onUpdate = (dt, t) => {
        prevStats.inventory.pebble = stats.inventory.pebble;
        prevStats.inventory.sword = stats.inventory.sword;
    };


    loop.onRender = (i) => {
        const iStats = {
            inventory: {
                pebble: lerp(prevStats.inventory.pebble, stats.inventory.pebble, i),
                sword: lerp(prevStats.inventory.sword, stats.inventory.sword, i),
            }
        };

        if (iStats.inventory.pebble >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.pebble).length) {
            $('#display-inventory').append(
                `<tr>
                    <th class="row">Pebbles</th>
                    <td id="total-pebble"></td>
                </tr>`
            );
        }

        if (iStats.inventory.pebble >= 5 && !$('#action').find(createButtonID.actions.craft).length) {
            btn.create('action', 'craft');
        }

        if (iStats.inventory.sword >= 1 && !$('#display-inventory').find(displayTotalID.items.weapons.sword).length) {
            $('#display-inventory').append(
                `<tr>
                    <th class="row">sword</th>
                    <td id="total-sword"></td>
                </tr>`
            );
            btn.create('action', 'attack');
        }

        $('#total-pebble').text(stats.inventory.pebble.toFixed(0));
        $('#total-sword').text(stats.inventory.sword.toFixed(0));
    };

    $('#current-version').text(stats.general.gameVersion);

    loop.start();

});

