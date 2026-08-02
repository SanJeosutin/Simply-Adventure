import {
    cookedFoodSettings,
    cookingSettings,
} from '../data/game.data.js';


function ensureCookingState(stats) {
    stats.status ??= {};
    stats.status.cookingJobs ??= [];
    stats.status.preparedFoods ??= [];
    stats.status.selectedCampFireID ??= null;
}

function getCookingJob(stats, fireID) {
    return stats.status.cookingJobs.find(job => job.fireID === fireID) ?? null;
}

function getEligibleCampFires(stats) {
    ensureCookingState(stats);

    return stats.status.campFires.filter(fire =>
        fire.active && !fire.terminal && !getCookingJob(stats, fire.id)
    );
}

function getCookableRawItems(stats) {
    return Object.keys(cookingSettings).filter(item =>
        stats.inventory.items[item] >= 1
    );
}

function getNextID(records) {
    return records.reduce(
        (highestID, record) => Math.max(highestID, record.id),
        0,
    ) + 1;
}

function getCookingJobElapsed(job, currentTime) {
    if (job.state !== 'cooking' || job.resumedAt === null) {
        return job.elapsedMs;
    }

    return Math.min(
        job.durationMs,
        job.elapsedMs + Math.max(0, currentTime - job.resumedAt),
    );
}

function getCookingJobProgress(job, currentTime = Date.now()) {
    const elapsedMs = getCookingJobElapsed(job, currentTime);

    return {
        elapsedMs,
        percentage: Math.min(100, Math.floor((elapsedMs / job.durationMs) * 100)),
        remainingMs: Math.max(0, job.durationMs - elapsedMs),
    };
}

function getCookingCompletionAt(job) {
    if (job.state !== 'cooking' || job.resumedAt === null) {
        return null;
    }

    return job.resumedAt + (job.durationMs - job.elapsedMs);
}

class CookingSystem {
    constructor(stats, progress, options = {}) {
        this.stats = stats;
        this.progress = progress;
        this.now = options.now ?? (() => Date.now());

        ensureCookingState(stats);

        this.campFireHooks = {
            onActivated: fire => this.resumeForFire(fire.id),
            onInactive: fire => this.pauseForFire(fire.id),
            onRemoved: fire => this.cancelForFire(fire.id),
        };
    }

    start(rawItem, fireID, currentTime = this.now()) {
        const food = cookingSettings[rawItem];
        const fire = this.stats.status.campFires.find(({ id }) => id === fireID);

        if (this.stats.status.gameOver || !food ||
            this.stats.inventory.items[rawItem] < 1 || !fire ||
            !fire.active || fire.terminal || getCookingJob(this.stats, fireID)) {
            return false;
        }

        this.stats.inventory.items[rawItem] -= 1;
        this.stats.status.cookingJobs.push({
            durationMs: food.cookingDuration,
            elapsedMs: 0,
            fireID,
            id: getNextID(this.stats.status.cookingJobs),
            rawItem,
            resumedAt: currentTime,
            state: 'cooking',
        });
        this.progress.announce(`Camp Fire ${fireID} started cooking ${food.label}.`);

        return true;
    }

    update(currentTime = this.now()) {
        [...this.stats.status.cookingJobs].forEach(job => {
            if (job.state !== 'cooking') {
                return;
            }

            const completionAt = getCookingCompletionAt(job);

            if (completionAt <= currentTime) {
                this.complete(job, completionAt);
            }
        });

        this.spoilPreparedFoods(currentTime);
    }

    complete(job, completedAt = this.now()) {
        if (!this.stats.status.cookingJobs.includes(job)) {
            return false;
        }

        const food = cookingSettings[job.rawItem];

        this.stats.status.cookingJobs = this.stats.status.cookingJobs.filter(
            currentJob => currentJob.id !== job.id
        );
        this.stats.inventory.items[food.cookedItem] += 1;
        this.stats.status.preparedFoods.push({
            cookedItem: food.cookedItem,
            id: getNextID(this.stats.status.preparedFoods),
            rotsAt: completedAt + food.spoilDuration,
            servingsRemaining: food.servings,
        });
        this.progress.announce(
            `Camp Fire ${job.fireID} produced ${food.cookedLabel}.`
        );

        return true;
    }

    pauseForFire(fireID, currentTime = this.now()) {
        const job = getCookingJob(this.stats, fireID);

        if (!job || job.state !== 'cooking') {
            return false;
        }

        const completionAt = getCookingCompletionAt(job);
        const progress = getCookingJobProgress(job, currentTime);

        if (progress.remainingMs === 0) {
            return this.complete(job, completionAt);
        }

        job.elapsedMs = progress.elapsedMs;
        job.resumedAt = null;
        job.state = 'paused';
        this.progress.announce(
            `Cooking on Camp Fire ${fireID} paused until it is refueled.`
        );

        return true;
    }

    resumeForFire(fireID, currentTime = this.now()) {
        const job = getCookingJob(this.stats, fireID);

        if (!job || job.state !== 'paused') {
            return false;
        }

        job.resumedAt = currentTime;
        job.state = 'cooking';
        this.progress.announce(`Cooking on Camp Fire ${fireID} resumed.`);

        return true;
    }

    cancelForFire(fireID, currentTime = this.now()) {
        const job = getCookingJob(this.stats, fireID);

        if (!job) {
            return false;
        }

        if (job.state === 'cooking' &&
            getCookingJobProgress(job, currentTime).remainingMs === 0) {
            return this.complete(job, getCookingCompletionAt(job));
        }

        this.stats.status.cookingJobs = this.stats.status.cookingJobs.filter(
            currentJob => currentJob.id !== job.id
        );
        this.stats.inventory.items[job.rawItem] += 1;
        this.progress.announce(
            `Camp Fire ${fireID} broke. The uncooked food was returned.`
        );

        return true;
    }

    spoilPreparedFoods(currentTime = this.now()) {
        const expiredFoods = this.stats.status.preparedFoods.filter(
            food => food.rotsAt <= currentTime
        );

        expiredFoods.forEach(preparedFood => {
            const food = cookedFoodSettings[preparedFood.cookedItem];

            this.stats.inventory.items[preparedFood.cookedItem] = Math.max(
                0,
                this.stats.inventory.items[preparedFood.cookedItem] - 1,
            );
            this.stats.inventory.items[food.rottenItem] += 1;
            this.progress.announce(
                `${food.cookedLabel} became rotten.`
            );
        });

        if (expiredFoods.length) {
            const expiredIDs = new Set(expiredFoods.map(({ id }) => id));

            this.stats.status.preparedFoods = this.stats.status.preparedFoods.filter(
                food => !expiredIDs.has(food.id)
            );
        }

        return expiredFoods.length;
    }
}

function initializeCookingActions(
    stats,
    cooking,
    query = globalThis.$,
) {
    query('#action').on('change', '#camp-fire-selector', event => {
        stats.status.selectedCampFireID = Number(event.currentTarget.value);
    });
    query('#action').on('click', '[data-cook-item]', event => {
        cooking.start(
            event.currentTarget.dataset.cookItem,
            Number(stats.status.selectedCampFireID),
        );
    });
}

export default CookingSystem;
export {
    ensureCookingState,
    getCookableRawItems,
    getCookingJob,
    getCookingCompletionAt,
    getCookingJobElapsed,
    getCookingJobProgress,
    getEligibleCampFires,
    initializeCookingActions,
};
