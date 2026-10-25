(function (global) {
    'use strict';

    const FORMAT_PREFIX = 'BC90E';

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

    function encodeEnemySpawnOrder(enemySpawnOrder, powerUpCount) {
        return enemySpawnOrder
            .map((entry) => {
                const powerUps = [...new Set(entry.powerUps ?? [])]
                    .filter((powerUpId) => Number.isInteger(powerUpId) &&
                        powerUpId >= 0 && powerUpId < powerUpCount)
                    .sort((first, second) => first - second)
                    .join('.');
                return `${entry.type}:${entry.textureType}:${powerUps}:${entry.isTnt ? 1 : 0}`;
            })
            .join(',');
    }

    function decodeEnemySpawnOrder(value, defaultOrder, powerUpCount) {
        if (!value) {
            return defaultOrder();
        }

        const entries = value.split(',').map((entry) => {
            const [typeValue, textureType, powerUpValue, tntValue] = entry.split(':');
            const type = Number(typeValue);
            const powerUps = powerUpValue
                ? powerUpValue.split('.').map(Number)
                : [];
            const isTnt = tntValue === '1';
            if (
                !Number.isInteger(type) || type < 0 || type > 10 ||
                !'abcdefgh'.includes(textureType) ||
                (tntValue !== undefined && !['0', '1'].includes(tntValue)) ||
                powerUps.some((powerUpId) =>
                    !Number.isInteger(powerUpId) ||
                    powerUpId < 0 ||
                    powerUpId >= powerUpCount
                ) ||
                new Set(powerUps).size !== powerUps.length
            ) {
                return null;
            }
            return { type, textureType, powerUps, isTnt };
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
        if (sections.length < 5 || sections.length > 9) {
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
        const forceInitialLives = sections.length === 9 ? sections[7] : '0';
        const mapData = sections.length === 9
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
