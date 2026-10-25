(function (global) {
    'use strict';

    const STORAGE_KEYS = Object.freeze({
        PACKS: 'bc90e-packs-v1',
        PACK_SELECTION: 'bc90e-selected-pack-v1',
        WORLD_SELECTION: 'bc90e-selected-world-v1'
    });

    function normalizeSavedPacks(rawSavedPacks) {
        if (!Array.isArray(rawSavedPacks)) {
            return [];
        }

        return rawSavedPacks.filter((pack) =>
            pack && typeof pack.id === 'string' &&
            typeof pack.name === 'string' &&
            (Array.isArray(pack.worlds) || Array.isArray(pack.stages))
        ).map((pack) => ({
            id: pack.id,
            name: pack.name,
            worlds: Array.isArray(pack.worlds)
                ? pack.worlds.filter((world) =>
                    world && typeof world.id === 'string' &&
                    typeof world.name === 'string' && Array.isArray(world.stages)
                ).map((world) => ({
                    ...world,
                    properties: world.properties ?? {},
                    stages: Array.isArray(world.stages)
                        ? world.stages.map((stage) => ({
                            ...stage,
                            id: stage.id ?? `stage-${Date.now()}-${Math.random().toString(36).slice(2)}`
                        }))
                        : []
                }))
                : [{
                    id: `world-${pack.id}`,
                    name: 'World 1',
                    properties: {},
                    stages: Array.isArray(pack.stages)
                        ? pack.stages.filter((stage) =>
                            stage && typeof stage.name === 'string' &&
                            typeof stage.code === 'string'
                        ).map((stage) => ({
                            ...stage,
                            id: stage.id ?? `stage-${Date.now()}-${Math.random().toString(36).slice(2)}`
                        }))
                        : []
                }]
        }));
    }

    function readJson(key, fallback) {
        try {
            const raw = global.localStorage?.getItem(key);
            if (raw === null || raw === undefined) {
                return fallback;
            }
            return JSON.parse(raw);
        } catch (error) {
            console.error(`Could not read persisted data for ${key}.`, error);
            return fallback;
        }
    }

    function readSavedPacks() {
        return normalizeSavedPacks(readJson(STORAGE_KEYS.PACKS, []));
    }

    function readSelectedPackId() {
        try {
            const value = global.localStorage?.getItem(STORAGE_KEYS.PACK_SELECTION);
            return value || null;
        } catch (error) {
            console.error('Could not read selected pack.', error);
            return null;
        }
    }

    function readSelectedWorldId() {
        try {
            const value = global.localStorage?.getItem(STORAGE_KEYS.WORLD_SELECTION);
            return value || null;
        } catch (error) {
            console.error('Could not read selected world.', error);
            return null;
        }
    }

    function writePackState({ savedPacks, selectedPackId, selectedWorldId }) {
        try {
            global.localStorage?.setItem(STORAGE_KEYS.PACKS, JSON.stringify(savedPacks));
            if (selectedPackId) {
                global.localStorage?.setItem(STORAGE_KEYS.PACK_SELECTION, selectedPackId);
            } else {
                global.localStorage?.removeItem(STORAGE_KEYS.PACK_SELECTION);
            }
            if (selectedWorldId) {
                global.localStorage?.setItem(STORAGE_KEYS.WORLD_SELECTION, selectedWorldId);
            } else {
                global.localStorage?.removeItem(STORAGE_KEYS.WORLD_SELECTION);
            }
            return true;
        } catch (error) {
            console.error('Could not persist pack state.', error);
            return false;
        }
    }

    function writePackSelectionState({ selectedPackId, selectedWorldId }) {
        try {
            if (selectedPackId) {
                global.localStorage?.setItem(STORAGE_KEYS.PACK_SELECTION, selectedPackId);
            } else {
                global.localStorage?.removeItem(STORAGE_KEYS.PACK_SELECTION);
            }
            if (selectedWorldId) {
                global.localStorage?.setItem(STORAGE_KEYS.WORLD_SELECTION, selectedWorldId);
            } else {
                global.localStorage?.removeItem(STORAGE_KEYS.WORLD_SELECTION);
            }
            return true;
        } catch (error) {
            console.error('Could not persist selected pack location.', error);
            return false;
        }
    }

    global.BC90EAppState = {
        STORAGE_KEYS,
        normalizeSavedPacks,
        readJson,
        readSavedPacks,
        readSelectedPackId,
        readSelectedWorldId,
        writePackState,
        writePackSelectionState
    };
})(window);
