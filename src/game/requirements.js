function hasRecipeResources(stats, recipe) {
    return recipe.requirements.every(requirement =>
        stats.inventory[requirement.category][requirement.item] >= requirement.quantity
    );
}

function hasRecipeConditions(stats, recipe) {
    return (recipe.conditions ?? []).every(condition => {
        if (condition.type === 'active-furniture' && condition.item === 'camp_fire') {
            return stats.status.campFires.some(fire => fire.active && !fire.terminal);
        }

        return false;
    });
}

function canCraftRecipe(stats, recipe) {
    return hasRecipeResources(stats, recipe) && hasRecipeConditions(stats, recipe);
}

export { canCraftRecipe, hasRecipeConditions, hasRecipeResources };
