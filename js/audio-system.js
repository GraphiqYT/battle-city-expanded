(function (global) {
    'use strict';

    const soundFiles = Object.freeze({
        levelStart: 'assets/sounds/level_start.wav',
        iceTurn: 'assets/sounds/ice_turn.wav',
        playerMovement: 'assets/sounds/player_movement.wav',
        enemyMovement: 'assets/sounds/enemy_movement.wav',
        playerShot: 'assets/sounds/player_shot.wav',
        wallHit: 'assets/sounds/wall_hit.wav',
        enemyHit: 'assets/sounds/enemy_hit.wav',
        enemyDestroyed: 'assets/sounds/enemy_destroy.wav',
        tntExplosion: 'assets/sounds/TNT_explosion.wav',
        eagleDestroyed: 'assets/sounds/eagle_destroy.wav',
        powerUpAppeared: 'assets/sounds/powerup_spawn.wav',
        pause: 'assets/sounds/pause.wav',
        powerUpCollected: 'assets/sounds/powerup_collect.wav',
        playerLifeCollected: 'assets/sounds/life_collect.wav',
        scoreCount: 'assets/sounds/score_count.wav',
        uiTileClick: 'assets/sounds/ui_tile_click.wav',
        uiButtonClick: 'assets/sounds/ui_button_click.wav',
        uiAllButtonHover: 'assets/sounds/ui_all_button_hover.wav'
    });
    const inheritedAssetUrl = global.getAssetUrl;

    const state = {
        audioContext: null,
        soundBuffers: new Map(),
        soundBufferLoads: new Map(),
        soundLoadControllers: new Set(),
        failedSoundLoads: new Set(),
        activeSoundSources: new Set(),
        preloadPromise: null,
        preloadCompleted: 0,
        keepAliveSource: null,
        keepAliveGain: null,
        resumePromise: null,
        suspendPromise: null,
        audioOperationPromise: null,
        generation: 0,
        muted: false,
        hasUserInteractedWithAudio: false,
        hasUserActivatedAudio: false,
        getAssetUrl: null,
        onSoundLoaded: null,
        onSoundFailed: null
    };

    function ensureAudioContext() {
        if (state.audioContext?.state === 'closed') {
            stopAudioKeepAlive();
            stopAllSoundSources();
            state.audioContext = null;
            state.resumePromise = null;
            state.suspendPromise = null;
            state.audioOperationPromise = null;
        }
        if (!state.audioContext) {
            const AudioContextConstructor = global.AudioContext ||
                global.webkitAudioContext;
            if (typeof AudioContextConstructor === 'function') {
                state.audioContext = new AudioContextConstructor();
            }
        }
        return state.audioContext;
    }

    function getAssetUrl(path) {
        if (typeof state.getAssetUrl === 'function') {
            return state.getAssetUrl(path);
        }
        if (typeof inheritedAssetUrl === 'function') {
            return inheritedAssetUrl(path);
        }
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}assetReload=${Date.now()}`;
    }

    function configure({ getAssetUrl: assetUrlResolver, onSoundLoaded, onSoundFailed } = {}) {
        if (assetUrlResolver !== undefined && typeof assetUrlResolver !== 'function') {
            throw new TypeError('getAssetUrl must be a function.');
        }
        if (onSoundLoaded !== undefined && typeof onSoundLoaded !== 'function') {
            throw new TypeError('onSoundLoaded must be a function.');
        }
        if (onSoundFailed !== undefined && typeof onSoundFailed !== 'function') {
            throw new TypeError('onSoundFailed must be a function.');
        }
        state.getAssetUrl = assetUrlResolver ?? null;
        state.onSoundLoaded = onSoundLoaded ?? null;
        state.onSoundFailed = onSoundFailed ?? null;
    }

    function queueAudioOperation(operation) {
        const previousOperation = state.audioOperationPromise;
        const audioOperationPromise = previousOperation
            ? previousOperation.then(operation, operation)
            : Promise.resolve().then(operation);
        state.audioOperationPromise = audioOperationPromise;
        audioOperationPromise.then(() => {
            if (state.audioOperationPromise === audioOperationPromise) {
                state.audioOperationPromise = null;
            }
        }, () => {
            if (state.audioOperationPromise === audioOperationPromise) {
                state.audioOperationPromise = null;
            }
        });
        return audioOperationPromise;
    }

    function withTimeout(promise, timeoutMs, message) {
        let timeoutId;
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                timeoutId = global.setTimeout(() => reject(new Error(message)), timeoutMs);
            })
        ]).finally(() => global.clearTimeout(timeoutId));
    }

    function resumeGameAudio({ fromUserGesture = false } = {}) {
        if (fromUserGesture) {
            state.hasUserInteractedWithAudio = true;
        }
        const audioContext = ensureAudioContext();
        if (!audioContext) {
            return Promise.reject(
                new Error('This browser does not support Web Audio.')
            );
        }
        if (state.resumePromise && !fromUserGesture) {
            return state.resumePromise;
        }
        if (audioContext.state === 'running' && !state.audioOperationPromise) {
            if (fromUserGesture) {
                state.hasUserActivatedAudio = true;
            }
            return Promise.resolve(audioContext.currentTime);
        }

        const previousOperation = state.audioOperationPromise;
        let resumeRequest;
        try {
            resumeRequest = audioContext.resume();
        } catch (error) {
            return Promise.reject(error);
        }
        const audioOperationPromise = Promise.resolve(resumeRequest).then(async () => {
            if (previousOperation) {
                await previousOperation.catch(() => {});
            }
            if (audioContext.state !== 'running') {
                await audioContext.resume();
            }
            if (audioContext.state !== 'running') {
                throw new Error(`Game audio context is "${audioContext.state}".`);
            }
            if (fromUserGesture) {
                state.hasUserActivatedAudio = true;
            }
            return audioContext.currentTime;
        });
        state.audioOperationPromise = audioOperationPromise;
        audioOperationPromise.then(() => {
            if (state.audioOperationPromise === audioOperationPromise) {
                state.audioOperationPromise = null;
            }
        }, () => {
            if (state.audioOperationPromise === audioOperationPromise) {
                state.audioOperationPromise = null;
            }
        });
        const resumePromise = audioOperationPromise.finally(() => {
            if (state.resumePromise === resumePromise) {
                state.resumePromise = null;
            }
        });
        state.resumePromise = resumePromise;
        return resumePromise;
    }

    async function warmUpGameAudio({
        fromUserGesture = false,
        activationTimeoutMs = 10000,
        warmupTimeoutMs = 5000
    } = {}) {
        let timeoutId = 0;
        try {
            await Promise.race([
                resumeGameAudio({ fromUserGesture }),
                new Promise((_, reject) => {
                    timeoutId = global.setTimeout(
                        () => reject(new Error(
                            'Audio context activation timed out. Check browser audio permissions and retry.'
                        )),
                        activationTimeoutMs
                    );
                })
            ]);
        } finally {
            global.clearTimeout(timeoutId);
        }

        const audioContext = ensureAudioContext();
        const silentBuffer = audioContext.createBuffer(
            1,
            Math.max(1, Math.ceil(audioContext.sampleRate * 0.02)),
            audioContext.sampleRate
        );
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        gain.gain.value = 0;
        source.buffer = silentBuffer;
        source.connect(gain);
        gain.connect(audioContext.destination);

        try {
            source.start();
            await Promise.race([
                new Promise((resolve) => {
                    source.addEventListener('ended', resolve, { once: true });
                }),
                new Promise((_, reject) => {
                    timeoutId = global.setTimeout(
                        () => reject(new Error('Audio warm-up timed out.')),
                        warmupTimeoutMs
                    );
                })
            ]);
        } finally {
            global.clearTimeout(timeoutId);
            try {
                source.stop();
            } catch (error) {
                if (error.name !== 'InvalidStateError') {
                    throw error;
                }
            }
            source.disconnect();
            gain.disconnect();
        }
    }

    function startAudioKeepAlive() {
        const audioContext = ensureAudioContext();
        if (
            state.muted ||
            !audioContext ||
            audioContext.state !== 'running' ||
            state.keepAliveSource
        ) {
            return;
        }

        const gain = audioContext.createGain();
        gain.gain.value = 0.00001;
        const source = audioContext.createOscillator();
        source.type = 'sine';
        source.frequency.value = 220;
        source.connect(gain);
        gain.connect(audioContext.destination);
        source.addEventListener('ended', () => {
            if (state.keepAliveSource !== source) {
                return;
            }
            state.keepAliveSource = null;
            state.keepAliveGain = null;
        }, { once: true });
        source.start();
        state.keepAliveSource = source;
        state.keepAliveGain = gain;
    }

    function stopAudioKeepAlive() {
        const source = state.keepAliveSource;
        const gain = state.keepAliveGain;
        state.keepAliveSource = null;
        state.keepAliveGain = null;
        if (source) {
            try {
                source.stop();
            } catch (error) {
                if (error.name !== 'InvalidStateError') {
                    throw error;
                }
            }
            source.disconnect();
        }
        gain?.disconnect();
    }

    function loadSoundBuffer(name, { timeoutMs = 30000 } = {}) {
        if (!soundFiles[name]) {
            return Promise.reject(new Error(`Unknown sound key: ${name}`));
        }
        if (state.soundBuffers.has(name)) {
            return Promise.resolve(state.soundBuffers.get(name));
        }
        const existingLoad = state.soundBufferLoads.get(name);
        if (existingLoad) {
            return existingLoad;
        }

        const audioContext = ensureAudioContext();
        if (!audioContext) {
            return Promise.reject(new Error('Audio backend is not available.'));
        }

        const generation = state.generation;
        const controller = new AbortController();
        state.soundLoadControllers.add(controller);
        let timeoutId = 0;
        const assetCache = global.BC90EAssetCache;
        const persistentCacheKey = assetCache?.makeKey(
            'audio',
            soundFiles[name],
            'encoded'
        );
        const loadAudioBuffer = async () => {
            let cachedAudio = null;
            if (persistentCacheKey) {
                try {
                    cachedAudio = await withTimeout(
                        assetCache.get(persistentCacheKey),
                        Math.min(timeoutMs, 5000),
                        `Reading cached audio "${name}" timed out.`
                    );
                } catch (error) {
                    console.warn(
                        `Could not read cached audio "${name}"; loading it from the server.`,
                        error
                    );
                }
            }
            if (cachedAudio instanceof ArrayBuffer) {
                try {
                    return await withTimeout(
                        audioContext.decodeAudioData(cachedAudio.slice(0)),
                        Math.min(timeoutMs, 10000),
                        `Decoding cached audio "${name}" timed out.`
                    );
                } catch (error) {
                    console.warn(`Discarding invalid cached audio "${name}".`, error);
                    void assetCache.remove(persistentCacheKey).catch((removeError) => {
                        console.warn(
                            `Could not remove invalid cached audio "${name}".`,
                            removeError
                        );
                    });
                }
            }

            const response = await global.fetch(getAssetUrl(soundFiles[name]), {
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Audio request failed with status ${response.status}.`);
            }
            const audioData = await response.arrayBuffer();
            const audioBuffer = await withTimeout(
                audioContext.decodeAudioData(audioData.slice(0)),
                Math.min(timeoutMs, 15000),
                `Decoding audio "${name}" timed out.`
            );
            if (
                persistentCacheKey &&
                generation === state.generation &&
                !controller.signal.aborted
            ) {
                void assetCache.put(persistentCacheKey, audioData.slice(0)).catch(
                    (error) => {
                        console.warn(`Could not cache audio "${name}".`, error);
                    }
                );
            }
            return audioBuffer;
        };
        let rejectTimeout;
        const timeoutPromise = new Promise((_, reject) => {
            rejectTimeout = reject;
        });
        const loadPromise = Promise.race([
            loadAudioBuffer(),
            timeoutPromise
        ]).then((buffer) => {
            if (generation !== state.generation) {
                throw new Error(`Audio loading for "${name}" was reset.`);
            }
            state.soundBuffers.set(name, buffer);
            state.failedSoundLoads.delete(name);
            state.preloadCompleted += 1;
            try {
                state.onSoundLoaded?.(name, buffer);
            } catch (error) {
                console.error(`Unable to update progress for sound "${name}".`, error);
            }
            return buffer;
        }).catch((error) => {
            if (generation === state.generation) {
                state.failedSoundLoads.add(name);
                try {
                    state.onSoundFailed?.(name, error);
                } catch (callbackError) {
                    console.error(`Unable to report failure for sound "${name}".`, callbackError);
                }
            }
            throw error;
        }).finally(() => {
            global.clearTimeout(timeoutId);
            state.soundLoadControllers.delete(controller);
            if (state.soundBufferLoads.get(name) === loadPromise) {
                state.soundBufferLoads.delete(name);
            }
        });

        state.soundBufferLoads.set(name, loadPromise);
        const timeoutError = new Error(
            `Loading audio "${name}" timed out after ${timeoutMs} ms.`
        );
        timeoutId = global.setTimeout(() => {
            controller.abort();
            rejectTimeout(timeoutError);
        }, timeoutMs);
        return loadPromise;
    }

    function preloadGameSounds({ concurrency = 4 } = {}) {
        if (!Number.isInteger(concurrency) || concurrency < 1) {
            return Promise.reject(new RangeError('Audio load concurrency must be positive.'));
        }
        if (state.preloadPromise) {
            return state.preloadPromise;
        }

        const generation = state.generation;
        const names = Object.keys(soundFiles);
        const preloadPromise = (async () => {
            const results = [];
            for (let index = 0; index < names.length; index += concurrency) {
                const batch = names.slice(index, index + concurrency);
                results.push(...await Promise.allSettled(
                    batch.map((name) => loadSoundBuffer(name))
                ));
            }
            return results;
        })();
        state.preloadPromise = preloadPromise;

        return preloadPromise.finally(() => {
            if (generation === state.generation &&
                state.preloadPromise === preloadPromise) {
                state.preloadPromise = null;
            }
        });
    }

    function assertAllGameSoundsLoaded() {
        if (state.soundBuffers.size === Object.keys(soundFiles).length) {
            return;
        }
        const failed = Array.from(state.failedSoundLoads);
        throw new Error(
            `Loaded ${state.soundBuffers.size} of ${Object.keys(soundFiles).length} game sounds.` +
            `${failed.length ? ` Failed files: ${failed.join(', ')}.` : ''}`
        );
    }

    function playSoundEffect(effect) {
        if (state.muted) {
            return null;
        }
        const audioContext = ensureAudioContext();
        const buffer = state.soundBuffers.get(effect);
        if (!buffer || !audioContext || audioContext.state !== 'running') {
            return null;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        state.activeSoundSources.add(source);
        source.addEventListener('ended', () => {
            state.activeSoundSources.delete(source);
            source.disconnect();
        }, { once: true });
        try {
            source.start();
        } catch (error) {
            state.activeSoundSources.delete(source);
            source.disconnect();
            console.error(`Unable to start sound "${effect}".`, error);
            return null;
        }
        return source;
    }

    function stopAllSoundSources(sourceToKeep = null) {
        Array.from(state.activeSoundSources).forEach((source) => {
            if (source === sourceToKeep) {
                return;
            }
            try {
                source.stop();
            } catch (error) {
                if (error.name !== 'InvalidStateError') {
                    console.error('Unable to stop a game sound.', error);
                }
            }
            source.disconnect();
            state.activeSoundSources.delete(source);
        });
    }

    function suspendGameAudio() {
        const audioContext = state.audioContext;
        if (!audioContext) {
            return Promise.resolve();
        }
        if (state.suspendPromise) {
            return state.suspendPromise;
        }
        if (audioContext.state !== 'running' && !state.audioOperationPromise) {
            return Promise.resolve();
        }

        const audioOperationPromise = queueAudioOperation(() => {
            if (audioContext.state !== 'running') {
                return;
            }
            return audioContext.suspend();
        });
        const suspendPromise = audioOperationPromise.finally(() => {
            if (state.suspendPromise === suspendPromise) {
                state.suspendPromise = null;
            }
        });
        state.suspendPromise = suspendPromise;
        return suspendPromise;
    }

    function resetSounds() {
        state.generation += 1;
        state.soundLoadControllers.forEach((controller) => controller.abort());
        state.soundLoadControllers.clear();
        state.soundBuffers.clear();
        state.soundBufferLoads.clear();
        state.failedSoundLoads.clear();
        state.preloadPromise = null;
        state.preloadCompleted = 0;
    }

    function setMuted(nextMuted) {
        state.muted = Boolean(nextMuted);
        if (state.muted) {
            stopAudioKeepAlive();
        }
    }

    function showAudioLoadingScreen() {
        const ui = global.BC90EGameplayUi;
        if (ui && typeof ui.setAudioLoadingVisible === 'function') {
            ui.setAudioLoadingVisible(true, 'Loading game assets and audio. Please wait...');
        }
    }

    function enableGameAudio() {
        state.muted = false;
        return resumeGameAudio({ fromUserGesture: true }).then(() => {
            startAudioKeepAlive();
        });
    }

    const api = Object.freeze({
        state,
        soundFiles,
        configure,
        ensureAudioContext,
        warmUpGameAudio,
        resumeGameAudio,
        suspendGameAudio,
        startAudioKeepAlive,
        stopAudioKeepAlive,
        loadSoundBuffer,
        preloadGameSounds,
        assertAllGameSoundsLoaded,
        playSoundEffect,
        stopAllSoundSources,
        resetSounds,
        setMuted,
        showAudioLoadingScreen,
        enableGameAudio,
        getAssetUrl
    });

    global.BC90EAudioSystem = api;
    global.soundFiles = soundFiles;
    global.soundBuffers = state.soundBuffers;
    global.soundBufferLoads = state.soundBufferLoads;
    global.failedSoundLoads = state.failedSoundLoads;
    global.getAssetUrl = global.getAssetUrl || getAssetUrl;
    global.warmUpGameAudio = warmUpGameAudio;
    global.resumeGameAudio = resumeGameAudio;
    global.startAudioKeepAlive = startAudioKeepAlive;
    global.stopAudioKeepAlive = stopAudioKeepAlive;
    global.loadSoundBuffer = loadSoundBuffer;
    global.preloadGameSounds = preloadGameSounds;
    global.assertAllGameSoundsLoaded = assertAllGameSoundsLoaded;
    global.playSoundEffect = playSoundEffect;
    global.enableGameAudio = enableGameAudio;
    global.showAudioLoadingScreen = showAudioLoadingScreen;
})(window);
