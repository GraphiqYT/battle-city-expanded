(function (global) {
    'use strict';

    const PACK_DIRECTORY_DB_NAME = 'bc90e-pack-directory';
    const PACK_DIRECTORY_STORE_NAME = 'handles';
    const PACK_DIRECTORY_HANDLE_KEY = 'packs';

    function openPackDirectoryDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(PACK_DIRECTORY_DB_NAME, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(PACK_DIRECTORY_STORE_NAME);
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(
                new Error('The Packs folder storage is blocked by another tab.')
            );
        });
    }

    async function storePackDirectoryHandle(handle) {
        const database = await openPackDirectoryDatabase();
        try {
            await new Promise((resolve, reject) => {
                const transaction = database.transaction(PACK_DIRECTORY_STORE_NAME, 'readwrite');
                transaction.objectStore(PACK_DIRECTORY_STORE_NAME)
                    .put(handle, PACK_DIRECTORY_HANDLE_KEY);
                transaction.oncomplete = resolve;
                transaction.onerror = () => reject(transaction.error);
                transaction.onabort = () => reject(
                    transaction.error ?? new Error('Could not save the Packs folder access.')
                );
            });
        } finally {
            database.close();
        }
    }

    async function getStoredPackDirectoryHandle() {
        const database = await openPackDirectoryDatabase();
        try {
            return await new Promise((resolve, reject) => {
                const transaction = database.transaction(PACK_DIRECTORY_STORE_NAME);
                const request = transaction.objectStore(PACK_DIRECTORY_STORE_NAME)
                    .get(PACK_DIRECTORY_HANDLE_KEY);
                request.onsuccess = () => resolve(request.result ?? null);
                request.onerror = () => reject(request.error);
            });
        } finally {
            database.close();
        }
    }

    function makeDirectoryPackId(fileName) {
        let hash = 2166136261;
        for (let index = 0; index < fileName.length; index += 1) {
            hash = Math.imul(hash ^ fileName.charCodeAt(index), 16777619);
        }
        return `pack-folder-${(hash >>> 0).toString(36)}`;
    }

    function normalizePackDocument(imported, fallbackId) {
        if (
            imported?.format !== 'BC90E-PACK' ||
            ![1, 2, 3].includes(imported.version) ||
            typeof imported.name !== 'string'
        ) {
            throw new Error('The file is not a valid BC90E pack.');
        }

        const sourceWorlds = imported.version === 1
            ? [{ name: 'World 1', stages: imported.stages, properties: {} }]
            : imported.worlds;

        if (!Array.isArray(sourceWorlds) || sourceWorlds.some((world) =>
            !world || typeof world.name !== 'string' ||
            !Array.isArray(world.stages) || world.stages.some((stage) =>
                !stage || typeof stage.name !== 'string' ||
                typeof stage.code !== 'string' || !stage.code.startsWith('BC90E|')
            )
        )) {
            throw new Error('The pack contains invalid world or level data.');
        }

        return {
            id: typeof imported.id === 'string' ? imported.id : fallbackId,
            name: imported.name,
            thumbnail: imported.thumbnail ?? null,
            worlds: sourceWorlds.map((world, worldIndex) => ({
                id: typeof world.id === 'string'
                    ? world.id
                    : `world-${Date.now()}-${worldIndex}-${Math.random().toString(36).slice(2)}`,
                name: world.name,
                thumbnail: world.thumbnail ?? null,
                properties: world.properties && typeof world.properties === 'object'
                    ? world.properties
                    : {},
                stages: world.stages.map((stage, stageIndex) => ({
                    ...stage,
                    id: typeof stage.id === 'string'
                        ? stage.id
                        : `stage-${Date.now()}-${worldIndex}-${stageIndex}-${Math.random().toString(36).slice(2)}`
                }))
            }))
        };
    }

    function serializePackDocument(pack) {
        return {
            format: 'BC90E-PACK',
            version: 3,
            id: pack.id,
            name: pack.name,
            thumbnail: pack.thumbnail ?? null,
            worlds: pack.worlds.map((world) => ({
                id: world.id,
                name: world.name,
                thumbnail: world.thumbnail ?? null,
                properties: world.properties ?? {},
                stages: world.stages
            }))
        };
    }

    async function synchronizePacksDirectory({ handle, packs, updateFileMap }) {
        const activeIds = new Set(packs.map((pack) => pack.id));
        const fileByPackId = updateFileMap ?? new Map();

        for (const [packId, fileName] of [...fileByPackId.entries()]) {
            if (!activeIds.has(packId)) {
                await handle.removeEntry(fileName);
                fileByPackId.delete(packId);
            }
        }

        for (const pack of packs) {
            const safeName = pack.name
                .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
                .slice(0, 80) || 'Pack';
            const safeId = pack.id.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');
            const fileName = fileByPackId.get(pack.id) ?? `${safeName}-${safeId}.bcepack.json`;
            const fileHandle = await handle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(serializePackDocument(pack), null, 2));
            await writable.close();
            fileByPackId.set(pack.id, fileName);
        }

        return fileByPackId;
    }

    global.BC90EPackDirectory = Object.freeze({
        PACK_DIRECTORY_DB_NAME,
        PACK_DIRECTORY_STORE_NAME,
        PACK_DIRECTORY_HANDLE_KEY,
        openPackDirectoryDatabase,
        storePackDirectoryHandle,
        getStoredPackDirectoryHandle,
        makeDirectoryPackId,
        normalizePackDocument,
        serializePackDocument,
        synchronizePacksDirectory
    });
})(window);
