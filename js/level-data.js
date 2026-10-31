(function (global) {
    'use strict';

    const FORMAT_PREFIX = 'BC90E';
    const DEFAULT_ENEMY_SPAWN_IDS = [3, 4, 5, 79, 80, 81, 82, 83];

    function parseDimensions(value) {
        const dimensions = value.split(',');

        if (dimensions.length !== 2) {
            return null;
        }

        const width = Number(dimensions[0]);
        const height = Number(dimensions[1]);

        if (
            !Number.isInteger(width) || width < 1 ||
            !Number.isInteger(height) || height < 1
        ) {
            return null;
        }

        return { width, height };
    }

    function encodeMap(grid) {
        const tileIds = grid.flat();
        const runs = [];
        let runStart = 0;

        for (let index = 1; index <= tileIds.length; index += 1) {
            if (index === tileIds.length || tileIds[index] !== tileIds[runStart]) {
                runs.push(`${index - runStart}x${tileIds[runStart]}`);
                runStart = index;
            }
        }

        return runs.join(',');
    }

    function encodeEnemySpawnOrder(
        enemySpawnOrder,
        powerUpCount,
        allSpawnIds = DEFAULT_ENEMY_SPAWN_IDS
    ) {
        return enemySpawnOrder
            .map((entry) => {
                const powerUps = [...new Set(entry.powerUps ?? [])]
                    .filter((powerUpId) => Number.isInteger(powerUpId) &&
                        powerUpId >= 0 && powerUpId < powerUpCount)
                    .sort((first, second) => first - second)
                    .join('.');
                const spawnIds = [...new Set(entry.spawnIds ?? allSpawnIds)]
                    .filter((spawnId) => allSpawnIds.includes(spawnId))
                    .sort((first, second) => allSpawnIds.indexOf(first) - allSpawnIds.indexOf(second))
                    .join('.');
                return `${entry.type}:${entry.textureType}:${powerUps}:${entry.isTnt ? 1 : 0}:${spawnIds}`;
            })
            .join(',');
    }

    function decodeEnemySpawnOrder(
        value,
        defaultOrder,
        powerUpCount,
        allSpawnIds = DEFAULT_ENEMY_SPAWN_IDS
    ) {
        if (!value) {
            return defaultOrder();
        }

        const entries = value.split(',').map((entry) => {
            const fields = entry.split(':');
            const [typeValue, textureType, powerUpValue, tntValue, spawnValue] = fields;
            const type = Number(typeValue);
            const powerUps = powerUpValue
                ? powerUpValue.split('.').map(Number)
                : [];
            const spawnIds = spawnValue === undefined
                ? [...allSpawnIds]
                : spawnValue
                    ? spawnValue.split('.').map(Number)
                    : [];
            const isTnt = tntValue === '1';
            if (
                fields.length < 3 || fields.length > 5 ||
                !Number.isInteger(type) || type < 0 || type > 10 ||
                !'abcdefgh'.includes(textureType) ||
                (tntValue !== undefined && !['0', '1'].includes(tntValue)) ||
                powerUps.some((powerUpId) =>
                    !Number.isInteger(powerUpId) ||
                    powerUpId < 0 ||
                    powerUpId >= powerUpCount
                ) ||
                new Set(powerUps).size !== powerUps.length ||
                spawnIds.length === 0 ||
                spawnIds.some((spawnId) => !allSpawnIds.includes(spawnId)) ||
                new Set(spawnIds).size !== spawnIds.length
            ) {
                return null;
            }
            return { type, textureType, powerUps, isTnt, spawnIds };
        });

        return entries.length > 0 && entries.every(Boolean) ? entries : null;
    }

    function decodeMap(data, width, height, validTileIds) {
        if (!data) {
            return null;
        }

        const tileIds = [];

        for (const run of data.split(',')) {
            const match = /^(\d+)x(\d+)$/.exec(run);

            if (!match) {
                return null;
            }

            const count = Number(match[1]);
            const tileId = Number(match[2]);

            if (
                count < 1 ||
                !Number.isSafeInteger(count) ||
                count > width * height - tileIds.length ||
                !Object.hasOwn(validTileIds, tileId)
            ) {
                return null;
            }

            tileIds.push(...Array(count).fill(tileId));

            if (tileIds.length > width * height) {
                return null;
            }
        }

        if (tileIds.length !== width * height) {
            return null;
        }

        return Array.from(
            { length: height },
            (_, row) => tileIds.slice(row * width, (row + 1) * width)
        );
    }

    function parseLevelCode(code, options) {
        const normalizedCode = code.trim();
        if (!normalizedCode.startsWith(`${FORMAT_PREFIX}|`)) {
            return { error: 'prefix' };
        }

        const sections = normalizedCode.split('|');
        if (sections.length < 5 || sections.length > 12) {
            return { error: 'format' };
        }

        const dimensions = parseDimensions(sections[1]);
        const enemySpawnOrder = sections.length >= 6
            ? decodeEnemySpawnOrder(
                sections[3],
                options.defaultEnemySpawnOrder,
                options.powerUpCount
            )
            : options.defaultEnemySpawnOrder();
        const eagleMode = sections.length >= 6 ? sections[4] : sections[3];
        const initialLives = sections.length >= 7
            ? Number(sections[5])
            : options.defaultInitialLives;
        const maxActiveEnemies = sections.length >= 8
            ? Number(sections[6])
            : options.defaultMaxActiveEnemies;
        const maxActivePowerUps = sections.length >= 10
            ? Number(sections[8])
            : options.defaultMaxActivePowerUps ?? 1;
        const playerRespawnDelayMs = sections.length >= 11
            ? Number(sections[9])
            : options.defaultPlayerRespawnDelayMs ?? 100;
        const powerUpLifetimeMs = sections.length >= 12
            ? Number(sections[10])
            : options.defaultPowerUpLifetimeMs ?? 8000;
        const forceInitialLives = sections.length >= 9 ? sections[7] : '0';
        const mapData = sections.length >= 12
            ? sections[11]
            : sections.length === 11
                ? sections[10]
                : sections.length === 10
                    ? sections[9]
                    : sections.length === 9
                        ? sections[8]
                        : sections.length === 8
                            ? sections[7]
                            : sections.length === 7
                                ? sections[6]
                                : sections.length === 6
                                    ? sections[5]
                                    : sections[4];

        if (
            !dimensions ||
            !enemySpawnOrder ||
            !['1', '2'].includes(eagleMode) ||
            !Number.isInteger(initialLives) ||
            initialLives < 0 ||
            initialLives > options.maxPlayerLives ||
            !Number.isInteger(maxActiveEnemies) ||
            maxActiveEnemies < 1 ||
            maxActiveEnemies > options.maxActiveEnemies ||
            !Number.isInteger(maxActivePowerUps) ||
            maxActivePowerUps < 1 ||
            maxActivePowerUps > (options.maxActivePowerUps ?? 999) ||
            !Number.isInteger(playerRespawnDelayMs) ||
            playerRespawnDelayMs < 0 ||
            playerRespawnDelayMs >
                (options.maxPlayerRespawnDelayMs ?? 10000) ||
            playerRespawnDelayMs % 10 !== 0 ||
            !Number.isInteger(powerUpLifetimeMs) ||
            powerUpLifetimeMs < (options.minPowerUpLifetimeMs ?? 1000) ||
            powerUpLifetimeMs > (options.maxPowerUpLifetimeMs ?? 120000) ||
            powerUpLifetimeMs % 100 !== 0 ||
            !['0', '1'].includes(forceInitialLives)
        ) {
            return { error: 'properties' };
        }

        if (
            dimensions.width > options.maxMapDimension ||
            dimensions.height > options.maxMapDimension
        ) {
            return { error: 'dimensions-too-large', dimensions };
        }

        const grid = decodeMap(
            mapData,
            dimensions.width,
            dimensions.height,
            options.validTileIds
        );
        if (!grid) {
            return { error: 'map' };
        }

        return {
            level: {
                name: sections[2],
                width: dimensions.width,
                height: dimensions.height,
                enemySpawnOrder,
                eagleMode,
                initialLives,
                maxActiveEnemies,
                maxActivePowerUps,
                playerRespawnDelayMs,
                powerUpLifetimeMs,
                forceInitialLives: forceInitialLives === '1',
                grid
            }
        };
    }

    global.BC90ELevelData = Object.freeze({
        formatPrefix: FORMAT_PREFIX,
        parseDimensions,
        encodeMap,
        encodeEnemySpawnOrder,
        decodeEnemySpawnOrder,
        decodeMap,
        parseLevelCode
    });
})(window);
