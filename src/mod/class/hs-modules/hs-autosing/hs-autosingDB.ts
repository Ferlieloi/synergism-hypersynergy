// HSAutosingDB.ts
// Dedicated class for IndexedDB handling for autosing module

export class HSAutosingDB {
    private dbName: string;
    private storeName: string;
    private db: IDBDatabase | null = null;

    constructor(dbName: string, storeName: string) {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    // Open IndexedDB connection
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

    // Store a bundle in IndexedDB
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

    // Load all bundles from IndexedDB
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

    // Clear all bundles from IndexedDB
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
