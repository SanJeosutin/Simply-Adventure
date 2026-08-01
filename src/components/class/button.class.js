"use strict";

import debugLog from '../Logic/debug.js';
import Progress from '../UI/progress.ui.js';


export default class CreateButton {
    constructor(progress = new Progress()) {
        this.activeCrafts = new Set();
        this.progress = progress;
    }

    create(action, inventory, reqItem, giveItem, reqQty, cooldown, message) {
        this.createRecipe(action, { items: inventory }, {
            id: giveItem,
            label: giveItem,
            requirements: [
                { category: 'items', item: reqItem, quantity: reqQty },
            ],
            output: { category: 'items', item: giveItem, quantity: 1 },
            craftTime: cooldown,
            message,
        });
    }

    createRecipe(action, inventory, recipe, onComplete = () => {}) {
        $('#action').on('click', action, () => {
            if (this.activeCrafts.has(action) || this.progress.isActive(action)) {
                return;
            }

            const hasRequirements = recipe.requirements.every(requirement =>
                inventory[requirement.category][requirement.item] >= requirement.quantity
            );

            if (!hasRequirements) {
                alert(recipe.message);
                debugLog(`Unable to craft ${recipe.label}: missing resources.`);
                return;
            }

            recipe.requirements.forEach(requirement => {
                inventory[requirement.category][requirement.item] -= requirement.quantity;
            });

            const actionButton = $(action);

            this.activeCrafts.add(action);
            actionButton.prop('disabled', true);
            const started = this.progress.start(
                action,
                `Crafting ${recipe.label}`,
                recipe.craftTime,
                () => {
                    const output = recipe.output;

                    inventory[output.category][output.item] += output.quantity;
                    this.activeCrafts.delete(action);
                    actionButton.prop('disabled', false);
                    debugLog(`Crafting ${recipe.label} complete.`);
                    onComplete(recipe, inventory);
                },
            );

            if (!started) {
                recipe.requirements.forEach(requirement => {
                    inventory[requirement.category][requirement.item] += requirement.quantity;
                });

                this.activeCrafts.delete(action);
                actionButton.prop('disabled', false);
                return;
            }

            debugLog(`Crafting ${recipe.label}...`);
        });
    }
}
