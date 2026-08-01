const settings = {
    debugMode: false,
    gameVersion: 'EXPERIMENTAL - 0.0.2c',
};

const stats = {
    status: {
        campFires: [],
    },
    inventory: {
        items: {
            pebble: 0,
            flint: 0,
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
    attack: '#action-attack',
};

const scavengeItems = [
    'straw',
    'stick',
    'pebble',
    'berry',
    'leaf',
];

const scavengeSettings = {
    flintChance: 0.2,
    maxAmount: 6,
};

const campFireSettings = {
    fuelItem: 'leaf',
    fuelRequired: 25,
    fuelDuration: 300000,
};

const craftActions = [
    {
        id: 'string',
        label: 'String',
        requirements: [
            { category: 'items', item: 'straw', quantity: 5 },
        ],
        output: { category: 'items', item: 'string', quantity: 1 },
        craftTime: 3000,
        message: 'You need 5 straws to craft a string.',
    },
    {
        id: 'rope',
        label: 'Rope',
        requirements: [
            { category: 'items', item: 'string', quantity: 7 },
        ],
        output: { category: 'items', item: 'rope', quantity: 1 },
        craftTime: 9000,
        message: 'You need 7 strings to craft a rope.',
    },
    {
        id: 'basic-spear',
        label: 'Basic Spear',
        requirements: [
            { category: 'items', item: 'flint', quantity: 1 },
            { category: 'items', item: 'stick', quantity: 2 },
            { category: 'items', item: 'string', quantity: 2 },
        ],
        output: { category: 'tools', item: 'basic_spear', quantity: 1 },
        craftTime: 15000,
        message: 'You need 1 flint, 2 sticks, and 2 strings to craft a Basic Spear.',
    },
    {
        id: 'basic-knife',
        label: 'Basic Knife',
        requirements: [
            { category: 'items', item: 'flint', quantity: 2 },
            { category: 'items', item: 'stick', quantity: 1 },
            { category: 'items', item: 'string', quantity: 5 },
        ],
        output: { category: 'tools', item: 'basic_knife', quantity: 1 },
        craftTime: 25000,
        message: 'You need 2 flints, 1 stick, and 5 strings to craft a Basic Knife.',
    },
    {
        id: 'camp-fire',
        label: 'Camp Fire',
        requirements: [
            { category: 'items', item: 'stick', quantity: 10 },
            { category: 'items', item: 'leaf', quantity: 15 },
            { category: 'items', item: 'flint', quantity: 1 },
        ],
        output: { category: 'furnitures', item: 'camp_fire', quantity: 1 },
        craftTime: 10000,
        message: 'You need 10 sticks, 15 leaves, and 1 flint to craft a Camp Fire.',
    },
    {
        id: 'trap',
        label: 'Trap',
        requirements: [
            { category: 'items', item: 'rope', quantity: 2 },
            { category: 'items', item: 'leaf', quantity: 5 },
            { category: 'items', item: 'berry', quantity: 2 },
        ],
        output: { category: 'furnitures', item: 'trap', quantity: 1 },
        craftTime: 15000,
        message: 'You need 2 ropes, 5 leaves, and 2 berries to craft a Trap.',
    },
];

function getCraftActionID(recipeID) {
    return `#action-craft-${recipeID}`;
}

export {
    settings,
    stats,
    actionIDs,
    scavengeItems,
    scavengeSettings,
    campFireSettings,
    craftActions,
    getCraftActionID,
};
