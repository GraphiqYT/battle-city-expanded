(function (global) {
    'use strict';

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

    global.BC90EPackDocument = Object.freeze({
        normalizePackDocument,
        serializePackDocument
    });
})(window);
