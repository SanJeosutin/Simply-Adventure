import readJSONFile from '../components/Logic/readJSONFile.js';


const playerDataURL = new URL('./player.data.json', import.meta.url);
const requiredAttributes = ['health', 'hunger', 'thirst'];
const survivalNeeds = ['hunger', 'thirst'];
const inventoryCategories = ['items', 'tools', 'buildings', 'furnitures'];

function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
}

function assertPositiveNumber(value, path) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new TypeError(`${path} must be a positive number.`);
    }
}

function validateAttribute(attribute, name) {
    if (!attribute || typeof attribute !== 'object') {
        throw new TypeError(`attributes.${name} must be an object.`);
    }

    assertPositiveNumber(attribute.max, `attributes.${name}.max`);

    if (!Number.isFinite(attribute.current) || attribute.current < 0 ||
        attribute.current > attribute.max) {
        throw new TypeError(
            `attributes.${name}.current must be between 0 and its maximum.`
        );
    }
}

function validateTimedRule(rule, path) {
    if (!rule || typeof rule !== 'object') {
        throw new TypeError(`${path} must be an object.`);
    }

    assertPositiveNumber(rule.amount, `${path}.amount`);
    assertPositiveNumber(rule.intervalMs, `${path}.intervalMs`);
}

function validateInventory(inventory) {
    if (!inventory || typeof inventory !== 'object') {
        throw new TypeError('inventory must be an object.');
    }

    inventoryCategories.forEach(category => {
        const entries = inventory[category];

        if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
            throw new TypeError(`inventory.${category} must be an object.`);
        }

        Object.entries(entries).forEach(([item, quantity]) => {
            if (!Number.isFinite(quantity) || quantity < 0) {
                throw new TypeError(
                    `inventory.${category}.${item} must be a non-negative number.`
                );
            }
        });
    });
}

function validatePlayerData(playerData) {
    if (!playerData || typeof playerData !== 'object') {
        throw new TypeError('Player data must be an object.');
    }

    requiredAttributes.forEach(name => {
        validateAttribute(playerData.attributes?.[name], name);
    });

    survivalNeeds.forEach(name => {
        const attribute = playerData.attributes[name];

        validateTimedRule(attribute.decay, `attributes.${name}.decay`);
        validateTimedRule(attribute.zeroDamage, `attributes.${name}.zeroDamage`);
    });

    validateInventory(playerData.inventory);

    return playerData;
}

async function loadPlayerData(fetchImplementation = globalThis.fetch) {
    return validatePlayerData(
        await readJSONFile(playerDataURL, fetchImplementation)
    );
}

function createPlayerStats(playerData) {
    const validatedData = validatePlayerData(playerData);

    return {
        attributes: cloneData(validatedData.attributes),
        inventory: cloneData(validatedData.inventory),
        status: {
            autoEatBerry: false,
            campFires: [],
            cookingJobs: [],
            cooldowns: {
                splintReadyAt: 0,
            },
            discoveries: {
                waterSourceFound: false,
            },
            durability: {},
            gameOver: false,
            preparedFoods: [],
            selectedBait: null,
            selectedCampFireID: null,
            selectedCascerationFood: null,
            traps: [],
            unlockedAttributes: {
                health: false,
                hunger: false,
                thirst: false,
            },
        },
    };
}

export { createPlayerStats, loadPlayerData, validatePlayerData };
