import {
    berryConsumableSettings,
    cookedFoodSettings,
} from '../data/game.data.js';


const attributeNames = ['health', 'hunger', 'thirst'];

function ensureDiscoveryState(stats) {
    stats.status ??= {};
    stats.status.discoveries ??= {};
    stats.status.discoveries.waterSourceFound ??= false;
    stats.status.unlockedAttributes ??= {};

    attributeNames.forEach(name => {
        stats.status.unlockedAttributes[name] ??= false;
    });

    return stats.status.unlockedAttributes;
}

function updateAttributeUnlocks(stats) {
    const unlockedAttributes = ensureDiscoveryState(stats);

    const foundEdibleFood = Object.keys(cookedFoodSettings).some(item =>
        stats.inventory.items[item] >= 1
    );

    if (foundEdibleFood ||
        stats.inventory.items[berryConsumableSettings.item] >=
        berryConsumableSettings.discoveryQuantity) {
        unlockedAttributes.hunger = true;
    }

    if (stats.attributes.hunger.current >= berryConsumableSettings.satedThreshold) {
        unlockedAttributes.health = true;
    }

    if (stats.status.discoveries.waterSourceFound) {
        unlockedAttributes.thirst = true;
    }

    return unlockedAttributes;
}

function discoverWaterSource(stats) {
    ensureDiscoveryState(stats);
    stats.status.discoveries.waterSourceFound = true;
    updateAttributeUnlocks(stats);

    return true;
}

function isAttributeUnlocked(stats, name) {
    return Boolean(updateAttributeUnlocks(stats)[name]);
}

export {
    discoverWaterSource,
    ensureDiscoveryState,
    isAttributeUnlocked,
    updateAttributeUnlocks,
};
