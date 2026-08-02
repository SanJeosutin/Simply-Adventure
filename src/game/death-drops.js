const DEATH_DROP_STORAGE_KEY = 'must-surv1v3.deathDrops.v1';
const MIN_COORDINATE = -999;
const MAX_COORDINATE = 999;

function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
}

function randomCoordinate(random) {
    const coordinateCount = MAX_COORDINATE - MIN_COORDINATE + 1;

    return Math.floor(random() * coordinateCount) + MIN_COORDINATE;
}

function createDeathDropSnapshot(stats) {
    return {
        inventory: cloneData(stats.inventory),
        status: {
            campFires: (stats.status?.campFires ?? []).map(fire => {
                const { timerID, ...serializableFire } = fire;

                return cloneData(serializableFire);
            }),
            durability: cloneData(stats.status?.durability ?? {}),
            traps: cloneData(stats.status?.traps ?? []),
        },
    };
}

function defaultID() {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }

    return `death-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default class DeathDropStore {
    constructor(options = {}) {
        this.key = options.key ?? DEATH_DROP_STORAGE_KEY;
        this.random = options.random ?? Math.random;
        this.now = options.now ?? (() => Date.now());
        this.createID = options.createID ?? defaultID;
        this.records = [];
        this.activeRecordID = null;
        this.activeSnapshot = null;
        this.lastError = null;

        try {
            this.storage = Object.hasOwn(options, 'storage')
                ? options.storage
                : globalThis.localStorage;
            this.load();
        } catch (error) {
            this.storage = null;
            this.lastError = error;
        }
    }

    load() {
        if (!this.storage) {
            throw new Error('Browser storage is unavailable.');
        }

        const savedRecords = this.storage.getItem(this.key);

        if (!savedRecords) {
            return;
        }

        const records = JSON.parse(savedRecords);

        if (!Array.isArray(records)) {
            throw new TypeError('Saved death drops are not a list.');
        }

        this.records = records;
    }

    create(stats) {
        const drop = createDeathDropSnapshot(stats);
        const record = {
            diedAt: new Date(this.now()).toISOString(),
            drop,
            id: this.createID(),
            location: {
                x: randomCoordinate(this.random),
                y: randomCoordinate(this.random),
            },
        };

        this.records.push(record);
        this.activeRecordID = record.id;
        this.activeSnapshot = JSON.stringify(drop);

        return {
            error: this.persist() ? null : this.lastError,
            persisted: this.lastError === null,
            record: cloneData(record),
        };
    }

    syncIfChanged(stats) {
        const record = this.records.find(({ id }) => id === this.activeRecordID);

        if (!record) {
            return { changed: false, error: this.lastError, persisted: false };
        }

        const drop = createDeathDropSnapshot(stats);
        const serializedDrop = JSON.stringify(drop);
        const changed = serializedDrop !== this.activeSnapshot;

        if (changed) {
            record.drop = drop;
            this.activeSnapshot = serializedDrop;
        }

        const persisted = changed
            ? this.persist()
            : this.lastError === null;

        return {
            changed,
            error: persisted ? null : this.lastError,
            persisted,
        };
    }

    persist() {
        if (!this.storage) {
            this.lastError ??= new Error('Browser storage is unavailable.');
            return false;
        }

        try {
            this.storage.setItem(this.key, JSON.stringify(this.records));
            this.lastError = null;
            return true;
        } catch (error) {
            this.lastError = error;
            return false;
        }
    }

    getRecords() {
        return cloneData(this.records);
    }
}

export {
    createDeathDropSnapshot,
    DEATH_DROP_STORAGE_KEY,
    MAX_COORDINATE,
    MIN_COORDINATE,
    randomCoordinate,
};
