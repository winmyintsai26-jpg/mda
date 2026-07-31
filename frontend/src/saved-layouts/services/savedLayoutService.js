import { requireCurrentUserId } from "../../auth/userOwnership.js";

const STORAGE_KEY = "mda.saved-layouts.v2";

function ownerStorageKey() {
    return `${STORAGE_KEY}.${requireCurrentUserId()}`;
}

class LocalStorageSavedLayoutRepository {
    readAll() {
        const ownerId = requireCurrentUserId();
        const key = ownerStorageKey();
        let rawValue = window.localStorage.getItem(key);
        if (!rawValue) {
            const legacyValue = window.localStorage.getItem("mda.saved-layouts.v1");
            if (legacyValue) {
                const legacyLayouts = JSON.parse(legacyValue);
                rawValue = JSON.stringify(Array.isArray(legacyLayouts) ? legacyLayouts.map((layout) => ({ ...layout, userId: ownerId })) : []);
                window.localStorage.setItem(key, rawValue);
                window.localStorage.removeItem("mda.saved-layouts.v1");
            }
        }
        if (!rawValue) {
            return [];
        }

        const parsedValue = JSON.parse(rawValue);
        return Array.isArray(parsedValue) ? parsedValue : [];
    }

    writeAll(layouts) {
        window.localStorage.setItem(ownerStorageKey(), JSON.stringify(layouts));
    }
}

export class SavedLayoutService {
    constructor(repository) {
        this.repository = repository;
    }

    getAll() {
        return this.repository.readAll();
    }

    getById(layoutId) {
        return this.getAll().find((layout) => layout.id === layoutId) || null;
    }

    save(layout) {
        if (!layout?.id || !layout?.name) {
            throw new Error("A valid saved layout is required.");
        }

        const ownerId = requireCurrentUserId();
        const ownedLayout = { ...layout, userId: ownerId };
        const layouts = this.getAll();
        const existingIndex = layouts.findIndex((candidate) => candidate.id === layout.id);
        const nextLayouts = [...layouts];

        if (existingIndex >= 0) {
            nextLayouts[existingIndex] = ownedLayout;
        } else {
            nextLayouts.push(ownedLayout);
        }

        this.repository.writeAll(nextLayouts);
        return ownedLayout;
    }

    markUsed(layoutId) {
        const layout = this.getById(layoutId);
        if (!layout) {
            return null;
        }

        return this.save({
            ...layout,
            lastUsedAt: new Date().toISOString()
        });
    }
}

export const savedLayoutService = new SavedLayoutService(new LocalStorageSavedLayoutRepository());
