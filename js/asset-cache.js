(function (global) {
    'use strict';

    const DATABASE_NAME = 'battle-city-expanded-assets';
    const DATABASE_VERSION = 1;
    const STORE_NAME = 'assets';
    const CACHE_SCHEMA_VERSION = 1;
    let databasePromise = null;
    let entriesPromise = null;
    const cachedEntries = new Map();
    let isUnavailable = false;
    let hasWarned = false;
    let areWritesEnabled = true;

    function warnUnavailable(error) {
        if (hasWarned) {
            return;
        }
        hasWarned = true;
        console.warn('Persistent asset cache failed; assets will load normally.', error);
    }

    function openDatabase() {
        if (isUnavailable) {
            return Promise.resolve(null);
        }
        if (databasePromise) {
            return databasePromise;
        }
        if (!global.indexedDB) {
            isUnavailable = true;
            warnUnavailable(new Error('IndexedDB is not available in this context.'));
            return Promise.resolve(null);
        }

        databasePromise = new Promise((resolve) => {
            let request;
            try {
                request = global.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
            } catch (error) {
                isUnavailable = true;
                warnUnavailable(error);
                resolve(null);
                return;
            }

            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => {
                const database = request.result;
                database.onversionchange = () => database.close();
                resolve(database);
            };
            request.onerror = () => {
                isUnavailable = true;
                warnUnavailable(request.error ?? new Error('Could not open IndexedDB.'));
                resolve(null);
            };
            request.onblocked = () => {
                isUnavailable = true;
                warnUnavailable(new Error('The asset cache is blocked by another open session.'));
                resolve(null);
            };
        });

        return databasePromise;
    }

    function makeKey(kind, path, variant = '') {
        const assetVersion = global.BC90EAppVersion?.assetCacheVersion ??
            global.BC90EAppVersion?.version ??
            'unversioned';
        return `schema-${CACHE_SCHEMA_VERSION}:app-${assetVersion}:${kind}:${path}:${variant}`;
    }

    function isAvailable() {
        return Boolean(global.indexedDB) && !isUnavailable;
    }

    function loadEntries(database) {
        if (entriesPromise) {
            return entriesPromise;
        }

        entriesPromise = new Promise((resolve) => {
            let transaction;
            let keys = null;
            let values = null;
            let isSettled = false;
            const settle = () => {
                if (isSettled || !keys || !values) {
                    return;
                }
                isSettled = true;
                cachedEntries.clear();
                keys.forEach((key, index) => cachedEntries.set(key, values[index]));
                resolve(cachedEntries);
            };

            try {
                transaction = database.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const keysRequest = store.getAllKeys();
                const valuesRequest = store.getAll();
                keysRequest.onsuccess = () => {
                    keys = keysRequest.result;
                    settle();
                };
                valuesRequest.onsuccess = () => {
                    values = valuesRequest.result;
                    settle();
                };
                transaction.onerror = () => {
                    warnUnavailable(
                        transaction.error ?? new Error('Could not load the persistent asset cache.')
                    );
                    if (!isSettled) {
                        isSettled = true;
                        resolve(cachedEntries);
                    }
                };
                transaction.onabort = () => {
                    if (!isSettled) {
                        isSettled = true;
                        resolve(cachedEntries);
                    }
                };
            } catch (error) {
                warnUnavailable(error);
                isSettled = true;
                resolve(cachedEntries);
            }
        });

        return entriesPromise;
    }

    async function get(key) {
        const database = await openDatabase();
        if (!database) {
            return null;
        }
        await loadEntries(database);
        return cachedEntries.get(key) ?? null;
    }

    async function put(key, value) {
        if (!areWritesEnabled) {
            return false;
        }
        const database = await openDatabase();
        if (!database) {
            return false;
        }

        return new Promise((resolve) => {
            let transaction;
            try {
                transaction = database.transaction(STORE_NAME, 'readwrite');
                transaction.objectStore(STORE_NAME).put(value, key);
                transaction.oncomplete = () => {
                    if (value instanceof ArrayBuffer) {
                        cachedEntries.set(key, value);
                    }
                    resolve(true);
                };
                transaction.onerror = () => {
                    warnUnavailable(transaction.error ?? new Error('Could not save an asset to cache.'));
                    resolve(false);
                };
                transaction.onabort = () => {
                    warnUnavailable(transaction.error ?? new Error('Asset cache write was aborted.'));
                    resolve(false);
                };
            } catch (error) {
                warnUnavailable(error);
                resolve(false);
            }
        });
    }

    async function remove(key) {
        const database = await openDatabase();
        if (!database) {
            return false;
        }

        return new Promise((resolve) => {
            let transaction;
            try {
                transaction = database.transaction(STORE_NAME, 'readwrite');
                transaction.objectStore(STORE_NAME).delete(key);
                transaction.oncomplete = () => {
                    cachedEntries.delete(key);
                    resolve(true);
                };
                transaction.onerror = () => {
                    warnUnavailable(transaction.error ?? new Error('Could not remove a cached asset.'));
                    resolve(false);
                };
                transaction.onabort = () => resolve(false);
            } catch (error) {
                warnUnavailable(error);
                resolve(false);
            }
        });
    }

    async function clear({ disableWrites = false } = {}) {
        if (disableWrites) {
            areWritesEnabled = false;
        }
        const database = await openDatabase();
        if (!database) {
            return false;
        }

        return new Promise((resolve) => {
            let transaction;
            try {
                transaction = database.transaction(STORE_NAME, 'readwrite');
                transaction.objectStore(STORE_NAME).clear();
                transaction.oncomplete = () => {
                    cachedEntries.clear();
                    entriesPromise = Promise.resolve(cachedEntries);
                    resolve(true);
                };
                transaction.onerror = () => {
                    warnUnavailable(transaction.error ?? new Error('Could not clear the asset cache.'));
                    resolve(false);
                };
                transaction.onabort = () => resolve(false);
            } catch (error) {
                warnUnavailable(error);
                resolve(false);
            }
        });
    }

    global.BC90EAssetCache = Object.freeze({
        makeKey,
        isAvailable,
        get,
        put,
        remove,
        clear
    });
})(window);
