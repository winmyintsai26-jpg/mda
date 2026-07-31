const DATABASE_NAME = "mda-workspace";
const STORE_NAME = "user-workbooks";
const LEGACY_STORE_NAME = "workbooks";

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!globalThis.indexedDB) {
            reject(new Error("IndexedDB is unavailable"));
            return;
        }
        const request = indexedDB.open(DATABASE_NAME, 2);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "storageId" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function transact(mode, action, storeName = STORE_NAME) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const request = action(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
    });
}

export const workbookStorage = {
    getAll: async (userId) => {
        const owned = (await transact("readonly", (store) => store.getAll())).filter((workbook) => workbook.userId === userId);
        if (owned.length) return owned;

        const legacy = await transact("readonly", (store) => store.getAll(), LEGACY_STORE_NAME).catch(() => []);
        if (!legacy.length) return [];
        const migrated = legacy.map((workbook) => ({ ...workbook, userId, storageId: `${userId}:${workbook.id}` }));
        await Promise.all(migrated.map((workbook) => transact("readwrite", (store) => store.put(workbook))));
        await transact("readwrite", (store) => store.clear(), LEGACY_STORE_NAME);
        return migrated;
    },
    put: (userId, workbook) => transact("readwrite", (store) => store.put({ ...workbook, userId, storageId: `${userId}:${workbook.id}` })),
    remove: (userId, workbookId) => transact("readwrite", (store) => store.delete(`${userId}:${workbookId}`))
};
