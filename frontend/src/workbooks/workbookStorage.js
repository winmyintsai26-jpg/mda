const DATABASE_NAME = "mda-workspace";
const STORE_NAME = "workbooks";

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!globalThis.indexedDB) {
            reject(new Error("IndexedDB is unavailable"));
            return;
        }
        const request = indexedDB.open(DATABASE_NAME, 1);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function transact(mode, action) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const request = action(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
    });
}

export const workbookStorage = {
    getAll: () => transact("readonly", (store) => store.getAll()),
    put: (workbook) => transact("readwrite", (store) => store.put(workbook)),
    remove: (workbookId) => transact("readwrite", (store) => store.delete(workbookId))
};
