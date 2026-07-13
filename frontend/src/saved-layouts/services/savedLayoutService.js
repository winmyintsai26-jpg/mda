const STORAGE_KEY = "mda.saved-layouts.v1";

class LocalStorageSavedLayoutRepository {
    readAll() {
        const rawValue = window.localStorage.getItem(STORAGE_KEY);
        if (!rawValue) {
            return [];
        }

        const parsedValue = JSON.parse(rawValue);
        return Array.isArray(parsedValue) ? parsedValue : [];
    }

    writeAll(layouts) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
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

        const layouts = this.getAll();
        const existingIndex = layouts.findIndex((candidate) => candidate.id === layout.id);
        const nextLayouts = [...layouts];

        if (existingIndex >= 0) {
            nextLayouts[existingIndex] = layout;
        } else {
            nextLayouts.push(layout);
        }

        this.repository.writeAll(nextLayouts);
        return layout;
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
