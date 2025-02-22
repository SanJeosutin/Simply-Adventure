import GameLoop from './game/mechanics/gameloop.js';
import Display from './components/UI/display.ui.js';
import Button from './components/UI/button.ui.js';

function lerp(v1, v2, p) {
    return v1 * (1 - p) + v2 * p;
}

const loop = new GameLoop();

const btn = new Button();
const display = new Display();

const stats = {
    general: {
        gameVersion: 'EXPERIMENTAL - 0.0.2c',
    },
    inventory: {
        items: {
            pebble: 0,
            straw: 0,
            stick: 0,
            berry: 0,
            leaf: 0,
            string: 0,
            rope: 0,
            map: 0,
            charcoal: 0,
        },
        tools: {
            basic_spear: 0,
            basic_knife: 0,
        },
        buildings: {

        },
        furnitures: {
            camp_fire: 0,
            trap: 0,
        }
    }
};

const createButtonID = {
    actions: {
        scavenge: '#action-scavenge',
        craft: {
            string: '#action-craft-string',
            rope: '#action-craft-rope',
        },
        attack: '#action-attack',
    },
};

const displayTotalID = {
    items: {
        materials: {
            pebble: '#total-pebble',
            straw: '#total-straw',
            stick: '#total-stick',
            berry: '#total-berry',
            leaf: '#total-leaf',
            string: '#total-string',
            rope: '#total-rope',
            map: '#total-map',
            charcoal: '#total-charcoal',
        
            
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
        stats.inventory.items.straw += Math.random(1) * 6;
        stats.inventory.items.stick += Math.random(1) * 6;
        stats.inventory.items.pebble += Math.random(1) * 6;
        stats.inventory.items.berry += Math.random(1) * 6;
        stats.inventory.items.leaf += Math.random(1) * 6;

        $(createButtonID.actions.scavenge).prop('disabled', true);
        setTimeout(() => {
            $(createButtonID.actions.scavenge).prop('disabled', false);
            console.log('scavenging...');
        }, 1000);
    });

    $('#action').on("click", createButtonID.actions.craft.string, () => {
        if (stats.inventory.items.straw >= 5) {
            stats.inventory.items.string += 1;
            stats.inventory.items.straw -= 5;
            console.log("crafting String");

            $(createButtonID.actions.craft.string).prop('disabled', true);

            setTimeout(() => {
                $(createButtonID.actions.craft.string).prop('disabled', false);
                console.log('Crafting String');
            }, 3000);
        } else {
            alert("You need 5 straws to craft a string.");
        }

        console.log("Curent Straw: " + stats.inventory.items.straw);
    });

    $('#action').on("click", createButtonID.actions.craft.rope, () => {
        if (stats.inventory.items.string >= 7) {
            stats.inventory.items.rope += 1;
            stats.inventory.items.string -= 7;
            console.log("crafting Rope");

            $(createButtonID.actions.craft.rope).prop('disabled', true);

            setTimeout(() => {
                $(createButtonID.actions.craft.rope).prop('disabled', false);
                console.log('Crafting Rope');
            }, 9000);
        } else {
            alert("You need 7 strings to craft a rope.");
        }

        console.log("Curent Strings: " + stats.inventory.items.string);
    });


    loop.onUpdate = (dt, t) => {
        prevStats.inventory.items.pebble = stats.inventory.items.pebble;
        prevStats.inventory.items.straw = stats.inventory.items.straw;
        prevStats.inventory.items.stick = stats.inventory.items.stick;
        prevStats.inventory.items.berry = stats.inventory.items.berry;
        prevStats.inventory.items.leaf = stats.inventory.items.leaf;
        prevStats.inventory.items.string = stats.inventory.items.string;
        prevStats.inventory.items.rope = stats.inventory.items.rope;
        prevStats.inventory.items.map = stats.inventory.items.map;
        prevStats.inventory.items.charcoal = stats.inventory.items.charcoal;
    };


    loop.onRender = (i) => {
        const iStats = {
            inventory: {
                pebble: lerp(prevStats.inventory.items.pebble, stats.inventory.items.pebble, i),
                straw: lerp(prevStats.inventory.items.straw, stats.inventory.items.straw, i),
                stick: lerp(prevStats.inventory.items.stick, stats.inventory.items.stick, i),
                berry: lerp(prevStats.inventory.items.berry, stats.inventory.items.berry, i),
                leaf: lerp(prevStats.inventory.items.leaf, stats.inventory.items.leaf, i),
                string: lerp(prevStats.inventory.items.string, stats.inventory.items.string, i),
                rope: lerp(prevStats.inventory.items.rope, stats.inventory.items.rope, i),
                map: lerp(prevStats.inventory.items.map, stats.inventory.items.map, i),
                charcoal: lerp(prevStats.inventory.items.charcoal, stats.inventory.items.charcoal, i),
            }
        };

        if (iStats.inventory.pebble >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.pebble).length) {
            display.create('display-inventory', 'pebble');
        }

        if (iStats.inventory.straw >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.straw).length) {
            display.create('display-inventory', 'straw');
        }

        if (iStats.inventory.stick >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.stick).length) {
            display.create('display-inventory', 'stick');
        }

        if (iStats.inventory.berry >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.berry).length) {
            display.create('display-inventory', 'berry');
        }

        if (iStats.inventory.leaf >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.leaf).length) {
            display.create('display-inventory', 'leaf');
        }

        if (iStats.inventory.string >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.string).length) {
            display.create('display-inventory', 'string');
        }

        if (iStats.inventory.rope >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.rope).length) {
            display.create('display-inventory', 'rope');
        }

        if (iStats.inventory.map >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.map).length) {
            display.create('display-inventory', 'map');
        }

        if (iStats.inventory.charcoal >= 1 && !$('#display-inventory').find(displayTotalID.items.materials.charcoal).length) {
            display.create('display-inventory', 'charcoal');
        }


        if (iStats.inventory.straw >= 5 && !$('#action').find(createButtonID.actions.craft.string).length) {
            btn.create('action', 'craft-string');
        }

        if (iStats.inventory.string >= 7 && !$('#action').find(createButtonID.actions.craft.rope).length) {
            btn.create('action', 'craft-rope');
        }

        /*if (iStats.inventory.sword >= 1 && !$('#display-inventory').find(displayTotalID.items.weapons.sword).length) {
            display.create('display-inventory', 'sword');
            btn.create('action', 'attack');
        }*/

        $('#total-pebble').text(stats.inventory.items.pebble.toFixed(0));
        $('#total-straw').text(stats.inventory.items.straw.toFixed(0));
        $('#total-stick').text(stats.inventory.items.stick.toFixed(0));
        $('#total-berry').text(stats.inventory.items.berry.toFixed(0));
        $('#total-leaf').text(stats.inventory.items.leaf.toFixed(0));
        $('#total-string').text(stats.inventory.items.string.toFixed(0));
        $('#total-rope').text(stats.inventory.items.rope.toFixed(0));
        $('#total-map').text(stats.inventory.items.map.toFixed(0));
        $('#total-charcoal').text(stats.inventory.items.charcoal.toFixed(0));
    };

    $('#current-version').text(stats.general.gameVersion);

    loop.start();
});

