(function (global) {
    'use strict';

    function createTileSelectorPreviews(context) {
        const {
            buttons,
            isTexturesVisible,
            isSimulationActive,
            animationFrames,
            tileAnimationGroups,
            reinforcedAnimationIds,
            reinforcedBrickId,
            reinforcedBrickPreviewStateDuration,
            reinforcedBrickTextureStates,
            shineCycleFrames,
            shineActiveFrames,
            textureFrameDuration,
            spawnAnimationFrameDuration,
            playerSpawnClassicLoop,
            eagleId,
            eagleFrameDuration,
            slowTextureFirstId,
            textureVisibleFrameDuration,
            slowTextureSpeedFactor,
            tntBlockId,
            airId,
            tileColors,
            editorTileTints,
            pixelTileLabels,
            tileButtonLabels,
            getTileTextureSourceId,
            getAvailableAnimationFrames,
            getReinforcedAnimationFrameIndex,
            getEditorTileTexture,
            getShineTexture,
            getPixelLabelCanvas
        } = context;
        const previewUrls = new Map();
        const updateInterval = 1000 / 16;
        let lastUpdateAt = -Infinity;

        function getPreviewKey(tileId, timestamp, previewState) {
            if (reinforcedAnimationIds.has(tileId)) {
                const animationSlot = Math.floor(timestamp / textureFrameDuration)
                    % shineCycleFrames;
                const shineFrame = animationSlot < shineActiveFrames
                    ? getReinforcedAnimationFrameIndex(timestamp, textureFrameDuration)
                    : 'off';
                return `${shineFrame}:${previewState}`;
            }
            if (tileId === tntBlockId) {
                return `tnt:${animationFrames.get(tntBlockId)?.[0] ? 'loaded' : 'pending'}`;
            }

            const textureTileId = getTileTextureSourceId(tileId);
            const animationGroup = tileAnimationGroups[textureTileId];
            if (animationGroup) {
                const sequenceIndex = Math.floor(timestamp / spawnAnimationFrameDuration)
                    % playerSpawnClassicLoop.length;
                return `${playerSpawnClassicLoop[sequenceIndex]}:${previewState}`;
            }

            const frames = getAvailableAnimationFrames(tileId);
            if (frames.length <= 1) {
                return `0:${previewState}`;
            }

            const frameDuration = tileId === eagleId
                ? eagleFrameDuration
                : tileId >= slowTextureFirstId
                    ? textureVisibleFrameDuration * slowTextureSpeedFactor
                    : textureVisibleFrameDuration;
            return `${Math.floor(timestamp / frameDuration) % frames.length}:${previewState}`;
        }

        function update(timestamp, force = false) {
            if (!isTexturesVisible() || isSimulationActive()) {
                return;
            }
            if (!force && timestamp - lastUpdateAt < updateInterval) {
                return;
            }
            lastUpdateAt = timestamp;

            buttons.forEach((button, tileId) => {
                if (tileId === airId) {
                    return;
                }

                const previewState = tileId === reinforcedBrickId
                    ? Math.floor(timestamp / reinforcedBrickPreviewStateDuration)
                        % reinforcedBrickTextureStates
                    : 0;
                const previewKey = getPreviewKey(tileId, timestamp, previewState);
                let tilePreviews = previewUrls.get(tileId);
                if (!tilePreviews) {
                    tilePreviews = new Map();
                    previewUrls.set(tileId, tilePreviews);
                }

                const cachedPreview = tilePreviews.get(previewKey);
                if (cachedPreview) {
                    if (button.dataset.previewKey !== previewKey) {
                        button.style.backgroundImage = `url("${cachedPreview}")`;
                        button.dataset.previewKey = previewKey;
                    }
                    return;
                }

                const texture = tileId === reinforcedBrickId
                    ? animationFrames.get(reinforcedBrickId)?.[previewState]
                        ?? animationFrames.get(reinforcedBrickId)?.[0]
                    : getEditorTileTexture(tileId, timestamp);
                if (!texture && !Object.hasOwn(pixelTileLabels, tileId)) {
                    return;
                }

                const preview = document.createElement('canvas');
                preview.width = 16;
                preview.height = 16;
                const previewContext = preview.getContext('2d');
                if (!previewContext) {
                    throw new Error('Could not create a tile selector preview context.');
                }
                previewContext.imageSmoothingEnabled = false;

                if (texture) {
                    previewContext.drawImage(texture, 0, 0, 16, 16);
                } else {
                    previewContext.fillStyle = tileColors[tileId] ?? tileColors[airId];
                    previewContext.fillRect(0, 0, 16, 16);
                }
                if (reinforcedAnimationIds.has(tileId)) {
                    const shineTexture = getShineTexture(timestamp);
                    if (shineTexture) {
                        previewContext.drawImage(shineTexture, 0, 0, 16, 16);
                    }
                }
                if (Object.hasOwn(editorTileTints, tileId)) {
                    previewContext.globalAlpha = 0.38;
                    previewContext.fillStyle = editorTileTints[tileId];
                    previewContext.fillRect(0, 0, 8, 8);
                    previewContext.globalAlpha = 1;
                }

                const label = tileButtonLabels[tileId] ?? pixelTileLabels[tileId];
                const labelCanvas = label ? getPixelLabelCanvas(label) : null;
                if (labelCanvas) {
                    previewContext.drawImage(labelCanvas, 0, 0, 8, 8);
                }

                const textureUrl = preview.toDataURL('image/png');
                tilePreviews.set(previewKey, textureUrl);
                if (button.dataset.previewKey !== previewKey) {
                    button.style.backgroundImage = `url("${textureUrl}")`;
                    button.dataset.previewKey = previewKey;
                }
            });
        }

        function invalidate(tileId) {
            previewUrls.delete(tileId);
            const button = buttons.get(tileId);
            if (button) {
                delete button.dataset.previewKey;
            }
        }

        function clear() {
            previewUrls.clear();
            lastUpdateAt = -Infinity;
        }

        return Object.freeze({ update, invalidate, clear });
    }

    global.BC90ETileSelectorPreviews = Object.freeze({ createTileSelectorPreviews });
})(window);
