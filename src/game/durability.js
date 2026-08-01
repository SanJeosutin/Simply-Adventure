import { durabilitySettings } from '../data/game.data.js';


function getDurability(stats, item) {
    return stats.status?.durability?.[item] ?? null;
}

function hasDurability(stats, item) {
    const durability = getDurability(stats, item);

    return Boolean(durability?.usesLeft > 0 && durability.currentUsesLeft > 0);
}

function registerDurability(stats, item, quantity = 1) {
    const settings = durabilitySettings[item];

    if (!settings || quantity < 1) {
        return null;
    }

    stats.status ??= {};
    stats.status.durability ??= {};

    const addedUses = settings.maxUses * quantity;
    const durability = stats.status.durability[item] ?? {
        currentUsesLeft: 0,
        maxUses: 0,
        pendingBreaks: 0,
        usesLeft: 0,
    };

    durability.usesLeft += addedUses;
    durability.maxUses += addedUses;

    if (durability.currentUsesLeft < 1) {
        durability.currentUsesLeft = settings.maxUses;
    }

    stats.status.durability[item] = durability;

    return durability;
}

function finalizeDurabilityBreak(stats, item) {
    const settings = durabilitySettings[item];
    const durability = getDurability(stats, item);

    if (!settings || !durability || durability.pendingBreaks < 1) {
        return false;
    }

    const inventory = stats.inventory[settings.category];

    inventory[item] = Math.max(0, inventory[item] - 1);
    durability.maxUses = Math.max(0, durability.maxUses - settings.maxUses);
    durability.pendingBreaks -= 1;

    return true;
}

function consumeDurability(stats, item, { deferBreak = false } = {}) {
    const settings = durabilitySettings[item];
    const durability = getDurability(stats, item);

    if (!settings || !hasDurability(stats, item)) {
        return { broke: false, consumed: false };
    }

    durability.usesLeft = Math.max(0, durability.usesLeft - 1);
    durability.currentUsesLeft = Math.max(0, durability.currentUsesLeft - 1);

    if (durability.currentUsesLeft > 0) {
        return { broke: false, consumed: true };
    }

    durability.pendingBreaks += 1;

    const ownedQuantity = stats.inventory[settings.category][item];
    const availableCopies = ownedQuantity - durability.pendingBreaks;

    durability.currentUsesLeft = availableCopies > 0 ? settings.maxUses : 0;

    if (!deferBreak) {
        finalizeDurabilityBreak(stats, item);
    }

    return { broke: true, consumed: true };
}

export {
    consumeDurability,
    finalizeDurabilityBreak,
    getDurability,
    hasDurability,
    registerDurability,
};
