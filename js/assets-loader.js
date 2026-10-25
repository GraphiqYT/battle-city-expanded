(function (global) {
    'use strict';

    const assetState = {
        pendingTextureLoads: new Map(),
        failedTextureLoads: new Set(),
        loadedTextureCache: new Map(),
        failedGameAssetLoads: new Map(),
        soundBuffers: new Map(),
        failedSoundLoads: new Set(),
        textureLoadStates: new Map(),
        assetReloadVersion: 0,
        startupAssetProgressPhase: 'textures'
    };

    function getAssetUrl(path) {
        if (!path) {
            return path;
        }
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}assetReload=${assetState.assetReloadVersion}`;
    }

    function getLoadingAssetLabel() {
        return `Loading game assets${'.'.repeat(1 + Math.floor(Date.now() / 450) % 3)}`;
    }

    function renderDiagnosticReport({
        report,
        failedGameAssetLoads,
        failedSoundLoads,
        soundFiles,
        error = null
    }) {
        const failedAssets = new Map();
        failedGameAssetLoads.forEach((_loadError, path) => {
            failedAssets.set(`Image: ${path}`, `Image: ${path}`);
        });
        failedSoundLoads.forEach((name) => {
            const path = soundFiles[name] ?? name;
            failedAssets.set(`Audio: ${path}`, `Audio: ${path}`);
        });
        if (failedAssets.size === 0 && error) {
            failedAssets.set(error.message, error.message);
        }

        const list = report.querySelector('ul');
        list.replaceChildren();
        failedAssets.forEach((description) => {
            const item = document.createElement('li');
            item.textContent = description;
            list.append(item);
        });
        report.querySelector('summary').textContent =
            `Assets that failed to load (${failedAssets.size})`;
        report.hidden = failedAssets.size === 0;
        return failedAssets.size;
    }

    function updateAssetProgress() {
        const soundFiles = global.soundFiles || {};
        const textureLoadStates = global.textureLoadStates || assetState.textureLoadStates;
        const soundBuffers = global.soundBuffers || assetState.soundBuffers;
        const failedTextureLoads = global.failedTextureLoads || assetState.failedTextureLoads;
        const failedSoundLoads = global.failedSoundLoads || assetState.failedSoundLoads;
        const initialAssetLoading = document.getElementById('initialAssetLoading');
        const initialAssetLoadingLabel = document.getElementById('initialAssetLoadingLabel');
        const initialAssetLoadingProgress = document.getElementById('initialAssetLoadingProgress');
        const audioLoadingDialog = document.getElementById('audioLoadingDialog');
        const audioLoadingText = document.getElementById('audioLoadingText');

        const GAME_FONT_FAMILIES = global.GAME_FONT_FAMILIES || ['Press Start 2P', 'Namco Pixel'];
        const totalTextures = textureLoadStates.size;
        const loadedTextures = Array.from(textureLoadStates.values())
            .filter((state) => state === 'loaded').length;
        const loadedFonts = GAME_FONT_FAMILIES.filter((family) =>
            document.fonts?.check(`16px "${family}"`)
        ).length;

        const startupProgress = {
            textures: `${loadedTextures}/${totalTextures} textures`,
            audio: `${soundBuffers.size}/${Object.keys(soundFiles).length} audios`,
            fonts: `${loadedFonts}/${GAME_FONT_FAMILIES.length} fonts`,
            complete: `${loadedFonts}/${GAME_FONT_FAMILIES.length} fonts`
        }[assetState.startupAssetProgressPhase] ?? `${loadedTextures}/${totalTextures} textures`;

        if (initialAssetLoading && initialAssetLoading.hidden === false) {
            if (initialAssetLoadingLabel) {
                initialAssetLoadingLabel.textContent = global.getLoadingAssetLabel
                    ? global.getLoadingAssetLabel()
                    : 'Loading game assets...';
            }
            if (initialAssetLoadingProgress) {
                initialAssetLoadingProgress.textContent = startupProgress;
            }
        }

        if (audioLoadingDialog && audioLoadingDialog.classList.contains('visible')) {
            if (audioLoadingText) {
                audioLoadingText.textContent = `${loadedTextures}/${totalTextures} textures · ${soundBuffers.size}/${Object.keys(soundFiles).length} audios · ${loadedFonts}/${GAME_FONT_FAMILIES.length} fonts`;
            }
        }

        if (typeof global.onAssetProgress === 'function') {
            global.onAssetProgress({
                totalTextures,
                loadedTextures,
                loadedFonts,
                startupProgress,
                failedTextureLoads: failedTextureLoads.size,
                failedSoundLoads: failedSoundLoads.size
            });
        }
    }

    function loadTexture(path, onValidTexture, normalizeBlackPixels = true) {
        const key = `${path}|${normalizeBlackPixels ? 'normalized' : 'raw'}`;
        const image = new Image();
        const textureLoadStates = global.textureLoadStates || assetState.textureLoadStates;
        const loadedTextureCache = global.loadedTextureCache || assetState.loadedTextureCache;
        const failedTextureLoads = global.failedTextureLoads || assetState.failedTextureLoads;
        textureLoadStates.set(key, 'loading');

        image.onload = () => {
            try {
                const texture = normalizeBlackPixels
                    ? (global.normalizeTransparentBlackPixels || ((value) => value))(image)
                    : image;
                loadedTextureCache.set(key, texture);
                textureLoadStates.set(key, 'loaded');
                failedTextureLoads.delete(key);
                if (typeof onValidTexture === 'function') {
                    onValidTexture(texture);
                }
            } catch (error) {
                console.error('Unable to prepare game asset.', error);
                textureLoadStates.set(key, 'failed');
                failedTextureLoads.add(key);
            }
        };

        image.onerror = () => {
            textureLoadStates.set(key, 'failed');
            failedTextureLoads.add(key);
            console.error(`Unable to load game asset: ${path}`);
        };

        image.src = getAssetUrl(path);
    }

    function retryFailedDocumentImages() {
        Array.from(document.images).forEach((image, index) => {
            if (!image.complete || image.naturalWidth > 0 || !image.src ||
                image.src.startsWith('data:') || image.src.startsWith('blob:')) {
                return;
            }
            const retryUrl = new URL(image.src, document.baseURI);
            retryUrl.searchParams.set('_asset_retry', `${Date.now()}-${index}`);
            image.src = retryUrl.toString();
        });
    }

    function reloadAllAssets() {
        assetState.assetReloadVersion += 1;
        if (global.loadedTextureCache) {
            global.loadedTextureCache.clear();
        }
        if (global.failedTextureLoads) {
            global.failedTextureLoads.clear();
        }
        if (global.failedGameAssetLoads) {
            global.failedGameAssetLoads.clear();
        }
        if (global.BC90EAudioSystem?.resetSounds) {
            global.BC90EAudioSystem.resetSounds();
        } else {
            global.soundBuffers?.clear();
            global.failedSoundLoads?.clear();
        }
        if (global.textureLoadStates) {
            global.textureLoadStates.clear();
        }
        if (typeof global.retryFailedDocumentImages === 'function') {
            global.retryFailedDocumentImages();
        }
    }

    global.BC90EAssetLoader = {
        state: assetState,
        getAssetUrl,
        getLoadingAssetLabel,
        renderDiagnosticReport,
        updateAssetProgress,
        loadTexture,
        retryFailedDocumentImages,
        reloadAllAssets
    };

    global.getAssetUrl = getAssetUrl;
    global.loadTexture = loadTexture;
    global.retryFailedDocumentImages = retryFailedDocumentImages;
    global.reloadAllAssets = reloadAllAssets;
    global.updateAssetProgress = updateAssetProgress;
})(window);
