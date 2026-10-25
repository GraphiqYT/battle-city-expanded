(function (global) {
    'use strict';

    const ARMORED_ENEMY_TEXTURE_STAGES = ['c', 'h', 'g', 'b'];
    const FAST_PROJECTILE_TANK_TYPES = new Set([1, 2, 3, 6]);
    const STEEL_BREAKING_TANK_TYPES = new Set([3, 8, 10]);
    const TWIN_SHOT_TANK_TYPES = new Set([8]);
    const REINFORCED_BRICK_DAMAGE_TANK_TYPES = new Set([3, 7, 8, 10]);
    const DOUBLE_BULLET_TANK_TYPES = new Set([2, 3, 7, 8]);
    const ENEMY_TANK_STATE_DURATIONS_MS = Object.freeze({
        random: Object.freeze({ min: 4000, max: 10000 }),
        player: Object.freeze({ min: 10000, max: 20000 }),
        eagle: Object.freeze({ min: 10000, max: 25000 }),
        escape: Object.freeze({ min: 1000, max: 25000 })
    });
    const ENEMY_TANK_STATES = Object.freeze(['random', 'player', 'eagle']);
    const ROAD_SPEED_FACTOR = 1.25;
    const DENSE_BUSH_SPEED_FACTOR = 0.5;
    const VERY_DENSE_BUSH_SPEED_FACTOR = 1 / 3;
    const ENEMY_ALIGNED_AIM_CHANCES = Object.freeze({
        random: 0.035,
        player: 0.18,
        eagle: 0.035
    });
    const DIRECTION_VECTORS = Object.freeze({
        UP: Object.freeze({ x: 0, y: -1 }),
        DOWN: Object.freeze({ x: 0, y: 1 }),
        LEFT: Object.freeze({ x: -1, y: 0 }),
        RIGHT: Object.freeze({ x: 1, y: 0 })
    });

    function getDirectionVector(direction) {
        return DIRECTION_VECTORS[direction];
    }

    function getPositionInDirection(x, y, direction, distance) {
        const vector = getDirectionVector(direction) ?? { x: 0, y: 0 };
        return {
            x: x + vector.x * distance,
            y: y + vector.y * distance
        };
    }

    function getMuzzlePosition(
        x,
        y,
        direction,
        width,
        height,
        offsetRatio,
        centerPull
    ) {
        const vector = getDirectionVector(direction) ?? DIRECTION_VECTORS.RIGHT;
        const offset = Math.max(width, height) * offsetRatio - centerPull;
        return {
            x: x + vector.x * offset,
            y: y + vector.y * offset
        };
    }

    function getTwinShotSpawnOffsets(direction, tileWidth, tileHeight) {
        const laneOffset = direction === 'UP' || direction === 'DOWN'
            ? { x: tileWidth / 2, y: 0 }
            : { x: 0, y: tileHeight / 2 };

        return [
            { x: -laneOffset.x, y: -laneOffset.y },
            { x: laneOffset.x, y: laneOffset.y }
        ];
    }

    function getDirectionForKey(key) {
        const normalizedKey = typeof key === 'string' && key.length === 1
            ? key.toLowerCase()
            : key;
        const directionByKey = {
            ArrowUp: 'UP',
            w: 'UP',
            ArrowDown: 'DOWN',
            s: 'DOWN',
            ArrowLeft: 'LEFT',
            a: 'LEFT',
            ArrowRight: 'RIGHT',
            d: 'RIGHT'
        };

        return directionByKey[normalizedKey] ?? null;
    }

    function getRequestedDirectionAfterRelease(
        requestedDirection,
        releasedDirection,
        pressedKeys,
        touchDirections
    ) {
        if (requestedDirection !== releasedDirection) {
            return requestedDirection;
        }

        const keyboardDirection = pressedKeys
            .map(getDirectionForKey)
            .find(Boolean);
        const touchDirection = touchDirections[touchDirections.length - 1];
        return keyboardDirection ?? touchDirection ?? null;
    }

    function getNearestTankGridLine(position, subTileSize, tankGridMultiplier) {
        const tankGridStep = subTileSize * tankGridMultiplier;
        return Math.round(position / tankGridStep) * tankGridStep;
    }

    function getTankAlignmentForDirection(
        x,
        y,
        direction,
        subTileWidth,
        subTileHeight,
        tankGridMultiplier
    ) {
        if (direction === 'UP' || direction === 'DOWN') {
            return {
                axis: 'x',
                value: getNearestTankGridLine(x, subTileWidth, tankGridMultiplier)
            };
        }
        return {
            axis: 'y',
            value: getNearestTankGridLine(y, subTileHeight, tankGridMultiplier)
        };
    }

    function getForwardTileSamplePositions(
        centerX,
        centerY,
        direction,
        width,
        height,
        tileWidth,
        tileHeight
    ) {
        const forwardVector = getDirectionVector(direction);
        if (!forwardVector) {
            return null;
        }

        const halfExtent = Math.max(width, height) / 2;
        return [0, -0.35, 0.35].map((offset) => ({
            x: centerX +
                forwardVector.x * (halfExtent - 0.01) +
                (direction === 'UP' || direction === 'DOWN'
                    ? offset * width
                    : 0),
            y: centerY +
                forwardVector.y * (halfExtent - 0.01) +
                (direction === 'LEFT' || direction === 'RIGHT'
                    ? offset * height
                    : 0)
        })).map((position) => ({
            row: Math.floor(position.y / tileHeight),
            column: Math.floor(position.x / tileWidth),
            x: position.x,
            y: position.y
        }));
    }

    function getMagnetCandidates(
        position,
        subTileSize,
        magnetStep,
        tankGridMultiplier
    ) {
        const magnetGridStep = subTileSize * magnetStep;
        const nearestLine = getNearestTankGridLine(
            position,
            subTileSize,
            tankGridMultiplier
        );
        const candidates = [nearestLine];

        for (let distance = 1; distance <= 4; distance += 1) {
            candidates.push(nearestLine - distance * magnetGridStep);
            candidates.push(nearestLine + distance * magnetGridStep);
        }

        return candidates;
    }

    function getTankSpeedMultiplier(type, textureType = 'a') {
        if (textureType === 'e') {
            return 1.1;
        }

        let multiplier = 0.8;

        if (type === 9) {
            multiplier = 1.05;
        } else if (type === 5) {
            multiplier = 1.15;
        } else if ([3, 7, 8].includes(type)) {
            multiplier = 0.7;
        }

        if (textureType === 'f') {
            multiplier *= 0.9;
        }

        return multiplier;
    }

    function getTankTerrainSpeedMultiplier(isVeryDenseBush, isDenseBush, isRoad) {
        const bushSpeedFactor = isVeryDenseBush
            ? VERY_DENSE_BUSH_SPEED_FACTOR
            : isDenseBush
                ? DENSE_BUSH_SPEED_FACTOR
                : 1;
        return bushSpeedFactor * (isRoad ? ROAD_SPEED_FACTOR : 1);
    }

    function getProjectileTerrainSpeedMultiplier(isVeryDenseBush, isDenseBush) {
        if (isVeryDenseBush) {
            return VERY_DENSE_BUSH_SPEED_FACTOR;
        }
        return isDenseBush ? DENSE_BUSH_SPEED_FACTOR : 1;
    }

    function limitIceSlideMovement(
        movement,
        hasSlidingDirection,
        slidingOnCompactIce,
        slidingDistance,
        slideDistanceTiles,
        tileWidth
    ) {
        if (!hasSlidingDirection || slidingOnCompactIce) {
            return movement;
        }
        return Math.min(
            movement,
            Math.max(0, slideDistanceTiles - slidingDistance) * tileWidth
        );
    }

    function getEnemyInitialHitPoints(textureType) {
        const stageIndex = ARMORED_ENEMY_TEXTURE_STAGES.indexOf(textureType);
        return stageIndex < 0
            ? 1
            : ARMORED_ENEMY_TEXTURE_STAGES.length - stageIndex;
    }

    function getEnemyDamagedTextureType(hitPoints) {
        return ARMORED_ENEMY_TEXTURE_STAGES[
            ARMORED_ENEMY_TEXTURE_STAGES.length - hitPoints
        ] ?? 'b';
    }

    function getTankBulletLimit(tankType) {
        if (tankType === 9) {
            return 3;
        }
        if (tankType === 10) {
            return 2;
        }
        return DOUBLE_BULLET_TANK_TYPES.has(tankType) ? 2 : 1;
    }

    function getProjectileSpeedMultiplier(tankType) {
        return FAST_PROJECTILE_TANK_TYPES.has(tankType) ? 1.25 : 1;
    }

    function canBreakSteel(tankType) {
        return STEEL_BREAKING_TANK_TYPES.has(tankType);
    }

    function hasTwinShot(tankType) {
        return TWIN_SHOT_TANK_TYPES.has(tankType);
    }

    function getTankBurstDirections(tankType, direction) {
        if (tankType === 10) {
            return direction === 'UP' || direction === 'DOWN'
                ? ['UP', 'DOWN']
                : ['LEFT', 'RIGHT'];
        }
        return Array(hasTwinShot(tankType) ? 2 : tankType === 9 ? 3 : 1)
            .fill(direction);
    }

    function getOppositeDirection(direction) {
        return {
            UP: 'DOWN',
            DOWN: 'UP',
            LEFT: 'RIGHT',
            RIGHT: 'LEFT'
        }[direction] ?? direction;
    }

    function getReinforcedBrickDamageMultiplier(tankType) {
        return REINFORCED_BRICK_DAMAGE_TANK_TYPES.has(tankType) ? 2 : 1;
    }

    function getEnemyFireCooldownMs(enemy, tankType) {
        const isTwinShot = hasTwinShot(tankType);
        if (enemy?.textureType === 'e' || enemy?.textureType === 'f') {
            return 300;
        }
        if (enemy && enemy.substate === 'Trapped') {
            return isTwinShot ? 100 : 300;
        }
        const cooldown = isTwinShot ? 700 : 1000;
        return enemy?.textureType === 'f' && enemy.aiState === 'random'
            ? cooldown * 0.8
            : cooldown;
    }

    function getEnemyAiStateDurationMs(
        state = 'random',
        textureType = null,
        random = () => Math.random()
    ) {
        if (state === 'random' && textureType === 'f') {
            return random() * 2000 + 1000;
        }
        const duration = ENEMY_TANK_STATE_DURATIONS_MS[state]
            ?? ENEMY_TANK_STATE_DURATIONS_MS.random;
        return random() * (duration.max - duration.min) + duration.min;
    }

    function chooseEnemyAiState(textureType, random = () => Math.random()) {
        if (textureType === 'e') {
            return random() < 0.5 ? 'player' : 'escape';
        }
        if (textureType === 'f') {
            return random() < 0.85 ? 'eagle' : 'player';
        }

        return ENEMY_TANK_STATES[
            Math.floor(random() * ENEMY_TANK_STATES.length)
        ];
    }

    function getNextEnemyAiState(enemy, random = () => Math.random()) {
        if (enemy.textureType === 'e') {
            return enemy.aiState === 'player' ? 'escape' : 'player';
        }
        if (enemy.textureType === 'f') {
            if (enemy.aiState === 'random' || random() >= 0.2) {
                return enemy.primaryAiState ?? 'eagle';
            }
            return 'random';
        }
        return chooseEnemyAiState(enemy.textureType, random);
    }

    function getEnemyDirectionScore(direction, enemyDirection, aiState, deltaX, deltaY, random = () => Math.random()) {
        const directionVector = getDirectionVector(direction) ?? { x: 0, y: 0 };
        let score = random() * 0.45;

        if (direction === enemyDirection) {
            score += 0.35;
        }

        const angleBias = (
            directionVector.x * deltaX + directionVector.y * deltaY
        ) / (Math.hypot(deltaX, deltaY) || 1);
        score += Math.max(
            0,
            aiState === 'escape' ? -angleBias : angleBias
        ) * 1.1;

        const preferredAxisDirection = Math.abs(deltaX) >= Math.abs(deltaY)
            ? (deltaX >= 0 ? 'RIGHT' : 'LEFT')
            : (deltaY >= 0 ? 'DOWN' : 'UP');

        if (aiState === 'player' && direction === preferredAxisDirection) {
            score += 0.12;
        }

        if (aiState === 'eagle' && direction === preferredAxisDirection) {
            score += 0.15;
        }

        return score;
    }

    function chooseEnemyDirection(
        directions,
        enemyDirection,
        reverseDirection,
        aiState,
        deltaX,
        deltaY,
        random = () => Math.random()
    ) {
        if (directions.length === 0) {
            return null;
        }

        let chosen = directions[0];
        let bestScore = -Infinity;

        directions.forEach((direction) => {
            let score = getEnemyDirectionScore(
                direction,
                enemyDirection,
                aiState,
                deltaX,
                deltaY,
                random
            );

            if (direction === enemyDirection) {
                score += 0.25;
            }
            if (direction === reverseDirection) {
                score -= 0.5;
            }
            if (direction === 'LEFT' || direction === 'RIGHT') {
                score += 0.2;
            }

            if (score > bestScore) {
                bestScore = score;
                chosen = direction;
            }
        });

        return chosen;
    }

    function chooseRandomEnemyDirection(
        openDirections,
        excludedDirection,
        random = () => Math.random()
    ) {
        if (openDirections.length === 0) {
            return null;
        }

        const preferredDirections = excludedDirection
            ? openDirections.filter((direction) => direction !== excludedDirection)
            : openDirections;
        const candidates = preferredDirections.length > 0
            ? preferredDirections
            : openDirections;
        return candidates[Math.floor(random() * candidates.length)];
    }

    function getPreferredEnemyDirections(
        openDirections,
        currentDirection,
        currentReverse,
        recentIceExitDirection,
        forceReverse
    ) {
        const sideDirections = openDirections.filter((direction) =>
            direction === 'LEFT' || direction === 'RIGHT'
        );
        const verticalDirections = openDirections.filter((direction) =>
            direction === 'UP' || direction === 'DOWN'
        );
        let preferredDirections = openDirections;

        const isSameAxisOnly = (
            (sideDirections.length === 0 && verticalDirections.length > 0) ||
            (verticalDirections.length === 0 && sideDirections.length > 0)
        );

        if (recentIceExitDirection) {
            preferredDirections = preferredDirections.filter(
                (direction) => direction !== recentIceExitDirection
            );
            if (preferredDirections.length === 0) {
                preferredDirections = openDirections;
            }
        }

        if (
            sideDirections.length > 0 &&
            (currentDirection === 'UP' || currentDirection === 'DOWN')
        ) {
            preferredDirections = preferredDirections.filter((direction) =>
                sideDirections.includes(direction)
            );
            if (preferredDirections.length === 0) {
                preferredDirections = sideDirections;
            }
        } else if (
            verticalDirections.length > 0 &&
            (currentDirection === 'LEFT' || currentDirection === 'RIGHT')
        ) {
            preferredDirections = preferredDirections.filter((direction) =>
                verticalDirections.includes(direction)
            );
            if (preferredDirections.length === 0) {
                preferredDirections = verticalDirections;
            }
        } else if (forceReverse && !isSameAxisOnly) {
            preferredDirections = preferredDirections.filter(
                (direction) => direction !== currentReverse
            );
            if (preferredDirections.length === 0) {
                preferredDirections = openDirections;
            }
        } else if (!isSameAxisOnly && (forceReverse || openDirections.length > 1)) {
            preferredDirections = preferredDirections.filter(
                (direction) => direction !== currentReverse
            );
            if (preferredDirections.length === 0) {
                preferredDirections = openDirections;
            }
        }

        return preferredDirections.length > 0 ? preferredDirections : openDirections;
    }

    function getAlignedPlayerDirection(
        playerX,
        playerY,
        enemyX,
        enemyY,
        tileWidth,
        tileHeight
    ) {
        const alignmentTolerance = Math.min(tileWidth, tileHeight) * 0.45;
        const deltaX = playerX - enemyX;
        const deltaY = playerY - enemyY;

        if (Math.abs(deltaY) <= alignmentTolerance && Math.abs(deltaX) > alignmentTolerance) {
            return deltaX < 0 ? 'LEFT' : 'RIGHT';
        }

        if (Math.abs(deltaX) <= alignmentTolerance && Math.abs(deltaY) > alignmentTolerance) {
            return deltaY < 0 ? 'UP' : 'DOWN';
        }

        return null;
    }

    function getEnemyPlayerAimDirection(
        alignedDirection,
        textureType,
        aiState,
        random = () => Math.random()
    ) {
        if (!alignedDirection) {
            return null;
        }

        if (textureType === 'f' && aiState === 'random') {
            return alignedDirection;
        }

        const aimState = aiState === 'escape' ? 'player' : aiState;
        const aimChance = ENEMY_ALIGNED_AIM_CHANCES[aimState ?? 'random']
            ?? ENEMY_ALIGNED_AIM_CHANCES.random;
        return random() < aimChance ? alignedDirection : null;
    }

    global.BC90EGame = Object.freeze({
        getTankSpeedMultiplier,
        getTankTerrainSpeedMultiplier,
        getProjectileTerrainSpeedMultiplier,
        limitIceSlideMovement,
        getEnemyInitialHitPoints,
        getEnemyDamagedTextureType,
        getTankBulletLimit,
        getProjectileSpeedMultiplier,
        canBreakSteel,
        hasTwinShot,
        getTankBurstDirections,
        getOppositeDirection,
        getDirectionVector,
        getPositionInDirection,
        getMuzzlePosition,
        getTwinShotSpawnOffsets,
        getDirectionForKey,
        getRequestedDirectionAfterRelease,
        getNearestTankGridLine,
        getTankAlignmentForDirection,
        getForwardTileSamplePositions,
        getMagnetCandidates,
        getReinforcedBrickDamageMultiplier,
        getEnemyFireCooldownMs,
        getEnemyAiStateDurationMs,
        chooseEnemyAiState,
        getNextEnemyAiState,
        getEnemyDirectionScore,
        chooseEnemyDirection,
        chooseRandomEnemyDirection,
        getPreferredEnemyDirections,
        getAlignedPlayerDirection,
        getEnemyPlayerAimDirection
    });
})(window);
