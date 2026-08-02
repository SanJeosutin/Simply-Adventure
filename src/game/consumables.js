import {
    berryConsumableSettings,
    cookedFoodConsumptionDuration,
    cookedFoodSettings,
} from '../data/game.data.js';
import { roundStat } from './survival.js';


function canConsumeBerry(stats) {
    const hunger = stats.attributes.hunger;
    const berryTotal = stats.inventory.items[berryConsumableSettings.item];

    return !stats.status.gameOver &&
        berryTotal >= berryConsumableSettings.quantity &&
        hunger.current < hunger.max;
}

function applyBerryNutrition(stats) {
    const hunger = stats.attributes.hunger;

    hunger.current = roundStat(Math.min(
        hunger.max,
        hunger.current + berryConsumableSettings.hungerRestored,
    ));

    return hunger.current;
}

function getCookedFoodAction(cookedItem) {
    return `#action-eat-${cookedItem.replaceAll('_', '-')}`;
}

function getPreparedFood(stats, cookedItem, currentTime = Date.now()) {
    return stats.status.preparedFoods
        .filter(food =>
            food.cookedItem === cookedItem &&
            food.servingsRemaining > 0 &&
            food.rotsAt > currentTime
        )
        .sort((first, second) => first.rotsAt - second.rotsAt)[0] ?? null;
}

function canConsumeCookedFood(stats, cookedItem, currentTime = Date.now()) {
    return !stats.status.gameOver &&
        Boolean(cookedFoodSettings[cookedItem]) &&
        Boolean(getPreparedFood(stats, cookedItem, currentTime)) &&
        stats.attributes.hunger.current < stats.attributes.hunger.max;
}

function reservePreparedServing(stats, cookedItem, currentTime = Date.now()) {
    const preparedFood = getPreparedFood(stats, cookedItem, currentTime);

    if (!preparedFood) {
        return null;
    }

    const reservation = {
        cookedItem,
        foodID: preparedFood.id,
        removed: preparedFood.servingsRemaining === 1,
        rotsAt: preparedFood.rotsAt,
    };

    preparedFood.servingsRemaining -= 1;

    if (reservation.removed) {
        stats.status.preparedFoods = stats.status.preparedFoods.filter(
            food => food.id !== preparedFood.id
        );
        stats.inventory.items[cookedItem] = Math.max(
            0,
            stats.inventory.items[cookedItem] - 1,
        );
    }

    return reservation;
}

function refundPreparedServing(stats, reservation) {
    if (!reservation) {
        return false;
    }

    const preparedFood = stats.status.preparedFoods.find(
        food => food.id === reservation.foodID
    );

    if (preparedFood) {
        preparedFood.servingsRemaining += 1;
        return true;
    }

    stats.status.preparedFoods.push({
        cookedItem: reservation.cookedItem,
        id: reservation.foodID,
        rotsAt: reservation.rotsAt,
        servingsRemaining: 1,
    });
    stats.inventory.items[reservation.cookedItem] += 1;

    return true;
}

function applyCookedFoodNutrition(stats, cookedItem) {
    const food = cookedFoodSettings[cookedItem];
    const hunger = stats.attributes.hunger;

    if (!food) {
        return hunger.current;
    }

    hunger.current = roundStat(Math.min(
        hunger.max,
        hunger.current + food.hungerRestored,
    ));

    return hunger.current;
}

function startCookedFoodConsumption(
    stats,
    progress,
    cookedItem,
    query = globalThis.$,
    onNeedRestored = () => {},
) {
    const action = getCookedFoodAction(cookedItem);

    if (!canConsumeCookedFood(stats, cookedItem) || progress.isActive(action)) {
        return false;
    }

    const actionButton = query(action);

    if (!actionButton.length) {
        return false;
    }

    const reservation = reservePreparedServing(stats, cookedItem);

    actionButton.prop('disabled', true);

    const started = progress.start(
        action,
        `Eating ${cookedFoodSettings[cookedItem].cookedLabel}`,
        cookedFoodConsumptionDuration,
        () => {
            applyCookedFoodNutrition(stats, cookedItem);
            onNeedRestored('hunger');
            actionButton.prop(
                'disabled',
                !canConsumeCookedFood(stats, cookedItem),
            );
        },
    );

    if (!started) {
        refundPreparedServing(stats, reservation);
        actionButton.prop('disabled', false);
    }

    return started;
}

function startBerryConsumption(
    stats,
    progress,
    query = globalThis.$,
    onNeedRestored = () => {},
) {
    const action = berryConsumableSettings.action;

    if (!canConsumeBerry(stats) || progress.isActive(action)) {
        return false;
    }

    const actionButton = query(action);

    if (!actionButton.length) {
        return false;
    }

    const berries = stats.inventory.items;

    berries[berryConsumableSettings.item] -= berryConsumableSettings.quantity;
    actionButton.prop('disabled', true);

    const started = progress.start(
        action,
        'Eating Berry',
        berryConsumableSettings.cooldown,
        () => {
            applyBerryNutrition(stats);
            onNeedRestored('hunger');
            actionButton.prop('disabled', !canConsumeBerry(stats));
        },
    );

    if (!started) {
        berries[berryConsumableSettings.item] += berryConsumableSettings.quantity;
        actionButton.prop('disabled', false);
    }

    return started;
}

function initializeBerryActions(
    stats,
    progress,
    query = globalThis.$,
    onNeedRestored = () => {},
) {
    query('#action').on(
        'click',
        berryConsumableSettings.action,
        () => startBerryConsumption(
            stats,
            progress,
            query,
            onNeedRestored,
        ),
    );
    query('#action').on(
        'change',
        berryConsumableSettings.autoEatControl,
        event => {
            stats.status.autoEatBerry = event.currentTarget.checked;
        },
    );

    return {
        update() {
            if (!stats.status.autoEatBerry) {
                return false;
            }

            return startBerryConsumption(
                stats,
                progress,
                query,
                onNeedRestored,
            );
        },
    };
}

function initializeCookedFoodActions(
    stats,
    progress,
    query = globalThis.$,
    onNeedRestored = () => {},
) {
    query('#action').on('click', '[data-eat-cooked-food]', event => {
        startCookedFoodConsumption(
            stats,
            progress,
            event.currentTarget.dataset.eatCookedFood,
            query,
            onNeedRestored,
        );
    });
}

export {
    applyCookedFoodNutrition,
    applyBerryNutrition,
    canConsumeBerry,
    canConsumeCookedFood,
    getCookedFoodAction,
    getPreparedFood,
    initializeBerryActions,
    initializeCookedFoodActions,
    refundPreparedServing,
    reservePreparedServing,
    startBerryConsumption,
    startCookedFoodConsumption,
};
