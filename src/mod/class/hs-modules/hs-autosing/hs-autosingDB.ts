/**
 * HSAutosingDB
 * Dedicated class for handling IndexedDB operations for the autosing module.
 */
export class HSAutosingDB {
    private dbName: string;
    private storeName: string;
    private db: IDBDatabase | null = null;

    /**
     * Create a new HSAutosingDB instance.
     * @param dbName Name of the IndexedDB database.
     * @param storeName Name of the object store.
     */
    constructor(dbName: string, storeName: string) {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    /**
     * Opens a connection to the IndexedDB database, creating the object store if needed.
     * @returns Promise that resolves to the opened IDBDatabase instance.
     */
    public async open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };
            request.onerror = (event) => {
                reject(event.target);
            };
        });
    }

    /**
     * Stores a compressed bundle string in the object store.
     * @param compressedBundle The compressed bundle string to store.
     * @returns Promise that resolves when the operation completes.
     */
    public async storeBundle(compressedBundle: string): Promise<void> {
        const db = await this.open();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.add({ data: compressedBundle, timestamp: Date.now() });
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Loads all compressed bundle strings from the object store.
     * @returns Promise that resolves to an array of compressed bundle strings.
     */
    public async loadBundles(): Promise<string[]> {
        const db = await this.open();
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const results = request.result as { data: string }[];
                resolve(results.map(r => r.data));
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clears all bundles from the object store.
     * @returns Promise that resolves when the operation completes.
     */
    public async clearBundles(): Promise<void> {
        const db = await this.open();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.clear();
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
}
