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
        sword: 0,
    }
};

const createButton = {
    actions: {
        scavenge: '#action-scavenge',
        craft: '#action-craft',
        attack: '#action-attack',
    },
};

const displayTotal = {
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
    $('#actions').on('click', createButton.actions.scavenge, () => {
        stats.inventory.pebble += 1;
        console.log("adding pebble");

        $(createButton.actions.scavenge).prop('disabled', true);
        setTimeout(() => {
            $(createButton.actions.scavenge).prop('disabled', false);
            console.log('scavenging');
        }, 1000);
    });

    $('#actions').on("click", createButton.actions.craft, () => {
        if (stats.inventory.pebble >= 5) {
            stats.inventory.sword += 1;
            stats.inventory.pebble -= 5;
            console.log("crafting sword");

            $(createButton.actions.craft).prop('disabled', true);

            setTimeout(() => {
                $(createButton.actions.craft).prop('disabled', false);
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

        if (iStats.inventory.pebble >= 1 && !$('#display-inventory').find(displayTotal.items.materials.pebble).length) {
            $('#display-inventory').append(
                `<tr>
                    <th class="row">Pebbles</th>
                    <td id="total-pebble"></td>
                </tr>`
            );
        }

        if (iStats.inventory.pebble >= 5 && !$('#actions').find(createButton.actions.craft).length) {
            $('#actions').append(
                $(document.createElement('createButton')).prop({
                    type: 'createButton',
                    innerHTML: 'Craft',
                    class: 'btn btn-sm btn-dark',
                    id: 'action-craft'
                })
            );
        }

        if (iStats.inventory.sword >= 1 && !$('#display-inventory').find(displayTotal.items.weapons.sword).length) {
            $('#display-inventory').append(
                `<tr>
                    <th class="row">sword</th>
                    <td id="total-sword"></td>
                </tr>`
            );

            $('#actions').append(
                $(document.createElement('createButton')).prop({
                    type: 'createButton',
                    innerHTML: 'Attack',
                    class: 'btn btn-sm btn-dark',
                    id: 'action-attack'
                })
            );
        }

        $('#total-pebble').text(stats.inventory.pebble.toFixed(0));
        $('#total-sword').text(stats.inventory.sword.toFixed(0));
    };

    $('#current-version').text(stats.general.gameVersion);

    loop.start();

});

