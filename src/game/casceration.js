import { cascerationSettings } from '../data/game.data.js';
import { consumeDurability, hasDurability } from './durability.js';


function calculateCascerationDuration(rawItem, quantity) {
    const food = cascerationSettings.foods[rawItem];

    if (!food || !Number.isInteger(quantity) || quantity < 1) {
        return null;
    }

    return quantity * (
        cascerationSettings.baseDurationPerItem +
        cascerationSettings.quantityAdjustmentPerItem +
        food.durationPerItem
    ) + cascerationSettings.toolDuration;
}

function randomInteger([minimum, maximum], random = Math.random) {
    return Math.floor(random() * (maximum - minimum + 1)) + minimum;
}

function rollCascerationYields(rawItem, quantity, random = Math.random) {
    const food = cascerationSettings.foods[rawItem];
    const totals = {};

    if (!food || !Number.isInteger(quantity) || quantity < 1) {
        return totals;
    }

    for (let foodIndex = 0; foodIndex < quantity; foodIndex += 1) {
        Object.entries(food.yields).forEach(([item, rule]) => {
            const range = random() < rule.specialChance
                ? rule.specialRange
                : rule.fallbackRange;

            totals[item] = (totals[item] ?? 0) + randomInteger(range, random);
        });
    }

    return totals;
}

function canCascerate(stats, rawItem, quantity) {
    return !stats.status.gameOver &&
        Boolean(cascerationSettings.foods[rawItem]) &&
        Number.isInteger(quantity) && quantity >= 1 &&
        stats.inventory.items[rawItem] >= quantity &&
        hasDurability(stats, cascerationSettings.tool);
}

function startCasceration(
    stats,
    progress,
    rawItem,
    quantity,
    options = {},
) {
    const query = options.query ?? globalThis.$;
    const random = options.random ?? Math.random;
    const action = cascerationSettings.action;

    if (!canCascerate(stats, rawItem, quantity) || progress.isActive(action)) {
        return false;
    }

    const actionButton = query(action);

    if (!actionButton.length) {
        return false;
    }

    const duration = calculateCascerationDuration(rawItem, quantity);

    stats.inventory.items[rawItem] -= quantity;
    actionButton.prop('disabled', true);

    const started = progress.start(
        action,
        `Cascerating ${quantity} ${cascerationSettings.foods[rawItem].label}`,
        duration,
        () => {
            const yields = rollCascerationYields(rawItem, quantity, random);
            const durability = consumeDurability(stats, cascerationSettings.tool);

            Object.entries(yields).forEach(([item, amount]) => {
                stats.inventory.items[item] += amount;
            });

            const result = Object.entries(yields)
                .filter(([, amount]) => amount > 0)
                .map(([item, amount]) =>
                    `${amount} ${item.replaceAll('_', ' ')}`
                )
                .join(', ');
            const breakMessage = durability.broke ? ' Your Basic Knife broke.' : '';

            progress.announce(`Casceration complete: ${result}.${breakMessage}`);
            actionButton.prop('disabled', false);
        },
    );

    if (!started) {
        stats.inventory.items[rawItem] += quantity;
        actionButton.prop('disabled', false);
    }

    return started;
}

function initializeCascerationActions(
    stats,
    progress,
    query = globalThis.$,
) {
    query('#action').on('change', cascerationSettings.foodControl, event => {
        stats.status.selectedCascerationFood = event.currentTarget.value;
    });
    query('#action').on('click', cascerationSettings.action, () => {
        const rawItem = query(cascerationSettings.foodControl).val();
        const quantity = Number(query(cascerationSettings.quantityControl).val());

        startCasceration(stats, progress, rawItem, quantity, { query });
    });
}

export {
    calculateCascerationDuration,
    canCascerate,
    initializeCascerationActions,
    randomInteger,
    rollCascerationYields,
    startCasceration,
};
