import GameLoop from './game/mechanics/gameloop.js';

import Display from './components/UI/display.ui.js';
import Button from './components/UI/button.ui.js';

import CreateButton from './components/class/button.class.js';


function lerp(v1, v2, p) {
    return v1 * (1 - p) + v2 * p;
}

const loop = new GameLoop();

const btn = new Button();
const display = new Display();

let stats = {
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

//BUTTON CREATION WHEN CERTAIN CRITERIA ARE MET
    const createAction = new CreateButton('#action');

    //INITIALISED BUTTON
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

    //create(action, inventory, reqItem, giveItem, reqQty, cooldown, message)
    createAction.create(createButtonID.actions.craft.string, stats.inventory.items, "straw", "string", 5, 3000, "You need 5 straws to craft a string.");
    createAction.create(createButtonID.actions.craft.rope, stats.inventory.items, "string", "rope", 7, 9000, "You need 7 strings to craft a rope.");


//UPDATE PLAYER INVENTORY
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

// DISPLAY PLAYER INVENTORY
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

        const materials = Object.keys(stats.inventory.items);

        materials.forEach(material => {
            if (stats.inventory.items[material] >= 1 && !$('#display-inventory').find(displayTotalID.items.materials[material]).length) {
                display.create('display-inventory', material);
            }
        });

        const craftActions = [
            { item: "straw", required: 5, buttonID: "craft-string" },
            { item: "string", required: 7, buttonID: "craft-rope" },
        ];
        
        craftActions.forEach(action => {
            if (stats.inventory.items[action.item] >= action.required && 
                !$('#action').find(createButtonID.actions.craft[action.buttonID.replace("craft-", "")]).length) {
                btn.create('action', action.buttonID);
            }
        });

        /*if (iStats.inventory.sword >= 1 && !$('#display-inventory').find(displayTotalID.items.weapons.sword).length) {
            display.create('display-inventory', 'sword');
            btn.create('action', 'attack');
        }*/
        
// UPDATE PLAYERS INVENTORY ON THE U.I
        materials.forEach(material => {
            $(`#total-${material}`).text(stats.inventory.items[material].toFixed(0));
        });
    };

    $('#current-version').text(stats.general.gameVersion);

    loop.start();
});

