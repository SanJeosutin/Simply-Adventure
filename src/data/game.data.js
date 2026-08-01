const settings = {
    debugMode: false,
    gameVersion: 'EXPERIMENTAL - 0.0.2c',
};

const stats = {
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

const actionIDs = {
    scavenge: '#action-scavenge',
    craft: {
        string: '#action-craft-string',
        rope: '#action-craft-rope',
    },
    attack: '#action-attack',
};

const scavengeItems = [
    'straw',
    'stick',
    'pebble',
    'berry',
    'leaf',
];

const craftActions = [
    {
        requiredItem: 'straw',
        giveItem: 'string',
        required: 5,
        cooldown: 3000,
        buttonID: 'craft-string',
        message: 'You need 5 straws to craft a string.',
    },
    {
        requiredItem: 'string',
        giveItem: 'rope',
        required: 7,
        cooldown: 9000,
        buttonID: 'craft-rope',
        message: 'You need 7 strings to craft a rope.',
    },
];

export {
    settings,
    stats,
    actionIDs,
    scavengeItems,
    craftActions,
};
