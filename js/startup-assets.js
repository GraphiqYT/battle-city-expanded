(function (global) {
    'use strict';

    function createAssetReadiness({
        pendingGameAssetLoads,
        failedGameAssetLoads,
        gameFontFamilies,
        updateAssetProgress
    }) {
        const ASSET_LOAD_STALL_TIMEOUT_MS = 90000;

        function withPreparationTimeout(promise, timeoutMs, message) {
            let timeoutId;
            return Promise.race([
                promise,
                new Promise((resolve, reject) => {
                    timeoutId = global.setTimeout(() => reject(new Error(message)), timeoutMs);
                })
            ]).finally(() => global.clearTimeout(timeoutId));
        }

        async function ensureGameAssetsReady({ includeFonts = true } = {}) {
            while (pendingGameAssetLoads.size > 0) {
                await new Promise((resolve, reject) => {
                    let isSettled = false;
                    const cleanup = () => {
                        global.clearTimeout(timeoutId);
                        global.removeEventListener('gameassetsettled', onAssetSettled);
                    };
                    const onAssetSettled = () => {
                        if (isSettled) {
                            return;
                        }
                        isSettled = true;
                        cleanup();
                        resolve();
                    };
                    const timeoutId = global.setTimeout(() => {
                        if (isSettled) {
                            return;
                        }
                        isSettled = true;
                        cleanup();
                        reject(new Error(
                            `${pendingGameAssetLoads.size} game asset(s) are still loading.`
                        ));
                    }, ASSET_LOAD_STALL_TIMEOUT_MS);
                    global.addEventListener('gameassetsettled', onAssetSettled, {
                        once: true
                    });
                });
            }

            if (failedGameAssetLoads.size > 0) {
                const failedPaths = Array.from(failedGameAssetLoads.keys());
                throw new Error(
                    `${failedPaths.length} game asset(s) failed to load: ` +
                    `${failedPaths.slice(0, 3).join(', ')}${failedPaths.length > 3 ? ', …' : ''}`
                );
            }

            const images = Array.from(global.document.images);
            await Promise.all(images.map(async (image) => {
                const source = image.currentSrc || image.src;
                if (!source || /^(data|blob):/i.test(source)) {
                    return;
                }
                if (!image.complete) {
                    await new Promise((resolve, reject) => {
                        const timeoutId = global.setTimeout(() => {
                            cleanup();
                            reject(new Error(`Image is still loading: ${source}`));
                        }, 10000);
                        const cleanup = () => {
                            global.clearTimeout(timeoutId);
                            image.removeEventListener('load', onLoad);
                            image.removeEventListener('error', onError);
                        };
                        const onLoad = () => {
                            cleanup();
                            resolve();
                        };
                        const onError = () => {
                            cleanup();
                            reject(new Error(`Image failed to load: ${source}`));
                        };
                        image.addEventListener('load', onLoad, { once: true });
                        image.addEventListener('error', onError, { once: true });
                    });
                }
                if (image.naturalWidth === 0 || image.naturalHeight === 0) {
                    throw new Error(`Image has no decoded content: ${source}`);
                }
                if (typeof image.decode === 'function') {
                    try {
                        await withPreparationTimeout(
                            image.decode(),
                            10000,
                            `Image decoding timed out: ${source}`
                        );
                    } catch (error) {
                        if (error instanceof Error && error.message.includes('timed out')) {
                            throw error;
                        }
                        throw new Error(`Image could not be decoded: ${source}`);
                    }
                }
            }));

            if (includeFonts) {
                await ensureGameFontsReady();
            }
        }

        async function ensureGameFontsReady() {
            if (!global.document.fonts) {
                throw new Error('This browser cannot verify the required game fonts.');
            }
            for (const family of gameFontFamilies) {
                try {
                    await withPreparationTimeout(
                        global.document.fonts.load(`16px "${family}"`),
                        10000,
                        `Font loading timed out: ${family}`
                    );
                } catch (error) {
                    if (error instanceof Error && error.message.includes('timed out')) {
                        throw error;
                    }
                    throw new Error(`Font failed to load: ${family}`);
                }
                if (!global.document.fonts.check(`16px "${family}"`)) {
                    throw new Error(`Font failed to load: ${family}`);
                }
                updateAssetProgress();
            }
        }

        return Object.freeze({ ensureGameAssetsReady, ensureGameFontsReady });
    }

    function createStartupAssets({
        loading,
        loadingLabel,
        loadingProgress,
        assetReport,
        retryButton,
        getLoadingAssetLabel,
        updateAssetProgress,
        ensureGameAssetsReady,
        failedTextureLoads,
        preloadGameSounds,
        failedSoundLoads,
        soundBuffers,
        soundFiles,
        ensureGameFontsReady,
        renderDiagnosticReport,
        setProgressPhase,
        startMenuIntro
    }) {
        async function prepareStartupAssets() {
            retryButton.hidden = true;
            loading.hidden = false;
            loading.classList.remove('has-error');
            assetReport.hidden = true;
            loadingLabel.textContent = getLoadingAssetLabel();
            loadingProgress.textContent = '';
            const progressInterval = global.setInterval(updateAssetProgress, 100);
            try {
                setProgressPhase('textures');
                updateAssetProgress();
                await ensureGameAssetsReady({ includeFonts: false });
                if (failedTextureLoads.size > 0) {
                    throw new Error(`${failedTextureLoads.size} texture(s) failed to load.`);
                }

                setProgressPhase('audio');
                updateAssetProgress();
                await preloadGameSounds();
                if (
                    failedSoundLoads.size > 0 ||
                    soundBuffers.size !== Object.keys(soundFiles).length
                ) {
                    const failedSounds = Array.from(failedSoundLoads);
                    throw new Error(
                        `${failedSounds.length || Object.keys(soundFiles).length - soundBuffers.size}` +
                        ` audio file(s) failed to load` +
                        `${failedSounds.length ? `: ${failedSounds.join(', ')}` : '.'}`
                    );
                }

                setProgressPhase('fonts');
                updateAssetProgress();
                await ensureGameFontsReady();
                setProgressPhase('complete');
                startMenuIntro();
            } catch (error) {
                console.error('Unable to prepare startup assets.', error);
                loading.classList.add('has-error');
                loadingLabel.textContent = 'Unable to load game assets.';
                loadingProgress.textContent = '';
                renderDiagnosticReport(assetReport, error);
                retryButton.hidden = false;
            } finally {
                global.clearInterval(progressInterval);
            }
        }

        return Object.freeze({ prepareStartupAssets });
    }

    global.BC90EStartupAssets = Object.freeze({
        createAssetReadiness,
        createStartupAssets
    });
})(window);
