const survivalNeeds = ['hunger', 'thirst'];
const STAT_PRECISION = 100;

function roundStat(value) {
    return Math.round((value + Number.EPSILON) * STAT_PRECISION) / STAT_PRECISION;
}

function applyDamage(stats, amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        return {
            applied: 0,
            current: stats.attributes.health.current,
            died: stats.attributes.health.current <= 0,
        };
    }

    const health = stats.attributes.health;
    const previousHealth = health.current;

    health.current = roundStat(Math.max(0, previousHealth - amount));

    return {
        applied: roundStat(previousHealth - health.current),
        current: health.current,
        died: previousHealth > 0 && health.current === 0,
    };
}

export default class SurvivalSystem {
    constructor(stats, options = {}) {
        this.stats = stats;
        this.now = options.now ?? (() => Date.now());
        this.setTimer = options.setTimer ?? ((callback, delay) =>
            setTimeout(callback, delay)
        );
        this.clearTimer = options.clearTimer ?? (timerID => clearTimeout(timerID));
        this.onDeath = options.onDeath ?? (() => {});
        this.deadlines = {};
        this.running = false;
        this.timerID = null;

        this.tick = this.tick.bind(this);
    }

    start(startedAt = this.now()) {
        if (this.running) {
            return false;
        }

        this.running = true;

        survivalNeeds.forEach(name => {
            const attribute = this.stats.attributes[name];

            this.deadlines[name] = {
                nextDamageAt: attribute.current === 0
                    ? startedAt + attribute.zeroDamage.intervalMs
                    : null,
                nextDecayAt: attribute.current > 0
                    ? startedAt + attribute.decay.intervalMs
                    : null,
            };
        });

        if (this.stats.attributes.health.current <= 0) {
            this.finishDeath();
            return true;
        }

        this.scheduleNextTick();

        return true;
    }

    stop() {
        if (this.timerID !== null) {
            this.clearTimer(this.timerID);
            this.timerID = null;
        }

        this.running = false;
    }

    advance(currentTime = this.now()) {
        if (!this.running) {
            return false;
        }

        while (this.running) {
            const nextEventAt = this.getNextEventAt();

            if (nextEventAt === null || nextEventAt > currentTime) {
                break;
            }

            survivalNeeds.forEach(name => {
                const attribute = this.stats.attributes[name];
                const deadlines = this.deadlines[name];

                if (deadlines.nextDecayAt !== nextEventAt) {
                    return;
                }

                attribute.current = roundStat(
                    Math.max(0, attribute.current - attribute.decay.amount)
                );

                if (attribute.current === 0) {
                    deadlines.nextDecayAt = null;
                    deadlines.nextDamageAt = nextEventAt +
                        attribute.zeroDamage.intervalMs;
                } else {
                    deadlines.nextDecayAt += attribute.decay.intervalMs;
                }
            });

            const damage = survivalNeeds.reduce((totalDamage, name) => {
                const attribute = this.stats.attributes[name];
                const deadlines = this.deadlines[name];

                if (deadlines.nextDamageAt !== nextEventAt) {
                    return totalDamage;
                }

                deadlines.nextDamageAt += attribute.zeroDamage.intervalMs;

                return totalDamage + attribute.zeroDamage.amount;
            }, 0);

            if (damage > 0 && applyDamage(this.stats, damage).died) {
                this.finishDeath();
            }
        }

        return true;
    }

    tick() {
        this.timerID = null;
        this.advance(this.now());
        this.scheduleNextTick();
    }

    getNextEventAt() {
        const deadlines = survivalNeeds.flatMap(name => [
            this.deadlines[name]?.nextDecayAt,
            this.deadlines[name]?.nextDamageAt,
        ]).filter(deadline => deadline !== null && deadline !== undefined);

        return deadlines.length ? Math.min(...deadlines) : null;
    }

    scheduleNextTick() {
        if (!this.running || this.timerID !== null) {
            return;
        }

        const nextEventAt = this.getNextEventAt();

        if (nextEventAt === null) {
            return;
        }

        this.timerID = this.setTimer(
            this.tick,
            Math.max(0, nextEventAt - this.now()),
        );
    }

    finishDeath() {
        if (!this.running) {
            return;
        }

        this.stop();
        this.onDeath(this.stats);
    }
}

export { applyDamage, roundStat };
