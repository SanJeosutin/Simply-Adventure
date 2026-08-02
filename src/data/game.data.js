const settings = {
    debugMode: false,
    gameVersion: 'EXPERIMENTAL - 0.0.3b',
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

const berryConsumableSettings = {
    action: '#action-eat-berry',
    autoEatControl: '#auto-eat-berry',
    cooldown: 100,
    discoveryQuantity: 1,
    hungerRestored: 0.02,
    item: 'berry',
    quantity: 1,
    satedThreshold: 15,
};

const cookingSettings = Object.freeze({
    raw_rabbit: {
        cookedLabel: 'Cooked Rabbit',
        cookedItem: 'cooked_rabbit',
        cookingDuration: 300000,
        hungerRestored: 7.5,
        label: 'Raw Rabbit',
        rottenItem: 'rotten_rabbit',
        servings: 2,
        spoilDuration: 7200000,
    },
    raw_fish: {
        cookedLabel: 'Cooked Fish',
        cookedItem: 'cooked_fish',
        cookingDuration: 240000,
        hungerRestored: 8,
        label: 'Raw Fish',
        rottenItem: 'rotten_fish',
        servings: 1,
        spoilDuration: 5400000,
    },
    fish_fillet: {
        cookedLabel: 'Cooked Fish Fillet',
        cookedItem: 'cooked_fish_fillet',
        cookingDuration: 120000,
        hungerRestored: 4,
        label: 'Fish Fillet',
        rottenItem: 'rotten_fish_fillet',
        servings: 1,
        spoilDuration: 7200000,
    },
    rabbit_meat: {
        cookedLabel: 'Cooked Rabbit Meat',
        cookedItem: 'cooked_rabbit_meat',
        cookingDuration: 150000,
        hungerRestored: 5,
        label: 'Rabbit Meat',
        rottenItem: 'rotten_rabbit_meat',
        servings: 1,
        spoilDuration: 10800000,
    },
});

const cookedFoodSettings = Object.freeze(
    Object.fromEntries(Object.entries(cookingSettings).map(([rawItem, food]) => [
        food.cookedItem,
        { ...food, rawItem },
    ]))
);

const cookedFoodConsumptionDuration = 10000;

const cascerationSettings = Object.freeze({
    action: '#action-cascerate',
    baseDurationPerItem: 10000,
    foodControl: '#cascerate-food',
    foods: {
        raw_fish: {
            durationPerItem: 10000,
            label: 'Raw Fish',
            yields: {
                fish_bones: {
                    fallbackRange: [2, 2],
                    specialChance: 0.4,
                    specialRange: [3, 4],
                },
                fish_fillet: {
                    fallbackRange: [3, 3],
                    specialChance: 0.4,
                    specialRange: [4, 5],
                },
            },
        },
        raw_rabbit: {
            durationPerItem: 15000,
            label: 'Raw Rabbit',
            yields: {
                rabbit_hide: {
                    fallbackRange: [1, 1],
                    specialChance: 0.2,
                    specialRange: [0, 0],
                },
                rabbit_meat: {
                    fallbackRange: [1, 2],
                    specialChance: 0.45,
                    specialRange: [3, 3],
                },
                rabbit_foot: {
                    fallbackRange: [1, 2],
                    specialChance: 0.75,
                    specialRange: [0, 0],
                },
                rabbit_bones: {
                    fallbackRange: [2, 4],
                    specialChance: 0.65,
                    specialRange: [5, 5],
                },
            },
        },
    },
    quantityAdjustmentPerItem: 950,
    quantityControl: '#cascerate-quantity',
    tool: 'basic_knife',
    toolDuration: 45000,
});

const splintSettings = Object.freeze({
    action: '#action-apply-splint',
    applicationDuration: 10000,
    cooldown: 120000,
    healthRestored: 0.5,
    item: 'splint',
});

const baitSettings = Object.freeze({
    control: '#trap-bait',
    items: [
        'berry',
        'rotten_rabbit',
        'rotten_fish',
        'rotten_fish_fillet',
        'rotten_rabbit_meat',
    ],
    quantity: 1,
});

const campFireSettings = {
    fuelItem: 'leaf',
    fuelRequired: 25,
    fuelDuration: 300000,
    charcoalItem: 'charcoal',
    charcoalRequired: 1,
    charcoalDuration: 1800000,
};

const durabilitySettings = {
    basic_spear: { category: 'tools', maxUses: 2 },
    basic_knife: { category: 'tools', maxUses: 4 },
    camp_fire: { category: 'furnitures', maxUses: 10 },
    trap: { category: 'furnitures', maxUses: 5 },
};

const huntingSettings = {
    spear: {
        tool: 'basic_spear',
        minDuration: 10000,
        maxDuration: 20000,
        maxBonusChance: 0.5,
    },
    trap: {
        furniture: 'trap',
        minDuration: 45000,
        maxDuration: 180000,
    },
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
    {
        id: 'splint',
        label: 'Splint',
        requirements: [
            { category: 'items', item: 'stick', quantity: 10 },
            { category: 'items', item: 'string', quantity: 6 },
        ],
        output: { category: 'items', item: 'splint', quantity: 1 },
        craftTime: 60000,
        message: 'You need 10 sticks and 6 strings to craft a Splint.',
    },
    {
        id: 'charcoal',
        label: 'Charcoal',
        requirements: [
            { category: 'items', item: 'stick', quantity: 5 },
        ],
        conditions: [
            { type: 'active-furniture', item: 'camp_fire' },
        ],
        output: { category: 'items', item: 'charcoal', quantity: 1 },
        craftTime: 45000,
        message: 'You need an active Camp Fire and 5 sticks to craft Charcoal.',
    },
];

function getCraftActionID(recipeID) {
    return `#action-craft-${recipeID}`;
}

export {
    settings,
    actionIDs,
    baitSettings,
    berryConsumableSettings,
    cascerationSettings,
    cookedFoodConsumptionDuration,
    cookedFoodSettings,
    cookingSettings,
    scavengeItems,
    scavengeSettings,
    campFireSettings,
    durabilitySettings,
    huntingSettings,
    splintSettings,
    craftActions,
    getCraftActionID,
};
