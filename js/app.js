
        'use strict';

        const isPlayOnlyMode = document.body.dataset.gameMode === 'play';
        const levelDataCodec = window.BC90ELevelData;
        if (!levelDataCodec) {
            throw new Error('The shared level data codec did not load.');
        }
        const gameCore = window.BC90EGame;
        if (!gameCore) {
            throw new Error('The shared game core did not load.');
        }
        const audioSystem = window.BC90EAudioSystem;
        if (!audioSystem) {
            throw new Error('The shared audio system did not load.');
        }
        const persistentAssetCache = window.BC90EAssetCache;
        if (!persistentAssetCache) {
            throw new Error('The persistent asset cache module did not load.');
        }
        const appShellUi = window.BC90EAppShell;
        if (!appShellUi) {
            throw new Error('The app shell module did not load.');
        }

        const messageDialogUi = window.BC90EMessageDialog.createMessageDialog();
        const {
            show: showMessage,
            showConfirmation: showMessageConfirmation
        } = messageDialogUi;

        const startMenu = document.getElementById('startMenu');
        const appShell = document.querySelector('.app-shell');
        const initialAssetLoading = document.getElementById('initialAssetLoading');
        const initialAssetLoadingLabel =
            document.getElementById('initialAssetLoadingLabel');
        const initialAssetLoadingProgress =
            document.getElementById('initialAssetLoadingProgress');
        const initialAssetReport = document.getElementById('initialAssetReport');
        const retryInitialAssetsButton = document.getElementById('retryInitialAssetsButton');
        const getLoadingAssetLabel = window.BC90EAssetLoader.getLoadingAssetLabel;
        const renderAssetDiagnosticReport = (report, error = null) =>
            window.BC90EAssetLoader.renderDiagnosticReport({
                report,
                failedGameAssetLoads,
                failedSoundLoads,
                soundFiles,
                error
            });

        let assetReportRefreshTimer = 0;
        function scheduleEditorAssetReport(error) {
            assetLoadStatus.hidden = false;
            assetLoadStatus.dataset.error = 'true';
            assetLoadStatus.textContent = `Asset failed to load: ${error.message}`;
            window.clearTimeout(assetReportRefreshTimer);
            assetReportRefreshTimer = window.setTimeout(() => {
                if (failedGameAssetLoads.size === 0 && failedSoundLoads.size === 0) {
                    assetLoadStatus.hidden = true;
                    delete assetLoadStatus.dataset.error;
                    assetLoadReport.hidden = true;
                    return;
                }
                renderAssetDiagnosticReport(assetLoadReport, error);
            }, 100);
        }

        const menuFrameToggleInput = document.getElementById('menuFrameToggleInput');
        const packEditorScreen = document.getElementById('packEditorScreen');
        const packEditorTitle = document.getElementById('packEditorTitle');
        const packEditorDescription = document.getElementById('packEditorDescription');
        const gamePlayScreen = document.getElementById('gamePlayScreen');
        const gamePlayCanvasHost = document.getElementById('gamePlayCanvasHost');
        const gamePlayHud = document.getElementById('gamePlayHud');
        const gamePlayReturnButton = document.getElementById('gamePlayReturnButton');
        const gamePauseMessage = document.getElementById('gamePauseMessage');
        const levelTransitionBlack = document.getElementById('levelTransitionBlack');
        const levelScoreScreen = document.getElementById('levelScoreScreen');
        const levelScoreRanks = document.getElementById('levelScoreRanks');
        const levelScoreTotal = document.getElementById('levelScoreTotal');
        let levelScoreScreenUi;
        const levelIntroCurtain = document.getElementById('levelIntroCurtain');
        const levelIntroTitle = document.getElementById('levelIntroTitle');
        let levelIntro;
        const packEditorGrid = document.getElementById('packEditorGrid');
        const packEditorBreadcrumb = document.getElementById('packEditorBreadcrumb');
        const packEditorStatus = document.getElementById('packEditorStatus');
        const packDirectoryLocation = document.getElementById('packDirectoryLocation');
        const backToWorldsButton = document.getElementById('backToWorldsButton');
        const newWorldButton = document.getElementById('newWorldButton');
        const newWorldDialog = document.getElementById('newWorldDialog');
        const newWorldForm = document.getElementById('newWorldForm');
        const newWorldNameInput = document.getElementById('newWorldNameInput');
        const cancelNewWorldButton = document.getElementById('cancelNewWorldButton');
        const newPackButton = document.getElementById('newPackButton');
        const newPackDialog = document.getElementById('newPackDialog');
        const newPackForm = document.getElementById('newPackForm');
        const newPackNameInput = document.getElementById('newPackNameInput');
        const cancelNewPackButton = document.getElementById('cancelNewPackButton');
        const packsDirectoryButton = document.getElementById('packsDirectoryButton');
        const importPackButton = document.getElementById('importPackButton');
        const importPackFileInput = document.getElementById('importPackFileInput');
        const importStageButton = document.getElementById('importStageButton');
        const saveStageToPackButton = document.getElementById('saveStageToPackButton');
        const exportPackButton = document.getElementById('exportPackButton');
        const packConfirmDialog = document.getElementById('packConfirmDialog');
        const packConfirmText = document.getElementById('packConfirmText');
        const renamePackItemDialog = document.getElementById('renamePackItemDialog');
        const renamePackItemForm = document.getElementById('renamePackItemForm');
        const renamePackItemTitle = document.getElementById('renamePackItemTitle');
        const renamePackItemInput = document.getElementById('renamePackItemInput');
        const cancelRenamePackItemButton =
            document.getElementById('cancelRenamePackItemButton');
        const packConfirmAcceptButton =
            document.getElementById('packConfirmAcceptButton');
        if (window.BC90EPackEditorActions?.bindPackEditorDialogs) {
            window.BC90EPackEditorActions.bindPackEditorDialogs({
                confirmDialog: packConfirmDialog,
                confirmText: packConfirmText,
                confirmAcceptButton: packConfirmAcceptButton,
                renameDialog: renamePackItemDialog,
                renameTitle: renamePackItemTitle,
                renameInput: renamePackItemInput,
                renameForm: renamePackItemForm,
                cancelRenameButton: cancelRenamePackItemButton,
                onRenameSubmit: (value) => {
                    const save = renamePackItemSave;
                    renamePackItemSave = null;
                    save?.(value);
                }
            });
        }
        const worldPropertiesDialog = document.getElementById('worldPropertiesDialog');
        const worldPropertiesForm = document.getElementById('worldPropertiesForm');
        const cancelWorldPropertiesButton =
            document.getElementById('cancelWorldPropertiesButton');
        const worldForceLivesInput = document.getElementById('worldForceLivesInput');
        const worldInitialLivesInput = document.getElementById('worldInitialLivesInput');
        const worldAutoAdvanceInput = document.getElementById('worldAutoAdvanceInput');
        const backToPackEditorButton = document.getElementById('backToPackEditorButton');
        const savePackStageButton = document.getElementById('savePackStageButton');
        const menuButton = document.getElementById('menuButton');
        const enableGameAudioButton = document.getElementById('enableGameAudioButton');
        const appStateApi = window.BC90EAppState;
        const packDirectoryApi = window.BC90EPackDirectory;
        const packDocumentApi = window.BC90EPackDocument;
        const playPackLoaderModule = window.BC90EPlayPackLoader;
        if (
            !appStateApi ||
            !packDirectoryApi ||
            !packDocumentApi ||
            !playPackLoaderModule
        ) {
            throw new Error('Pack state, directory, or Play pack loader modules did not load.');
        }
        const {
            PACKS: PACK_STORAGE_KEY,
            PACK_SELECTION: PACK_SELECTION_KEY,
            WORLD_SELECTION: WORLD_SELECTION_KEY
        } = appStateApi.STORAGE_KEYS;
        const {
            storePackDirectoryHandle,
            getStoredPackDirectoryHandle,
            makeDirectoryPackId
        } = packDirectoryApi;
        const { normalizePackDocument, serializePackDocument } = packDocumentApi;
        const playPackLoader = playPackLoaderModule.createPlayPackLoader({
            normalizePackDocument,
            makeDirectoryPackId
        });
        let savedPacks = [];
        let selectedPackId = null;
        let selectedWorldId = null;
        let packsDirectoryHandle = null;
        let lastKnownPacksDirectoryHandle = null;
        let pendingPacksDirectoryPermissionHandle = null;
        let isPacksDirectoryReady = false;
        let packsDirectoryRequestId = 0;
        let packDirectoryFileByPackId = new Map();
        let packDirectorySaveQueue = Promise.resolve();
        let editingPackStage = null;
        let playingPackStage = null;
        let isPackPlayMode = false;
        let editingWorldProperties = null;
        let packWorldAutoAdvanceTimeout = 0;
        let packWorldAutoAdvanceGeneration = 0;
        let packGameOverReturnTimeout = 0;
        let hasUnsavedLevelChanges = false;

        function updatePackDirectoryLocation() {
            const handle = packsDirectoryHandle ??
                pendingPacksDirectoryPermissionHandle ??
                lastKnownPacksDirectoryHandle;
            if (!handle) {
                packDirectoryLocation.textContent =
                    'Packs folder in use: none selected; packs are stored in this browser.';
                packDirectoryLocation.title = packDirectoryLocation.textContent;
                return;
            }

            const prefix = isPacksDirectoryReady
                ? 'Packs folder in use'
                : 'Selected Packs folder (access pending)';
            packDirectoryLocation.textContent =
                `${prefix}: ${handle.name}. The browser does not expose its full path.`;
            packDirectoryLocation.title = packDirectoryLocation.textContent;
        }

        try {
            const storedPacks = JSON.parse(localStorage.getItem(PACK_STORAGE_KEY) ?? '[]');
            savedPacks = appStateApi.normalizeSavedPacks(storedPacks);
            selectedPackId = localStorage.getItem(PACK_SELECTION_KEY);
            selectedWorldId = localStorage.getItem(WORLD_SELECTION_KEY);
        } catch (error) {
            packEditorStatus.textContent = `Could not load saved packs: ${error.message}`;
            packEditorStatus.dataset.error = 'true';
        }

        function persistPacks() {
            try {
                localStorage.setItem(PACK_STORAGE_KEY, JSON.stringify(savedPacks));
                if (selectedPackId) {
                    localStorage.setItem(PACK_SELECTION_KEY, selectedPackId);
                } else {
                    localStorage.removeItem(PACK_SELECTION_KEY);
                }
                if (selectedWorldId) {
                    localStorage.setItem(WORLD_SELECTION_KEY, selectedWorldId);
                } else {
                    localStorage.removeItem(WORLD_SELECTION_KEY);
                }
                if (isPacksDirectoryReady) {
                    const snapshot = JSON.parse(JSON.stringify(savedPacks));
                    packDirectorySaveQueue = packDirectorySaveQueue
                        .then(
                            () => synchronizePacksDirectory(snapshot),
                            () => synchronizePacksDirectory(snapshot)
                        )
                        .then(() => {
                            packEditorStatus.textContent = 'Pack changes saved in the Packs folder.';
                            delete packEditorStatus.dataset.error;
                        })
                        .catch((error) => {
                            packEditorStatus.textContent =
                                `Could not save to the Packs folder: ${error.message}`;
                            packEditorStatus.dataset.error = 'true';
                        });
                } else {
                    packEditorStatus.textContent =
                        'Choose the Packs folder before editing packs.';
                }
                return true;
            } catch (error) {
                packEditorStatus.textContent = `Could not save packs: ${error.message}`;
                packEditorStatus.dataset.error = 'true';
                return false;
            }
        }

        function persistPackSelection() {
            try {
                if (selectedPackId) {
                    localStorage.setItem(PACK_SELECTION_KEY, selectedPackId);
                } else {
                    localStorage.removeItem(PACK_SELECTION_KEY);
                }
                if (selectedWorldId) {
                    localStorage.setItem(WORLD_SELECTION_KEY, selectedWorldId);
                } else {
                    localStorage.removeItem(WORLD_SELECTION_KEY);
                }
                return true;
            } catch (error) {
                packEditorStatus.textContent =
                    `Could not save the selected pack location: ${error.message}`;
                packEditorStatus.dataset.error = 'true';
                return false;
            }
        }

        async function synchronizePacksDirectory(packs) {
            packDirectoryFileByPackId = await packDirectoryApi.synchronizePacksDirectory({
                handle: packsDirectoryHandle,
                packs,
                updateFileMap: packDirectoryFileByPackId
            });
        }

        async function connectPacksDirectory(handle, requestId = packsDirectoryRequestId) {
            let permission;
            try {
                permission = await handle.queryPermission({ mode: 'readwrite' });
            } catch (error) {
                throw new Error(`Could not check folder permissions: ${error.message}`);
            }
            if (permission !== 'granted') {
                pendingPacksDirectoryPermissionHandle = handle;
                lastKnownPacksDirectoryHandle = handle;
                packsDirectoryButton.textContent = 'Grant Folder Access';
                updatePackDirectoryLocation();
                packEditorStatus.textContent =
                    `Folder "${handle.name}" selected. Click "Grant Folder Access" to approve read/write access.`;
                delete packEditorStatus.dataset.error;
                return false;
            }
            if (requestId !== packsDirectoryRequestId) {
                return;
            }
            const legacyPacks = savedPacks;
            const loadedPacks = [];
            const filesById = new Map();
            const invalidFiles = [];
            try {
                for await (const entry of handle.values()) {
                    if (entry.kind !== 'file' ||
                        !entry.name.toLowerCase().endsWith('.bcepack.json')) {
                        continue;
                    }
                    try {
                        const file = await entry.getFile();
                        const imported = JSON.parse(await file.text());
                        const pack = normalizePackDocument(
                            imported,
                            makeDirectoryPackId(entry.name)
                        );
                        if (loadedPacks.some((loaded) => loaded.id === pack.id)) {
                            pack.id = makeDirectoryPackId(`${entry.name}-${loadedPacks.length}`);
                        }
                        loadedPacks.push(pack);
                        filesById.set(pack.id, entry.name);
                    } catch (error) {
                        invalidFiles.push(`${entry.name}: ${error.message}`);
                    }
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error(
                        `The browser interrupted reading "${handle.name}". Reopen the folder and grant access.`
                    );
                }
                throw new Error(`Could not read "${handle.name}": ${error.message}`);
            }
            if (requestId !== packsDirectoryRequestId) {
                return;
            }
            if (loadedPacks.length) {
                savedPacks = loadedPacks;
            } else {
                savedPacks = legacyPacks;
            }
            packsDirectoryHandle = handle;
            packDirectoryFileByPackId = filesById;
            lastKnownPacksDirectoryHandle = handle;
            if (!loadedPacks.length && legacyPacks.length) {
                await synchronizePacksDirectory(savedPacks);
            }
            if (requestId !== packsDirectoryRequestId) {
                return;
            }
            isPacksDirectoryReady = true;
            let rememberedHandle = true;
            try {
                await storePackDirectoryHandle(handle);
            } catch (error) {
                rememberedHandle = false;
                console.error('Could not remember the Packs folder permission.', error);
            }
            if (requestId !== packsDirectoryRequestId) {
                return;
            }
            if (!savedPacks.some((pack) => pack.id === selectedPackId)) {
                selectedPackId = null;
                selectedWorldId = null;
            } else if (!getSelectedWorld()) {
                selectedWorldId = null;
            }
            packsDirectoryButton.textContent = 'Change Packs Folder';
            packEditorStatus.textContent = [
                `Connected to "${handle.name}" (${savedPacks.length} packs).`,
                !rememberedHandle ? 'Folder access will need to be selected again next time.' : '',
                invalidFiles.length
                    ? `Skipped invalid file(s): ${invalidFiles.join('; ')}`
                    : ''
            ].filter(Boolean).join(' ');
            if (invalidFiles.length) {
                packEditorStatus.dataset.error = 'true';
            } else {
                delete packEditorStatus.dataset.error;
            }
            renderPackEditor();
            pendingPacksDirectoryPermissionHandle = null;
            return true;
        }

        async function restorePacksDirectory() {
            const requestId = packsDirectoryRequestId;
            try {
                const handle = await getStoredPackDirectoryHandle();
                if (requestId !== packsDirectoryRequestId) {
                    return;
                }
                if (!handle) {
                    renderPackEditor();
                    return;
                }
                packsDirectoryHandle = handle;
                lastKnownPacksDirectoryHandle = handle;
                const permission = await handle.queryPermission({ mode: 'readwrite' });
                if (requestId !== packsDirectoryRequestId) {
                    return;
                }
                if (permission !== 'granted') {
                    pendingPacksDirectoryPermissionHandle = handle;
                    packsDirectoryButton.textContent = 'Grant Folder Access';
                    updatePackDirectoryLocation();
                    packEditorStatus.textContent =
                        `Access to "${handle.name}" needs approval. Click "Grant Folder Access".`;
                    renderPackEditor();
                    return;
                }
                await connectPacksDirectory(handle, requestId);
            } catch (error) {
                if (requestId !== packsDirectoryRequestId) {
                    return;
                }
                packEditorStatus.textContent =
                    `Could not access the Packs folder: ${error.message}`;
                packEditorStatus.dataset.error = 'true';
                renderPackEditor();
            }
        }

        function getSelectedPack() {
            return savedPacks.find((pack) => pack.id === selectedPackId) ?? null;
        }

        function getSelectedWorld(pack = getSelectedPack()) {
            return pack?.worlds.find((world) => world.id === selectedWorldId) ?? null;
        }

        function requestPackConfirmation(message) {
            const packActionApi = window.BC90EPackEditorActions;
            if (packActionApi?.requestPackConfirmation) {
                return packActionApi.requestPackConfirmation(
                    packConfirmDialog,
                    packConfirmText,
                    document.getElementById('packConfirmAcceptButton'),
                    message
                );
            }

            packConfirmText.textContent = message;
            packConfirmDialog.showModal();
            return new Promise((resolve) => {
                packConfirmDialog.addEventListener(
                    'close',
                    () => resolve(packConfirmDialog.returnValue === 'confirm'),
                    { once: true }
                );
            });
        }

        function askPackItemName(title, value, onSave) {
            const packActionApi = window.BC90EPackEditorActions;
            if (packActionApi?.askPackItemName) {
                return packActionApi.askPackItemName(
                    renamePackItemDialog,
                    renamePackItemTitle,
                    renamePackItemInput,
                    document.getElementById('renamePackItemForm'),
                    title,
                    value,
                    onSave
                );
            }

            renamePackItemTitle.textContent = title;
            renamePackItemInput.value = value;
            renamePackItemSave = onSave;
            renamePackItemDialog.showModal();
            renamePackItemInput.focus();
            renamePackItemInput.select();
        }

        let renamePackItemSave = null;
        const packStageReorderingApi = window.BC90EPackStageReordering;
        if (!packStageReorderingApi) {
            throw new Error('The pack stage reordering module did not load.');
        }
        const packStageReordering = packStageReorderingApi.createPackStageReordering({
            grid: packEditorGrid,
            screen: packEditorScreen,
            isPlayMode: () => isPackPlayMode,
            getSelectedWorld,
            persistPacks,
            renderPackEditor: () => renderPackEditor()
        });
        const initializeStageCardReordering = packStageReordering.initialize;

        function playPackStage(pack, world, stage) {
            levelCode.value = stage.code;
            if (!importLevel()) {
                return;
            }
            if (!findTileCenter(PLAYER_INITIAL_SPAWN_ID)) {
                showMessage('The map needs a Player Initial Spawn before playing.');
                return;
            }
            hasUnsavedLevelChanges = false;
            pendingPackLaunch = { pack, world, stage };
            const allSoundsLoaded =
                soundBuffers.size === Object.keys(soundFiles).length &&
                failedSoundLoads.size === 0;
            if (allSoundsLoaded && gameAudioContext.state === 'running') {
                void startPreparedLevel();
            } else {
                showAudioLoadingScreen();
            }
        }

        function beginPendingPackLaunch() {
            if (!pendingPackLaunch) {
                return null;
            }
            const { pack, world, stage } = pendingPackLaunch;
            applyWorldProperties(world);
            playingPackStage = { packId: pack.id, worldId: world.id, stageId: stage.id };
            pendingPackLaunch = null;
            packEditorScreen.hidden = true;
            document.body.classList.remove('pack-editor-open', 'pack-play-mode');
            startMenu.hidden = true;
            backToPackEditorButton.hidden = true;
            savePackStageButton.hidden = true;
            moveCanvasIntoGameScreen();
            return stage.name || levelName.value.trim() || 'Stage';
        }

        const levelIntroModule = window.BC90ELevelIntro;
        if (!levelIntroModule) {
            throw new Error('The level intro module did not load.');
        }
        levelIntro = levelIntroModule.createLevelIntro({
            curtain: levelIntroCurtain,
            title: levelIntroTitle,
            transitionBlack: levelTransitionBlack,
            setGamePaused: (isPaused) => {
                isGamePaused = isPaused;
            },
            clearPressedKeys: () => pressedKeys.clear(),
            clearTouchDirections: () => activeTouchDirections.clear(),
            clearRequestedDirection: () => {
                requestedDirection = null;
            },
            clearPlayerSliding,
            updateTouchControlsVisibility,
            setGameSoundsMuted,
            playSoundEffect,
            releaseInitialSpawns
        });
        const playLevelIntro = levelIntro.play;

        async function startPreparedLevel(startMuted = false) {
            const stageName = beginPendingPackLaunch();
            if (stageName) {
                startSimulation(startMuted, { deferSpawns: true });
                isGamePaused = true;
                if (!await playLevelIntro(stageName, startMuted)) {
                    return;
                }
                updateTouchControlsVisibility();
                return;
            }
            startSimulation(startMuted);
        }

        function makeStageThumbnail() {
            const thumbnailCanvas = document.createElement('canvas');
            thumbnailCanvas.width = 128;
            thumbnailCanvas.height = 128;
            const thumbnailContext = thumbnailCanvas.getContext('2d');
            if (!thumbnailContext) {
                throw new Error('Could not create the stage thumbnail.');
            }
            thumbnailContext.fillStyle = '#11161d';
            thumbnailContext.fillRect(0, 0, 128, 128);
            const scale = Math.min(128 / canvas.width, 128 / canvas.height);
            const width = canvas.width * scale;
            const height = canvas.height * scale;
            thumbnailContext.imageSmoothingEnabled = false;
            thumbnailContext.drawImage(
                canvas,
                (128 - width) / 2,
                (128 - height) / 2,
                width,
                height
            );
            return thumbnailCanvas.toDataURL('image/png');
        }

        async function makeStageThumbnailFromCode(code) {
            const currentLevelCode = compileLevelData(levelName.value, false);
            if (currentLevelCode === null) {
                throw new Error('Could not preserve the current level before importing.');
            }
            const wasDirty = hasUnsavedLevelChanges;

            try {
                levelCode.value = code;
                if (!importLevel()) {
                    throw new Error('The clipboard level could not be rendered.');
                }
                await new Promise((resolve) => window.requestAnimationFrame(resolve));
                return makeStageThumbnail();
            } finally {
                levelCode.value = currentLevelCode;
                if (!importLevel()) {
                    hasUnsavedLevelChanges = wasDirty;
                    throw new Error('Could not restore the level after creating its thumbnail.');
                }
                hasUnsavedLevelChanges = wasDirty;
            }
        }

        const levelCode = document.getElementById('levelCode');
        const levelName = document.getElementById('levelName');
        const packStageEditor = window.BC90EPackStageEditor?.createPackStageEditorApi({
            appShell,
            startMenu,
            packEditorScreen,
            menuButton,
            backToPackEditorButton,
            savePackStageButton,
            levelCode,
            importLevel,
            applyWorldProperties,
            renderPackEditor,
            makeStageThumbnail,
            persistPacks,
            savedPacks,
            showMessage,
            packEditorStatus,
            requestPackConfirmation,
            compileLevelData,
            hasUnsavedLevelChanges,
            setHasUnsavedLevelChanges: (value) => {
                hasUnsavedLevelChanges = value;
            },
            levelName,
            resizeCanvas,
            editingPackStage,
            clearPackWorldAutoAdvance: () => {
                window.clearTimeout(packWorldAutoAdvanceTimeout);
                packWorldAutoAdvanceTimeout = 0;
            }
        });

        function editPackStage(pack, world, stage) {
            if (packStageEditor?.editPackStage) {
                editingPackStage = { packId: pack.id, worldId: world.id, stageId: stage.id };
                return packStageEditor.editPackStage(pack, world, stage);
            }
            levelCode.value = stage.code;
            if (!importLevel()) {
                return;
            }
            hasUnsavedLevelChanges = false;
            applyWorldProperties(world);
            editingPackStage = { packId: pack.id, worldId: world.id, stageId: stage.id };
            packEditorScreen.hidden = true;
            document.body.classList.remove('pack-editor-open');
            appShell.hidden = false;
            startMenu.hidden = true;
            menuButton.hidden = true;
            backToPackEditorButton.hidden = false;
            savePackStageButton.hidden = false;
            window.requestAnimationFrame(resizeCanvas);
        }

        function applyWorldProperties(world) {
            const properties = world.properties ?? {};
            if (typeof properties.initialLives === 'number') {
                setConfiguredInitialLives(properties.initialLives);
            }
            if (typeof properties.forceInitialLives === 'boolean') {
                isForceInitialLivesEnabled = properties.forceInitialLives;
                forceInitialLivesToggleButton.textContent =
                    `Force Initial Lives: ${isForceInitialLivesEnabled ? 'ON' : 'OFF'}`;
                forceInitialLivesToggleButton.setAttribute(
                    'aria-pressed',
                    String(isForceInitialLivesEnabled)
                );
                setToggleButtonState(forceInitialLivesToggleButton, isForceInitialLivesEnabled);
            }
        }

        function openWorldProperties(world) {
            const appDialogs = window.BC90EPackEditorDialogs;
            if (appDialogs?.bindPackEditorDialogs) {
                const dialogApi = appDialogs.bindPackEditorDialogs({
                    worldPropertiesDialog,
                    worldPropertiesForm,
                    worldForceLivesInput,
                    worldInitialLivesInput,
                    worldAutoAdvanceInput,
                    cancelWorldPropertiesButton,
                    onWorldPropertiesOpen: (nextWorld) => {
                        editingWorldProperties = nextWorld;
                    },
                    onSaveWorldProperties: ({ forceInitialLives, initialLives, autoAdvance }) => {
                        if (!editingWorldProperties) {
                            return;
                        }
                        editingWorldProperties.properties = {
                            forceInitialLives,
                            initialLives,
                            autoAdvance
                        };
                        persistPacks();
                        editingWorldProperties = null;
                        worldPropertiesDialog.close();
                        renderPackEditor();
                    }
                });
                dialogApi.openWorldProperties(world);
                return;
            }

            editingWorldProperties = world;
            const properties = world.properties ?? {};
            worldForceLivesInput.checked = Boolean(properties.forceInitialLives);
            worldInitialLivesInput.value = String(properties.initialLives ?? 3);
            worldAutoAdvanceInput.checked = Boolean(properties.autoAdvance);
            worldPropertiesDialog.showModal();
        }

        function finishPackStageEdit() {
            if (packStageEditor?.finishPackStageEdit) {
                return packStageEditor.finishPackStageEdit();
            }
            window.clearTimeout(packWorldAutoAdvanceTimeout);
            packWorldAutoAdvanceTimeout = 0;
            hasUnsavedLevelChanges = false;
            editingPackStage = null;
            backToPackEditorButton.hidden = true;
            savePackStageButton.hidden = true;
            menuButton.hidden = false;
            packEditorScreen.hidden = false;
            appShell.hidden = true;
            document.body.classList.add('pack-editor-open');
            startMenu.hidden = true;
            renderPackEditor();
        }

        const packEditorRenderer = window.BC90EPackEditorRenderer.createPackEditorRenderer({
            elements: {
                packEditorTitle,
                packEditorDescription,
                packEditorBreadcrumb,
                packEditorGrid,
                newPackButton,
                importPackButton,
                packsDirectoryButton,
                newWorldButton,
                importStageButton,
                saveStageToPackButton,
                exportPackButton,
                backToWorldsButton
            },
            updatePackDirectoryLocation,
            getSelectedPack,
            getSelectedWorld,
            getSavedPacks: () => savedPacks,
            getIsPackPlayMode: () => isPackPlayMode,
            getIsPacksDirectoryReady: () => isPacksDirectoryReady,
            setSelectedPackId: (value) => {
                selectedPackId = value;
            },
            setSelectedWorldId: (value) => {
                selectedWorldId = value;
            },
            persistPackSelection,
            requestPackConfirmation,
            askPackItemName,
            persistPacks,
            openWorldProperties,
            playPackStage,
            editPackStage,
            initializeStageCardReordering
        });

        function renderPackEditor() {
            packEditorRenderer.render();
        }
        packsDirectoryButton.addEventListener('click', async () => {
            const requestId = ++packsDirectoryRequestId;
            if (pendingPacksDirectoryPermissionHandle) {
                const handle = pendingPacksDirectoryPermissionHandle;
                packsDirectoryButton.disabled = true;
                packEditorStatus.textContent = `Requesting access to "${handle.name}"…`;
                try {
                    const permission = await handle.requestPermission({
                        mode: 'readwrite'
                    });
                    if (requestId !== packsDirectoryRequestId) {
                        return;
                    }
                    if (permission !== 'granted') {
                        pendingPacksDirectoryPermissionHandle = null;
                        packsDirectoryButton.textContent = 'Choose Packs Folder';
                        packEditorStatus.textContent =
                            `Access to "${handle.name}" was not granted. Choose the folder again and approve read/write access.`;
                        packEditorStatus.dataset.error = 'true';
                        return;
                    }
                    await connectPacksDirectory(handle, requestId);
                } catch (error) {
                    if (requestId === packsDirectoryRequestId) {
                        pendingPacksDirectoryPermissionHandle = null;
                        packsDirectoryButton.textContent = 'Choose Packs Folder';
                        packEditorStatus.textContent = error.name === 'AbortError'
                            ? `Access request for "${handle.name}" was cancelled. Select the folder again and approve read/write access.`
                            : `Could not grant access to "${handle.name}": ${error.message}`;
                        packEditorStatus.dataset.error = 'true';
                    }
                } finally {
                    packsDirectoryButton.disabled = false;
                }
                return;
            }
            if (typeof window.showDirectoryPicker !== 'function') {
                packEditorStatus.textContent =
                    'This browser does not support folder access. Open the game in a recent Chromium-based browser.';
                packEditorStatus.dataset.error = 'true';
                return;
            }
            packsDirectoryButton.disabled = true;
            packEditorStatus.textContent = 'Opening the Packs folder…';
            delete packEditorStatus.dataset.error;
            let handle;
            try {
                const pickerOptions = {
                    id: 'bc90e-packs',
                    mode: 'readwrite'
                };
                handle = await window.showDirectoryPicker(pickerOptions);
            } catch (error) {
                if (error.name === 'AbortError') {
                    const isVsCodeEmbeddedBrowser =
                        /\bCode\/[\d.]+/.test(navigator.userAgent) &&
                        /\bElectron\//.test(navigator.userAgent);
                    packEditorStatus.textContent = isVsCodeEmbeddedBrowser
                        ? 'VS Code Browser Pages cancelled the folder request. Open the game in Chrome or Edge via Go Live (localhost), then choose the Packs folder there. This is a browser limitation, not a missed click.'
                        : 'The browser closed the folder picker without returning the selected folder. Try opening the game from a localhost server in Chrome or Edge. You can also use Import Pack File and Export Pack as a manual fallback.';
                } else {
                    packEditorStatus.textContent =
                        `The browser could not open the folder picker (${error.name}): ${error.message}`;
                }
                packEditorStatus.dataset.error = 'true';
                packsDirectoryButton.disabled = false;
                return;
            }
            try {
                packEditorStatus.textContent = `Connecting to "${handle.name}"…`;
                await connectPacksDirectory(handle, requestId);
            } catch (error) {
                if (requestId === packsDirectoryRequestId) {
                    packEditorStatus.textContent =
                        `Folder "${handle.name}" was selected, but could not be connected: ${error.message}`;
                    packEditorStatus.dataset.error = 'true';
                }
            } finally {
                packsDirectoryButton.disabled = false;
            }
        });
        newPackButton.addEventListener('click', () => {
            if (!isPacksDirectoryReady) {
                return;
            }
            newPackForm.reset();
            if (window.BC90EPackEditorDialogs?.bindPackEditorDialogs) {
                window.BC90EPackEditorDialogs.bindPackEditorDialogs({
                    newPackDialog,
                    newPackForm,
                    newPackNameInput,
                    cancelNewPackButton,
                    onCreatePack: (name) => {
                        const pack = {
                            id: `pack-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            name,
                            worlds: []
                        };
                        savedPacks.push(pack);
                        selectedPackId = pack.id;
                        selectedWorldId = null;
                        persistPacks();
                        renderPackEditor();
                        newPackDialog.close();
                    }
                });
                newPackNameInput.focus();
                newPackDialog.showModal();
                return;
            }
            newPackDialog.showModal();
            newPackNameInput.focus();
        });
        cancelNewPackButton.addEventListener('click', () => newPackDialog.close());
        importPackButton.addEventListener('click', () => importPackFileInput.click());
        importPackFileInput.addEventListener('change', async () => {
            const [file] = importPackFileInput.files ?? [];
            importPackFileInput.value = '';
            if (!file) {
                return;
            }
            try {
                const imported = JSON.parse(await file.text());
                const pack = normalizePackDocument(
                    imported,
                    `pack-${Date.now()}-${Math.random().toString(36).slice(2)}`
                );
                pack.id = `pack-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                savedPacks.push(pack);
                selectedPackId = pack.id;
                selectedWorldId = null;
                persistPacks();
                renderPackEditor();
            } catch (error) {
                packEditorStatus.textContent = `Could not open pack: ${error.message}`;
                packEditorStatus.dataset.error = 'true';
            }
        });
        saveStageToPackButton.addEventListener('click', () => {
            const pack = getSelectedPack();
            const world = getSelectedWorld(pack);
            if (!pack || !world) {
                return;
            }
            const code = compileLevelData(levelName.value, false);
            if (code === null) {
                return;
            }
            world.stages.push({
                id: `stage-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: levelName.value.trim() || `Stage ${world.stages.length + 1}`,
                code,
                thumbnail: makeStageThumbnail()
            });
            persistPacks();
            renderPackEditor();
        });
        newWorldButton.addEventListener('click', () => {
            newWorldForm.reset();
            if (window.BC90EPackEditorDialogs?.bindPackEditorDialogs) {
                window.BC90EPackEditorDialogs.bindPackEditorDialogs({
                    newWorldDialog,
                    newWorldForm,
                    newWorldNameInput,
                    cancelNewWorldButton,
                    onCreateWorld: (name) => {
                        const pack = getSelectedPack();
                        if (!pack) {
                            return;
                        }
                        pack.worlds.push({
                            id: `world-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            name,
                            stages: [],
                            properties: {
                                forceInitialLives: false,
                                initialLives: 3,
                                maxActiveEnemies: 4,
                                gameOverMode: '1',
                                autoAdvance: false
                            }
                        });
                        persistPacks();
                        renderPackEditor();
                        newWorldDialog.close();
                    }
                });
                newWorldNameInput.focus();
                newWorldDialog.showModal();
                return;
            }
            newWorldDialog.showModal();
            newWorldNameInput.focus();
        });
        cancelNewWorldButton.addEventListener('click', () => newWorldDialog.close());
        backToWorldsButton.addEventListener('click', () => {
            selectedWorldId = null;
            persistPackSelection();
            renderPackEditor();
        });
        importStageButton.addEventListener('click', async () => {
            try {
                if (!navigator.clipboard?.readText) {
                    throw new Error('Clipboard access is not available. Copy a BC90E level code and try again.');
                }
                const code = (await navigator.clipboard.readText()).trim();
                const sections = code.split('|');
                if (!code.startsWith('BC90E|') || sections.length < 5 || sections.length > 9) {
                    throw new Error('The clipboard does not contain a valid BC90E level code.');
                }
                const pack = getSelectedPack();
                const world = getSelectedWorld(pack);
                if (!pack || !world) {
                    return;
                }
                const name = sections[2] || `Stage ${world.stages.length + 1}`;
                const thumbnail = await makeStageThumbnailFromCode(code);
                world.stages.push({
                    id: `stage-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    name,
                    code,
                    thumbnail
                });
                persistPacks();
                renderPackEditor();
            } catch (error) {
                packEditorStatus.textContent = `Could not import level: ${error.message}`;
                packEditorStatus.dataset.error = 'true';
            }
        });
        exportPackButton.addEventListener('click', async () => {
            const pack = getSelectedPack();
            if (!pack) {
                return;
            }
            const fileName =
                `${pack.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')}.bcepack.json`;
            const contents = JSON.stringify(serializePackDocument(pack), null, 2);
            try {
                if (typeof window.showSaveFilePicker === 'function') {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'Battle City Expanded pack',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                    const writable = await fileHandle.createWritable();
                    await writable.write(contents);
                    await writable.close();
                    packEditorStatus.textContent = 'Pack exported successfully.';
                    delete packEditorStatus.dataset.error;
                    return;
                }
                const url = URL.createObjectURL(new Blob([contents], {
                    type: 'application/json'
                }));
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    packEditorStatus.textContent = `Could not export pack: ${error.message}`;
                    packEditorStatus.dataset.error = 'true';
                }
            }
        });
        renderPackEditor();

        const openPackEditorButton = document.getElementById('openPackEditorButton');
        const returnFromPackEditorButton =
            document.getElementById('returnFromPackEditorButton');
        const openEditorButton = document.getElementById('openEditorButton');
        const openMenuSettingsButton =
            document.getElementById('openMenuSettingsButton');
        const playFromMenuButton = document.getElementById('playFromMenuButton');
        if (isPlayOnlyMode) {
            document.querySelectorAll('.start-menu-editor-button').forEach((button) => {
                button.hidden = true;
                button.removeAttribute('autofocus');
            });
        }
        openEditorButton.addEventListener('click', () => {
            appShell.hidden = false;
            startMenu.hidden = true;
            window.requestAnimationFrame(resizeCanvas);
        });
        openPackEditorButton.addEventListener('click', () => {
            isPackPlayMode = false;
            playingPackStage = null;
            playerRank9Burst = null;
            enemyRank9Bursts.clear();
            document.body.classList.remove('pack-play-mode');
            startMenu.hidden = true;
            packEditorScreen.hidden = false;
            document.body.classList.add('pack-editor-open');
            selectedPackId = null;
            selectedWorldId = null;
            if (isPlayOnlyMode) {
                void loadPlayPacksFromFolder();
            } else {
                renderPackEditor();
                void restorePacksDirectory();
            }
        });
        openMenuSettingsButton.addEventListener('click', () => {
            settingsDialog.classList.add('menu-settings');
            settingsDialog.showModal();
            window.requestAnimationFrame(applyTouchControlSettings);
        });
        async function loadPlayPacksFromFolder() {
            isPacksDirectoryReady = true;
            savedPacks = [];
            packEditorStatus.textContent = 'Loading packs from the packs folder...';
            delete packEditorStatus.dataset.error;
            renderPackEditor();
            try {
                savedPacks = await playPackLoader.load();
                packEditorStatus.textContent =
                    `Loaded ${savedPacks.length} pack(s) from the packs folder.`;
                delete packEditorStatus.dataset.error;
            } catch (error) {
                console.error('Could not load packs for Play mode.', error);
                packEditorStatus.textContent = error.message;
                packEditorStatus.dataset.error = 'true';
            }
            renderPackEditor();
        }

        playFromMenuButton.addEventListener('click', () => {
            isPackPlayMode = true;
            playingPackStage = null;
            document.body.classList.add('pack-play-mode');
            startMenu.hidden = true;
            packEditorScreen.hidden = false;
            document.body.classList.add('pack-editor-open');
            selectedPackId = null;
            selectedWorldId = null;
            renderPackEditor();
            void restorePacksDirectory();
        });
        function handlePackEditorReturn() {
            packEditorScreen.hidden = true;
            document.body.classList.remove('pack-editor-open');
            document.body.classList.remove('pack-play-mode');
            isPackPlayMode = false;
            startMenu.hidden = false;
        }

        async function handleGameplayReturn() {
            if (!await showMessageConfirmation(
                'Return to the main menu? The current game will stop.'
            )) {
                return;
            }
            if (isSimulationActive) {
                stopSimulation();
            }
            restoreCanvasToEditor();
            playingPackStage = null;
            isPackPlayMode = false;
            document.body.classList.remove('pack-play-mode', 'pack-editor-open');
            packEditorScreen.hidden = true;
            appShell.hidden = true;
            startMenu.hidden = false;
        }

        backToPackEditorButton.addEventListener('click', async () => {
            if (!await requestPackConfirmation(
                'Return to Pack Editor and discard your unsaved stage changes?'
            )) {
                return;
            }
            finishPackStageEdit();
        });
        savePackStageButton.addEventListener('click', async () => {
            if (packStageEditor?.saveCurrentPackStage) {
                await packStageEditor.saveCurrentPackStage();
                return;
            }
            if (!editingPackStage || !await requestPackConfirmation(
                'Save these changes to this stage and return to Pack Editor?'
            )) {
                return;
            }
            const pack = savedPacks.find((entry) => entry.id === editingPackStage.packId);
            const world = pack?.worlds.find((entry) => entry.id === editingPackStage.worldId);
            const stage = world?.stages.find((entry) => entry.id === editingPackStage.stageId);
            if (!stage) {
                showMessage('The edited stage no longer exists in this pack.');
                return;
            }
            const code = compileLevelData(levelName.value, false);
            if (code === null) {
                return;
            }
            try {
                stage.name = levelName.value.trim() || stage.name;
                stage.code = code;
                stage.thumbnail = makeStageThumbnail();
                if (!persistPacks()) {
                    return;
                }
                finishPackStageEdit();
            } catch (error) {
                packEditorStatus.textContent = `Could not save the stage thumbnail: ${error.message}`;
                packEditorStatus.dataset.error = 'true';
                packEditorScreen.hidden = false;
                document.body.classList.add('pack-editor-open');
            }
        });

        const TEXTURE_DIRECTORY = 'assets/textures/';
        const MAP_TEXTURE_DIRECTORY = `${TEXTURE_DIRECTORY}map/`;
        const UI_TEXTURE_DIRECTORY = `${TEXTURE_DIRECTORY}ui/`;
        const canvas = document.getElementById('gameCanvas');
        const context = canvas.getContext('2d');
        const mapViewport = document.getElementById('mapViewport');
        const editorInactivePauseMessage = document.getElementById(
            'editorInactivePauseMessage'
        );
        const canvasPanel = mapViewport.parentElement;
        const editorLayout = document.querySelector('.editor-layout');
        const mapZoomControls = document.getElementById('mapZoomControls');
        const playerLivesPanel = document.getElementById('playerLivesPanel');
        const canvasPanelPlaceholder = document.createComment('Editor canvas panel position');
        editorLayout.insertBefore(canvasPanelPlaceholder, canvasPanel);
        const mapEdgeIndicators = new Map(
            Array.from(mapViewport.querySelectorAll('[data-map-edge]')).map((indicator) => [
                indicator.dataset.mapEdge,
                indicator
            ])
        );
        function moveCanvasIntoGameScreen() {
            gamePlayCanvasHost.append(canvasPanel);
            gamePlayHud.insertBefore(playerLivesPanel, gamePlayReturnButton);
            mapViewport.append(gameOverMessage);
            gameOverMessage.classList.remove('game-over-intro');
            gamePlayScreen.hidden = false;
            document.body.classList.add('pack-game-active');
            window.requestAnimationFrame(resizeCanvas);
        }

        function restoreCanvasToEditor() {
            levelIntro.cancel();
            areInitialSpawnsDeferred = false;
            levelTransitionBlack.hidden = true;
            levelScoreScreen.hidden = true;
            stopLevelScoreAnimation();
            levelIntroCurtain.hidden = true;
            levelIntroCurtain.classList.remove('opening', 'title-hidden');
            if (canvasPanelPlaceholder.parentNode) {
                canvasPanelPlaceholder.parentNode.insertBefore(
                    canvasPanel,
                    canvasPanelPlaceholder.nextSibling
                );
            }
            canvasPanel.insertBefore(playerLivesPanel, mapViewport);
            canvasPanel.insertBefore(gameOverMessage, simulationButton);
            gameOverMessage.classList.remove('game-over-intro');
            gamePlayScreen.hidden = true;
            document.body.classList.remove('pack-game-active');
            window.requestAnimationFrame(resizeCanvas);
        }

        const zoomInButton = document.getElementById('zoomInButton');
        const zoomOutButton = document.getElementById('zoomOutButton');
        const zoomFitButton = document.getElementById('zoomFitButton');
        const panModeButton = document.getElementById('panModeButton');
        const mapZoomInput = document.getElementById('mapZoomInput');
        const mapZoomInputVisibleInput =
            document.getElementById('mapZoomInputVisibleInput');
        const mapZoomInputControl = mapZoomInput.closest('.map-zoom-input');
        context.imageSmoothingEnabled = false;
        const mobileGameControls = document.getElementById('mobileGameControls');
        const mobileControlsToggleButton = document.getElementById('mobileControlsToggleButton');
        const touchControlsPreview = document.getElementById('touchControlsPreview');
        const touchControlsConfigurator =
            document.getElementById('touchControlsConfigurator');
        const touchPreviewPad = touchControlsPreview.querySelector('[data-touch-preview="pad"]');
        const touchPreviewFire = document.getElementById('touchControlsPreviewFire');
        const touchPadSizeInput = document.getElementById('touchPadSizeInput');
        const touchFireSizeInput = document.getElementById('touchFireSizeInput');
        const touchPadSizeValue = document.getElementById('touchPadSizeValue');
        const touchFireSizeValue = document.getElementById('touchFireSizeValue');
        const resetTouchControlsButton =
            document.getElementById('resetTouchControlsButton');
        const touchControlsSettingsStatus =
            document.getElementById('touchControlsSettingsStatus');
        const settingsApi = window.BC90ESettings;
        if (!settingsApi) {
            throw new Error('The settings module did not load.');
        }
        const DEFAULT_TOUCH_CONTROLS = settingsApi.DEFAULT_TOUCH_CONTROLS;
        const copyDefaultTouchControls = () => ({
            pad: { ...DEFAULT_TOUCH_CONTROLS.pad },
            fire: { ...DEFAULT_TOUCH_CONTROLS.fire },
            padSize: DEFAULT_TOUCH_CONTROLS.padSize,
            fireSize: DEFAULT_TOUCH_CONTROLS.fireSize
        });
        let touchControlSettings = settingsApi.loadTouchControls();

        function saveTouchControlSettings() {
            if (settingsApi.persistTouchControls(touchControlSettings)) {
                touchControlsSettingsStatus.textContent = 'Saved on this device.';
            } else {
                touchControlsSettingsStatus.textContent =
                    'Could not save settings on this device.';
            }
        }

        const touchControlsUi = window.BC90ETouchControlsUi.createTouchControlsUi({
            mobileGameControls,
            touchControlsPreview,
            touchControlsConfigurator,
            touchPreviewPad,
            touchPreviewFire,
            touchPadSizeInput,
            touchFireSizeInput,
            touchPadSizeValue,
            touchFireSizeValue,
            resetTouchControlsButton,
            touchControlsSettingsStatus,
            getSettings: () => touchControlSettings,
            setSettings: (settings) => {
                touchControlSettings = settings;
            },
            saveSettings: saveTouchControlSettings,
            getDefaultSettings: copyDefaultTouchControls,
            isSimulationActive: () => isSimulationActive,
            areTouchControlsEnabled: () => areTouchControlsEnabled
        });
        function applyTouchControlSettings() {
            touchControlsUi.applySettings();
        }
        function updateTouchControlsVisibility(forceHidden = false) {
            touchControlsUi.updateVisibility(forceHidden);
        }

        const pageScaleEnabledInput = document.getElementById('pageScaleEnabledInput');
        const pageScaleInput = document.getElementById('pageScaleInput');
        const pageScaleValue = document.getElementById('pageScaleValue');
        const enemyOrderSizeInput = document.getElementById('enemyOrderSizeInput');
        const enemyOrderHorizontalScrollbar =
            document.getElementById('enemyOrderHorizontalScrollbar');
        const enemyOrderHorizontalScrollbarTrack =
            document.getElementById('enemyOrderHorizontalScrollbarTrack');
        const supportsTouchControls = navigator.maxTouchPoints > 0 ||
            'ontouchstart' in window;
        const playerLivesCount = document.getElementById('playerLivesCount');
        const enemyLivesGrid = document.getElementById('enemyLivesGrid');
        const gameOverMessage = document.getElementById('gameOverMessage');
        const assetLoadStatus = document.getElementById('assetLoadStatus');
        const assetLoadReport = document.getElementById('assetLoadReport');
        const tileSelector = document.getElementById('tileSelector');
        const routeVariantPalette = document.getElementById('routeVariantPalette');
        const routeVariantButtonById = new Map();
        const canvasModeControls = document.getElementById('canvasModeControls');
        const canvasModeControlsToggleButton =
            document.getElementById('canvasModeControlsToggleButton');
        const mapZoomControlsToggleButton =
            document.getElementById('mapZoomControlsToggleButton');
        const mapZoomButtonSizeInput = document.getElementById('mapZoomButtonSizeInput');
        const canvasToolButtonSizeInput = document.getElementById('canvasToolButtonSizeInput');
        const copyLevelCodeButton = document.getElementById('copyLevelCodeButton');
        const pasteLevelCodeButton = document.getElementById('pasteLevelCodeButton');
        const shareLevelCodeButton = document.getElementById('shareLevelCodeButton');
        const initialLivesInput = document.getElementById('initialLivesInput');
        const forceInitialLivesToggleButton =
            document.getElementById('forceInitialLivesToggleButton');
        let isForceInitialLivesEnabled = false;
        const maxActiveEnemiesInput = document.getElementById('maxActiveEnemiesInput');
        const enemySpawnOrderEditor = document.getElementById('enemySpawnOrderEditor');
        const addEnemySpawnOrderButton = document.getElementById('addEnemySpawnOrderButton');
        const eagleMode = document.getElementById('eagleMode');
        const exportButton = document.getElementById('exportButton');
        const pngExportDialog = document.getElementById('pngExportDialog');
        const pngExportForm = document.getElementById('pngExportForm');
        const pngExportTileSizeInput = document.getElementById('pngExportTileSizeInput');
        const pngExportStatus = document.getElementById('pngExportStatus');
        const pngExportPreview = document.getElementById('pngExportPreview');
        const pngExportCancelButton = document.getElementById('pngExportCancelButton');
        const pngExportShareButton = document.getElementById('pngExportShareButton');
        const pngExportDownloadLink = document.getElementById('pngExportDownloadLink');
        const importButton = document.getElementById('importButton');
        const simulationButton = document.getElementById('simulationButton');
        const simulationButtonUi = window.BC90ESimulationButtonUi;
        if (!simulationButtonUi) {
            throw new Error('The simulation button UI module did not load.');
        }
        const fitSimulationButtonText =
            simulationButtonUi.initializeSimulationButton(simulationButton);
        const gridToggleButton = document.getElementById('gridToggleButton');
        const tileTextureToggle = document.getElementById('tileTextureToggle');
        const tileNameToggle = document.getElementById('tileNameToggle');
        const debugToggleButton = document.getElementById('debugToggleButton');
        const debugSettingsRow = document.getElementById('debugSettingsRow');
        const hitboxToggleButton = document.getElementById('hitboxToggleButton');
        const slowMotionButton = document.getElementById('slowMotionButton');
        const enemyDebugToggleButton = document.getElementById('enemyDebugToggleButton');
        const enemyDebugPanel = document.getElementById('enemyDebugPanel');
        const slowMotionScaleInput = document.getElementById('slowMotionScaleInput');
        const pixelCursorButton = document.getElementById('pixelCursorButton');
        const pixelCursorImage = document.getElementById('pixelCursorImage');
        const pixelCursorSizeInput = document.getElementById('pixelCursorSizeInput');
        const playerTextureRowInput = document.getElementById('playerTextureRowInput');
        const playerTextureTypeInput = document.getElementById('playerTextureTypeInput');
        const gridColorInput = document.getElementById('gridColorInput');
        const roundedUiButton = document.getElementById('roundedUiButton');
        const themeToggleButton = document.getElementById('themeToggleButton');
        const pixelatedUiButton = document.getElementById('pixelatedUiButton');
        const pixelatedUiFontSizeInput = document.getElementById('pixelatedUiFontSizeInput');
        const resetMessagesButton = document.getElementById('resetMessagesButton');
        const reloadAssetsButton = document.getElementById('reloadAssetsButton');
        const deleteAssetsCacheButton =
            document.getElementById('deleteAssetsCacheButton');
        const assetCacheStatus = document.getElementById('assetCacheStatus');
        const recoverAudioButton = document.getElementById('recoverAudioButton');
        const audioRecoveryStatus = document.getElementById('audioRecoveryStatus');
        const settingsButton = document.getElementById('settingsButton');
        const settingsDialog = document.getElementById('settingsDialog');
        const closeSettingsButton = document.getElementById('closeSettingsButton');
        const levelDataPanel = document.getElementById('levelDataPanel');
        const levelDataExpander = levelDataPanel.querySelector('.level-data-expander');
        let levelDataCloseTimer = 0;
        const mapWidthInput = document.getElementById('mapWidthInput');
        const mapHeightInput = document.getElementById('mapHeightInput');
        const resizeMapButton = document.getElementById('resizeMapButton');
        const audioLoadingDialog = document.getElementById('audioLoadingDialog');
        const audioLoadingText = document.getElementById('audioLoadingText');
        const audioAssetReport = document.getElementById('audioAssetReport');
        const startLoadedLevelButton = document.getElementById('startLoadedLevelButton');
        const startMutedLevelButton = document.getElementById('startMutedLevelButton');
        const retryGameAssetsButton = document.getElementById('retryGameAssetsButton');

        const MAP_WIDTH = 26;
        const MAP_HEIGHT = 26;
        const MAX_MAP_DIMENSION = 64;
        const WORLD_TILE_SIZE = 16;
        const FORMAT_PREFIX = levelDataCodec.formatPrefix;
        const BACKGROUND_COLOR = '#000000';
        const MAP_BACKGROUND_COLOR = '#0d1013';
        let gridColor = '#292d33';
        let isGridVisible = false;
        let areTileTexturesVisible = true;
        let areCanvasModeControlsVisible = true;
        let areMapZoomControlsVisible = true;
        let isMapZoomInputVisible = true;
        let areHitboxesVisible = false;
        let isSlowMotionEnabled = false;
        let isDebugEnabled = false;
        let isEnemyDebugEnabled = false;
        let areTouchControlsEnabled = false;
        let playerTextureRow = 0;
        let playerTextureType = 'a';
        let playerTextureLoadVersion = 0;
        let gameTime = 0;
        let baseLayerCache = null;
        let editorStaticLayerCache = null;
        let editorDynamicTileIndexes = new Set();
        let coveredElementCellsCache = null;
        let coveredElementCellsCacheVersion = -1;
        let mapRenderVersion = 0;
        let isTileNamesVisible = false;
        const PLAYER_COLOR = '#39ff68';
        const PLAYER_GUN_COLOR = '#b7ffc7';
        const SUB_TILES_PER_TILE = 4;
        const PLAYER_SIZE_IN_SUB_TILES = 8;
        const MAGNET_STEP_IN_SUB_TILES = 2;
        const OBSTACLE_MAGNET_STEP_IN_SUB_TILES = MAGNET_STEP_IN_SUB_TILES / 4;
        const PLAYER_COLLISION_PADDING = 1;
        const PLAYER_BASE_SPEED_TILES_PER_SECOND = 6;
        // The player speed baseline is the original one; tank-type modifiers are applied on top of it.
        const PLAYER_SPEED_TILES_PER_SECOND = PLAYER_BASE_SPEED_TILES_PER_SECOND * 1.8 * 1.5 * 1.5;
        // Enemy tanks should follow the same logic as the player; they are not a separate special-case system.
        const ENEMY_TANK_TYPE = 4;
        const ENEMY_TANK_TEXTURE_TYPE = 'b';
        const ENEMY_TANK_TEXTURE_ROW = 4;
        const ENEMY_TANK_MIN_MOVE_TILES = 5;
        const ENEMY_TANK_MAX_MOVE_TILES = 20;
        const ENEMY_TANK_STOP_CHANCE = 0.45;
        const ENEMY_TANK_PAUSE_SECONDS = 0.8;
        const ENEMY_PATH_BLOCKED_RETRY_MS = 900;
        const ENEMY_TANK_SUBSTATES = ['Normal', 'Trapped'];
        const ENEMY_TANK_TRAPPED_SHOT_COOLDOWN_MIN_MS = 120;
        const ENEMY_TANK_TRAPPED_SHOT_COOLDOWN_MAX_MS = 220;
        const TILE_PIXEL_SIZE = 8;
        const PLAYER_MUZZLE_OFFSET_RATIO = 0.35;
        const PLAYER_MUZZLE_CENTER_PULL_PIXELS = 1;
        const PLAYER_HITBOX_GRID_SIZE = 16;
        const PLAYER_HITBOX_MASKS = {
            object: [
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111',
                '1111111111111111'
            ],
            enemyBullet: [
                '0000000000000000',
                '0000000000000000',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0011111111111100',
                '0000000000000000',
                '0000000000000000'
            ]
        };
        const BULLET_SPEED_TILES_PER_SECOND = 20 * 1.2;
        const BULLET_SIZE_IN_TILES = 1;
        const EXPLOSION_FRAME_COUNT = 5;
        const EXPLOSION_FRAME_DURATION = 1000 / 15;
        const TNT_BLINK_DURATION_MS = 100;
        const TNT_FADE_DURATION_MS = 200;
        const TNT_CHAIN_DELAY_MS = 150;
        const TNT_BLOCK_FUSE_MS = 100;
        const TNT_BLAST_TILE_SIZE = 8;
        const BULLET_HITBOX_GRID_SIZE = 8;
        const TANK_DEATH_EXPLOSION_SEQUENCE = [0, 1, 2, 3, 4, 3, 2, 1, 0];
        const BULLET_EXPLOSION_SEQUENCE = [0, 1, 2];
        const BULLET_CROSS_EXPLOSION_SEQUENCE = [0, 1];
        const BULLET_HITBOX_MASKS = {
            playerEnemy: [
                '00000000',
                '01111100',
                '01111100',
                '01111100',
                '01111100',
                '01111100',
                '01111100',
                '01111100'
            ],
            enemyPlayer: [
                '00000000',
                '00111000',
                '00111000',
                '00111000',
                '00111000',
                '00111000',
                '00111000',
                '00111000',
            ],
            bulletBullet: [
                '00000000',
                '01111100',
                '01111100',
                '01111100',
                '01111100',
                '01111100',
                '01111100',
                '01111100'
            ],
            object: [
                '00000000',
                '11111111',
                '11111111',
                '11111111',
                '11111111',
                '11111111',
                '11111111',
                '11111111',
            ],
        };
        const BRICK_SUBTILE_GRID_SIZE = 2;
        const BRICK_SUBTILE_COUNT = BRICK_SUBTILE_GRID_SIZE ** 2;
        const REINFORCED_BRICK_HIT_POINTS = 4;
        const REINFORCED_BRICK_EXPLOSION_DAMAGE = 2;
        const COLLISION_EDGE_EPSILON = 0.0001;
        const SHINE_FRAME_COUNT = 20;
        const SHINE_PEAK_FRAME = 9;
        const SHINE_ACTIVE_FRAMES = SHINE_FRAME_COUNT;
        const SHINE_HOLD_FRAMES = 60;
        const SHINE_CYCLE_FRAMES = SHINE_ACTIVE_FRAMES + SHINE_HOLD_FRAMES;
        const BULLET_FIRE_COOLDOWN_SECONDS = 0.15;
        const PLAYER_DEATH_RESPAWN_DELAY_MS = 100;
        let slowMotionTimeScale = 0.3;
        const LARGE_TILE_SIZE = 2;
        const TEXTURE_ANIMATION_FPS = 32;
        const TEXTURE_FRAME_DURATION = 1000 / TEXTURE_ANIMATION_FPS;
        const EDITOR_MAP_RENDER_INTERVAL = TEXTURE_FRAME_DURATION;
        const OTHER_TEXTURE_ANIMATION_FPS = 8;
        const OTHER_TEXTURE_FRAME_DURATION = 1000 / OTHER_TEXTURE_ANIMATION_FPS;
        const TEXTURE_VISIBLE_FRAME_DURATION = OTHER_TEXTURE_FRAME_DURATION;
        const SPAWN_ANIMATION_SPEED_FACTOR = 1.5;
        const SPAWN_ANIMATION_FRAME_DURATION = (
            TEXTURE_VISIBLE_FRAME_DURATION / SPAWN_ANIMATION_SPEED_FACTOR
        );
        const EAGLE_FRAME_DURATION = OTHER_TEXTURE_FRAME_DURATION * OTHER_TEXTURE_ANIMATION_FPS;
        const SLOW_TEXTURE_FIRST_ID = 10;
        const SLOW_TEXTURE_SPEED_FACTOR = 2.5;
        const PLAYER_SPAWN_CLASSIC_LOOP = [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2];
        const PLAYER_SPAWN_SEQUENCE = [0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4];
        const PLAYER_MOVE_FRAME_DURATION = 1000 / 6;
        const POWERUP_PREVIEW_BLINK_DURATION = 400;
        const POWERUP_WORLD_BLINK_DURATION = 400;
        const POWERUP_WORLD_MIN_BLINK_DURATION = 60;
        const POWERUP_WORLD_LIFETIME_MS = 8000;
        const POWERUP_WORLD_SIZE = WORLD_TILE_SIZE * 2;
        const TEXTURE_FRAME_PATTERN = /^(\d+)-(\d{2})\.png$/;

        const EAGLE_ID = 0;
        const PLAYER_INITIAL_SPAWN_ID = 1;
        const PLAYER_RESPAWN_ID = 2;
        const ENEMY_SPAWN_A_ID = 3;
        const ENEMY_SPAWN_B_ID = 4;
        const ENEMY_SPAWN_C_ID = 5;
        const ENEMY_SPAWN_D_ID = 79;
        const ENEMY_SPAWN_E_ID = 80;
        const ENEMY_SPAWN_F_ID = 81;
        const ENEMY_SPAWN_G_ID = 82;
        const ENEMY_SPAWN_H_ID = 83;
        const TNT_BLOCK_ID = 84;
        const ENEMY_SPAWN_IDS = [
            ENEMY_SPAWN_A_ID,
            ENEMY_SPAWN_B_ID,
            ENEMY_SPAWN_C_ID,
            ENEMY_SPAWN_D_ID,
            ENEMY_SPAWN_E_ID,
            ENEMY_SPAWN_F_ID,
            ENEMY_SPAWN_G_ID,
            ENEMY_SPAWN_H_ID
        ];
        const VACIO_SOLIDO_ID = 6;
        const AIR_ID = 7;
        const SOLID_BLOCK_ID = 8;
        const SOLID_BLOCK_2_ID = 9;
        const WATER_ID = 10;
        const LAVA_ID = 11;
        const BUSH_ID = 12;
        const ICE_ID = 13;
        const REINFORCED_STEEL_ID = 14;
        const REINFORCED_BRICKS_ID = 15;
        const DENSE_BUSH_ID = 16;
        const COMPACT_ICE_ID = 17;
        const VERY_DENSE_BUSH_ID = 78;
        const roadTileCatalog = window.BC90ERoadTiles;
        if (!roadTileCatalog) {
            throw new Error('The road tile catalog did not load.');
        }
        const {
            ROAD_STRAIGHT_DASHED_ID,
            ROAD_TILE_DEFINITIONS,
            ROAD_TILE_STATE_BY_ID,
            ROAD_TILE_ID_BY_STATE,
            ROAD_TILE_IDS,
            ROAD_TILE_FOOTPRINTS
        } = roadTileCatalog;
        const ICE_SLIDE_DISTANCE_TILES = 4;
        const ENEMY_ICE_EXIT_REENTRY_MS = 500;
        const BRICK_TILE_IDS = new Set([
            SOLID_BLOCK_2_ID,
            REINFORCED_BRICKS_ID
        ]);
        const REINFORCED_ANIMATION_IDS = new Set([
            REINFORCED_STEEL_ID,
            REINFORCED_BRICKS_ID
        ]);
        const SOLID_TILE_IDS = new Set([
            EAGLE_ID,
            VACIO_SOLIDO_ID,
            SOLID_BLOCK_ID,
            SOLID_BLOCK_2_ID,
            TNT_BLOCK_ID,
            WATER_ID,
            LAVA_ID,
            REINFORCED_STEEL_ID,
            REINFORCED_BRICKS_ID
        ]);
        const TILE_ANIMATION_GROUPS = {
            [PLAYER_INITIAL_SPAWN_ID]: 'player-spawn',
            [PLAYER_RESPAWN_ID]: 'player-spawn',
            [ENEMY_SPAWN_A_ID]: 'enemy-spawn',
            [ENEMY_SPAWN_B_ID]: 'enemy-spawn',
            [ENEMY_SPAWN_C_ID]: 'enemy-spawn'
        };
        const TILE_ANIMATION_FRAME_COUNTS = {
            [EAGLE_ID]: 2,
            [PLAYER_INITIAL_SPAWN_ID]: 5,
            [PLAYER_RESPAWN_ID]: 5,
            [ENEMY_SPAWN_A_ID]: 5,
            [ENEMY_SPAWN_B_ID]: 5,
            [ENEMY_SPAWN_C_ID]: 5,
            [WATER_ID]: 2,
            [LAVA_ID]: 2,
            [BUSH_ID]: 2,
            [ICE_ID]: 2,
            [REINFORCED_STEEL_ID]: 0,
            [REINFORCED_BRICKS_ID]: 0,
            [DENSE_BUSH_ID]: 2,
            [COMPACT_ICE_ID]: 2,
            [VERY_DENSE_BUSH_ID]: 2,
            [TNT_BLOCK_ID]: 2
        };
        const REINFORCED_BRICK_TEXTURE_STATES = 4;
        const REINFORCED_BRICK_PREVIEW_STATE_DURATION = 1000;

        const tileDefinitions = [
            { id: EAGLE_ID, name: 'Eagle / Base' },
            { id: PLAYER_INITIAL_SPAWN_ID, name: 'Player Spawn' },
            { id: ENEMY_SPAWN_A_ID, name: 'Enemy Spawn A' },
            { id: VACIO_SOLIDO_ID, name: 'Solid Void' },
            { id: AIR_ID, name: 'Air / Floor' },
            { id: SOLID_BLOCK_2_ID, name: 'Bricks' },
            { id: TNT_BLOCK_ID, name: 'TNT Block' },
            { id: REINFORCED_BRICKS_ID, name: 'Reinforced Bricks' },
            { id: SOLID_BLOCK_ID, name: 'Steel' },
            { id: REINFORCED_STEEL_ID, name: 'Reinforced Steel' },
            { id: WATER_ID, name: 'Water' },
            { id: LAVA_ID, name: 'Lava' },
            { id: BUSH_ID, name: 'Bush' },
            { id: DENSE_BUSH_ID, name: 'Dense Bush' },
            { id: VERY_DENSE_BUSH_ID, name: 'Very Dense Bush' },
            { id: ICE_ID, name: 'Ice' },
            { id: COMPACT_ICE_ID, name: 'Compact Ice' }
        ];

        const TILE_COLORS = {
            [EAGLE_ID]: '#d9a441',
            [PLAYER_INITIAL_SPAWN_ID]: '#39ff68',
            [PLAYER_RESPAWN_ID]: '#55d9ff',
            ...Object.fromEntries(ENEMY_SPAWN_IDS.map((id) => [id, '#f04444'])),
            [VACIO_SOLIDO_ID]: '#0d1013',
            [AIR_ID]: '#17191c',
            [SOLID_BLOCK_ID]: '#d3d3d3',
            [SOLID_BLOCK_2_ID]: '#a2694f',
            [TNT_BLOCK_ID]: '#c83d26',
            [WATER_ID]: '#2389c9',
            [LAVA_ID]: '#d84828',
            [BUSH_ID]: '#258a38',
            [ICE_ID]: '#bac6c6',
            [REINFORCED_STEEL_ID]: '#65717d',
            [REINFORCED_BRICKS_ID]: '#737a84',
            [DENSE_BUSH_ID]: '#176b2c',
            [COMPACT_ICE_ID]: '#95c4c4',
            [VERY_DENSE_BUSH_ID]: '#0f4f22',
            ...Object.fromEntries(Array.from(ROAD_TILE_IDS, (id) => [id, '#45484b']))
        };

        const SIMULATION_TILE_COLORS = {
            [PLAYER_INITIAL_SPAWN_ID]: '#123a22',
            [PLAYER_RESPAWN_ID]: '#123442',
            ...Object.fromEntries(ENEMY_SPAWN_IDS.map((id) => [id, '#42181b']))
        };

        const EDITOR_TILE_TINTS = {
            [PLAYER_INITIAL_SPAWN_ID]: TILE_COLORS[PLAYER_INITIAL_SPAWN_ID],
            [PLAYER_RESPAWN_ID]: TILE_COLORS[PLAYER_RESPAWN_ID],
            ...Object.fromEntries(ENEMY_SPAWN_IDS.map((id) => [id, TILE_COLORS[id]]))
        };

        const PIXEL_TILE_LABELS = {
            1: 'S1',
            2: 'R1',
            3: 'E1',
            4: 'E2',
            5: 'E3',
            [ENEMY_SPAWN_D_ID]: 'E4',
            [ENEMY_SPAWN_E_ID]: 'E5',
            [ENEMY_SPAWN_F_ID]: 'E6',
            [ENEMY_SPAWN_G_ID]: 'E7',
            [ENEMY_SPAWN_H_ID]: 'E8'
        };
        const TILE_BUTTON_LABELS = {
            [PLAYER_INITIAL_SPAWN_ID]: 'S',
            [PLAYER_RESPAWN_ID]: 'R',
            ...Object.fromEntries(ENEMY_SPAWN_IDS.map((id) => [id, 'E']))
        };
        const TILE_BUTTON_BACKGROUND_COLORS = {
            [PLAYER_INITIAL_SPAWN_ID]: '#2d6b4f',
            [PLAYER_RESPAWN_ID]: '#2d6b4f',
            ...Object.fromEntries(ENEMY_SPAWN_IDS.map((id) => [id, '#7c2c2c']))
        };

        const tileTextures = new Map();
        const animationFrames = new Map();
        const availableAnimationFramesByTile = new Map();
        const shineFrames = [];
        const textureAnimations = new Map();
        const tileSelectorButtons = new Map();
        let routeFamilyPreviewCanvas = null;
        let routeVariantPaletteCategory = 'straight';
        const pixelLabels = window.BC90EPixelLabels.createPixelLabels();
        const playerTextures = new Map();
        const enemyTextures = new Map();
        const enemyTextureLoadingKeys = new Set();
        const explosionTextures = [];
        const shieldTextures = [];
        const powerUpTextures = Array(8);
        const selectionActionTextures = [];
        let selectionActionCheckTexture = null;
        let bulletTexture = null;
        let textureLoadComplete = false;
        let assetReloadVersion = 0;
        let bypassPersistentAssetCache = false;
        let persistentCacheClearPromise = Promise.resolve(true);
        const pendingGameAssetLoads = new Map();
        const failedGameAssetLoads = new Map();
        const textureLoadStates = new Map();
        const failedTextureLoads = new Set();
        const loadedTextureCache = new Map();
        const textureLoadQueue = [];
        const activeTextureLoadCancels = new Set();
        const MAX_CONCURRENT_TEXTURE_LOADS = 16;
        let activeTextureLoadCount = 0;
        let pendingPackLaunch = null;
        let gameAssetPreparationAttempt = 0;

        let mapWidth = MAP_WIDTH;
        let mapHeight = MAP_HEIGHT;
        let isPanModeEnabled = false;
        let canvasControlsLayout = null;
        function syncCanvasModeControlSize() {
            if (canvasControlsLayout) {
                canvasControlsLayout.syncSize();
            }
        }
        const mapCameraApi = window.BC90EMapCamera;
        if (!mapCameraApi) {
            throw new Error('The map camera module did not load.');
        }
        const mapCamera = mapCameraApi.createMapCamera({
            canvas,
            context,
            viewport: mapViewport,
            canvasPanel,
            playerLivesPanel,
            zoomInput: mapZoomInput,
            zoomInButton,
            zoomOutButton,
            edgeIndicators: mapEdgeIndicators,
            supportsTouchControls,
            getCanvasDimensions,
            getMapDimensions: () => ({ width: mapWidth, height: mapHeight }),
            isPanModeEnabled: () => isPanModeEnabled,
            syncCanvasModeControlSize,
            onBackingSizeChanged: () => {
                baseLayerCache = null;
            }
        });
        let mapGrid = createMap(mapWidth, mapHeight, AIR_ID);
        const brickDamage = new Map();
        let simulationMapSnapshot = null;
        let simulationBrickDamageSnapshot = null;
        const mapValidationModule = window.BC90EMapValidation;
        if (!mapValidationModule) {
            throw new Error('The map validation module did not load.');
        }
        const mapValidation = mapValidationModule.createMapValidation({
            restrictedTileIds: [
                EAGLE_ID,
                PLAYER_INITIAL_SPAWN_ID,
                PLAYER_RESPAWN_ID,
                ...ENEMY_SPAWN_IDS
            ],
            airTileId: AIR_ID,
            isMultiCellElement,
            getElementFootprintSize,
            getElementFootprint
        });
        const tileCounters = createTileCounters();
        const TILE_LIMITS = {
            [PLAYER_INITIAL_SPAWN_ID]: 1,
            [PLAYER_RESPAWN_ID]: 1,
            ...Object.fromEntries(ENEMY_SPAWN_IDS.map((id) => [id, 1]))
        };
        let selectedTileId = null;
        let selectedRoadTileId = ROAD_STRAIGHT_DASHED_ID;
        let hasSelectedRoadVariant = false;
        let isEraserMode = false;
        let isSquareMode = false;
        let isFillMode = false;
        let isDrawingSquare = false;
        let isSquareConstraintActive = false;
        let squareDrawStart = null;
        let squareDrawEnd = null;
        let isPainting = false;
        let lastEditedX = null;
        let lastEditedY = null;
        let isMovingElement = false;
        let movingElement = null;
        let movePreview = null;
        let isSelectionMode = false;
        let isSelecting = false;
        let selectionStart = null;
        let selectionDragEnd = null;
        let selectionRegion = null;
        let isMovingSelection = false;
        let movingSelection = null;
        let selectionMovePreview = null;
        let selectionClipboard = null;
        let isPasteMode = false;
        let pastePreview = null;
        let lastMapPointerPosition = null;
        let selectionActionCheckUntil = 0;
        let selectionActionCheckIndex = null;
        let selectionActionFeedbackBounds = null;
        let selectionActionHoverIndex = null;
        let selectionActionUnlockTimer = 0;
        let pendingCut = null;
        let selectionActionOpacity = 1;
        let selectionActionOpacityTarget = 1;
        let selectionActionOpacityStartedAt = 0;
        let isSimulationActive = false;
        let isGamePaused = false;
        let resumeSimulationAfterBackground = false;
        let areInitialSpawnsDeferred = false;
        const pressedKeys = new Set();
        const activeTouchDirections = new Map();
        let touchFirePointerId = null;
        let touchFireIntervalId = null;
        const bullets = [];
        const explosions = [];
        const powerUpsOnMap = [];
        const tntBlockDetonations = new Map();
        let temporarySteelEffect = null;
        const destroyedEagleTiles = new Set();
        const gameAudioContext = audioSystem.ensureAudioContext();
        if (!gameAudioContext) {
            throw new Error('This browser does not support Web Audio.');
        }
        let audioIdleTimeoutId = 0;
        const AUDIO_IDLE_TIMEOUT_MS = 60000;
        const soundFiles = audioSystem.soundFiles;
        let startupAssetProgressPhase = 'textures';
        window.updateAssetProgress = function updateAssetProgress() {
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
            }[startupAssetProgressPhase];
            if (!initialAssetLoading.hidden) {
                initialAssetLoadingLabel.textContent = getLoadingAssetLabel();
                initialAssetLoadingProgress.textContent = startupProgress;
            }
            if (audioLoadingDialog.classList.contains('visible')) {
                audioLoadingText.textContent = (
                    `${getLoadingAssetLabel()}\n${loadedTextures}/${totalTextures} textures · ` +
                    `${soundBuffers.size}/${Object.keys(soundFiles).length} audios · ` +
                    `${loadedFonts}/${GAME_FONT_FAMILIES.length} fonts`
                );
            }
        }

        const soundBuffers = audioSystem.state.soundBuffers;
        const failedSoundLoads = audioSystem.state.failedSoundLoads;
        const GAME_FONT_FAMILIES = ['Press Start 2P', 'Namco Pixel'];
        const assetReadiness = window.BC90EStartupAssets.createAssetReadiness({
            pendingGameAssetLoads,
            failedGameAssetLoads,
            gameFontFamilies: GAME_FONT_FAMILIES,
            updateAssetProgress: () => window.updateAssetProgress()
        });
        const { ensureGameAssetsReady, ensureGameFontsReady } = assetReadiness;
        const activeSoundSources = audioSystem.state.activeSoundSources;
        const pendingSoundEffects = [];
        const PENDING_SOUND_EFFECT_TTL_MS = 2000;
        let soundPreloadCompleted = 0;
        audioSystem.configure({
            getAssetUrl,
            onSoundLoaded: () => {
                soundPreloadCompleted = audioSystem.state.preloadCompleted;
                window.updateAssetProgress();
                if (audioLoadingDialog.classList.contains('visible')) {
                    audioLoadingText.textContent =
                        `Loading and decoding sounds (${soundPreloadCompleted}/${Object.keys(soundFiles).length})...`;
                }
            },
            onSoundFailed: () => {
                window.updateAssetProgress();
            }
        });
        let audioLoadingScreenShown = false;
        const MAX_PLAYER_LIVES = 3;
        const DEFAULT_MAX_ACTIVE_ENEMIES = 4;
        const MAX_ACTIVE_ENEMIES = 20;
        let maxActiveEnemies = DEFAULT_MAX_ACTIVE_ENEMIES;
        let playerLives = MAX_PLAYER_LIVES;
        let defeatedEnemyCount = 0;
        const defeatedEnemiesByRank = Array(11).fill(0);
        const ENEMY_RANK_SCORE_POINTS = [0, 200, 300, 400, 100, 200, 300, 400, 500, 600, 700];
        let enemyFrozenUntil = 0;
        let isGameOver = false;
        let isPlayerDead = false;
        let areGameSoundsMuted = false;
        function setGameSoundsMuted(muted) {
            areGameSoundsMuted = Boolean(muted);
            audioSystem.setMuted(areGameSoundsMuted);
        }
        let activeMovementAudio = null;
        let activeMovementSource = null;
        let movementAudioGeneration = 0;
        let playerVisualStepsPerTile = 8;
        let playerHasRespawned = false;
        const Player = {
            x: 0,
            y: 0,
            physicsX: 0,
            physicsY: 0,
            speed: PLAYER_SPEED_TILES_PER_SECOND,
            direction: 'UP',
            isMoving: false
        };

        function updatePlayerLivesDisplay() {
            playerLivesCount.textContent = String(playerLives).padStart(3, '0');
        }

        const enemyLivesIcons = Array.from({ length: 20 }, () => {
            const icon = document.createElement('img');
            icon.className = 'enemy-lives-icon';
            icon.src = getAssetUrl(`${UI_TEXTURE_DIRECTORY}enemy.png`);
            icon.alt = '';
            icon.hidden = true;
            enemyLivesGrid.append(icon);
            return icon;
        });

        function updateEnemyLivesDisplay() {
            const remainingEnemies = Math.max(0, enemySpawnOrder.length - defeatedEnemyCount);
            const visibleEnemyCount = Math.min(20, remainingEnemies);
            enemyLivesIcons.forEach((icon, index) => {
                icon.hidden = index >= visibleEnemyCount;
            });
            enemyLivesGrid.setAttribute(
                'aria-label',
                `${remainingEnemies} ${remainingEnemies === 1 ? 'enemy' : 'enemies'} remaining`
            );
        }

        function updateZoomButtonLabels() {
            zoomInButton.textContent = isTileNamesVisible ? 'Zoom in' : '+';
            zoomOutButton.textContent = isTileNamesVisible ? 'Zoom out' : '−';
            zoomFitButton.textContent = isTileNamesVisible ? 'Fit map' : 'Fit';
        }

        function getAssetUrl(path) {
            const separator = path.includes('?') ? '&' : '?';
            return `${path}${separator}assetReload=${assetReloadVersion}`;
        }

        function getConfiguredInitialLives() {
            const value = Number.parseInt(initialLivesInput.value, 10);
            return Number.isInteger(value)
                ? Math.min(999, Math.max(0, value))
                : MAX_PLAYER_LIVES;
        }

        function setConfiguredInitialLives(value) {
            const normalizedValue = Math.min(999, Math.max(0, Number(value) || 0));
            initialLivesInput.value = String(normalizedValue);

            if (!isSimulationActive) {
                playerLivesCount.textContent = String(normalizedValue).padStart(3, '0');
            }
        }

        function getConfiguredMaxActiveEnemies() {
            const value = Number.parseInt(maxActiveEnemiesInput.value, 10);
            return Number.isInteger(value)
                ? Math.min(MAX_ACTIVE_ENEMIES, Math.max(1, value))
                : DEFAULT_MAX_ACTIVE_ENEMIES;
        }

        function setConfiguredMaxActiveEnemies(value) {
            maxActiveEnemies = Math.min(
                MAX_ACTIVE_ENEMIES,
                Math.max(1, Number(value) || DEFAULT_MAX_ACTIVE_ENEMIES)
            );
            maxActiveEnemiesInput.value = String(maxActiveEnemies);
        }

        function loadSoundBuffer(name) {
            return audioSystem.loadSoundBuffer(name);
        }

        async function preloadGameSounds() {
            const soundNames = Object.keys(soundFiles);
            const results = await audioSystem.preloadGameSounds({ concurrency: 4 });
            const failedLoads = results
                .map((result, index) => ({ result, name: soundNames[index] }))
                .filter(({ result }) => result.status === 'rejected');
            failedLoads.forEach(({ result, name }) => {
                console.error(`Unable to preload sound "${name}".`, result.reason);
            });
            if (failedLoads.length > 0) {
                scheduleEditorAssetReport(
                    new Error(`${failedLoads.length} audio file(s) failed to load.`)
                );
            } else if (failedGameAssetLoads.size === 0) {
                assetLoadStatus.hidden = true;
                delete assetLoadStatus.dataset.error;
                assetLoadReport.hidden = true;
            }
            return results;
        }

        function assertAllGameSoundsLoaded() {
            audioSystem.assertAllGameSoundsLoaded();
        }

        function queueSoundEffect(effect) {
            const now = performance.now();
            while (pendingSoundEffects.length >= 12) {
                pendingSoundEffects.shift();
            }
            pendingSoundEffects.push({ effect, requestedAt: now });
        }

        function flushPendingSoundEffects() {
            if (areGameSoundsMuted || document.hidden) {
                pendingSoundEffects.length = 0;
                return;
            }
            if (gameAudioContext.state !== 'running') {
                pendingSoundEffects.length = 0;
                return;
            }

            const now = performance.now();
            const queuedCount = pendingSoundEffects.length;
            for (let index = 0; index < queuedCount; index += 1) {
                const queued = pendingSoundEffects.shift();
                if (now - queued.requestedAt > PENDING_SOUND_EFFECT_TTL_MS) {
                    continue;
                }
                const buffer = soundBuffers.get(queued.effect);
                if (!buffer) {
                    pendingSoundEffects.push(queued);
                    continue;
                }
                startSoundEffect(queued.effect);
            }
        }

        function startSoundEffect(effect) {
            if (areGameSoundsMuted || document.hidden) {
                return;
            }
            return audioSystem.playSoundEffect(effect);
        }

        function playSoundEffect(effect) {
            if (areGameSoundsMuted || document.hidden) {
                return;
            }

            if (gameAudioContext.state !== 'running') {
                queueSoundEffect(effect);
                return;
            }

            if (!soundBuffers.has(effect)) {
                queueSoundEffect(effect);
                void loadSoundBuffer(effect).then(() => {
                    flushPendingSoundEffects();
                }).catch((error) => {
                    console.error(`Unable to load sound "${effect}".`, error);
                });
                return;
            }

            return startSoundEffect(effect);
        }

        function startAudioKeepAlive() {
            audioSystem.startAudioKeepAlive();
        }

        function stopAudioKeepAlive() {
            audioSystem.stopAudioKeepAlive();
        }

        function scheduleAudioIdleSuspension() {
            window.clearTimeout(audioIdleTimeoutId);
            audioIdleTimeoutId = window.setTimeout(() => {
                audioIdleTimeoutId = 0;
                if (
                    pressedKeys.size > 0 ||
                    activeTouchDirections.size > 0 ||
                    touchFirePointerId !== null
                ) {
                    scheduleAudioIdleSuspension();
                    return;
                }

                if (isSimulationActive && !document.hidden) {
                    scheduleAudioIdleSuspension();
                    return;
                }

                pendingSoundEffects.length = 0;
                stopMovementAudio();
                stopAllSoundSources();
                stopAudioKeepAlive();
                if (gameAudioContext.state === 'running') {
                    void audioSystem.suspendGameAudio().catch((error) => {
                        console.error('Unable to suspend idle game audio.', error);
                    });
                }
            }, AUDIO_IDLE_TIMEOUT_MS);
        }

        function stopAllSoundSources(sourceToKeep = null) {
            audioSystem.stopAllSoundSources(sourceToKeep);
        }

        function hidePlayerForGameOver() {
            shouldDrawPlayerAfterSpawn = false;
            playerRespawnIntroActive = false;
            playerRespawnPending = false;
            Player.isMoving = false;
        }

        async function warmUpGameAudio() {
            await audioSystem.warmUpGameAudio();
        }

        function setGameOver(soundSourceToKeep = null, reason = 'lives') {
            if (isGameOver) {
                return;
            }

            isGameOver = true;
            isPlayerDead = true;
            if (reason === 'eagle') {
                playerLives = 0;
                updatePlayerLivesDisplay();
            }
            setGameSoundsMuted(true);
            enableGameAudioButton.hidden = false;
            stopMovementAudio();
            stopAllSoundSources(soundSourceToKeep);
            gameOverMessage.classList.add('visible');
            requestedDirection = null;
            clearPlayerSliding();
            explosions.push({
                x: Player.x,
                y: Player.y,
                startedAt: gameTime,
                type: 'tank'
            });
            hidePlayerForGameOver();
            if (document.body.classList.contains('pack-game-active')) {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => {
                        if (isGameOver) {
                            gameOverMessage.classList.add('game-over-intro');
                        }
                    });
                });
            }
            if (isPackPlayMode && playingPackStage) {
                window.clearTimeout(packGameOverReturnTimeout);
                packGameOverReturnTimeout = window.setTimeout(
                    returnToPackWorldsAfterGameOver,
                    2200
                );
            }
        }

        function returnToPackWorldsAfterGameOver() {
            packGameOverReturnTimeout = 0;
            if (!isGameOver || !isPackPlayMode || !playingPackStage) {
                return;
            }

            const packId = playingPackStage.packId;
            window.clearTimeout(packWorldAutoAdvanceTimeout);
            stopSimulation();
            restoreCanvasToEditor();
            selectedPackId = savedPacks.some((pack) => pack.id === packId)
                ? packId
                : null;
            selectedWorldId = null;
            packEditorScreen.hidden = false;
            document.body.classList.add('pack-editor-open', 'pack-play-mode');
            startMenu.hidden = true;
            renderPackEditor();
        }

        function shouldLoseFromEagle() {
            const eagleCount = tileCounters[EAGLE_ID] ?? 0;
            return eagleMode.value === '1' || destroyedEagleTiles.size >= eagleCount;
        }

        function destroyEagleAt(eagleAnchor) {
            const eagleKey = `${eagleAnchor.row},${eagleAnchor.column}`;
            if (destroyedEagleTiles.has(eagleKey)) {
                return false;
            }

            destroyedEagleTiles.add(eagleKey);
            const eagleSound = playSoundEffect('eagleDestroyed');
            if (shouldLoseFromEagle()) {
                setGameOver(eagleSound, 'eagle');
            }

            const tileDimensions = getTileDimensions();
            explosions.push({
                x: (eagleAnchor.column + LARGE_TILE_SIZE / 2) * tileDimensions.width,
                y: (eagleAnchor.row + LARGE_TILE_SIZE / 2) * tileDimensions.height,
                startedAt: gameTime,
                type: 'tank'
            });
            return true;
        }

        function unlockGameAudio() {
            void resumeGameAudio().catch((error) => {
                console.error('Unable to enable game audio.', error);
            });
            void preloadGameSounds();
        }

        function showAudioLoadingScreen() {
            const attempt = ++gameAssetPreparationAttempt;
            const progressInterval = window.setInterval(window.updateAssetProgress, 100);
            audioLoadingScreenShown = true;
            audioLoadingDialog.classList.add('visible');
            audioAssetReport.hidden = true;
            audioLoadingText.classList.remove('has-error');
            startLoadedLevelButton.disabled = true;
            startLoadedLevelButton.hidden = true;
            startLoadedLevelButton.textContent = 'Start Level';
            startMutedLevelButton.hidden = true;
            retryGameAssetsButton.hidden = true;
            audioLoadingTitle.textContent = 'Preparing level';
            window.updateAssetProgress();
            unlockGameAudio();

            void ensureGameAssetsReady().then(() => {
                if (attempt !== gameAssetPreparationAttempt) {
                    return;
                }
                startMutedLevelButton.hidden = false;
                window.updateAssetProgress();
                return preloadGameSounds();
            }).then(() => {
                if (attempt !== gameAssetPreparationAttempt ||
                    !audioLoadingDialog.classList.contains('visible')) {
                    return;
                }
                const soundsReady = soundBuffers.size === Object.keys(soundFiles).length;
                if (!soundsReady) {
                    audioLoadingText.classList.add('has-error');
                    audioLoadingText.textContent =
                        'Some sounds could not be loaded. You can retry audio or start muted.';
                    renderAssetDiagnosticReport(audioAssetReport);
                    startLoadedLevelButton.hidden = true;
                    startMutedLevelButton.textContent = 'Start without audio';
                    return;
                }
                audioAssetReport.hidden = true;
                audioLoadingText.classList.remove('has-error');
                audioLoadingText.textContent =
                    'Assets and audio are ready. You can start the level.';
                startLoadedLevelButton.hidden = false;
                startLoadedLevelButton.disabled = false;
                startMutedLevelButton.textContent = 'Start without audio';
            }).catch((error) => {
                if (attempt !== gameAssetPreparationAttempt) {
                    return;
                }
                console.error('Unable to prepare game assets.', error);
                audioLoadingText.classList.add('has-error');
                audioLoadingText.textContent = error.message;
                renderAssetDiagnosticReport(audioAssetReport, error);
                startLoadedLevelButton.hidden = true;
                startMutedLevelButton.hidden = true;
                retryGameAssetsButton.hidden = false;
            }).finally(() => {
                window.clearInterval(progressInterval);
            });
        }

        function stopMovementAudio() {
            movementAudioGeneration += 1;
            movementAudioPendingGeneration = null;
            if (activeMovementSource) {
                try {
                    activeMovementSource.stop();
                } catch (error) {
                    if (error.name !== 'InvalidStateError') {
                        console.error('Unable to stop movement audio.', error);
                    }
                }
                activeMovementSource.disconnect();
                activeSoundSources.delete(activeMovementSource);
                activeMovementSource = null;
            }
            activeMovementAudio = null;
        }

        let movementAudioPendingGeneration = null;

        function startMovementAudio(name, generation) {
            const soundName = name === 'player' ? 'playerMovement' : 'enemyMovement';
            const buffer = soundBuffers.get(soundName);
            if (!buffer) {
                if (movementAudioPendingGeneration === generation) {
                    return;
                }
                movementAudioPendingGeneration = generation;
                void loadSoundBuffer(soundName).then((loadedBuffer) => {
                    if (movementAudioPendingGeneration === generation) {
                        movementAudioPendingGeneration = null;
                    }
                    startMovementAudioWithBuffer(name, generation, loadedBuffer);
                }).catch((error) => {
                    if (movementAudioPendingGeneration === generation) {
                        movementAudioPendingGeneration = null;
                    }
                    console.error(`Unable to load ${name} movement audio.`, error);
                });
                return;
            }

            startMovementAudioWithBuffer(name, generation, buffer);
        }

        function startMovementAudioWithBuffer(name, generation, buffer) {
            if (generation !== movementAudioGeneration || !isSimulationActive) {
                return;
            }
            if (gameAudioContext.state !== 'running') {
                movementAudioPendingGeneration = generation;
                return;
            }
            movementAudioPendingGeneration = null;
            try {
                const source = gameAudioContext.createBufferSource();
                source.buffer = buffer;
                source.loop = true;
                source.connect(gameAudioContext.destination);
                source.start();
                activeMovementSource = source;
                activeSoundSources.add(source);
            } catch (error) {
                console.error(`Unable to play ${name} movement loop.`, error);
            }
        }

        function updateMovementAudio() {
            const nextMovementAudio = !isSimulationActive || isGamePaused || areGameSoundsMuted
                ? null
                : Player.isMoving
                    ? 'player'
                    : enemyTanks.some((enemy) => enemy.isMoving)
                        ? 'enemy'
                        : null;

            if (
                nextMovementAudio === activeMovementAudio &&
                (
                    nextMovementAudio === null ||
                    activeMovementSource ||
                    movementAudioPendingGeneration === movementAudioGeneration
                )
            ) {
                return;
            }

            if (nextMovementAudio !== activeMovementAudio) {
                if (activeMovementSource) {
                    activeMovementSource.stop();
                    activeMovementSource.disconnect();
                    activeSoundSources.delete(activeMovementSource);
                    activeMovementSource = null;
                }
                activeMovementAudio = nextMovementAudio;
                movementAudioGeneration += 1;
                movementAudioPendingGeneration = null;
            }

            if (nextMovementAudio) {
                void startMovementAudio(nextMovementAudio, movementAudioGeneration);
            }
        }

        gameAudioContext.addEventListener('statechange', () => {
            if (gameAudioContext.state !== 'running') {
                pendingSoundEffects.length = 0;
                stopMovementAudio();
                stopAllSoundSources();
                return;
            }

            if (isSimulationActive && !isGameOver) {
                const currentMovementSoundName = activeMovementAudio === 'player'
                    ? 'playerMovement'
                    : activeMovementAudio === 'enemy' ? 'enemyMovement' : null;
                if (
                    currentMovementSoundName &&
                    soundBuffers.has(currentMovementSoundName) &&
                    !activeMovementSource
                ) {
                    movementAudioPendingGeneration = null;
                }
                updateMovementAudio();
            }
            flushPendingSoundEffects();
        });

        function resumeGameAudio() {
            const restoreAudio = () => {
                startAudioKeepAlive();
                flushPendingSoundEffects();
                if (isSimulationActive && !isGameOver) {
                    updateMovementAudio();
                }
                scheduleAudioIdleSuspension();
            };
            if (gameAudioContext.state === 'running') {
                restoreAudio();
                return Promise.resolve();
            }

            return audioSystem.resumeGameAudio().then(restoreAudio);
        }

        function tryResumeGameAudioOnReturn() {
            if (
                document.hidden ||
                !isSimulationActive ||
                isGameOver ||
                areGameSoundsMuted ||
                gameAudioContext.state === 'running'
            ) {
                return;
            }
            void resumeGameAudio().catch((error) => {
                console.error('Unable to resume game audio when returning to the page.', error);
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                window.clearTimeout(audioIdleTimeoutId);
                audioIdleTimeoutId = 0;
                pendingSoundEffects.length = 0;
                stopMovementAudio();
                stopAllSoundSources();
                stopAudioKeepAlive();
                if (gameAudioContext.state === 'running') {
                    void audioSystem.suspendGameAudio().catch((error) => {
                        console.error('Unable to suspend game audio in the background.', error);
                    });
                }
            } else if (isSimulationActive && !isGameOver) {
                tryResumeGameAudioOnReturn();
                if (gameAudioContext.state === 'running') {
                    flushPendingSoundEffects();
                    updateMovementAudio();
                }
            }
        });
        window.addEventListener('focus', tryResumeGameAudioOnReturn);
        document.addEventListener('pointerdown', (event) => {
            if (event.target instanceof Element && !event.target.closest('#gameCanvas, #mobileGameControls, [data-game-direction], [data-game-fire]')) {
                clearGameInputState();
            }
            void resumeGameAudio().catch((error) => {
                console.error('Unable to resume game audio after user interaction.', error);
            });
        }, true);
        document.addEventListener('keydown', () => {
            void resumeGameAudio().catch((error) => {
                console.error('Unable to resume game audio after user interaction.', error);
            });
        }, true);
        document.addEventListener('pointermove', () => {
            if (gameAudioContext.state === 'running') {
                scheduleAudioIdleSuspension();
            }
        }, true);

        function getTankSpeedMultiplierForType(type, textureType = playerTextureType) {
            return gameCore.getTankSpeedMultiplier(type, textureType);
        }

        function getEnemyInitialHitPoints(textureType) {
            return gameCore.getEnemyInitialHitPoints(textureType);
        }

        function getEnemyDamagedTextureType(hitPoints) {
            return gameCore.getEnemyDamagedTextureType(hitPoints);
        }

        function getPlayerTankType() {
            const parsedValue = Number.parseInt(playerTextureRowInput.value, 10);
            return Number.isFinite(parsedValue)
                ? Math.min(10, Math.max(0, parsedValue))
                : 0;
        }

        function setPlayerTankRank(rank) {
            const normalizedRank = [0, 1, 2, 3, 8, 10, 9].includes(rank) ? rank : 0;
            playerTextureRow = normalizedRank;
            playerTextureRowInput.value = String(normalizedRank);
            loadPlayerTextures();
        }

        let enemySpawnOrder = [];
        const enemySpawnOrderUi = window.BC90EEnemySpawnOrderUi.createEnemySpawnOrderUi({
            editor: enemySpawnOrderEditor,
            horizontalScrollbar: enemyOrderHorizontalScrollbar,
            horizontalScrollbarTrack: enemyOrderHorizontalScrollbarTrack,
            sizeInput: enemyOrderSizeInput,
            getSpawnOrder: () => enemySpawnOrder,
            getPowerUpTextures: () => powerUpTextures,
            getEnemyTextures: () => enemyTextures,
            getPlayerMoveFrameDuration: () => PLAYER_MOVE_FRAME_DURATION,
            getPowerUpPreviewBlinkDuration: () => POWERUP_PREVIEW_BLINK_DURATION,
            getMapTextureDirectory: () => MAP_TEXTURE_DIRECTORY,
            getUiTextureDirectory: () => UI_TEXTURE_DIRECTORY,
            getEnemyTankType: () => ENEMY_TANK_TYPE,
            getEnemyTankTextureType: () => ENEMY_TANK_TEXTURE_TYPE,
            loadEnemyTextureSet,
            loadEnemyTextureDefinition,
            updateEnemyLivesDisplay,
            encodeSpawnOrder: (order, powerUpCount) =>
                levelDataCodec.encodeEnemySpawnOrder(order, powerUpCount),
            decodeSpawnOrder: (value, makeDefaultOrder, powerUpCount) =>
                levelDataCodec.decodeEnemySpawnOrder(value, makeDefaultOrder, powerUpCount)
        });
        enemySpawnOrder = enemySpawnOrderUi.createDefaultEnemySpawnOrder();

        function createDefaultEnemySpawnOrder() {
            return enemySpawnOrderUi.createDefaultEnemySpawnOrder();
        }

        function getEnemySpawnOrderRowPositions() {
            return enemySpawnOrderUi.getRowPositions();
        }

        function renderEnemySpawnOrderEditor(previousPositions = null, removedRow = null) {
            enemySpawnOrderUi.render(previousPositions, removedRow);
        }

        function syncEnemyOrderHorizontalScrollbar() {
            enemySpawnOrderUi.syncHorizontalScrollbar();
        }

        function updateEnemyOrderSize() {
            enemySpawnOrderUi.updateSize();
        }

        function updateEnemySpawnOrderPreviews(timestamp) {
            enemySpawnOrderUi.updatePreviews(timestamp);
        }

        function encodeEnemySpawnOrder() {
            return enemySpawnOrderUi.encodeSpawnOrder(
                enemySpawnOrder,
                powerUpTextures.length
            );
        }

        function decodeEnemySpawnOrder(value) {
            return enemySpawnOrderUi.decodeSpawnOrder(
                value,
                createDefaultEnemySpawnOrder,
                powerUpTextures.length
            );
        }
        function getPlayerTankSpeedMultiplier() {
            return getTankSpeedMultiplierForType(getPlayerTankType(), playerTextureType);
        }

        function getEnemyTankDefinition(enemy = null) {
            return {
                type: enemy?.type ?? ENEMY_TANK_TYPE,
                textureType: enemy?.textureType ?? ENEMY_TANK_TEXTURE_TYPE,
                textureRow: enemy?.textureRow ?? ENEMY_TANK_TEXTURE_ROW
            };
        }

        function getEnemyTankType(enemy = null) {
            return getEnemyTankDefinition(enemy).type;
        }

        function getEnemyTankSpeedMultiplier(enemy) {
            const { type, textureType } = getEnemyTankDefinition(enemy);
            return getTankSpeedMultiplierForType(type, textureType);
        }

        function getTankBulletLimit(tankType) {
            return gameCore.getTankBulletLimit(tankType);
        }

        function getTankProjectileSpeedMultiplier(tankType) {
            return gameCore.getProjectileSpeedMultiplier(tankType);
        }

        function getTankCanBreakSteel(tankType) {
            return gameCore.canBreakSteel(tankType);
        }

        function getTankTwinShotEnabled(tankType) {
            return gameCore.hasTwinShot(tankType);
        }

        function getTankBurstDirections(tankType, direction) {
            return gameCore.getTankBurstDirections(tankType, direction);
        }

        function getTankReinforcedBrickDamageMultiplier(tankType) {
            return gameCore.getReinforcedBrickDamageMultiplier(tankType);
        }

        function getPlayerBulletLimit() {
            return getTankBulletLimit(getPlayerTankType());
        }

        function getPlayerReinforcedBrickDamageMultiplier() {
            return getTankReinforcedBrickDamageMultiplier(getPlayerTankType());
        }

        function getEnemyBulletLimit(enemy) {
            return getTankBulletLimit(getEnemyTankType(enemy));
        }

        function getEnemyTwinShotEnabled(enemy) {
            return getTankTwinShotEnabled(getEnemyTankType(enemy));
        }

        function getEnemyFireCooldownMs(enemy) {
            return gameCore.getEnemyFireCooldownMs(enemy, getEnemyTankType(enemy));
        }

        let requestedDirection = null;
        let slidingDirection = null;
        let slidingDistance = 0;
        let slidingOnCompactIce = false;
        let isPlayerWaitingAfterIceSlide = false;
        let previousFrameTime = 0;
        let lastEditorMapRenderAt = -Infinity;
        let lastShotAt = 0;
        let lastShotSpacing = 0;
        let nextBulletBurstId = 1;
        let playerRank9Burst = null;
        const enemyRank9Bursts = new Map();
        let playerSpawnIntroStart = 0;
        let playerSpawnIntroUntil = 0;
        let playerInvincibleUntil = 0;
        let shouldDrawPlayerAfterSpawn = false;
        let playerRespawnIntroActive = false;
        let playerRespawnPending = false;
        let enemySpawnIntroStartByTile = new Map();
        let enemyTanks = [];
        let pendingTntDetonations = [];
        let enemyPairsIgnoringCollision = new Set();
        let playerEnemyPairsIgnoringCollision = new Set();
        let nextEnemySpawnOrderIndex = 0;
        let nextEnemySpawnAllowedAt = 0;
        let nextEnemyId = 1;

        function getEnemyPairKey(first, second) {
            return [first.id, second.id].sort((a, b) => a - b).join(':');
        }

        function resetMessagePreferences() {
            messageDialogUi.resetPreferences();
            audioLoadingScreenShown = false;
            showMessage('Message preferences have been reset.');
        }

        function createMap(width, height, defaultTileId) {
            return Array.from(
                { length: height },
                () => Array(width).fill(defaultTileId)
            );
        }

        function isValidTexture(image, path) {
            const width = image.naturalWidth || image.width;
            const height = image.naturalHeight || image.height;
            if (width <= 0 || height <= 0) {
                return false;
            }

            const roadDefinition = ROAD_TILE_DEFINITIONS.find(({ file }) =>
                path.endsWith(file)
            );
            if (roadDefinition) {
                return width * roadDefinition.height ===
                    height * roadDefinition.width;
            }

            return width === height;
        }

        function normalizeTransparentBlackPixels(image) {
            const canvas = document.createElement('canvas');
            const width = image.naturalWidth || image.width;
            const height = image.naturalHeight || image.height;
            canvas.width = width;
            canvas.height = height;

            const context2d = canvas.getContext('2d');
            context2d.clearRect(0, 0, width, height);
            context2d.drawImage(image, 0, 0);

            const imageData = context2d.getImageData(0, 0, width, height);
            const { data } = imageData;

            for (let index = 0; index < data.length; index += 4) {
                const red = data[index];
                const green = data[index + 1];
                const blue = data[index + 2];
                const alpha = data[index + 3];

                if (alpha > 0 && red <= 32 && green <= 32 && blue <= 32) {
                    data[index + 3] = 0;
                    data[index] = 0;
                    data[index + 1] = 0;
                    data[index + 2] = 0;
                }
            }

            context2d.putImageData(imageData, 0, 0);

            return canvas;
        }

        function serializeTextureForCache(texture) {
            const width = texture.naturalWidth || texture.width;
            const height = texture.naturalHeight || texture.height;
            if (!width || !height) {
                return Promise.resolve(null);
            }

            const canvas = texture instanceof HTMLCanvasElement
                ? texture
                : document.createElement('canvas');
            if (canvas !== texture) {
                canvas.width = width;
                canvas.height = height;
                const cacheContext = canvas.getContext('2d');
                cacheContext.drawImage(texture, 0, 0, width, height);
            }

            return new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/png');
            });
        }

        async function createTextureCacheValue(texture) {
            if (!persistentAssetCache.isAvailable()) {
                return null;
            }
            if (typeof createImageBitmap === 'function') {
                try {
                    return await createImageBitmap(texture);
                } catch (error) {
                    console.warn('Could not prepare a decoded texture for persistent cache.', error);
                }
            }
            return serializeTextureForCache(texture);
        }

        function processTextureLoadQueue() {
            while (
                activeTextureLoadCount < MAX_CONCURRENT_TEXTURE_LOADS &&
                textureLoadQueue.length > 0
            ) {
                textureLoadQueue.shift()();
            }
        }

        function loadTexture(path, onValidTexture, normalizeBlackPixels = true) {
            const cacheKey = `${path}|${normalizeBlackPixels ? 'normalized' : 'raw'}`;
            const persistentCacheKey = persistentAssetCache.makeKey(
                'texture',
                path,
                normalizeBlackPixels ? 'normalized' : 'raw'
            );
            const shouldBypassPersistentCache = bypassPersistentAssetCache;
            const cacheResetPromise = persistentCacheClearPromise;
            const cachedTexture = loadedTextureCache.get(cacheKey);
            if (cachedTexture) {
                textureLoadStates.set(cacheKey, 'loaded');
                failedTextureLoads.delete(cacheKey);
                try {
                    onValidTexture(cachedTexture);
                } catch (error) {
                    assetLoadStatus.hidden = false;
                    assetLoadStatus.textContent =
                        `Asset could not be prepared: ${path}.`;
                    console.error(`Unable to prepare cached game asset "${path}".`, error);
                }
                return;
            }

            const image = new Image();
            const requestVersion = assetReloadVersion;
            textureLoadStates.set(cacheKey, 'loading');
            pendingGameAssetLoads.set(
                path,
                (pendingGameAssetLoads.get(path) ?? 0) + 1
            );
            failedGameAssetLoads.delete(path);
            let isSettled = false;
            let timeoutId = null;
            let hasStarted = false;
            let isPersistentCacheHit = false;
            let cachedImageUrl = null;
            let cancelLoad = null;
            const loadFromSource = () => {
                if (cachedImageUrl) {
                    URL.revokeObjectURL(cachedImageUrl);
                    cachedImageUrl = null;
                }
                isPersistentCacheHit = false;
                image.src = getAssetUrl(path);
            };
            const settleLoad = (error = null) => {
                if (isSettled) {
                    return;
                }
                isSettled = true;
                if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                }
                if (hasStarted) {
                    activeTextureLoadCount -= 1;
                    activeTextureLoadCancels.delete(cancelLoad);
                }
                if (requestVersion === assetReloadVersion) {
                    const pendingCount = pendingGameAssetLoads.get(path) ?? 0;
                    if (pendingCount <= 1) {
                        pendingGameAssetLoads.delete(path);
                    } else {
                        pendingGameAssetLoads.set(path, pendingCount - 1);
                    }
                    if (error) {
                        failedGameAssetLoads.set(path, error);
                        failedTextureLoads.add(cacheKey);
                        textureLoadStates.set(cacheKey, 'failed');
                        scheduleEditorAssetReport(new Error(`${path}: ${error.message}`));
                    } else {
                        failedGameAssetLoads.delete(path);
                        failedTextureLoads.delete(cacheKey);
                        textureLoadStates.set(cacheKey, 'loaded');
                        if (failedGameAssetLoads.size === 0 && failedSoundLoads.size === 0) {
                            assetLoadStatus.hidden = true;
                            delete assetLoadStatus.dataset.error;
                            assetLoadReport.hidden = true;
                        }
                    }
                    window.updateAssetProgress();
                    window.dispatchEvent(new Event('gameassetsettled'));
                }
                processTextureLoadQueue();
            };

            image.onload = () => {
                if (isSettled) {
                    return;
                }
                if (requestVersion !== assetReloadVersion) {
                    settleLoad();
                    return;
                }

                if (isValidTexture(image, path)) {
                    let texture;
                    try {
                        texture = normalizeBlackPixels && !isPersistentCacheHit
                            ? normalizeTransparentBlackPixels(image)
                            : image;
                        loadedTextureCache.set(cacheKey, texture);
                        onValidTexture(texture);
                    } catch (error) {
                        settleLoad(error);
                        assetLoadStatus.hidden = false;
                        assetLoadStatus.textContent =
                            `Asset could not be prepared: ${path}.`;
                        console.error(`Unable to prepare game asset "${path}".`, error);
                        return;
                    }

                    if (isPersistentCacheHit) {
                        URL.revokeObjectURL(cachedImageUrl);
                        cachedImageUrl = null;
                        settleLoad();
                        return;
                    }

                    void createTextureCacheValue(texture).then(async (cacheValue) => {
                        if (cacheValue && requestVersion === assetReloadVersion && !isSettled) {
                            await cacheResetPromise;
                        }
                        if (cacheValue && requestVersion === assetReloadVersion && !isSettled) {
                            const didCache = await persistentAssetCache.put(
                                persistentCacheKey,
                                cacheValue
                            );
                            if (!didCache &&
                                persistentAssetCache.isAvailable() &&
                                typeof ImageBitmap === 'function' &&
                                cacheValue instanceof ImageBitmap) {
                                const fallbackBlob = await serializeTextureForCache(texture);
                                if (fallbackBlob) {
                                    await persistentAssetCache.put(
                                        persistentCacheKey,
                                        fallbackBlob
                                    );
                                }
                            }
                        }
                        if (typeof ImageBitmap === 'function' &&
                            cacheValue instanceof ImageBitmap) {
                            cacheValue.close();
                        }
                        settleLoad();
                    }).catch((error) => {
                        console.warn(`Could not persist game texture "${path}".`, error);
                        settleLoad();
                    });
                    return;
                }

                if (isPersistentCacheHit) {
                    void persistentAssetCache.remove(persistentCacheKey);
                    loadFromSource();
                    return;
                }

                const error = new Error(
                    `Invalid dimensions (${image.naturalWidth || image.width}x` +
                    `${image.naturalHeight || image.height}).`
                );
                settleLoad(error);
                assetLoadStatus.hidden = false;
                assetLoadStatus.textContent =
                    `Asset has invalid dimensions: ${path} ` +
                    `(${image.naturalWidth || image.width}x${image.naturalHeight || image.height}).`;
                console.error(`Invalid image dimensions for game asset "${path}".`);
            };
            image.onerror = () => {
                if (isSettled) {
                    return;
                }
                if (isPersistentCacheHit) {
                    void persistentAssetCache.remove(persistentCacheKey);
                    loadFromSource();
                    return;
                }
                if (requestVersion !== assetReloadVersion) {
                    settleLoad();
                    return;
                }

                const error = new Error('Image request failed.');
                settleLoad(error);
                assetLoadStatus.hidden = false;
                assetLoadStatus.textContent =
                    `Asset failed to load: ${path}. Serve the whole project folder, with "assets" beside "index.html".`;
                console.error(`Unable to load game asset "${path}". Check the local server root and file path.`);
            };
            textureLoadQueue.push(() => {
                if (requestVersion !== assetReloadVersion) {
                    settleLoad();
                    return;
                }
                hasStarted = true;
                activeTextureLoadCount += 1;
                cancelLoad = () => {
                    if (isSettled) {
                        return;
                    }
                    if (cachedImageUrl) {
                        URL.revokeObjectURL(cachedImageUrl);
                        cachedImageUrl = null;
                    }
                    image.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                    settleLoad();
                };
                activeTextureLoadCancels.add(cancelLoad);
                timeoutId = window.setTimeout(() => {
                    const error = new Error('Image request timed out.');
                    settleLoad(error);
                    image.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                    assetLoadStatus.hidden = false;
                    assetLoadStatus.dataset.error = 'true';
                    assetLoadStatus.textContent =
                        `Asset request timed out: ${path}. Check that the local server is serving the assets folder.`;
                    renderAssetDiagnosticReport(assetLoadReport, error);
                    console.error(`Timed out loading game asset "${path}".`);
                }, 90000);
                const loadCachedTexture = async () => {
                    if (shouldBypassPersistentCache) {
                        loadFromSource();
                        return;
                    }
                    const cachedTexture = await persistentAssetCache.get(persistentCacheKey);
                    if (isSettled || requestVersion !== assetReloadVersion) {
                        return;
                    }
                    if (typeof ImageBitmap === 'function' &&
                        cachedTexture instanceof ImageBitmap) {
                        if (!isValidTexture(cachedTexture, path)) {
                            cachedTexture.close();
                            await persistentAssetCache.remove(persistentCacheKey);
                            loadFromSource();
                            return;
                        }
                        try {
                            loadedTextureCache.set(cacheKey, cachedTexture);
                            onValidTexture(cachedTexture);
                            settleLoad();
                        } catch (error) {
                            settleLoad(error);
                            assetLoadStatus.hidden = false;
                            assetLoadStatus.textContent =
                                `Asset could not be prepared: ${path}.`;
                            console.error(`Unable to prepare cached game asset "${path}".`, error);
                        }
                        return;
                    }
                    if (!(cachedTexture instanceof Blob)) {
                        loadFromSource();
                        return;
                    }
                    try {
                        cachedImageUrl = URL.createObjectURL(cachedTexture);
                        isPersistentCacheHit = true;
                        image.src = cachedImageUrl;
                    } catch (error) {
                        console.warn(`Could not open cached game texture "${path}".`, error);
                        loadFromSource();
                    }
                };
                void loadCachedTexture().catch((error) => {
                    if (isSettled || requestVersion !== assetReloadVersion) {
                        return;
                    }
                    console.warn(`Could not read cached game texture "${path}".`, error);
                    loadFromSource();
                });
            });
            processTextureLoadQueue();
        }

        function retryFailedDocumentImages() {
            const retryToken = Date.now();
            Array.from(document.images).forEach((image, index) => {
                if (!image.complete || image.naturalWidth > 0 || !image.src ||
                    image.src.startsWith('data:') || image.src.startsWith('blob:')) {
                    return;
                }

                const retryUrl = new URL(image.src, document.baseURI);
                retryUrl.searchParams.set('_asset_retry', `${retryToken}-${index}`);
                image.src = retryUrl.href;
            });
        }

        const tileSelectorPreviews = window.BC90ETileSelectorPreviews.createTileSelectorPreviews({
            buttons: tileSelectorButtons,
            isTexturesVisible: () => areTileTexturesVisible,
            isSimulationActive: () => isSimulationActive,
            animationFrames,
            tileAnimationGroups: TILE_ANIMATION_GROUPS,
            reinforcedAnimationIds: REINFORCED_ANIMATION_IDS,
            reinforcedBrickId: REINFORCED_BRICKS_ID,
            reinforcedBrickPreviewStateDuration: REINFORCED_BRICK_PREVIEW_STATE_DURATION,
            reinforcedBrickTextureStates: REINFORCED_BRICK_TEXTURE_STATES,
            shineCycleFrames: SHINE_CYCLE_FRAMES,
            shineActiveFrames: SHINE_ACTIVE_FRAMES,
            textureFrameDuration: TEXTURE_FRAME_DURATION,
            spawnAnimationFrameDuration: SPAWN_ANIMATION_FRAME_DURATION,
            playerSpawnClassicLoop: PLAYER_SPAWN_CLASSIC_LOOP,
            eagleId: EAGLE_ID,
            eagleFrameDuration: EAGLE_FRAME_DURATION,
            slowTextureFirstId: SLOW_TEXTURE_FIRST_ID,
            textureVisibleFrameDuration: TEXTURE_VISIBLE_FRAME_DURATION,
            slowTextureSpeedFactor: SLOW_TEXTURE_SPEED_FACTOR,
            tntBlockId: TNT_BLOCK_ID,
            airId: AIR_ID,
            tileColors: TILE_COLORS,
            editorTileTints: EDITOR_TILE_TINTS,
            pixelTileLabels: PIXEL_TILE_LABELS,
            tileButtonLabels: TILE_BUTTON_LABELS,
            getTileTextureSourceId,
            getAvailableAnimationFrames,
            getReinforcedAnimationFrameIndex,
            getEditorTileTexture,
            getShineTexture,
            getPixelLabelCanvas: pixelLabels.getCanvas
        });

        function invalidateTileSelectorPreview(tileId) {
            tileSelectorPreviews.invalidate(tileId);
        }

        function getAvailableAnimationFrames(tileId) {
            const textureTileId = getTileTextureSourceId(tileId);
            let availableFrames = availableAnimationFramesByTile.get(textureTileId);

            if (!availableFrames) {
                availableFrames = animationFrames.get(textureTileId) ?? [];
                availableAnimationFramesByTile.set(textureTileId, availableFrames);
            }

            return availableFrames;
        }

        function getTileTextureSourceId(tileId) {
            const enemySpawnIndex = ENEMY_SPAWN_IDS.indexOf(tileId);
            return enemySpawnIndex >= 0
                ? ENEMY_SPAWN_IDS[enemySpawnIndex % 3]
                : tileId;
        }

        function loadTileTextures() {
            for (let tileId = 0; tileId <= COMPACT_ICE_ID; tileId += 1) {
                const animationGroup = TILE_ANIMATION_GROUPS[tileId];
                const hasDedicatedAnimationFrames = Boolean(animationGroup) ||
                    tileId === VACIO_SOLIDO_ID ||
                    tileId === REINFORCED_BRICKS_ID ||
                    (TILE_ANIMATION_FRAME_COUNTS[tileId] ?? 0) > 0;

                if (!hasDedicatedAnimationFrames) {
                    loadTexture(
                        `${MAP_TEXTURE_DIRECTORY}${tileId}.png`,
                        (image) => {
                            tileTextures.set(tileId, image);
                            editorStaticLayerCache = null;
                            invalidateTileSelectorPreview(tileId);
                            if (tileId === AIR_ID) {
                                baseLayerCache = null;
                            }
                        }
                    );
                }

                if (animationGroup) {
                    for (let frame = 0; frame < 5; frame += 1) {
                        const frameName = String(frame).padStart(2, '0');
                        loadTexture(
                            `${MAP_TEXTURE_DIRECTORY}${animationGroup}-${frameName}.png`,
                            (image) => {
                                if (!animationFrames.has(tileId)) {
                                    animationFrames.set(tileId, []);
                                }

                                animationFrames.get(tileId)[frame] = image;
                                availableAnimationFramesByTile.delete(tileId);
                                invalidateTileSelectorPreview(tileId);
                                textureAnimations.set(tileId, true);
                            },
                            false
                        );
                    }

                    continue;
                }

                if (REINFORCED_ANIMATION_IDS.has(tileId)) {
                    continue;
                }

                const frameCount = TILE_ANIMATION_FRAME_COUNTS[tileId] ?? 0;

                for (let frame = 0; frame < frameCount; frame += 1) {
                    const frameName = String(frame).padStart(2, '0');
                    loadTexture(
                        `${MAP_TEXTURE_DIRECTORY}${tileId}-${frameName}.png`,
                        (image) => {
                            if (!animationFrames.has(tileId)) {
                                animationFrames.set(tileId, []);
                            }

                            animationFrames.get(tileId)[frame] = image;
                            availableAnimationFramesByTile.delete(tileId);
                            invalidateTileSelectorPreview(tileId);
                            textureAnimations.set(tileId, true);
                        }
                    );
                }
            }

            for (let frame = 0; frame < TILE_ANIMATION_FRAME_COUNTS[VERY_DENSE_BUSH_ID]; frame += 1) {
                const frameName = String(frame).padStart(2, '0');
                loadTexture(
                    `${MAP_TEXTURE_DIRECTORY}${VERY_DENSE_BUSH_ID}-${frameName}.png`,
                    (image) => {
                        if (!animationFrames.has(VERY_DENSE_BUSH_ID)) {
                            animationFrames.set(VERY_DENSE_BUSH_ID, []);
                        }
                        animationFrames.get(VERY_DENSE_BUSH_ID)[frame] = image;
                        availableAnimationFramesByTile.delete(VERY_DENSE_BUSH_ID);
                        invalidateTileSelectorPreview(VERY_DENSE_BUSH_ID);
                        textureAnimations.set(VERY_DENSE_BUSH_ID, true);
                    }
                );
            }

            for (let frame = 0; frame < TILE_ANIMATION_FRAME_COUNTS[TNT_BLOCK_ID]; frame += 1) {
                const frameName = String(frame).padStart(2, '0');
                loadTexture(
                    `${MAP_TEXTURE_DIRECTORY}${TNT_BLOCK_ID}-${frameName}.png`,
                    (image) => {
                        if (!animationFrames.has(TNT_BLOCK_ID)) {
                            animationFrames.set(TNT_BLOCK_ID, []);
                        }
                        animationFrames.get(TNT_BLOCK_ID)[frame] = image;
                        availableAnimationFramesByTile.delete(TNT_BLOCK_ID);
                        invalidateTileSelectorPreview(TNT_BLOCK_ID);
                        editorStaticLayerCache = null;
                        mapRenderVersion += 1;
                    },
                    false
                );
            }

            textureLoadComplete = true;

            for (let frame = 0; frame < SHINE_FRAME_COUNT; frame += 1) {
                const frameName = String(frame).padStart(2, '0');
                loadTexture(
                    `${MAP_TEXTURE_DIRECTORY}shine-${frameName}.png`,
                    (image) => {
                        shineFrames[frame] = image;
                        REINFORCED_ANIMATION_IDS.forEach(invalidateTileSelectorPreview);
                    }
                );
            }

            for (let state = 0; state < REINFORCED_BRICK_TEXTURE_STATES; state += 1) {
                const stateName = String(state).padStart(2, '0');
                loadTexture(
                    `${MAP_TEXTURE_DIRECTORY}${REINFORCED_BRICKS_ID}-${stateName}.png`,
                    (image) => {
                        if (!animationFrames.has(REINFORCED_BRICKS_ID)) {
                            animationFrames.set(REINFORCED_BRICKS_ID, []);
                        }

                        animationFrames.get(REINFORCED_BRICKS_ID)[state] = image;
                        availableAnimationFramesByTile.delete(REINFORCED_BRICKS_ID);
                        invalidateTileSelectorPreview(REINFORCED_BRICKS_ID);
                    }
                );
            }

            ROAD_TILE_DEFINITIONS.forEach(({ id, file }) => {
                loadTexture(`${MAP_TEXTURE_DIRECTORY}${file}`, (image) => {
                    tileTextures.set(id, image);
                    editorStaticLayerCache = null;
                    drawRouteVariantPreviews();
                });
            });
        }

        function loadPlayerTextures() {
            const directions = ['up', 'down', 'left', 'right'];
            const textureType = playerTextureType;
            const textureRow = playerTextureRow;
            const loadVersion = ++playerTextureLoadVersion;
            const nextPlayerTextures = new Map();
            let loadedTextureCount = 0;

            directions.forEach((direction) => {
                [0, 1].forEach((frame) => {
                    const frameName = String(frame).padStart(2, '0');
                    loadTexture(
                        `${TEXTURE_DIRECTORY}tank/${textureType}/Tank-${textureType}-${textureRow}-${direction}-${frameName}.png`,
                        (image) => {
                            if (loadVersion !== playerTextureLoadVersion) {
                                return;
                            }

                            if (!nextPlayerTextures.has(direction)) {
                                nextPlayerTextures.set(direction, []);
                            }
                            nextPlayerTextures.get(direction)[frame] = image;
                            loadedTextureCount += 1;

                            if (loadedTextureCount === directions.length * 2) {
                                playerTextures.clear();
                                nextPlayerTextures.forEach((frames, loadedDirection) => {
                                    playerTextures.set(loadedDirection, frames);
                                });
                            }
                        },
                        textureType !== 'f'
                    );
                });
            });
        }

        function loadEnemyTextureSet(textureType, textureRow) {
            ['up', 'down', 'left', 'right'].forEach((direction) => {
                loadEnemyTextureDefinition(textureType, textureRow, direction);
            });
        }

        function loadEnemyTextures() {
            enemyTextures.clear();
            enemyTextureLoadingKeys.clear();
            enemySpawnOrderEditor.querySelectorAll('.enemy-order-preview').forEach((preview) => {
                delete preview.dataset.renderedEnemyTexture;
            });

            for (const textureType of 'abcdefgh') {
                for (let textureRow = 0; textureRow <= 10; textureRow += 1) {
                    loadEnemyTextureSet(textureType, textureRow);
                }
            }
        }

        function loadEnemyTextureDefinition(textureType, textureRow, direction) {
            const key = `${textureType}-${textureRow}-${direction}`;
            const frames = enemyTextures.get(key) ?? [];
            enemyTextures.set(key, frames);
            [0, 1].forEach((frame) => {
                const frameKey = `${key}-${frame}`;
                if (frames[frame] || enemyTextureLoadingKeys.has(frameKey)) {
                    return;
                }

                enemyTextureLoadingKeys.add(frameKey);
                const frameName = String(frame).padStart(2, '0');
                loadTexture(
                    `${TEXTURE_DIRECTORY}tank/${textureType}/Tank-${textureType}-${textureRow}-${direction}-${frameName}.png`,
                    (image) => {
                        frames[frame] = image;
                        enemyTextureLoadingKeys.delete(frameKey);
                        enemySpawnOrderEditor
                            .querySelectorAll('.enemy-order-preview')
                            .forEach((preview) => {
                                delete preview.dataset.renderedEnemyTexture;
                            });
                    },
                    textureType !== 'f'
                );
            });
        }

        function loadBulletTexture() {
            loadTexture(`${MAP_TEXTURE_DIRECTORY}bullet.png`, (image) => {
                bulletTexture = image;
            });
        }

        function loadPowerUpTextures() {
            for (let powerUpId = 0; powerUpId < powerUpTextures.length; powerUpId += 1) {
                loadTexture(
                    `${MAP_TEXTURE_DIRECTORY}Powerup-${String(powerUpId).padStart(2, '0')}.png`,
                    (image) => {
                        powerUpTextures[powerUpId] = image;
                    },
                    false
                );
            }
        }

        function loadExplosionTextures() {
            for (let frame = 0; frame < EXPLOSION_FRAME_COUNT; frame += 1) {
                const frameName = String(frame).padStart(2, '0');
                loadTexture(
                    `${MAP_TEXTURE_DIRECTORY}Explosion-${frameName}.png`,
                    (image) => {
                        explosionTextures[frame] = image;
                    }
                );
            }
        }

        function loadShieldTextures() {
            [0, 1].forEach((frame) => {
                const frameName = String(frame).padStart(2, '0');
                loadTexture(
                    `${MAP_TEXTURE_DIRECTORY}Shield-${frameName}.png`,
                    (image) => {
                        shieldTextures[frame] = image;
                    }
                );
            });
        }

        function loadSelectionActionTextures() {
            ['delete', 'copy', 'cut', 'paste'].forEach((name, index) => {
                loadTexture(
                    `${UI_TEXTURE_DIRECTORY}${name}.png`,
                    (image) => {
                        selectionActionTextures[index] = image;
                    },
                    false
                );
            });
            loadTexture(
                `${UI_TEXTURE_DIRECTORY}check.png`,
                (image) => {
                    selectionActionCheckTexture = image;
                },
                false
            );
        }

        function reloadAllAssets() {
            if (isSimulationActive) {
                return;
            }

            assetReloadVersion += 1;
            bypassPersistentAssetCache = true;
            persistentCacheClearPromise = persistentAssetCache.clear();
            window.clearTimeout(assetReportRefreshTimer);
            textureLoadQueue.length = 0;
            Array.from(activeTextureLoadCancels).forEach((cancelLoad) => cancelLoad());
            pendingGameAssetLoads.clear();
            failedGameAssetLoads.clear();
            textureLoadStates.clear();
            failedTextureLoads.clear();
            loadedTextureCache.clear();
            assetLoadStatus.hidden = true;
            assetLoadStatus.textContent = '';
            delete assetLoadStatus.dataset.error;
            assetLoadReport.hidden = true;
            tileTextures.clear();
            animationFrames.clear();
            availableAnimationFramesByTile.clear();
            tileSelectorPreviews.clear();
            tileSelectorButtons.forEach((button) => {
                delete button.dataset.previewKey;
                button.style.backgroundImage = '';
            });
            shineFrames.length = 0;
            editorStaticLayerCache = null;
            baseLayerCache = null;
            textureAnimations.clear();
            playerTextures.clear();
            enemyTextures.clear();
            enemyTextureLoadingKeys.clear();
            explosionTextures.length = 0;
            shieldTextures.length = 0;
            powerUpTextures.fill(null);
            selectionActionTextures.length = 0;
            selectionActionCheckTexture = null;
            bulletTexture = null;
            textureLoadComplete = false;
            baseLayerCache = null;

            loadTileTextures();
            loadPlayerTextures();
            loadEnemyTextures();
            loadBulletTexture();
            loadPowerUpTextures();
            loadExplosionTextures();
            loadShieldTextures();
            loadSelectionActionTextures();
            bypassPersistentAssetCache = false;
            pixelCursorUi.setSource(getAssetUrl(pixelCursorUi.getTexturePath()));
            document.querySelector('.player-lives-icon').src =
                getAssetUrl(`${UI_TEXTURE_DIRECTORY}player.png`);
            enemyLivesIcons.forEach((icon) => {
                icon.src = getAssetUrl(`${UI_TEXTURE_DIRECTORY}enemy.png`);
            });
            const mouseModeButton = canvasModeControls.querySelector('[data-mouse-mode]');
            const selectionModeButton = canvasModeControls.querySelector('[data-selection-mode]');
            mouseModeButton.style.backgroundImage =
                `url("${getAssetUrl(`${UI_TEXTURE_DIRECTORY}Mouse-move.png`)}")`;
            selectionModeButton.style.backgroundImage =
                `url("${getAssetUrl(`${UI_TEXTURE_DIRECTORY}Mouse-select-00.png`)}")`;

            audioSystem.resetSounds();
            soundPreloadCompleted = 0;
            void persistentCacheClearPromise.then(() => preloadGameSounds());
            updateTileSelectorTextures(gameTime, true);
            assetLoadStatus.hidden = false;
            assetLoadStatus.textContent = 'Reloading game assets; missing files will be listed here.';
            window.setTimeout(() => {
                if (
                    assetLoadStatus.textContent ===
                    'Reloading game assets; missing files will be listed here.'
                ) {
                    assetLoadStatus.hidden = true;
                }
            }, 3000);
        }

        function getTileTexture(tileId, timestamp) {
            if (
                isSimulationActive &&
                areInitialSpawnsDeferred &&
                isSpawnerTile(tileId)
            ) {
                return null;
            }

            if (tileId === REINFORCED_STEEL_ID) {
                return tileTextures.get(REINFORCED_STEEL_ID) ?? null;
            }

            if (tileId === TNT_BLOCK_ID) {
                const frames = animationFrames.get(TNT_BLOCK_ID);
                return frames?.[0] ?? null;
            }

            if (tileId === REINFORCED_BRICKS_ID) {
                return animationFrames.get(REINFORCED_BRICKS_ID)?.[0]
                    ?? tileTextures.get(REINFORCED_BRICKS_ID)
                    ?? null;
            }

            if (tileId === EAGLE_ID) {
                const frames = animationFrames.get(tileId);
                return frames?.[0] ?? tileTextures.get(tileId) ?? null;
            }

            const roadState = ROAD_TILE_STATE_BY_ID.get(tileId);
            if (roadState) {
                return tileTextures.get(roadState.definition.id) ?? null;
            }

            const availableFrames = getAvailableAnimationFrames(tileId);

            if (availableFrames.length > 0) {
                const textureTileId = getTileTextureSourceId(tileId);
                const animationGroup = TILE_ANIMATION_GROUPS[textureTileId];
                const textureFrameDuration = tileId >= SLOW_TEXTURE_FIRST_ID
                        ? TEXTURE_VISIBLE_FRAME_DURATION * SLOW_TEXTURE_SPEED_FACTOR
                        : TEXTURE_VISIBLE_FRAME_DURATION;
                const frameDuration = tileId === EAGLE_ID
                    ? EAGLE_FRAME_DURATION
                    : animationGroup
                        ? SPAWN_ANIMATION_FRAME_DURATION
                    : textureFrameDuration;
                const animationFrameCount = TILE_ANIMATION_FRAME_COUNTS[textureTileId]
                    ?? availableFrames.length;
                const activePlayerSpawnId = getActivePlayerSpawnTileId();
                const playerSpawnIntro = isSimulationActive && playerSpawnIntroStart
                    ? Math.max(0, timestamp - playerSpawnIntroStart)
                    : 0;
                const enemySpawnIntro = enemySpawnIntroStartByTile.get(tileId);
                const spawnRelativeTime = tileId === activePlayerSpawnId
                    ? playerSpawnIntro
                    : enemySpawnIntro
                        ? timestamp - enemySpawnIntro.startedAt
                        : 0;
                if (
                    isSimulationActive &&
                    (
                        (tileId === activePlayerSpawnId &&
                            spawnRelativeTime >= PLAYER_SPAWN_SEQUENCE.length * SPAWN_ANIMATION_FRAME_DURATION)
                        ||
                        (enemySpawnIntro &&
                            spawnRelativeTime >= PLAYER_SPAWN_SEQUENCE.length * SPAWN_ANIMATION_FRAME_DURATION)
                    )
                ) {
                    return null;
                }
                const frameIndex = animationGroup
                        ? (
                            !isSimulationActive &&
                            isSpawnerTile(tileId)
                                ? PLAYER_SPAWN_CLASSIC_LOOP[
                                    Math.floor(timestamp / frameDuration) % PLAYER_SPAWN_CLASSIC_LOOP.length
                                ]
                                : tileId === activePlayerSpawnId
                                    ? PLAYER_SPAWN_SEQUENCE[
                                        Math.min(
                                            Math.floor(spawnRelativeTime / SPAWN_ANIMATION_FRAME_DURATION),
                                            PLAYER_SPAWN_SEQUENCE.length - 1
                                        )
                                    ]
                                    : enemySpawnIntro
                                        ? PLAYER_SPAWN_SEQUENCE[
                                            Math.min(
                                                Math.floor(spawnRelativeTime / SPAWN_ANIMATION_FRAME_DURATION),
                                                PLAYER_SPAWN_SEQUENCE.length - 1
                                            )
                                        ]
                                        : 0
                        )
                        : Math.floor(timestamp / frameDuration) % animationFrameCount;
                return availableFrames[frameIndex] ?? availableFrames.find(Boolean) ?? null;
            }

            return tileTextures.get(tileId) ?? null;
        }

        function drawRouteTexture(context, texture, tileId, x, y, width, height) {
            const roadState = ROAD_TILE_STATE_BY_ID.get(tileId);
            if (!roadState || roadState.rotation === 0) {
                context.drawImage(texture, x, y, width, height);
                return;
            }

            const isQuarterTurn = roadState.rotation % 2 === 1;
            const sourceWidth = isQuarterTurn ? height : width;
            const sourceHeight = isQuarterTurn ? width : height;
            context.save();
            context.translate(x + width / 2, y + height / 2);
            context.rotate(roadState.rotation * Math.PI / 2);
            context.drawImage(
                texture,
                -sourceWidth / 2,
                -sourceHeight / 2,
                sourceWidth,
                sourceHeight
            );
            context.restore();
        }

        function drawRoutePreview(context, texture, tileId, x, y, width, height) {
            const roadState = ROAD_TILE_STATE_BY_ID.get(tileId);
            if (!roadState || roadState.definition.category !== 'straight') {
                drawRouteTexture(context, texture, tileId, x, y, width, height);
                return;
            }

            const footprint = ROAD_TILE_FOOTPRINTS.get(tileId);
            if (footprint.width === 2) {
                const halfHeight = height / 2;
                drawRouteTexture(context, texture, tileId, x, y, width, halfHeight);
                drawRouteTexture(
                    context,
                    texture,
                    tileId,
                    x,
                    y + halfHeight,
                    width,
                    halfHeight
                );
            } else {
                const halfWidth = width / 2;
                drawRouteTexture(context, texture, tileId, x, y, halfWidth, height);
                drawRouteTexture(
                    context,
                    texture,
                    tileId,
                    x + halfWidth,
                    y,
                    halfWidth,
                    height
                );
            }
        }

        function getShineTexture(timestamp) {
            const animationSlot = Math.floor(timestamp / TEXTURE_FRAME_DURATION)
                % SHINE_CYCLE_FRAMES;

            if (animationSlot >= SHINE_ACTIVE_FRAMES) {
                return null;
            }

            const frameIndex = getReinforcedAnimationFrameIndex(timestamp, TEXTURE_FRAME_DURATION);
            return shineFrames[frameIndex] ?? null;
        }

        function getReinforcedAnimationFrameIndex(timestamp, frameDuration) {
            const animationSlot = Math.floor(timestamp / frameDuration)
                % SHINE_CYCLE_FRAMES;

            if (animationSlot >= SHINE_ACTIVE_FRAMES) {
                return 0;
            }

            const halfDuration = SHINE_ACTIVE_FRAMES / 2;

            if (animationSlot <= halfDuration) {
                const accelerationProgress = animationSlot / halfDuration;
                const acceleratedProgress = 1 - Math.cos(
                    accelerationProgress * Math.PI / 2
                );

                return Math.round(acceleratedProgress * SHINE_PEAK_FRAME);
            }

            const decelerationProgress = (animationSlot - halfDuration) / halfDuration;
            const deceleratedProgress = Math.sin(decelerationProgress * Math.PI / 2);

            return Math.round(
                SHINE_PEAK_FRAME +
                deceleratedProgress * (
                    SHINE_FRAME_COUNT - 1 - SHINE_PEAK_FRAME
                )
            );
        }

        function getEditorTileTexture(tileId, timestamp) {
            const wasSimulationActive = isSimulationActive;
            isSimulationActive = false;
            const texture = getTileTexture(tileId, timestamp);
            isSimulationActive = wasSimulationActive;
            return texture;
        }

        function getPlayerTexture(timestamp) {
            const direction = Player.direction.toLowerCase();
            const frames = playerTextures.get(direction);

            if (!frames?.[0]) {
                return null;
            }

            const frame = Player.isMoving
                ? Math.floor(timestamp / PLAYER_MOVE_FRAME_DURATION) % 2
                : 0;

            return frames[frame] ?? frames[0];
        }

        function beginEnemySpawnIntros() {
            if (areInitialSpawnsDeferred || gameTime < nextEnemySpawnAllowedAt) {
                return;
            }

            const activeEnemySpawnIds = ENEMY_SPAWN_IDS.filter(
                (tileId) => findTileCenter(tileId)
            );

            if (
                activeEnemySpawnIds.length === 0 ||
                nextEnemySpawnOrderIndex >= enemySpawnOrder.length
            ) {
                return;
            }

            const occupiedSpawnIds = new Set([
                ...enemySpawnIntroStartByTile.keys(),
                ...enemyTanks
                    .filter((enemy) => enemy.spawnTileId)
                    .filter((enemy) => isEnemyOccupyingSpawn(enemy, enemy.spawnTileId))
                    .map((enemy) => enemy.spawnTileId)
            ]);
            const availableSpawnIds = activeEnemySpawnIds.filter(
                (tileId) => !occupiedSpawnIds.has(tileId)
            );
            const availableSlots = Math.max(
                0,
                maxActiveEnemies - enemyTanks.length - enemySpawnIntroStartByTile.size
            );

            const remainingDefinitions = enemySpawnOrder.length - nextEnemySpawnOrderIndex;
            const spawnCount = Math.min(
                availableSpawnIds.length,
                availableSlots,
                remainingDefinitions
            );

            availableSpawnIds.slice(0, spawnCount).forEach((tileId) => {
                const definition = enemySpawnOrder[nextEnemySpawnOrderIndex];
                if (
                    !definition ||
                    !Number.isInteger(definition.type) ||
                    typeof definition.textureType !== 'string'
                ) {
                    console.error(
                        `Invalid enemy spawn definition at index ${nextEnemySpawnOrderIndex}.`
                    );
                    nextEnemySpawnOrderIndex = enemySpawnOrder.length;
                    return;
                }
                nextEnemySpawnOrderIndex += 1;
                ['up', 'down', 'left', 'right'].forEach((direction) => {
                    loadEnemyTextureDefinition(
                        definition.textureType,
                        definition.type,
                        direction
                    );
                });
                const startedAt = gameTime;
                enemySpawnIntroStartByTile.set(tileId, {
                    startedAt,
                    type: definition.type,
                    textureType: definition.textureType,
                    powerUps: [...(definition.powerUps ?? [])],
                    isTnt: definition.isTnt === true,
                    until: startedAt + (
                        PLAYER_SPAWN_SEQUENCE.length * SPAWN_ANIMATION_FRAME_DURATION
                    )
                });
                const spawnCenter = findTileCenter(tileId);
                if (spawnCenter) {
                    movePlayerBesideEnemySpawn(spawnCenter);
                }
            });
        }

        function finishEnemySpawnIntroductions() {
            if (enemySpawnIntroStartByTile.size === 0) {
                return;
            }

            for (const [tileId, intro] of [...enemySpawnIntroStartByTile.entries()]) {
                if (gameTime < intro.until) {
                    continue;
                }

                const spawnCenter = findTileCenter(tileId);
                if (!spawnCenter) {
                    enemySpawnIntroStartByTile.delete(tileId);
                    continue;
                }

                const quantizedSpawn = quantizeWorldPosition(
                    spawnCenter.x,
                    spawnCenter.y
                );
                const enemyType = intro.type;
                const enemyTextureType = intro.textureType;
                const enemyTextureRow = enemyType;
                const aiState = chooseEnemyAiState(enemyTextureType);
                enemyTanks.push({
                    id: nextEnemyId++,
                    x: quantizedSpawn.x,
                    y: quantizedSpawn.y,
                    physicsX: spawnCenter.x,
                    physicsY: spawnCenter.y,
                    spawnTileId: tileId,
                    direction: 'UP',
                    type: enemyType,
                    textureType: enemyTextureType,
                    visualTextureType: enemyTextureType,
                    powerUps: [...(intro.powerUps ?? [])],
                    isTnt: intro.isTnt === true,
                    textureRow: enemyTextureRow,
                    hitPoints: getEnemyInitialHitPoints(enemyTextureType),
                    slidingDirection: null,
                    slidingDistance: 0,
                    slidingOnCompactIce: false,
                    speed: PLAYER_SPEED_TILES_PER_SECOND * getTankSpeedMultiplierForType(
                        enemyType,
                        enemyTextureType
                    ),
                    aiState,
                    primaryAiState: enemyTextureType === 'f' ? aiState : null,
                    aiStateUntil: gameTime + getEnemyAiStateDurationMs(
                        aiState,
                        enemyTextureType
                    ),
                    isMoving: false,
                    color: '#ff8a75'
                });

                enemySpawnIntroStartByTile.delete(tileId);
            }
        }

        function dropEnemyPowerUp(enemy) {
            const availablePowerUpIds = (enemy.powerUps ?? []).filter(
                (powerUpId) => Number.isInteger(powerUpId) &&
                    powerUpId >= 0 && powerUpId < powerUpTextures.length
            );
            if (availablePowerUpIds.length === 0) {
                return false;
            }

            const playerDimensions = getPlayerDimensions();
            const candidates = [];

            for (let row = 0; row <= mapHeight - 2; row += 1) {
                for (let column = 0; column <= mapWidth - 2; column += 1) {
                    const isClearFootprint = [
                        mapGrid[row]?.[column],
                        mapGrid[row]?.[column + 1],
                        mapGrid[row + 1]?.[column],
                        mapGrid[row + 1]?.[column + 1]
                    ].every((tileId) => tileId === AIR_ID);
                    if (!isClearFootprint) {
                        continue;
                    }

                    const left = column * WORLD_TILE_SIZE;
                    const top = row * WORLD_TILE_SIZE;
                    const centerX = left + POWERUP_WORLD_SIZE / 2;
                    const centerY = top + POWERUP_WORLD_SIZE / 2;
                    const overlapsPlayer = !isPlayerDead &&
                        Math.abs(Player.x - centerX) <
                            (playerDimensions.width + POWERUP_WORLD_SIZE) / 2 &&
                        Math.abs(Player.y - centerY) <
                            (playerDimensions.height + POWERUP_WORLD_SIZE) / 2;
                    const overlapsEnemy = enemyTanks.some((otherEnemy) =>
                        otherEnemy.id !== enemy.id &&
                        Math.abs(otherEnemy.x - centerX) <
                            (playerDimensions.width + POWERUP_WORLD_SIZE) / 2 &&
                        Math.abs(otherEnemy.y - centerY) <
                            (playerDimensions.height + POWERUP_WORLD_SIZE) / 2
                    );

                    if (!overlapsPlayer && !overlapsEnemy) {
                        candidates.push({ row, column });
                    }
                }
            }

            if (candidates.length === 0) {
                return false;
            }

            const tile = candidates[Math.floor(Math.random() * candidates.length)];
            const powerUpId = availablePowerUpIds[
                Math.floor(Math.random() * availablePowerUpIds.length)
            ];
            powerUpsOnMap.push({
                ...tile,
                powerUpId,
                spawnedAt: performance.now()
            });
            playSoundEffect('powerUpAppeared');
            return true;
        }

        function defeatEnemy(
            enemy,
            shouldDropPowerUp = true,
            shouldDelayTntDetonation = false
        ) {
            const enemyIndex = enemyTanks.indexOf(enemy);
            if (enemyIndex < 0) {
                return;
            }

            if (enemy.isTnt === true) {
                playSoundEffect('tntExplosion');
            } else {
                playSoundEffect('enemyDestroyed');
            }
            explosions.push({
                x: enemy.x,
                y: enemy.y,
                startedAt: gameTime,
                type: 'tank'
            });
            if (shouldDropPowerUp) {
                dropEnemyPowerUp(enemy);
            }
            enemyTanks.splice(enemyIndex, 1);
            enemyRank9Bursts.delete(enemy.id);
            defeatedEnemyCount = Math.min(
                enemySpawnOrder.length,
                defeatedEnemyCount + 1
            );
            if (Number.isInteger(enemy.type) && enemy.type >= 1 && enemy.type <= 10) {
                defeatedEnemiesByRank[enemy.type] += 1;
            }
            updateEnemyLivesDisplay();
            if (enemy.isTnt === true) {
                if (shouldDelayTntDetonation) {
                    pendingTntDetonations.push({
                        enemy,
                        shouldDropPowerUp,
                        startedAt: gameTime,
                        detonatesAt: gameTime + TNT_CHAIN_DELAY_MS
                    });
                } else {
                    detonateEnemyTnt(enemy, shouldDropPowerUp);
                }
            }
            nextEnemySpawnAllowedAt = gameTime + 1000 + Math.random() * 4000;
            if (enemySpawnOrder.length > 0 &&
                defeatedEnemyCount >= enemySpawnOrder.length) {
                schedulePackWorldAutoAdvance();
            }
        }

        function getTankTopLeftTile(tankX, tankY) {
            const tileDimensions = getTileDimensions();
            return {
                column: Math.round(tankX / tileDimensions.width) - 1,
                row: Math.round(tankY / tileDimensions.height) - 1
            };
        }

        function detonateEnemyTnt(enemy, shouldDropPowerUps = true) {
            const { column, row } = getTankTopLeftTile(enemy.x, enemy.y);
            detonateTntBlast(column, row, shouldDropPowerUps);
        }

        function detonateTntBlast(column, row, shouldDropPowerUps = true) {
            const tileDimensions = getTileDimensions();
            const blast = {
                left: (column - 3) * tileDimensions.width,
                top: (row - 3) * tileDimensions.height,
                width: TNT_BLAST_TILE_SIZE * tileDimensions.width,
                height: TNT_BLAST_TILE_SIZE * tileDimensions.height
            };
            explosions.push({
                ...blast,
                startedAt: gameTime,
                type: 'tntBlast'
            });

            let mapChanged = false;
            const firstColumn = Math.max(0, column - 3);
            const firstRow = Math.max(0, row - 3);
            const lastColumn = Math.min(mapWidth - 1, column + 4);
            const lastRow = Math.min(mapHeight - 1, row + 4);
            for (let blastRow = firstRow; blastRow <= lastRow; blastRow += 1) {
                for (let blastColumn = firstColumn; blastColumn <= lastColumn; blastColumn += 1) {
                    const tileId = mapGrid[blastRow][blastColumn];
                    const element = getElementAnchor(blastRow, blastColumn);
                    const eagleAnchor = tileId === EAGLE_ID
                        ? { row: blastRow, column: blastColumn }
                        : element?.tileId === EAGLE_ID
                            ? element
                            : null;
                    if (eagleAnchor) {
                        destroyEagleAt(eagleAnchor);
                        continue;
                    }

                    const tntBlockAnchor = tileId === TNT_BLOCK_ID
                        ? { row: blastRow, column: blastColumn }
                        : element?.tileId === TNT_BLOCK_ID
                            ? element
                            : null;
                    if (tntBlockAnchor) {
                        triggerTntBlockByBlast(
                            tntBlockAnchor.row,
                            tntBlockAnchor.column
                        );
                    } else if (tileId === REINFORCED_BRICKS_ID) {
                        for (let subtile = 0; subtile < BRICK_SUBTILE_COUNT; subtile += 1) {
                            damageBrickSubtile(
                                blastRow,
                                blastColumn,
                                subtile,
                                REINFORCED_BRICK_EXPLOSION_DAMAGE
                            );
                        }
                        mapChanged = true;
                    } else if (BRICK_TILE_IDS.has(tileId)) {
                        for (let subtile = 0; subtile < BRICK_SUBTILE_COUNT; subtile += 1) {
                            damageBrickSubtile(blastRow, blastColumn, subtile);
                        }
                        mapChanged = true;
                    } else if (
                        tileId === SOLID_BLOCK_ID ||
                        tileId === ICE_ID
                    ) {
                        mapGrid[blastRow][blastColumn] = AIR_ID;
                        clearBrickDamage(blastRow, blastColumn);
                        mapChanged = true;
                    } else if (tileId === COMPACT_ICE_ID) {
                        mapGrid[blastRow][blastColumn] = ICE_ID;
                        clearBrickDamage(blastRow, blastColumn);
                        mapChanged = true;
                    } else if (
                        tileId === BUSH_ID ||
                        tileId === DENSE_BUSH_ID ||
                        tileId === VERY_DENSE_BUSH_ID
                    ) {
                        mapGrid[blastRow][blastColumn] = AIR_ID;
                        clearBrickDamage(blastRow, blastColumn);
                        mapChanged = true;
                    }
                }
            }
            if (mapChanged) {
                mapRenderVersion += 1;
                editorStaticLayerCache = null;
            }

            const overlapsBlast = (tankX, tankY) => {
                const dimensions = getPlayerDimensions();
                return tankX + dimensions.width / 2 > blast.left &&
                    tankX - dimensions.width / 2 < blast.left + blast.width &&
                    tankY + dimensions.height / 2 > blast.top &&
                    tankY - dimensions.height / 2 < blast.top + blast.height;
            };
            for (const target of [...enemyTanks]) {
                if (
                    target.textureType !== 'f' &&
                    overlapsBlast(target.x, target.y)
                ) {
                    defeatEnemy(target, shouldDropPowerUps, true);
                }
            }

            if (
                !isPlayerDead &&
                playerTextureType !== 'f' &&
                shouldDrawPlayerAfterSpawn &&
                overlapsBlast(Player.x, Player.y)
            ) {
                playerInvincibleUntil = 0;
                triggerPlayerDeath();
            }
        }

        function triggerTntBlock(row, column) {
            const key = `${row},${column}`;
            if (
                mapGrid[row]?.[column] !== TNT_BLOCK_ID ||
                tntBlockDetonations.has(key)
            ) {
                return false;
            }

            tntBlockDetonations.set(key, {
                detonatesAt: gameTime + TNT_BLOCK_FUSE_MS,
                startedAt: gameTime,
            });
            mapRenderVersion += 1;
            coveredElementCellsCache = null;
            coveredElementCellsCacheVersion = -1;
            return true;
        }

        function triggerTntBlockByBlast(row, column) {
            const key = `${row},${column}`;
            if (
                mapGrid[row]?.[column] !== TNT_BLOCK_ID ||
                tntBlockDetonations.has(key)
            ) {
                return false;
            }

            tntBlockDetonations.set(key, {
                detonatesAt: gameTime + TNT_CHAIN_DELAY_MS,
                startedAt: gameTime,
            });
            mapRenderVersion += 1;
            coveredElementCellsCache = null;
            coveredElementCellsCacheVersion = -1;
            return true;
        }

        function updatePendingTntBlockDetonations() {
            if (!isSimulationActive) {
                return;
            }

            for (const [key, detonation] of tntBlockDetonations) {
                if (gameTime < detonation.detonatesAt) {
                    continue;
                }

                const [row, column] = key.split(',').map(Number);
                if (mapGrid[row]?.[column] !== TNT_BLOCK_ID) {
                    tntBlockDetonations.delete(key);
                    continue;
                }

                tntBlockDetonations.delete(key);
                for (const cell of getElementFootprint(row, column, TNT_BLOCK_ID)) {
                    mapGrid[cell.row][cell.column] = AIR_ID;
                    clearBrickDamage(cell.row, cell.column);
                }
                mapRenderVersion += 1;
                coveredElementCellsCache = null;
                coveredElementCellsCacheVersion = -1;
                editorStaticLayerCache = null;
                playSoundEffect('tntExplosion');
                detonateTntBlast(column, row);
            }
        }

        function updatePendingTntDetonations() {
            if (!isSimulationActive) {
                return;
            }

            while (
                pendingTntDetonations.length > 0 &&
                gameTime >= pendingTntDetonations[0].detonatesAt
            ) {
                const { enemy, shouldDropPowerUp } = pendingTntDetonations.shift();
                detonateEnemyTnt(enemy, shouldDropPowerUp);
            }
        }

        function getTntDetonationBlinkFrame(startedAt, detonatesAt) {
            const duration = Math.max(1, detonatesAt - startedAt);
            const progress = Math.min(1, Math.max(0, (gameTime - startedAt) / duration));
            return Math.floor(progress ** 2 * 4) % 2;
        }

        function schedulePackWorldAutoAdvance() {
            const progressionStage = isPackPlayMode
                ? playingPackStage
                : editingPackStage;
            if (!progressionStage || !isSimulationActive || isGameOver) {
                return;
            }

            const pack = savedPacks.find((entry) => entry.id === progressionStage.packId);
            const world = pack?.worlds.find(
                (entry) => entry.id === progressionStage.worldId
            );
            if (world?.properties?.autoAdvance !== true) {
                return;
            }

            const currentStageIndex = world.stages.findIndex(
                (stage) => stage.id === progressionStage.stageId
            );
            if (currentStageIndex < 0) {
                return;
            }
            const nextStage = world.stages[currentStageIndex + 1];
            if (!nextStage) {
                return;
            }

            const currentStageId = progressionStage.stageId;
            window.clearTimeout(packWorldAutoAdvanceTimeout);
            const generation = ++packWorldAutoAdvanceGeneration;
            const advanceToNextStage = async () => {
                packWorldAutoAdvanceTimeout = 0;
                const activeStage = isPackPlayMode
                    ? playingPackStage
                    : editingPackStage;
                if (generation !== packWorldAutoAdvanceGeneration ||
                    !isSimulationActive || isGameOver ||
                    activeStage?.stageId !== currentStageId) {
                    return;
                }

                if (isPackPlayMode) {
                    levelScoreScreen.hidden = true;
                    stopLevelScoreAnimation();
                    levelTransitionBlack.hidden = false;
                    const currentStage = isPackPlayMode
                        ? playingPackStage
                        : editingPackStage;
                    if (generation !== packWorldAutoAdvanceGeneration ||
                        !isSimulationActive || isGameOver ||
                        currentStage?.stageId !== currentStageId) {
                        return;
                    }
                }

                levelCode.value = nextStage.code;
                if (!importLevel()) {
                    return;
                }
                hasUnsavedLevelChanges = false;
                const nextPackStage = {
                    packId: pack.id,
                    worldId: world.id,
                    stageId: nextStage.id
                };
                if (isPackPlayMode) {
                    playingPackStage = nextPackStage;
                } else {
                    editingPackStage = nextPackStage;
                }
                applyWorldProperties(world);
                if (isPackPlayMode) {
                    startSimulation(false, { deferSpawns: true });
                    if (!await playLevelIntro(nextStage.name || levelName.value.trim() || 'Stage')) {
                        return;
                    }
                    updateTouchControlsVisibility();
                    return;
                }
                startSimulation();
            };

            if (isPackPlayMode) {
                void animateLevelScoreScreen(generation, currentStageId)
                    .then((finished) => {
                        if (finished) {
                            return advanceToNextStage();
                        }
                    })
                    .catch((error) => {
                        console.error('Unable to animate the stage score.', error);
                    });
                return;
            }

            packWorldAutoAdvanceTimeout = window.setTimeout(
                () => void advanceToNextStage(),
                1200
            );
        }

        const levelScoreScreenModule = window.BC90ELevelScoreScreen;
        if (!levelScoreScreenModule) {
            throw new Error('The level score screen module did not load.');
        }
        levelScoreScreenUi = levelScoreScreenModule.createLevelScoreScreen({
            screen: levelScoreScreen,
            ranks: levelScoreRanks,
            total: levelScoreTotal,
            enemyTextures,
            moveFrameDuration: PLAYER_MOVE_FRAME_DURATION,
            pointsPerRank: ENEMY_RANK_SCORE_POINTS,
            playSoundEffect
        });
        const stopLevelScoreAnimation = levelScoreScreenUi.stop;
        const continueFromLevelScore = levelScoreScreenUi.continue;
        const animateLevelScoreScreen = (generation, currentStageId) =>
            levelScoreScreenUi.animate({
                isCurrent: () =>
                    generation === packWorldAutoAdvanceGeneration &&
                    isSimulationActive &&
                    !isGameOver &&
                    isPackPlayMode &&
                    playingPackStage?.stageId === currentStageId,
                defeatedEnemiesByRank
            });

        function restoreTemporarySteel() {
            if (!temporarySteelEffect) {
                return;
            }

            temporarySteelEffect.cells.forEach((cell) => {
                mapGrid[cell.row][cell.column] = cell.tileId;
                const key = `${cell.row},${cell.column}`;
                if (cell.brickDamage) {
                    brickDamage.set(key, new Map(cell.brickDamage));
                } else {
                    brickDamage.delete(key);
                }
            });
            temporarySteelEffect = null;
            mapRenderVersion += 1;
            coveredElementCellsCache = null;
            coveredElementCellsCacheVersion = -1;
        }

        function createTemporarySteel(protectiveTileId = SOLID_BLOCK_ID) {
            restoreTemporarySteel();
            const cells = [];
            const cellKeys = new Set();

            for (let eagleRow = 0; eagleRow < mapHeight; eagleRow += 1) {
                for (let eagleColumn = 0; eagleColumn < mapWidth; eagleColumn += 1) {
                    if (mapGrid[eagleRow][eagleColumn] !== EAGLE_ID) {
                        continue;
                    }

                    for (
                        let row = eagleRow - 1;
                        row <= eagleRow + LARGE_TILE_SIZE;
                        row += 1
                    ) {
                        for (
                            let column = eagleColumn - 1;
                            column <= eagleColumn + LARGE_TILE_SIZE;
                            column += 1
                        ) {
                            if (
                                row < 0 || row >= mapHeight ||
                                column < 0 || column >= mapWidth ||
                                (
                                    row >= eagleRow &&
                                    row < eagleRow + LARGE_TILE_SIZE &&
                                    column >= eagleColumn &&
                                    column < eagleColumn + LARGE_TILE_SIZE
                                )
                            ) {
                                continue;
                            }

                            const key = `${row},${column}`;
                            if (cellKeys.has(key) || getElementAnchor(row, column)) {
                                continue;
                            }

                            const tileId = mapGrid[row][column];
                            cells.push({
                                row,
                                column,
                                tileId,
                                brickDamage: brickDamage.has(key)
                                    ? new Map(brickDamage.get(key))
                                    : null
                            });
                            cellKeys.add(key);
                            mapGrid[row][column] = protectiveTileId;
                            brickDamage.delete(key);
                        }
                    }
                }
            }

            if (cells.length === 0) {
                return;
            }

            temporarySteelEffect = {
                cells,
                cellKeys,
                tileId: protectiveTileId,
                expiresAt: gameTime + 10000
            };
            mapRenderVersion += 1;
            coveredElementCellsCache = null;
            coveredElementCellsCacheVersion = -1;
        }

        function updateTemporarySteel() {
            if (temporarySteelEffect && gameTime >= temporarySteelEffect.expiresAt) {
                restoreTemporarySteel();
            }
        }

        function applyPowerUp(powerUpId) {
            if (powerUpId === 0) {
                playerInvincibleUntil = Math.max(playerInvincibleUntil, gameTime + 5000);
            } else if (powerUpId === 1) {
                enemyFrozenUntil = Math.max(enemyFrozenUntil, gameTime + 5000);
            } else if (powerUpId === 2) {
                createTemporarySteel();
            } else if (powerUpId === 4) {
                [...enemyTanks].forEach((enemy) => defeatEnemy(enemy, false));
            } else if (powerUpId === 5) {
                playerLives = Math.min(999, playerLives + 1);
                updatePlayerLivesDisplay();
            } else if (powerUpId === 3) {
                const rankProgression = [0, 1, 2, 3, 8, 10, 9];
                const currentRankIndex = rankProgression.indexOf(getPlayerTankType());
                if (currentRankIndex >= 0 && currentRankIndex < rankProgression.length - 1) {
                    setPlayerTankRank(rankProgression[currentRankIndex + 1]);
                }
            } else if (powerUpId === 6) {
                setPlayerTankRank(8);
            } else if (powerUpId === 7) {
                createTemporarySteel(REINFORCED_STEEL_ID);
            }
        }

        function updatePowerUpPickups() {
            const now = performance.now();
            for (let index = powerUpsOnMap.length - 1; index >= 0; index -= 1) {
                if (
                    now - powerUpsOnMap[index].spawnedAt >=
                    POWERUP_WORLD_LIFETIME_MS
                ) {
                    powerUpsOnMap.splice(index, 1);
                }
            }

            if (!isSimulationActive || isPlayerDead || !shouldDrawPlayerAfterSpawn) {
                return;
            }

            const playerDimensions = getPlayerDimensions();
            const playerLeft = Player.x - playerDimensions.width / 2;
            const playerRight = Player.x + playerDimensions.width / 2;
            const playerTop = Player.y - playerDimensions.height / 2;
            const playerBottom = Player.y + playerDimensions.height / 2;

            for (let index = powerUpsOnMap.length - 1; index >= 0; index -= 1) {
                const powerUp = powerUpsOnMap[index];
                const powerUpLeft = powerUp.column * WORLD_TILE_SIZE;
                const powerUpTop = powerUp.row * WORLD_TILE_SIZE;
                const overlapsPlayer =
                    playerRight > powerUpLeft &&
                    playerLeft < powerUpLeft + POWERUP_WORLD_SIZE &&
                    playerBottom > powerUpTop &&
                    playerTop < powerUpTop + POWERUP_WORLD_SIZE;

                if (overlapsPlayer) {
                    powerUpsOnMap.splice(index, 1);
                    playSoundEffect(powerUp.powerUpId === 5
                        ? 'playerLifeCollected'
                        : 'powerUpCollected');
                    applyPowerUp(powerUp.powerUpId);
                    break;
                }
            }
        }

        function drawPowerUps() {
            const now = performance.now();
            powerUpsOnMap.forEach(({ row, column, powerUpId, spawnedAt }) => {
                const age = Math.max(0, now - spawnedAt);
                const blinkDurationSlope = (
                    POWERUP_WORLD_MIN_BLINK_DURATION - POWERUP_WORLD_BLINK_DURATION
                ) / POWERUP_WORLD_LIFETIME_MS;
                const currentBlinkDuration = Math.max(
                    POWERUP_WORLD_MIN_BLINK_DURATION,
                    POWERUP_WORLD_BLINK_DURATION +
                        blinkDurationSlope * Math.min(age, POWERUP_WORLD_LIFETIME_MS)
                );
                const blinkPhase = Math.log(
                    currentBlinkDuration / POWERUP_WORLD_BLINK_DURATION
                ) / blinkDurationSlope;
                if (Math.floor(blinkPhase) % 2 === 1) {
                    return;
                }
                const texture = powerUpTextures[powerUpId];
                if (!texture) {
                    return;
                }

                context.drawImage(
                    texture,
                    column * WORLD_TILE_SIZE,
                    row * WORLD_TILE_SIZE,
                    POWERUP_WORLD_SIZE,
                    POWERUP_WORLD_SIZE
                );
            });
        }

        function drawPixelDigitOnTile(
            tileId,
            tileX,
            tileY,
            tileWidth,
            tileHeight,
            targetContext = context
        ) {
            const label = PIXEL_TILE_LABELS[tileId];

            if (!label) {
                return;
            }

            pixelLabels.draw(label, tileX, tileY, tileWidth, tileHeight, targetContext);
        }

        function createTileCounters() {
            return mapValidation.createTileCounters();
        }

        function countRestrictedTiles(grid) {
            return mapValidation.countRestrictedTiles(grid);
        }

        function isLargeTile(tileId) {
            return tileId === EAGLE_ID ||
                tileId === TNT_BLOCK_ID ||
                tileId === PLAYER_INITIAL_SPAWN_ID ||
                tileId === PLAYER_RESPAWN_ID ||
                ENEMY_SPAWN_IDS.includes(tileId);
        }

        function getRoadTileState(tileId) {
            return ROAD_TILE_STATE_BY_ID.get(tileId) ?? null;
        }

        function getElementFootprintSize(tileId) {
            if (isLargeTile(tileId)) {
                return { width: LARGE_TILE_SIZE, height: LARGE_TILE_SIZE };
            }
            return ROAD_TILE_FOOTPRINTS.get(tileId) ?? { width: 1, height: 1 };
        }

        function isMultiCellElement(tileId) {
            const { width, height } = getElementFootprintSize(tileId);
            return width > 1 || height > 1;
        }

        function getElementAnchor(row, column) {
            for (let anchorRow = Math.max(0, row - LARGE_TILE_SIZE + 1); anchorRow <= row; anchorRow += 1) {
                for (let anchorColumn = Math.max(0, column - LARGE_TILE_SIZE + 1); anchorColumn <= column; anchorColumn += 1) {
                    const tileId = mapGrid[anchorRow]?.[anchorColumn];
                    const size = getElementFootprintSize(tileId);
                    if (
                        isMultiCellElement(tileId) &&
                        row < anchorRow + size.height &&
                        column < anchorColumn + size.width
                    ) {
                        return { row: anchorRow, column: anchorColumn, tileId };
                    }
                }
            }

            return null;
        }

        function getElementFootprint(row, column, tileId) {
            const size = getElementFootprintSize(tileId);
            const footprint = [];

            for (let rowOffset = 0; rowOffset < size.height; rowOffset += 1) {
                for (let columnOffset = 0; columnOffset < size.width; columnOffset += 1) {
                    footprint.push({
                        row: row + rowOffset,
                        column: column + columnOffset
                    });
                }
            }

            return footprint;
        }

        function getPlayerSpawnPlacementTileId() {
            if (tileCounters[PLAYER_INITIAL_SPAWN_ID] === 0) {
                return PLAYER_INITIAL_SPAWN_ID;
            }

            if (tileCounters[PLAYER_RESPAWN_ID] === 0) {
                return PLAYER_RESPAWN_ID;
            }

            return null;
        }

        function getEnemySpawnPlacementTileId() {
            return ENEMY_SPAWN_IDS.find((tileId) => tileCounters[tileId] === 0) ?? null;
        }

        function findTilePosition(tileId) {
            for (let row = 0; row < mapHeight; row += 1) {
                for (let column = 0; column < mapWidth; column += 1) {
                    if (mapGrid[row][column] === tileId) {
                        return { row, column };
                    }
                }
            }

            return null;
        }

        function promotePlayerRespawnAfterRemoval() {
            const respawnPosition = findTilePosition(PLAYER_RESPAWN_ID);

            if (!respawnPosition) {
                return;
            }

            mapGrid[respawnPosition.row][respawnPosition.column] = PLAYER_INITIAL_SPAWN_ID;
            tileCounters[PLAYER_RESPAWN_ID] -= 1;
            tileCounters[PLAYER_INITIAL_SPAWN_ID] += 1;
        }

        function promoteEnemySpawnsAfterRemoval(removedTileId) {
            const removedIndex = ENEMY_SPAWN_IDS.indexOf(removedTileId);
            if (removedIndex < 0) {
                return;
            }

            for (let index = removedIndex + 1; index < ENEMY_SPAWN_IDS.length; index += 1) {
                const currentTileId = ENEMY_SPAWN_IDS[index];
                const position = findTilePosition(currentTileId);
                if (position) {
                    const promotedTileId = ENEMY_SPAWN_IDS[index - 1];
                    mapGrid[position.row][position.column] = promotedTileId;
                    tileCounters[currentTileId] -= 1;
                    tileCounters[promotedTileId] += 1;
                }
            }
        }

        function clearElementAt(row, column) {
            const element = getElementAnchor(row, column);

            if (!element) {
                return false;
            }

            const removedTileId = element.tileId;
            mapGrid[element.row][element.column] = AIR_ID;
            if (Object.hasOwn(tileCounters, removedTileId)) {
                tileCounters[removedTileId] -= 1;
            }

            if (removedTileId === PLAYER_INITIAL_SPAWN_ID && tileCounters[PLAYER_RESPAWN_ID] > 0) {
                promotePlayerRespawnAfterRemoval();
            }

            if (removedTileId === PLAYER_RESPAWN_ID && tileCounters[PLAYER_INITIAL_SPAWN_ID] === 0) {
                const respawnPosition = findTilePosition(PLAYER_RESPAWN_ID);

                if (respawnPosition) {
                    mapGrid[respawnPosition.row][respawnPosition.column] = PLAYER_INITIAL_SPAWN_ID;
                    tileCounters[PLAYER_RESPAWN_ID] -= 1;
                    tileCounters[PLAYER_INITIAL_SPAWN_ID] += 1;
                }
            }

            if (ENEMY_SPAWN_IDS.includes(removedTileId)) {
                promoteEnemySpawnsAfterRemoval(removedTileId);
            }

            mapRenderVersion += 1;
            return true;
        }

        function validateLargeTileFootprints(grid, width, height) {
            return mapValidation.validateLargeTileFootprints(grid, width, height);
        }

        function replaceMap(width, height, nextGrid) {
            mapWidth = width;
            mapHeight = height;
            mapGrid = nextGrid;
            brickDamage.clear();
            tntBlockDetonations.clear();
            clearSelection();
            mapRenderVersion += 1;
            mapWidthInput.value = width;
            mapHeightInput.value = height;

            const nextCounters = countRestrictedTiles(mapGrid);
            Object.keys(tileCounters).forEach((tileId) => {
                tileCounters[tileId] = nextCounters[tileId];
            });
        }

        const mapResizerApi = window.BC90EMapResizer;
        if (!mapResizerApi) {
            throw new Error('The map resizer module did not load.');
        }
        const { resizeMap } = mapResizerApi.createMapResizer({
            widthInput: mapWidthInput,
            heightInput: mapHeightInput,
            maxDimension: MAX_MAP_DIMENSION,
            airTileId: AIR_ID,
            getMapState: () => ({ width: mapWidth, height: mapHeight, grid: mapGrid }),
            createMap,
            validateFootprints: validateLargeTileFootprints,
            isSimulationActive: () => isSimulationActive,
            stopSimulation,
            showMessage,
            replaceMap,
            resetZoom: () => mapCamera.setZoom(100, false),
            resizeCanvas
        });

        function getTileIdForEvent(event) {
            return isEraserMode || event.buttons === 2 || event.button === 2
                ? AIR_ID
                : selectedTileId;
        }

        function isSpawnerTile(tileId) {
            return tileId === PLAYER_INITIAL_SPAWN_ID ||
                tileId === PLAYER_RESPAWN_ID ||
                ENEMY_SPAWN_IDS.includes(tileId);
        }

        function getCanvasDimensions() {
            return {
                width: mapWidth * WORLD_TILE_SIZE,
                height: mapHeight * WORLD_TILE_SIZE
            };
        }

        function getTileDimensions() {
            const canvasDimensions = getCanvasDimensions();

            return {
                width: canvasDimensions.width / mapWidth,
                height: canvasDimensions.height / mapHeight
            };
        }

        function getSubTileDimensions() {
            const tileDimensions = getTileDimensions();

            return {
                width: tileDimensions.width / SUB_TILES_PER_TILE,
                height: tileDimensions.height / SUB_TILES_PER_TILE
            };
        }

        function getPlayerDimensions() {
            const subTileDimensions = getSubTileDimensions();

            return {
                width: subTileDimensions.width * PLAYER_SIZE_IN_SUB_TILES,
                height: subTileDimensions.height * PLAYER_SIZE_IN_SUB_TILES
            };
        }

        function findTileCenter(tileId) {
            for (let row = 0; row < mapHeight; row += 1) {
                for (let column = 0; column < mapWidth; column += 1) {
                    if (mapGrid[row][column] === tileId) {
                        const tileDimensions = getTileDimensions();
                        const elementSize = isLargeTile(tileId)
                            ? LARGE_TILE_SIZE
                            : 1;

                        return {
                            x: (column + elementSize / 2) * tileDimensions.width,
                            y: (row + elementSize / 2) * tileDimensions.height
                        };
                    }
                }
            }

            return null;
        }

        function getActivePlayerSpawnTileId() {
            if (playerHasRespawned && tileCounters[PLAYER_RESPAWN_ID] > 0) {
                return PLAYER_RESPAWN_ID;
            }

            return PLAYER_INITIAL_SPAWN_ID;
        }

        function resetPlayerToSpawn() {
            const spawnCenter = findTileCenter(getActivePlayerSpawnTileId());

            if (spawnCenter) {
                const quantizedSpawn = quantizeWorldPosition(
                    spawnCenter.x,
                    spawnCenter.y
                );
                Player.x = quantizedSpawn.x;
                Player.y = quantizedSpawn.y;
                Player.physicsX = spawnCenter.x;
                Player.physicsY = spawnCenter.y;
            }

            Player.direction = 'UP';
            Player.isMoving = false;
            requestedDirection = null;
            clearPlayerSliding();
        }

        function takeSimulationSnapshot() {
            return {
                mapGrid: mapGrid.map((row) => row.slice()),
                brickDamage: new Map(
                    Array.from(brickDamage.entries()).map(([key, damagedSubtiles]) => [
                        key,
                        new Map(damagedSubtiles)
                    ])
                )
            };
        }

        function restoreSimulationSnapshot(snapshot) {
            if (!snapshot) {
                return;
            }

            mapGrid = snapshot.mapGrid.map((row) => row.slice());
            brickDamage.clear();
            snapshot.brickDamage.forEach((damagedSubtiles, key) => {
                brickDamage.set(key, new Map(damagedSubtiles));
            });
            mapRenderVersion += 1;
            coveredElementCellsCache = null;
            coveredElementCellsCacheVersion = -1;
        }

        function getPlayerSpawnAreaBounds(spawnTileId) {
            const spawnCenter = findTileCenter(spawnTileId);
            if (!spawnCenter) {
                return null;
            }

            const tileDimensions = getTileDimensions();
            const halfWidth = tileDimensions.width * LARGE_TILE_SIZE / 2;
            const halfHeight = tileDimensions.height * LARGE_TILE_SIZE / 2;

            return {
                left: spawnCenter.x - halfWidth,
                right: spawnCenter.x + halfWidth,
                top: spawnCenter.y - halfHeight,
                bottom: spawnCenter.y + halfHeight
            };
        }

        function moveEnemyBesidePlayerSpawn(enemy, spawnTileId) {
            const spawnBounds = getPlayerSpawnAreaBounds(spawnTileId);
            if (!spawnBounds) {
                return false;
            }

            const enemyDimensions = getPlayerDimensions();
            const enemyHalfWidth = enemyDimensions.width / 2;
            const enemyHalfHeight = enemyDimensions.height / 2;
            const overlapsSpawn = enemy.x - enemyHalfWidth < spawnBounds.right &&
                enemy.x + enemyHalfWidth > spawnBounds.left &&
                enemy.y - enemyHalfHeight < spawnBounds.bottom &&
                enemy.y + enemyHalfHeight > spawnBounds.top;

            if (!overlapsSpawn) {
                return true;
            }

            const tileDimensions = getTileDimensions();
            const spawnCenterX = (spawnBounds.left + spawnBounds.right) / 2;
            const spawnCenterY = (spawnBounds.top + spawnBounds.bottom) / 2;
            const sideOffsetX = tileDimensions.width * LARGE_TILE_SIZE;
            const sideOffsetY = tileDimensions.height * LARGE_TILE_SIZE;
            const candidates = [
                { x: spawnCenterX - sideOffsetX, y: spawnCenterY },
                { x: spawnCenterX + sideOffsetX, y: spawnCenterY },
                { x: spawnCenterX, y: spawnCenterY - sideOffsetY },
                { x: spawnCenterX, y: spawnCenterY + sideOffsetY }
            ];

            const candidate = candidates.find((position) => !checkTankCollisionAt(
                position.x,
                position.y,
                enemy.direction,
                enemyDimensions,
                enemy,
                false
            ));

            if (!candidate) {
                return false;
            }

            const horizontalDistance = Math.abs(candidate.x - enemy.x);
            const verticalDistance = Math.abs(candidate.y - enemy.y);
            enemy.direction = horizontalDistance >= verticalDistance
                ? candidate.x < enemy.x ? 'LEFT' : 'RIGHT'
                : candidate.y < enemy.y ? 'UP' : 'DOWN';
            clearEnemySliding(enemy);
            enemy.pauseUntil = 0;
            enemy.substate = 'Normal';
            enemy.remainingDistance = Math.max(
                1,
                Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y) /
                    getTileDimensions().width
            );
            return true;
        }

        function preparePlayerSpawnArea(spawnTileId) {
            return enemyTanks.every((enemy) => moveEnemyBesidePlayerSpawn(enemy, spawnTileId));
        }

        function movePlayerBesideEnemySpawn(spawnCenter) {
            const tileDimensions = getTileDimensions();
            const playerDimensions = getPlayerDimensions();
            const halfWidth = playerDimensions.width / 2;
            const halfHeight = playerDimensions.height / 2;
            const spawnHalfWidth = tileDimensions.width * LARGE_TILE_SIZE / 2;
            const spawnHalfHeight = tileDimensions.height * LARGE_TILE_SIZE / 2;
            const overlapsSpawn = Player.x - halfWidth < spawnCenter.x + spawnHalfWidth &&
                Player.x + halfWidth > spawnCenter.x - spawnHalfWidth &&
                Player.y - halfHeight < spawnCenter.y + spawnHalfHeight &&
                Player.y + halfHeight > spawnCenter.y - spawnHalfHeight;

            if (!overlapsSpawn) {
                return true;
            }

            const sideOffsetX = tileDimensions.width * LARGE_TILE_SIZE;
            const sideOffsetY = tileDimensions.height * LARGE_TILE_SIZE;
            const candidates = [
                { x: spawnCenter.x - sideOffsetX, y: spawnCenter.y },
                { x: spawnCenter.x + sideOffsetX, y: spawnCenter.y },
                { x: spawnCenter.x, y: spawnCenter.y - sideOffsetY },
                { x: spawnCenter.x, y: spawnCenter.y + sideOffsetY }
            ];
            const candidate = candidates.find((position) => !checkTankCollisionAt(
                position.x,
                position.y,
                Player.direction,
                playerDimensions,
                Player,
                false
            ));

            if (!candidate) {
                return false;
            }

            Player.physicsX = candidate.x;
            Player.physicsY = candidate.y;
            Player.x = candidate.x;
            Player.y = candidate.y;
            return true;
        }

        function isEnemyOccupyingSpawn(enemy, tileId) {
            const spawnBounds = getPlayerSpawnAreaBounds(tileId);
            if (!spawnBounds) {
                return false;
            }

            const enemyDimensions = getPlayerDimensions();
            const halfWidth = enemyDimensions.width / 2;
            const halfHeight = enemyDimensions.height / 2;
            return enemy.x - halfWidth < spawnBounds.right &&
                enemy.x + halfWidth > spawnBounds.left &&
                enemy.y - halfHeight < spawnBounds.bottom &&
                enemy.y + halfHeight > spawnBounds.top;
        }

        function beginPendingPlayerRespawn() {
            if (isPlayerDead || !playerRespawnPending) {
                return;
            }

            playerHasRespawned = Boolean(findTileCenter(PLAYER_RESPAWN_ID));
            const spawnTileId = getActivePlayerSpawnTileId();
            preparePlayerSpawnArea(spawnTileId);

            resetPlayerToSpawn();
            playerSpawnIntroStart = gameTime + PLAYER_DEATH_RESPAWN_DELAY_MS;
            playerInvincibleUntil = playerSpawnIntroStart + 4000;
            playerSpawnIntroUntil = playerSpawnIntroStart + (
                PLAYER_SPAWN_SEQUENCE.length * SPAWN_ANIMATION_FRAME_DURATION
            );
            playerRespawnPending = false;
        }

        function triggerPlayerDeath() {
            if (!isSimulationActive || isPlayerDead || playerRespawnIntroActive) {
                return;
            }

            setPlayerTankRank(0);
            const deathPosition = { x: Player.x, y: Player.y };
            if (playerLives === 0) {
                playerRespawnIntroActive = false;
                playerRespawnPending = false;
                shouldDrawPlayerAfterSpawn = false;
                const deathSound = playSoundEffect('enemyDestroyed');
                setGameOver(deathSound, 'lives');
                return;
            }

            playerLives -= 1;
            updatePlayerLivesDisplay();
            playerRespawnIntroActive = true;
            shouldDrawPlayerAfterSpawn = false;
            Player.isMoving = false;
            requestedDirection = null;
            clearPlayerSliding();
            playerRespawnPending = true;
            playerSpawnIntroStart = 0;
            playerSpawnIntroUntil = 0;
            playerInvincibleUntil = 0;
            playSoundEffect('enemyDestroyed');
            explosions.push({
                x: deathPosition.x,
                y: deathPosition.y,
                startedAt: gameTime,
                type: 'tank'
            });

        }

        function normalizeKeyName(key) {
            if (typeof key !== 'string') {
                return key;
            }
            return key.length === 1 ? key.toLowerCase() : key;
        }

        function getDirectionForKey(key) {
            return gameCore.getDirectionForKey(key);
        }

        function isEditableTextTarget(target) {
            return target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                (target instanceof HTMLElement && target.isContentEditable);
        }

        function restoreRequestedDirection(releasedDirection) {
            requestedDirection = gameCore.getRequestedDirectionAfterRelease(
                requestedDirection,
                releasedDirection,
                Array.from(pressedKeys).reverse(),
                Array.from(activeTouchDirections.values())
            );
        }

        function getNearestTankGridLine(position, subTileSize) {
            return gameCore.getNearestTankGridLine(
                position,
                subTileSize,
                MAGNET_STEP_IN_SUB_TILES
            );
        }

        function getMagnetCandidates(
            position,
            subTileSize,
            magnetStep = OBSTACLE_MAGNET_STEP_IN_SUB_TILES
        ) {
            return gameCore.getMagnetCandidates(
                position,
                subTileSize,
                magnetStep,
                MAGNET_STEP_IN_SUB_TILES
            );
        }

        function isSolidTile(tileId) {
            return SOLID_TILE_IDS.has(tileId);
        }

        function getBrickSubtileIndex(pixelX, pixelY, column, row) {
            const tileDimensions = getTileDimensions();
            const tileLeft = column * tileDimensions.width;
            const tileTop = row * tileDimensions.height;
            const subtileWidth = tileDimensions.width / BRICK_SUBTILE_GRID_SIZE;
            const subtileHeight = tileDimensions.height / BRICK_SUBTILE_GRID_SIZE;
            const subtileColumn = Math.floor((pixelX - tileLeft) / subtileWidth);
            const subtileRow = Math.floor((pixelY - tileTop) / subtileHeight);

            if (
                subtileColumn < 0 || subtileColumn >= BRICK_SUBTILE_GRID_SIZE ||
                subtileRow < 0 || subtileRow >= BRICK_SUBTILE_GRID_SIZE
            ) {
                return -1;
            }

            return subtileRow * BRICK_SUBTILE_GRID_SIZE + subtileColumn;
        }

        function getBrickSubtileHits(row, column, subtileIndex) {
            return brickDamage.get(`${row},${column}`)?.get(subtileIndex) ?? 0;
        }

        function isBrickSubtileIntact(row, column, subtileIndex) {
            const tileId = mapGrid[row]?.[column];
            const hitPoints = tileId === REINFORCED_BRICKS_ID
                ? REINFORCED_BRICK_HIT_POINTS
                : 1;

            return getBrickSubtileHits(row, column, subtileIndex) < hitPoints;
        }

        function damageBrickSubtile(row, column, subtileIndex, damageAmount = 1) {
            if (subtileIndex < 0) {
                return false;
            }

            const key = `${row},${column}`;
            const damagedSubtiles = brickDamage.get(key) ?? new Map();
            const nextHits = getBrickSubtileHits(row, column, subtileIndex) + damageAmount;
            damagedSubtiles.set(subtileIndex, nextHits);

            const hitPoints = mapGrid[row]?.[column] === REINFORCED_BRICKS_ID
                ? REINFORCED_BRICK_HIT_POINTS
                : 1;
            const destroyedSubtiles = Array.from(damagedSubtiles.values())
                .filter((hits) => hits >= hitPoints).length;

            if (destroyedSubtiles >= BRICK_SUBTILE_COUNT) {
                mapGrid[row][column] = AIR_ID;
                brickDamage.delete(key);
                mapRenderVersion += 1;
            } else {
                brickDamage.set(key, damagedSubtiles);
            }

            return true;
        }

        function clearBrickDamage(row, column) {
            brickDamage.delete(`${row},${column}`);
        }

        function isBlockingTileAt(row, column, pixelX, pixelY) {
            const tileId = mapGrid[row]?.[column];
            const element = getElementAnchor(row, column);
            const blockingTileId = isSolidTile(tileId) ? tileId : element?.tileId;

            if (!isSolidTile(blockingTileId)) {
                return false;
            }

            if (BRICK_TILE_IDS.has(blockingTileId)) {
                const subtileIndex = getBrickSubtileIndex(pixelX, pixelY, column, row);
                return isBrickSubtileIntact(row, column, subtileIndex);
            }

            return true;
        }

        function isPlayerTouchingTile(tileId, centerX = Player.x, centerY = Player.y) {
            const subTileDimensions = getSubTileDimensions();
            let touching = false;

            forEachPlayerHitboxPixel('object', centerX, centerY, (pixelX, pixelY) => {
                if (touching) {
                    return;
                }

                const subTileColumn = Math.floor(pixelX / subTileDimensions.width);
                const subTileRow = Math.floor(pixelY / subTileDimensions.height);
                const row = Math.floor(subTileRow / SUB_TILES_PER_TILE);
                const column = Math.floor(subTileColumn / SUB_TILES_PER_TILE);

                if (mapGrid[row]?.[column] === tileId) {
                    touching = true;
                }
            });

            return touching;
        }

        function isPlayerTouchingRoute(centerX = Player.x, centerY = Player.y) {
            const subTileDimensions = getSubTileDimensions();
            let touching = false;
            forEachPlayerHitboxPixel('object', centerX, centerY, (pixelX, pixelY) => {
                if (touching) {
                    return;
                }
                const column = Math.floor(
                    Math.floor(pixelX / subTileDimensions.width) / SUB_TILES_PER_TILE
                );
                const row = Math.floor(
                    Math.floor(pixelY / subTileDimensions.height) / SUB_TILES_PER_TILE
                );
                const routeAnchor = getElementAnchor(row, column);
                if (
                    ROAD_TILE_IDS.has(mapGrid[row]?.[column]) ||
                    ROAD_TILE_IDS.has(routeAnchor?.tileId)
                ) {
                    touching = true;
                }
            });
            return touching;
        }

        function isEnemyTouchingTile(tileId, enemy, centerX = enemy.x, centerY = enemy.y) {
            const subTileDimensions = getSubTileDimensions();
            const enemyDimensions = getPlayerDimensions();
            let touching = false;

            forEachTankHitboxPixel(
                PLAYER_HITBOX_MASKS.object,
                centerX,
                centerY,
                enemy.direction ?? 'UP',
                enemyDimensions,
                (pixelX, pixelY) => {
                    if (touching) {
                        return;
                    }

                    const subTileColumn = Math.floor(pixelX / subTileDimensions.width);
                    const subTileRow = Math.floor(pixelY / subTileDimensions.height);
                    const row = Math.floor(subTileRow / SUB_TILES_PER_TILE);
                    const column = Math.floor(subTileColumn / SUB_TILES_PER_TILE);

                    if (mapGrid[row]?.[column] === tileId) {
                        touching = true;
                    }
                }
            );

            return touching;
        }

        function clearPlayerSliding() {
            slidingDirection = null;
            slidingDistance = 0;
            slidingOnCompactIce = false;
            isPlayerWaitingAfterIceSlide = false;
        }

        function playIceTurnSound(
            wasMoving,
            previousDirection,
            movementDirection,
            wasTouchingIce
        ) {
            if (
                !wasMoving &&
                wasTouchingIce &&
                previousDirection !== movementDirection
            ) {
                playSoundEffect('iceTurn');
            }
        }

        function updatePlayerSlidingAfterMovement(direction, movement) {
            const touchingIce = isPlayerTouchingTile(ICE_ID);
            const touchingCompactIce = isPlayerTouchingTile(COMPACT_ICE_ID);

            if (touchingCompactIce) {
                slidingDirection = direction;
                slidingDistance = 0;
                slidingOnCompactIce = true;
                return;
            }
            if (slidingOnCompactIce) {
                if (touchingIce) {
                    slidingDirection = direction;
                    slidingDistance = 0;
                    slidingOnCompactIce = false;
                } else {
                    clearPlayerSliding();
                }
                return;
            }
            if (slidingDirection) {
                if (!touchingIce) {
                    clearPlayerSliding();
                    return;
                }
                slidingDirection = direction;
                slidingDistance += movement / getTileDimensions().width;
                if (slidingDistance >= ICE_SLIDE_DISTANCE_TILES) {
                    clearPlayerSliding();
                    isPlayerWaitingAfterIceSlide = true;
                }
            } else if (touchingIce) {
                slidingDirection = direction;
                slidingDistance = 0;
            }
        }

        function clearEnemySliding(enemy) {
            enemy.slidingDirection = null;
            enemy.slidingDistance = 0;
            enemy.slidingOnCompactIce = false;
        }

        function updateEnemySlidingAfterMovement(enemy, direction, movement) {
            const touchingIce = isEnemyTouchingTile(ICE_ID, enemy);
            const touchingCompactIce = isEnemyTouchingTile(COMPACT_ICE_ID, enemy);

            if (touchingCompactIce) {
                enemy.slidingDirection = direction;
                enemy.slidingDistance = 0;
                enemy.slidingOnCompactIce = true;
                return;
            }
            if (enemy.slidingOnCompactIce) {
                if (touchingIce) {
                    enemy.slidingDirection = direction;
                    enemy.slidingDistance = 0;
                    enemy.slidingOnCompactIce = false;
                } else {
                    clearEnemySliding(enemy);
                }
                return;
            }
            if (enemy.slidingDirection) {
                if (!touchingIce) {
                    clearEnemySliding(enemy);
                    enemy.remainingDistance = 0;
                    return;
                }
                enemy.slidingDirection = direction;
                enemy.slidingDistance += movement / getTileDimensions().width;
                if (enemy.slidingDistance >= ICE_SLIDE_DISTANCE_TILES) {
                    clearEnemySliding(enemy);
                    enemy.remainingDistance = 0;
                }
            } else if (touchingIce) {
                enemy.slidingDirection = direction;
                enemy.slidingDistance = 0;
            }
        }

        function isEnemyTouchingRoute(enemy, centerX = enemy.x, centerY = enemy.y) {
            const subTileDimensions = getSubTileDimensions();
            const enemyDimensions = getPlayerDimensions();
            let touching = false;
            forEachTankHitboxPixel(
                PLAYER_HITBOX_MASKS.object,
                centerX,
                centerY,
                enemy.direction ?? 'UP',
                enemyDimensions,
                (pixelX, pixelY) => {
                    if (touching) {
                        return;
                    }
                    const column = Math.floor(
                        Math.floor(pixelX / subTileDimensions.width) / SUB_TILES_PER_TILE
                    );
                    const row = Math.floor(
                        Math.floor(pixelY / subTileDimensions.height) / SUB_TILES_PER_TILE
                    );
                    const routeAnchor = getElementAnchor(row, column);
                    if (
                        ROAD_TILE_IDS.has(mapGrid[row]?.[column]) ||
                        ROAD_TILE_IDS.has(routeAnchor?.tileId)
                    ) {
                        touching = true;
                    }
                }
            );
            return touching;
        }

        function isBulletTouchingTile(bullet, tileId) {
            let touching = false;

            forEachBulletHitboxPixel(bullet, 'object', (pixelX, pixelY) => {
                if (touching) {
                    return;
                }

                const subTileDimensions = getSubTileDimensions();
                const subTileColumn = Math.floor(pixelX / subTileDimensions.width);
                const subTileRow = Math.floor(pixelY / subTileDimensions.height);
                const row = Math.floor(subTileRow / SUB_TILES_PER_TILE);
                const column = Math.floor(subTileColumn / SUB_TILES_PER_TILE);

                if (mapGrid[row]?.[column] === tileId) {
                    touching = true;
                }
            });

            return touching;
        }

        function forEachTankHitboxPixel(mask, centerX, centerY, direction, tankDimensions, callback) {
            const pixelWidth = tankDimensions.width / PLAYER_HITBOX_GRID_SIZE;
            const pixelHeight = tankDimensions.height / PLAYER_HITBOX_GRID_SIZE;
            const halfWidth = tankDimensions.width / 2;
            const halfHeight = tankDimensions.height / 2;
            const rotationByDirection = {
                UP: 0,
                RIGHT: Math.PI / 2,
                DOWN: Math.PI,
                LEFT: -Math.PI / 2
            };
            const rotation = rotationByDirection[direction] ?? 0;
            const cosine = Math.cos(rotation);
            const sine = Math.sin(rotation);

            mask.forEach((row, rowIndex) => {
                Array.from(row).forEach((filled, columnIndex) => {
                    if (filled === '1') {
                        const localX = -halfWidth + (columnIndex + 0.5) * pixelWidth;
                        const localY = -halfHeight + (rowIndex + 0.5) * pixelHeight;
                        callback(
                            centerX + localX * cosine - localY * sine,
                            centerY + localX * sine + localY * cosine,
                            pixelWidth,
                            pixelHeight
                        );
                    }
                });
            });
        }

        function forEachPlayerHitboxPixel(hitboxName, centerX, centerY, callback) {
            const mask = PLAYER_HITBOX_MASKS[hitboxName];
            const playerDimensions = getPlayerDimensions();
            forEachTankHitboxPixel(
                mask,
                centerX,
                centerY,
                Player.direction,
                playerDimensions,
                callback
            );
        }

        function checkTankCollisionAt(
            nextX,
            nextY,
            direction,
            tankDimensions = getPlayerDimensions(),
            ignoreTank = null,
            includePlayer = true
        ) {
            const canvasDimensions = getCanvasDimensions();
            const subTileDimensions = getSubTileDimensions();
            const virtualGridWidth = mapWidth * SUB_TILES_PER_TILE;
            const virtualGridHeight = mapHeight * SUB_TILES_PER_TILE;
            const enemyAlreadyOccupiesPlayerSpawn = enemyTanks.includes(ignoreTank) &&
                isEnemyOccupyingSpawn(ignoreTank, getActivePlayerSpawnTileId());
            const spawnBarrierBounds = enemyTanks.includes(ignoreTank) &&
                playerRespawnIntroActive &&
                playerSpawnIntroStart > 0 &&
                !enemyAlreadyOccupiesPlayerSpawn
                ? getPlayerSpawnAreaBounds(getActivePlayerSpawnTileId())
                : null;
            let collision = false;

            forEachTankHitboxPixel(
                PLAYER_HITBOX_MASKS.object,
                nextX,
                nextY,
                direction,
                tankDimensions,
                (pixelX, pixelY) => {
                    if (collision) {
                        return;
                    }

                    const subTileColumn = Math.floor(pixelX / subTileDimensions.width);
                    const subTileRow = Math.floor(pixelY / subTileDimensions.height);

                    if (
                        pixelX < 0 || pixelY < 0 ||
                        pixelX >= canvasDimensions.width ||
                        pixelY >= canvasDimensions.height ||
                        subTileColumn < 0 ||
                        subTileColumn >= virtualGridWidth ||
                        subTileRow < 0 ||
                        subTileRow >= virtualGridHeight
                    ) {
                        collision = true;
                        return;
                    }

                    const row = Math.floor(subTileRow / SUB_TILES_PER_TILE);
                    const column = Math.floor(subTileColumn / SUB_TILES_PER_TILE);
                    const element = getElementAnchor(row, column);

                    if (
                        spawnBarrierBounds &&
                        pixelX >= spawnBarrierBounds.left &&
                        pixelX < spawnBarrierBounds.right &&
                        pixelY >= spawnBarrierBounds.top &&
                        pixelY < spawnBarrierBounds.bottom
                    ) {
                        collision = true;
                        return;
                    }

                    if (
                        isBlockingTileAt(row, column, pixelX, pixelY) &&
                        !isSpawnerTile(element?.tileId ?? mapGrid[row]?.[column]) ||
                        element && isSolidTile(element.tileId)
                    ) {
                        collision = true;
                    }
                }
            );

            if (collision) {
                return true;
            }

            const otherTanks = [
                ...enemyTanks.filter((tank) => tank !== ignoreTank),
                ...(includePlayer &&
                    shouldDrawPlayerAfterSpawn &&
                    ignoreTank !== Player
                    ? [Player]
                    : [])
            ];
            const nextHalfWidth = tankDimensions.width / 2;
            const nextHalfHeight = tankDimensions.height / 2;
            const nextLeft = nextX - nextHalfWidth;
            const nextRight = nextX + nextHalfWidth;
            const nextTop = nextY - nextHalfHeight;
            const nextBottom = nextY + nextHalfHeight;

            return otherTanks.some((tank) => {
                if (!tank) {
                    return false;
                }

                if (
                    enemyTanks.includes(ignoreTank) &&
                    enemyTanks.includes(tank) &&
                    enemyPairsIgnoringCollision.has(getEnemyPairKey(ignoreTank, tank))
                ) {
                    return false;
                }

                if (
                    (
                        ignoreTank === Player &&
                        enemyTanks.includes(tank) &&
                        playerEnemyPairsIgnoringCollision.has(tank.id)
                    ) ||
                    (
                        tank === Player &&
                        enemyTanks.includes(ignoreTank) &&
                        playerEnemyPairsIgnoringCollision.has(ignoreTank.id)
                    )
                ) {
                    return false;
                }

                const tankDimensionsForHitbox = getPlayerDimensions();
                const tankHalfWidth = tankDimensionsForHitbox.width / 2;
                const tankHalfHeight = tankDimensionsForHitbox.height / 2;
                const tankLeft = tank.x - tankHalfWidth;
                const tankRight = tank.x + tankHalfWidth;
                const tankTop = tank.y - tankHalfHeight;
                const tankBottom = tank.y + tankHalfHeight;

                return nextLeft < tankRight && nextRight > tankLeft &&
                    nextTop < tankBottom && nextBottom > tankTop;
            });
        }

        function checkCollision(nextX, nextY) {
            return checkTankCollisionAt(
                nextX,
                nextY,
                Player.direction,
                getPlayerDimensions(),
                Player,
                false
            );
        }

        function alignPlayerForDirection(direction) {
            alignTankForDirection(Player, direction);
        }

        function alignTankForDirection(tank, direction) {
            const subTileDimensions = getSubTileDimensions();
            const alignment = gameCore.getTankAlignmentForDirection(
                tank.physicsX,
                tank.physicsY,
                direction,
                subTileDimensions.width,
                subTileDimensions.height,
                MAGNET_STEP_IN_SUB_TILES
            );
            tank[`physics${alignment.axis.toUpperCase()}`] = alignment.value;
            const quantizedPosition = quantizeWorldPosition(tank.physicsX, tank.physicsY);
            tank[alignment.axis] = quantizedPosition[alignment.axis];
        }

        function updatePlayer(deltaSeconds) {
            const wasMoving = Player.isMoving;
            const previousDirection = Player.direction;
            Player.isMoving = false;
            if (isPlayerDead) {
                return;
            }
            const touchingIce = isPlayerTouchingTile(ICE_ID);
            const touchingCompactIce = isPlayerTouchingTile(COMPACT_ICE_ID);
            const wasTouchingIce = touchingIce || touchingCompactIce;

            if (slidingDirection && slidingOnCompactIce && !touchingCompactIce) {
                if (touchingIce) {
                    slidingOnCompactIce = false;
                    slidingDistance = 0;
                } else {
                    clearPlayerSliding();
                }
            } else if (
                slidingDirection &&
                !slidingOnCompactIce &&
                (!touchingIce || slidingDistance >= ICE_SLIDE_DISTANCE_TILES)
            ) {
                clearPlayerSliding();
            }
            if (isPlayerWaitingAfterIceSlide) {
                Player.isMoving = false;
                return;
            }

            const movementDirection = slidingDirection ?? requestedDirection;

            if (!isSimulationActive || !movementDirection) {
                Player.isMoving = false;
                return;
            }

            if (!slidingDirection && movementDirection !== Player.direction) {
                alignPlayerForDirection(movementDirection);
                Player.direction = movementDirection;
            }

            if (slidingDirection) {
                Player.direction = slidingDirection;
            }

            const subTileDimensions = getSubTileDimensions();
            const speedFactor = gameCore.getTankTerrainSpeedMultiplier(
                isPlayerTouchingTile(VERY_DENSE_BUSH_ID),
                isPlayerTouchingTile(DENSE_BUSH_ID),
                isPlayerTouchingRoute()
            );
            const tankSpeedMultiplier = getPlayerTankSpeedMultiplier();
            const tileDimensions = getTileDimensions();
            let movement = Player.speed * tankSpeedMultiplier * speedFactor *
                subTileDimensions.width * deltaSeconds;
            movement = gameCore.limitIceSlideMovement(
                movement,
                Boolean(slidingDirection),
                slidingOnCompactIce,
                slidingDistance,
                ICE_SLIDE_DISTANCE_TILES,
                tileDimensions.width
            );
            if (movement <= 0) {
                Player.isMoving = false;
                return;
            }
            const nextPosition = gameCore.getPositionInDirection(
                Player.physicsX,
                Player.physicsY,
                movementDirection,
                movement
            );

            const quantizedNextPosition = quantizeWorldPosition(
                nextPosition.x,
                nextPosition.y
            );

            if (!checkCollision(quantizedNextPosition.x, quantizedNextPosition.y)) {
                Player.physicsX = nextPosition.x;
                Player.physicsY = nextPosition.y;
                Player.x = quantizedNextPosition.x;
                Player.y = quantizedNextPosition.y;
                Player.isMoving = true;
                playIceTurnSound(
                    wasMoving,
                    previousDirection,
                    movementDirection,
                    wasTouchingIce
                );
                updatePlayerSlidingAfterMovement(movementDirection, movement);
                return;
            }

            if (slidingDirection && requestedDirection && requestedDirection !== slidingDirection) {
                const savedPhysicsX = Player.physicsX;
                const savedPhysicsY = Player.physicsY;
                const savedX = Player.x;
                const savedY = Player.y;
                const savedDirection = Player.direction;
                alignPlayerForDirection(requestedDirection);
                Player.direction = requestedDirection;

                let turnedNextX = Player.physicsX;
                let turnedNextY = Player.physicsY;
                if (requestedDirection === 'UP') turnedNextY -= movement;
                if (requestedDirection === 'DOWN') turnedNextY += movement;
                if (requestedDirection === 'LEFT') turnedNextX -= movement;
                if (requestedDirection === 'RIGHT') turnedNextX += movement;
                const quantizedTurnedPosition = quantizeWorldPosition(turnedNextX, turnedNextY);

                if (!checkCollision(quantizedTurnedPosition.x, quantizedTurnedPosition.y)) {
                    Player.physicsX = turnedNextX;
                    Player.physicsY = turnedNextY;
                    Player.x = quantizedTurnedPosition.x;
                    Player.y = quantizedTurnedPosition.y;
                    Player.isMoving = true;
                    playIceTurnSound(
                        wasMoving,
                        previousDirection,
                        requestedDirection,
                        wasTouchingIce
                    );
                    updatePlayerSlidingAfterMovement(requestedDirection, movement);
                    return;
                }

                Player.physicsX = savedPhysicsX;
                Player.physicsY = savedPhysicsY;
                Player.x = savedX;
                Player.y = savedY;
                Player.direction = savedDirection;
            }

            const candidates = Player.direction === 'UP' || Player.direction === 'DOWN'
                ? getMagnetCandidates(Player.x, subTileDimensions.width)
                : getMagnetCandidates(Player.y, subTileDimensions.height);

            for (const candidate of candidates) {
                let alignedNextX = Player.physicsX;
                let alignedNextY = Player.physicsY;

                if (Player.direction === 'UP' || Player.direction === 'DOWN') {
                    alignedNextX = candidate;
                } else {
                    alignedNextY = candidate;
                }

                const alignedNextPosition = gameCore.getPositionInDirection(
                    alignedNextX,
                    alignedNextY,
                    movementDirection,
                    movement
                );
                const quantizedAlignedPosition = quantizeWorldPosition(
                    alignedNextPosition.x,
                    alignedNextPosition.y
                );

                if (!checkCollision(quantizedAlignedPosition.x, quantizedAlignedPosition.y)) {
                    Player.physicsX = alignedNextPosition.x;
                    Player.physicsY = alignedNextPosition.y;
                    Player.x = quantizedAlignedPosition.x;
                    Player.y = quantizedAlignedPosition.y;
                    Player.isMoving = true;
                    playIceTurnSound(
                        wasMoving,
                        previousDirection,
                        movementDirection,
                        wasTouchingIce
                    );
                    updatePlayerSlidingAfterMovement(movementDirection, movement);
                    return;
                }
            }
            if (slidingDirection) {
                clearPlayerSliding();
                isPlayerWaitingAfterIceSlide = true;
            }
        }

        function getVisualPlayerPosition() {
            return getVisualWorldPosition(Player.x, Player.y);
        }

        function getVisualWorldPosition(x, y) {
            const tileDimensions = getTileDimensions();
            const stepWidth = tileDimensions.width / playerVisualStepsPerTile;
            const stepHeight = tileDimensions.height / playerVisualStepsPerTile;

            return {
                x: Math.round(x / stepWidth) * stepWidth,
                y: Math.round(y / stepHeight) * stepHeight
            };
        }

        function quantizeWorldPosition(x, y) {
            return getVisualWorldPosition(x, y);
        }

        function getPlayerMuzzlePosition(direction = Player.direction) {
            const playerDimensions = getPlayerDimensions();
            return gameCore.getMuzzlePosition(
                Player.x,
                Player.y,
                direction,
                playerDimensions.width,
                playerDimensions.height,
                PLAYER_MUZZLE_OFFSET_RATIO,
                PLAYER_MUZZLE_CENTER_PULL_PIXELS
            );
        }

        function getTwinShotSpawnOffsets(direction) {
            const tileDimensions = getTileDimensions();
            return gameCore.getTwinShotSpawnOffsets(
                direction,
                tileDimensions.width,
                tileDimensions.height
            );
        }

        function fireBullet() {
            if (!isSimulationActive || isPlayerDead || !shouldDrawPlayerAfterSpawn) {
                return;
            }

            const currentPlayerBulletCount = bullets.filter((bullet) => bullet.owner === 'player').length;
            const playerTankType = getPlayerTankType();
            const directions = getTankBurstDirections(playerTankType, Player.direction);
            if (
                playerRank9Burst ||
                (playerTankType === 9 && currentPlayerBulletCount > 0)
            ) {
                return;
            }
            if (currentPlayerBulletCount + directions.length > getPlayerBulletLimit()) {
                return;
            }

            const now = gameTime;
            const timeSinceLastShot = lastShotAt ? now - lastShotAt : Infinity;

            if (timeSinceLastShot < BULLET_FIRE_COOLDOWN_SECONDS * 1000) {
                return;
            }

            lastShotAt = now;
            lastShotSpacing = timeSinceLastShot;
            playSoundEffect('playerShot');

            const tileDimensions = getTileDimensions();
            const bulletSize = Math.min(tileDimensions.width, tileDimensions.height)
                * BULLET_SIZE_IN_TILES;
            const spawnOffsets = getTankTwinShotEnabled(playerTankType)
                ? getTwinShotSpawnOffsets(Player.direction)
                : directions.map(() => ({ x: 0, y: 0 }));

            if (playerTankType === 9) {
                const burstId = nextBulletBurstId++;
                spawnPlayerTankBullet(
                    directions[0],
                    bulletSize,
                    burstId
                );
                playerRank9Burst = {
                    id: burstId,
                    direction: directions[0],
                    tankType: playerTankType,
                    remaining: 2,
                    nextShotAt: gameTime + 90,
                    waitUntil: null
                };
                return;
            }

            directions.forEach((direction, index) => {
                const directionVector = gameCore.getDirectionVector(direction);
                const offset = spawnOffsets[index] ?? { x: 0, y: 0 };
                const muzzle = getPlayerMuzzlePosition(direction);
                const spawnX = muzzle.x + offset.x;
                const spawnY = muzzle.y + offset.y;

                bullets.push({
                    x: spawnX,
                    y: spawnY,
                    physicsX: spawnX,
                    physicsY: spawnY,
                    vx: directionVector.x,
                    vy: directionVector.y,
                    direction,
                    owner: 'player',
                    size: bulletSize,
                    hitboxes: BULLET_HITBOX_MASKS,
                    projectileSpeedMultiplier: getTankProjectileSpeedMultiplier(playerTankType),
                    canBreakSteel: getTankCanBreakSteel(playerTankType),
                    reinforcedBrickDamageMultiplier: getPlayerReinforcedBrickDamageMultiplier()
                });
            });
        }

        function spawnPlayerTankBullet(direction, bulletSize, burstId = null, tankType = getPlayerTankType()) {
            const muzzle = getPlayerMuzzlePosition(direction);
            const directionVector = gameCore.getDirectionVector(direction);
            bullets.push({
                x: muzzle.x,
                y: muzzle.y,
                physicsX: muzzle.x,
                physicsY: muzzle.y,
                vx: directionVector.x,
                vy: directionVector.y,
                direction,
                owner: 'player',
                burstId,
                size: bulletSize,
                hitboxes: BULLET_HITBOX_MASKS,
                projectileSpeedMultiplier: getTankProjectileSpeedMultiplier(tankType),
                canBreakSteel: getTankCanBreakSteel(tankType),
                reinforcedBrickDamageMultiplier:
                    getTankReinforcedBrickDamageMultiplier(tankType)
            });
        }

        function updatePlayerRank9Burst() {
            if (!playerRank9Burst) {
                return;
            }

            const burst = playerRank9Burst;
            const bulletSize = Math.min(
                getTileDimensions().width,
                getTileDimensions().height
            ) * BULLET_SIZE_IN_TILES;
            if (burst.remaining > 0 && gameTime >= burst.nextShotAt) {
                spawnPlayerTankBullet(burst.direction, bulletSize, burst.id, 9);
                burst.remaining -= 1;
                burst.nextShotAt += 90;
            }
            if (
                burst.remaining === 0 &&
                !bullets.some((bullet) =>
                    bullet.owner === 'player' && bullet.burstId === burst.id
                )
            ) {
                burst.waitUntil ??= gameTime + 200;
                if (gameTime >= burst.waitUntil) {
                    playerRank9Burst = null;
                }
            }
        }

        function forEachBulletHitboxPixel(
            bullet,
            hitboxName,
            callback,
            centerX = bullet.x,
            centerY = bullet.y
        ) {
            const mask = bullet.hitboxes[hitboxName];
            const pixelSize = bullet.size / BULLET_HITBOX_GRID_SIZE;
            const halfSize = bullet.size / 2;
            const rotationByDirection = {
                UP: 0,
                DOWN: Math.PI,
                LEFT: -Math.PI / 2,
                RIGHT: Math.PI / 2
            };
            const rotation = rotationByDirection[bullet.direction] ?? 0;
            const cosine = Math.cos(rotation);
            const sine = Math.sin(rotation);

            mask.forEach((row, rowIndex) => {
                Array.from(row).forEach((filled, columnIndex) => {
                    if (filled === '1') {
                        const localX = -halfSize + (columnIndex + 0.5) * pixelSize;
                        const localY = -halfSize + (rowIndex + 0.5) * pixelSize;
                        callback(
                            centerX + localX * cosine - localY * sine,
                            centerY + localX * sine + localY * cosine,
                            pixelSize
                        );
                    }
                });
            });
        }

        function checkBulletObjectCollision(bullet, centerX, centerY) {
            const tileDimensions = getTileDimensions();
            let hitObject = false;
            const damagedSubtilesThisImpact = new Set();

            forEachBulletHitboxPixel(
                bullet,
                'object',
                (pixelX, pixelY, pixelSize) => {
                    const left = pixelX - pixelSize / 2;
                    const right = pixelX + pixelSize / 2;
                    const top = pixelY - pixelSize / 2;
                    const bottom = pixelY + pixelSize / 2;
                    const firstColumn = Math.floor(
                        (left - COLLISION_EDGE_EPSILON) / tileDimensions.width
                    );
                    const lastColumn = Math.floor(
                        (right + COLLISION_EDGE_EPSILON) / tileDimensions.width
                    );
                    const firstRow = Math.floor(
                        (top - COLLISION_EDGE_EPSILON) / tileDimensions.height
                    );
                    const lastRow = Math.floor(
                        (bottom + COLLISION_EDGE_EPSILON) / tileDimensions.height
                    );

                    for (let row = firstRow; row <= lastRow; row += 1) {
                        for (let column = firstColumn; column <= lastColumn; column += 1) {
                            const tileId = mapGrid[row]?.[column];
                            const element = getElementAnchor(row, column);

                            const eagleAnchor = tileId === EAGLE_ID
                                ? { row, column }
                                : element?.tileId === EAGLE_ID
                                    ? element
                                    : null;
                            const eagleKey = eagleAnchor
                                ? `${eagleAnchor.row},${eagleAnchor.column}`
                                : null;
                            if (eagleAnchor && destroyEagleAt(eagleAnchor)) {
                                bullet.hitEagle = true;
                                hitObject = true;
                                continue;
                            }

                            if (eagleAnchor && destroyedEagleTiles.has(eagleKey)) {
                                continue;
                            }

                            const tntBlockAnchor = tileId === TNT_BLOCK_ID
                                ? { row, column, tileId }
                                : element?.tileId === TNT_BLOCK_ID
                                    ? element
                                    : null;
                            if (tntBlockAnchor) {
                                triggerTntBlock(
                                    tntBlockAnchor.row,
                                    tntBlockAnchor.column
                                );
                                hitObject = true;
                            } else if (BRICK_TILE_IDS.has(tileId)) {
                                const tileLeft = column * tileDimensions.width;
                                const tileTop = row * tileDimensions.height;
                                const subtileWidth = tileDimensions.width / BRICK_SUBTILE_GRID_SIZE;
                                const subtileHeight = tileDimensions.height / BRICK_SUBTILE_GRID_SIZE;
                                const firstSubtileColumn = Math.floor(
                                    (left - COLLISION_EDGE_EPSILON - tileLeft) / subtileWidth
                                );
                                const lastSubtileColumn = Math.floor(
                                    (right + COLLISION_EDGE_EPSILON - tileLeft) / subtileWidth
                                );
                                const firstSubtileRow = Math.floor(
                                    (top - COLLISION_EDGE_EPSILON - tileTop) / subtileHeight
                                );
                                const lastSubtileRow = Math.floor(
                                    (bottom + COLLISION_EDGE_EPSILON - tileTop) / subtileHeight
                                );

                                for (
                                    let subtileRow = firstSubtileRow;
                                    subtileRow <= lastSubtileRow;
                                    subtileRow += 1
                                ) {
                                    for (
                                        let subtileColumn = firstSubtileColumn;
                                        subtileColumn <= lastSubtileColumn;
                                        subtileColumn += 1
                                    ) {
                                        if (
                                            subtileRow >= 0 && subtileRow < BRICK_SUBTILE_GRID_SIZE &&
                                            subtileColumn >= 0 &&
                                            subtileColumn < BRICK_SUBTILE_GRID_SIZE
                                        ) {
                                            const subtileIndex = (
                                                subtileRow * BRICK_SUBTILE_GRID_SIZE + subtileColumn
                                            );
                                            const subtileKey = `${row},${column},${subtileIndex}`;

                                            if (
                                                !damagedSubtilesThisImpact.has(subtileKey) &&
                                                isBrickSubtileIntact(row, column, subtileIndex)
                                            ) {
                                                const damageAmount =
                                                    tileId === REINFORCED_BRICKS_ID
                                                        ? bullet.reinforcedBrickDamageMultiplier ?? 1
                                                        : 1;
                                                damageBrickSubtile(
                                                    row,
                                                    column,
                                                    subtileIndex,
                                                    damageAmount
                                                );
                                                damagedSubtilesThisImpact.add(subtileKey);
                                                hitObject = true;
                                            }
                                        }
                                    }
                                }
                            } else if (
                                tileId === SOLID_BLOCK_ID &&
                                bullet.canBreakSteel
                            ) {
                                mapGrid[row][column] = AIR_ID;
                                clearBrickDamage(row, column);
                                mapRenderVersion += 1;
                                hitObject = true;
                            } else if (
                                tileId !== undefined &&
                                tileId !== WATER_ID &&
                                tileId !== LAVA_ID &&
                                (isSolidTile(tileId) || element && isSolidTile(element.tileId))
                            ) {
                                hitObject = true;
                            }
                        }
                    }
                },
                centerX,
                centerY
            );

            return hitObject;
        }

        function bulletsIntersect(bulletA, bulletB) {
            let haveIntersection = false;

            forEachBulletHitboxPixel(
                bulletA,
                'bulletBullet',
                (pixelAX, pixelAY) => {
                    if (haveIntersection) {
                        return;
                    }

                    forEachBulletHitboxPixel(
                        bulletB,
                        'bulletBullet',
                        (pixelBX, pixelBY) => {
                            if (haveIntersection) {
                                return;
                            }

                            if (Math.hypot(pixelAX - pixelBX, pixelAY - pixelBY) <= bulletA.size * 0.7) {
                                haveIntersection = true;
                            }
                        },
                        bulletB.x,
                        bulletB.y
                    );
                },
                bulletA.x,
                bulletA.y
            );

            return haveIntersection;
        }

        function updateBullets(deltaSeconds) {
            if (!isSimulationActive) {
                return;
            }

            const tileDimensions = getTileDimensions();
            const step = BULLET_SPEED_TILES_PER_SECOND * tileDimensions.width * deltaSeconds;

            for (let index = bullets.length - 1; index >= 0; index -= 1) {
                const bullet = bullets[index];
                if (!bullet) {
                    continue;
                }
                const previousBulletX = bullet.x;
                const previousBulletY = bullet.y;
                const speedFactor = gameCore.getProjectileTerrainSpeedMultiplier(
                    isBulletTouchingTile(bullet, VERY_DENSE_BUSH_ID),
                    isBulletTouchingTile(bullet, DENSE_BUSH_ID)
                );
                const projectileSpeedMultiplier = bullet.projectileSpeedMultiplier ?? 1;
                bullet.physicsX += bullet.vx * step * projectileSpeedMultiplier * speedFactor;
                bullet.physicsY += bullet.vy * step * projectileSpeedMultiplier * speedFactor;
                bullet.x = bullet.physicsX;
                bullet.y = bullet.physicsY;
                const travelDistance = Math.hypot(
                    bullet.x - previousBulletX,
                    bullet.y - previousBulletY
                );
                const sampleSize = Math.min(
                    getSubTileDimensions().width,
                    getSubTileDimensions().height
                );
                const sampleCount = Math.max(1, Math.ceil(travelDistance / sampleSize));
                let hitWall = false;

                for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
                    const progress = sampleIndex / sampleCount;
                    const sampleX = previousBulletX + (
                        bullet.x - previousBulletX
                    ) * progress;
                    const sampleY = previousBulletY + (
                        bullet.y - previousBulletY
                    ) * progress;

                    if (checkBulletObjectCollision(bullet, sampleX, sampleY)) {
                        hitWall = true;
                        break;
                    }
                }

                if (hitWall) {
                    if (bullet.owner === 'enemy') {
                        const enemyTank = enemyTanks.find((candidate) => candidate.id === bullet.ownerId);
                        if (enemyTank) {
                            enemyTank.lastBulletDestroyedAt = gameTime;
                        }
                    }

                    if (!bullet.hitEagle) {
                        playSoundEffect('wallHit');
                        explosions.push({
                            x: bullet.x,
                            y: bullet.y,
                            startedAt: gameTime,
                            type: 'bullet'
                        });
                    }
                    if (index >= 0 && index < bullets.length && bullets[index] === bullet) {
                        bullets.splice(index, 1);
                    }
                    continue;
                }

                for (let otherIndex = index - 1; otherIndex >= 0; otherIndex -= 1) {
                    const otherBullet = bullets[otherIndex];
                    if (!otherBullet || otherBullet.owner === bullet.owner) {
                        continue;
                    }

                    if (bulletsIntersect(bullet, otherBullet)) {
                        const impactX = (bullet.x + otherBullet.x) / 2;
                        const impactY = (bullet.y + otherBullet.y) / 2;
                        if (index >= 0 && index < bullets.length && bullets[index] === bullet) {
                            bullets.splice(index, 1);
                        }
                        if (otherIndex >= 0 && otherIndex < bullets.length && bullets[otherIndex] === otherBullet) {
                            bullets.splice(otherIndex, 1);
                        }
                        explosions.push({
                            x: impactX,
                            y: impactY,
                            startedAt: gameTime,
                            type: 'bulletCross'
                        });
                        continue;
                    }
                }

                if (!bullets.includes(bullet)) {
                    continue;
                }

                if (bullet.owner === 'player') {
                    const hitEnemy = enemyTanks.find((enemy) => {
                        const dx = bullet.x - enemy.x;
                        const dy = bullet.y - enemy.y;
                        return Math.hypot(dx, dy) <= Math.max(getPlayerDimensions().width, getPlayerDimensions().height) * 0.55;
                    });

                    if (hitEnemy) {
                        if (index >= 0 && index < bullets.length && bullets[index] === bullet) {
                            bullets.splice(index, 1);
                        }
                        const hitPointsBeforeDamage = hitEnemy.hitPoints
                            ?? getEnemyInitialHitPoints(
                                hitEnemy.textureType ?? ENEMY_TANK_TEXTURE_TYPE
                            );
                        if (hitPointsBeforeDamage > 1) {
                            playSoundEffect('enemyHit');
                        }
                        explosions.push({
                            x: hitEnemy.x,
                            y: hitEnemy.y,
                            startedAt: gameTime,
                            type: 'bullet'
                        });
                        hitEnemy.hitPoints = Math.max(0, hitPointsBeforeDamage - 1);
                        if (hitEnemy.hitPoints > 0) {
                            hitEnemy.visualTextureType = getEnemyDamagedTextureType(
                                hitEnemy.hitPoints
                            );
                            if (
                                (hitEnemy.powerUps?.length ?? 0) > 0 &&
                                dropEnemyPowerUp(hitEnemy)
                            ) {
                                hitEnemy.powerUps = [];
                            }
                        } else {
                            defeatEnemy(hitEnemy);
                        }
                        continue;
                    }
                }

                if (bullet.owner === 'enemy') {
                    const playerReach = Math.sqrt(
                        Math.pow(bullet.x - Player.x, 2) + Math.pow(bullet.y - Player.y, 2)
                    );
                    const playerRadius = Math.max(getPlayerDimensions().width, getPlayerDimensions().height) * 0.55;

                    if (!isPlayerDead && shouldDrawPlayerAfterSpawn && playerReach <= playerRadius) {
                        if (index >= 0 && index < bullets.length && bullets[index] === bullet) {
                            bullets.splice(index, 1);
                        }
                        if (gameTime < playerInvincibleUntil) {
                            explosions.push({
                                x: bullet.x,
                                y: bullet.y,
                                startedAt: gameTime,
                                type: 'bullet'
                            });
                            continue;
                        }
                        triggerPlayerDeath();
                        continue;
                    }
                }

                let bulletLeft = bullet.x;
                let bulletRight = bullet.x;
                let bulletTop = bullet.y;
                let bulletBottom = bullet.y;
                forEachBulletHitboxPixel(
                    bullet,
                    'object',
                    (pixelX, pixelY, pixelSize) => {
                        bulletLeft = Math.min(bulletLeft, pixelX - pixelSize / 2);
                        bulletRight = Math.max(bulletRight, pixelX + pixelSize / 2);
                        bulletTop = Math.min(bulletTop, pixelY - pixelSize / 2);
                        bulletBottom = Math.max(bulletBottom, pixelY + pixelSize / 2);
                    }
                );

                const canvasDimensions = getCanvasDimensions();
                if (
                    bulletLeft < 0 || bulletTop < 0 ||
                    bulletRight > canvasDimensions.width ||
                    bulletBottom > canvasDimensions.height
                ) {
                    if (bullet.owner === 'enemy') {
                        const enemyTank = enemyTanks.find((candidate) => candidate.id === bullet.ownerId);
                        if (enemyTank) {
                            enemyTank.lastBulletDestroyedAt = gameTime;
                        }
                    }

                    explosions.push({
                        x: bullet.x,
                        y: bullet.y,
                        startedAt: gameTime,
                        type: 'bullet'
                    });
                    if (index >= 0 && index < bullets.length && bullets[index] === bullet) {
                        bullets.splice(index, 1);
                    }
                    continue;
                }

                const subTileWidth = getSubTileDimensions().width;
                const subTileHeight = getSubTileDimensions().height;
                const firstSubTileColumn = Math.floor(bulletLeft / subTileWidth);
                const lastSubTileColumn = Math.floor((bulletRight - 1) / subTileWidth);
                const firstSubTileRow = Math.floor(bulletTop / subTileHeight);
                const lastSubTileRow = Math.floor((bulletBottom - 1) / subTileHeight);

            }
        }

        function updateExplosions() {
            for (let index = explosions.length - 1; index >= 0; index -= 1) {
                const explosion = explosions[index];
                if (explosion.type === 'tntBlast') {
                    if (gameTime - explosion.startedAt >=
                        TNT_BLINK_DURATION_MS + TNT_FADE_DURATION_MS) {
                        explosions.splice(index, 1);
                    }
                    continue;
                }
                const sequence = explosion.type === 'tank'
                    ? TANK_DEATH_EXPLOSION_SEQUENCE
                    : explosion.type === 'bulletCross'
                        ? BULLET_CROSS_EXPLOSION_SEQUENCE
                        : BULLET_EXPLOSION_SEQUENCE;
                const sequenceDurationMs = sequence.length * EXPLOSION_FRAME_DURATION;

                if (gameTime - explosion.startedAt >= sequenceDurationMs) {
                    explosions.splice(index, 1);
                }
            }

        }

        function getExplosionFrameForSequence(explosion) {
            const sequence = explosion.type === 'tank'
                ? TANK_DEATH_EXPLOSION_SEQUENCE
                : explosion.type === 'bulletCross'
                    ? BULLET_CROSS_EXPLOSION_SEQUENCE
                    : BULLET_EXPLOSION_SEQUENCE;
            const frameIndex = Math.min(
                sequence.length - 1,
                Math.max(0, Math.floor(
                    (gameTime - explosion.startedAt) / EXPLOSION_FRAME_DURATION
                ))
            );
            return sequence[frameIndex];
        }

        function drawExplosions() {
            explosions.forEach((explosion) => {
                if (gameTime < explosion.startedAt) {
                    return;
                }
                if (explosion.type === 'tntBlast') {
                    const elapsed = gameTime - explosion.startedAt;
                    const fadeProgress = Math.min(
                        1,
                        Math.max(0, (elapsed - TNT_BLINK_DURATION_MS) / TNT_FADE_DURATION_MS)
                    );
                    const blinkVisible = elapsed >= TNT_BLINK_DURATION_MS ||
                        Math.floor(elapsed / 25) % 2 === 0;
                    if (!blinkVisible && fadeProgress === 0) {
                        return;
                    }

                    const scale = 1 - fadeProgress * 0.18;
                    const width = explosion.width * scale;
                    const height = explosion.height * scale;
                    const left = explosion.left + (explosion.width - width) / 2;
                    const top = explosion.top + (explosion.height - height) / 2;
                    context.save();
                    context.globalAlpha = 1 - fadeProgress;
                    context.fillStyle = 'rgba(255, 24, 24, 0.32)';
                    context.strokeStyle = '#ff2525';
                    context.lineWidth = Math.max(2, Math.min(
                        getTileDimensions().width,
                        getTileDimensions().height
                    ) * 0.08);
                    context.fillRect(left, top, width, height);
                    context.strokeRect(left, top, width, height);
                    context.restore();
                    return;
                }
                const frame = getExplosionFrameForSequence(explosion);
                const texture = explosionTextures[frame];
                if (!texture) {
                    return;
                }

                const visualPosition = getVisualWorldPosition(explosion.x, explosion.y);
                const size = 4 * Math.max(
                    getTileDimensions().width,
                    getTileDimensions().height
                );
                context.drawImage(
                    texture,
                    visualPosition.x - size / 2,
                    visualPosition.y - size / 2,
                    size,
                    size
                );
            });
        }

        function getEnemyDebugText() {
            if (!enemyTanks.length) {
                return 'No enemies in simulation.';
            }

            return enemyTanks.map((enemy) => {
                const distanceTravelled = (enemy.distanceTravelled ?? 0).toFixed(1);
                const remainingDistance = (enemy.remainingDistance ?? 0).toFixed(1);
                const textureInfo = `${enemy.visualTextureType ?? enemy.textureType ?? 'b'}/${enemy.textureRow ?? 4}`;
                return [
                    `E:${enemy.id}`,
                    `walk=${distanceTravelled}`,
                    `left=${remainingDistance}`,
                    `tex=${textureInfo}`,
                    `dir=${enemy.direction ?? 'UP'}`,
                    `state=${enemy.aiState ?? 'random'}`,
                    `substate=${enemy.substate ?? 'Normal'}`,
                    `path=${enemy.pathTargetTileId ?? '-'}`,
                    `blockedSteps=${enemy.pathBlockedSteps?.size ?? 0}`,
                    `obstacle=${enemy.lastBlockedTileId ?? '-'}`,
                    `shoot=${enemy.lastShotAt ? (gameTime - enemy.lastShotAt) : 0}`
                ].join(' | ');
            }).join('\n');
        }

        function refreshEnemyDebugPanel() {
            if (!isEnemyDebugEnabled) {
                enemyDebugPanel.hidden = true;
                enemyDebugPanel.textContent = '';
                return;
            }

            enemyDebugPanel.hidden = false;
            enemyDebugPanel.textContent = getEnemyDebugText();
        }

        function getBulletDebugHitboxNames(bullet) {
            if (bullet.owner === 'player') {
                return ['object', 'playerEnemy'];
            }
            if (bullet.owner === 'enemy') {
                return ['object', 'enemyPlayer'];
            }
            return ['object'];
        }

        function drawBullets() {
            const rotationByDirection = {
                UP: 0,
                DOWN: Math.PI,
                LEFT: -Math.PI / 2,
                RIGHT: Math.PI / 2
            };

            bullets.forEach((bullet) => {
                const visualPosition = { x: bullet.x, y: bullet.y };
                context.save();
                context.translate(visualPosition.x, visualPosition.y);
                context.rotate(rotationByDirection[bullet.direction] ?? 0);

                if (bulletTexture) {
                    context.drawImage(
                        bulletTexture,
                        -bullet.size / 2,
                        -bullet.size / 2,
                        bullet.size,
                        bullet.size
                    );
                } else {
                    context.fillStyle = '#8b939d';
                    context.fillRect(
                        -bullet.size / 2,
                        -bullet.size / 2,
                        bullet.size,
                        bullet.size
                    );
                }

                if (areHitboxesVisible) {
                    const hitboxColors = {
                        object: '#ff4d6d',
                        playerEnemy: '#55d9ff',
                        enemyPlayer: '#ff9e5a'
                    };

                    getBulletDebugHitboxNames(bullet).forEach((hitboxName) => {
                        drawBulletHitboxOutline(bullet, hitboxName, hitboxColors[hitboxName] ?? '#ffffff');
                    });
                }

                context.restore();
            });
        }

        function drawBulletHitboxOutline(bullet, hitboxName, color) {
            const mask = bullet.hitboxes[hitboxName];
            const pixelSize = bullet.size / BULLET_HITBOX_GRID_SIZE;
            const halfSize = bullet.size / 2;

            context.save();
            context.strokeStyle = color;
            context.lineWidth = 1;
            context.beginPath();

            mask.forEach((row, rowIndex) => {
                Array.from(row).forEach((filled, columnIndex) => {
                    if (filled !== '1') {
                        return;
                    }

                    const left = -halfSize + columnIndex * pixelSize;
                    const top = -halfSize + rowIndex * pixelSize;
                    const right = left + pixelSize;
                    const bottom = top + pixelSize;
                    const hasFilled = (neighborRow, neighborColumn) => (
                        mask[neighborRow]?.[neighborColumn] === '1'
                    );

                    if (!hasFilled(rowIndex - 1, columnIndex)) {
                        context.moveTo(left, top);
                        context.lineTo(right, top);
                    }
                    if (!hasFilled(rowIndex + 1, columnIndex)) {
                        context.moveTo(left, bottom);
                        context.lineTo(right, bottom);
                    }
                    if (!hasFilled(rowIndex, columnIndex - 1)) {
                        context.moveTo(left, top);
                        context.lineTo(left, bottom);
                    }
                    if (!hasFilled(rowIndex, columnIndex + 1)) {
                        context.moveTo(right, top);
                        context.lineTo(right, bottom);
                    }
                });
            });

            context.stroke();
            context.restore();
        }

        function getEnemyTexture(enemy, timestamp) {
            const direction = (enemy.direction ?? 'UP').toLowerCase();
            const currentTextureType = enemy.visualTextureType ??
                enemy.textureType ??
                ENEMY_TANK_TEXTURE_TYPE;
            const textureType = enemySpawnOrderUi.getVisualTextureType(
                currentTextureType,
                (enemy.powerUps?.length ?? 0) > 0,
                enemy.isTnt === true,
                timestamp
            );
            const textureRow = enemy.textureRow ?? ENEMY_TANK_TEXTURE_ROW;
            const key = `${textureType}-${textureRow}-${direction}`;
            loadEnemyTextureDefinition(textureType, textureRow, direction);
            const frames = [
                enemyTextures.get(key),
                enemyTextures.get(`${textureType}-${textureRow}-up`)
            ].find((candidate) => candidate?.[0]) ?? null;

            if (!frames?.[0]) {
                return null;
            }

            const frame = enemy.isMoving
                ? Math.floor(timestamp / PLAYER_MOVE_FRAME_DURATION) % 2
                : 0;

            return frames[frame] ?? frames[0];
        }

        function getEnemyTargetPosition(enemy) {
            const playerCenter = {
                x: Player.x,
                y: Player.y
            };
            const eagles = [];
            for (let row = 0; row < mapHeight; row += 1) {
                for (let column = 0; column < mapWidth; column += 1) {
                    if (mapGrid[row]?.[column] === EAGLE_ID) {
                        const tileDimensions = getTileDimensions();
                        eagles.push({
                            x: (column + 0.5) * tileDimensions.width,
                            y: (row + 0.5) * tileDimensions.height
                        });
                    }
                }
            }

            const candidates = [{ x: playerCenter.x, y: playerCenter.y, weight: 1.2 }];
            if (eagles.length > 0) {
                candidates.push(...eagles.map((eagle) => ({
                    x: eagle.x,
                    y: eagle.y,
                    weight: 1.1
                })));
            }

            return candidates.reduce((best, candidate) => {
                const candidateDistance = Math.hypot(
                    candidate.x - enemy.physicsX,
                    candidate.y - enemy.physicsY
                );
                const bestDistance = Math.hypot(
                    best.x - enemy.physicsX,
                    best.y - enemy.physicsY
                );
                return candidateDistance < bestDistance ? candidate : best;
            }, candidates[0]);
        }

        function reverseDirection(direction) {
            return gameCore.getOppositeDirection(direction);
        }

        function getEnemyEagleTarget(enemy) {
            const eagles = [];

            for (let row = 0; row < mapHeight; row += 1) {
                for (let column = 0; column < mapWidth; column += 1) {
                    if (mapGrid[row]?.[column] === EAGLE_ID) {
                        const tileDimensions = getTileDimensions();
                        eagles.push({
                            x: (column + 0.5) * tileDimensions.width,
                            y: (row + 0.5) * tileDimensions.height
                        });
                    }
                }
            }

            if (eagles.length === 0) {
                return { x: Player.x, y: Player.y };
            }

            return eagles[Math.floor(Math.random() * eagles.length)];
        }

        function getEnemyAiTarget(enemy) {
            if (enemy.aiState === 'player') {
                return { x: Player.x, y: Player.y };
            }

            if (enemy.aiState === 'escape') {
                return { x: Player.x, y: Player.y };
            }

            if (enemy.aiState === 'eagle') {
                return getEnemyEagleTarget(enemy);
            }

            return getEnemyTargetPosition(enemy);
        }

        function getEnemyAiStateDurationMs(state = 'random', textureType = null) {
            return gameCore.getEnemyAiStateDurationMs(state, textureType);
        }

        function chooseEnemyAiState(textureType) {
            return gameCore.chooseEnemyAiState(textureType);
        }

        function rotateEnemyAiState(enemy) {
            if (enemy.textureType === 'e') {
                enemy.aiState = gameCore.getNextEnemyAiState(enemy);
                enemy.aiStateUntil = gameTime + getEnemyAiStateDurationMs(enemy.aiState);
                enemy.pathBlockedSteps?.clear();
                enemy.pathRouteCache = null;
                enemy.fireCooldownUntil = gameTime;
                return;
            }

            if (enemy.textureType === 'f') {
                enemy.aiState = gameCore.getNextEnemyAiState(enemy);
                enemy.aiStateUntil = gameTime + getEnemyAiStateDurationMs(
                    enemy.aiState,
                    enemy.textureType
                );
                enemy.pathBlockedSteps?.clear();
                enemy.pathRouteCache = null;
                if (enemy.aiState !== 'random') {
                    enemy.fireCooldownUntil = gameTime;
                }
                return;
            }

            const state = gameCore.getNextEnemyAiState(enemy);
            enemy.aiState = state;
            enemy.aiStateUntil = gameTime + getEnemyAiStateDurationMs(state);
            enemy.pathBlockedSteps?.clear();
            enemy.pathRouteCache = null;
        }

        function getEnemyPathTileId(row, column) {
            const element = getElementAnchor(row, column);
            return element?.tileId ?? mapGrid[row]?.[column] ?? null;
        }

        function getEnemyPathPreferenceCost(row, column) {
            const tileId = getEnemyPathTileId(row, column);

            if (ROAD_TILE_IDS.has(tileId)) {
                return 0.15;
            }
            if (tileId === VERY_DENSE_BUSH_ID) {
                return 2000;
            }
            if (tileId === DENSE_BUSH_ID) {
                return 1000;
            }
            if (tileId === AIR_ID) {
                return 1;
            }
            if (tileId === BUSH_ID) {
                return 0.75;
            }
            if (tileId === SOLID_BLOCK_2_ID) {
                return 2;
            }
            if (tileId === REINFORCED_BRICKS_ID) {
                return 3;
            }
            if (tileId === ICE_ID || tileId === COMPACT_ICE_ID) {
                return 4;
            }
            return 2;
        }

        function isEnemyPathTileWalkable(row, column) {
            if (row < 0 || row >= mapHeight || column < 0 || column >= mapWidth) {
                return false;
            }

            const tileId = getEnemyPathTileId(row, column);
            return tileId === null ||
                !isSolidTile(tileId) ||
                BRICK_TILE_IDS.has(tileId);
        }

        function isEnemyPathPositionWalkable(row, column) {
            for (let footprintRow = row; footprintRow < row + 2; footprintRow += 1) {
                for (
                    let footprintColumn = column;
                    footprintColumn < column + 2;
                    footprintColumn += 1
                ) {
                    if (!isEnemyPathTileWalkable(footprintRow, footprintColumn)) {
                        return false;
                    }
                }
            }

            return true;
        }

        function getEnemyPathPositionPreferenceCost(row, column) {
            let totalCost = 0;
            let roadCenterOffset = Infinity;
            const tankCenterX = column + 1;
            const tankCenterY = row + 1;
            const checkedRoads = new Set();

            for (let footprintRow = row; footprintRow < row + 2; footprintRow += 1) {
                for (
                    let footprintColumn = column;
                    footprintColumn < column + 2;
                    footprintColumn += 1
                ) {
                    totalCost += getEnemyPathPreferenceCost(footprintRow, footprintColumn);
                    const road = getElementAnchor(footprintRow, footprintColumn);
                    if (!road || !ROAD_TILE_IDS.has(road.tileId)) {
                        continue;
                    }

                    const roadKey = `${road.row},${road.column},${road.tileId}`;
                    if (checkedRoads.has(roadKey)) {
                        continue;
                    }
                    checkedRoads.add(roadKey);

                    const roadSize = getElementFootprintSize(road.tileId);
                    const roadCenterX = road.column + roadSize.width / 2;
                    const roadCenterY = road.row + roadSize.height / 2;
                    const centerOffset = roadSize.width === roadSize.height
                        ? Math.hypot(tankCenterX - roadCenterX, tankCenterY - roadCenterY)
                        : roadSize.width > roadSize.height
                            ? Math.abs(tankCenterY - roadCenterY)
                            : Math.abs(tankCenterX - roadCenterX);
                    roadCenterOffset = Math.min(roadCenterOffset, centerOffset);
                }
            }

            return totalCost / 4 + (Number.isFinite(roadCenterOffset)
                ? roadCenterOffset * 0.5
                : 0);
        }

        function getEnemyPathTargetKey(enemy, tileDimensions) {
            if (enemy.aiState === 'escape') {
                const row = Math.floor(Player.y / tileDimensions.height);
                const column = Math.floor(Player.x / tileDimensions.width);
                return `escape:${row},${column}`;
            }
            if (enemy.aiState === 'player') {
                const row = Math.floor(Player.y / tileDimensions.height);
                const column = Math.floor(Player.x / tileDimensions.width);
                return `player:${row},${column}`;
            }
            return 'eagle';
        }

        function getEnemyPathDirection(enemy) {
            const tileDimensions = getTileDimensions();
            const startRow = Math.round(enemy.physicsY / tileDimensions.height) - 1;
            const startColumn = Math.round(enemy.physicsX / tileDimensions.width) - 1;
            const width = mapWidth;
            const height = mapHeight;
            const startIndex = startRow * width + startColumn;
            const nodeCount = width * height;
            const targetKey = getEnemyPathTargetKey(enemy, tileDimensions);
            const cachedRoute = enemy.pathRouteCache;

            if (
                cachedRoute &&
                cachedRoute.mapVersion === mapRenderVersion &&
                cachedRoute.targetKey === targetKey &&
                cachedRoute.aiState === enemy.aiState
            ) {
                if (cachedRoute.steps.has(startIndex)) {
                    return cachedRoute.steps.get(startIndex);
                }
            }

            if (
                startRow < 0 || startRow >= height ||
                startColumn < 0 || startColumn >= width
            ) {
                return null;
            }

            const targetCells = enemy.aiState === 'player'
                ? [{
                    kind: 'player',
                    cells: [{
                        row: Math.floor(Player.y / tileDimensions.height),
                        column: Math.floor(Player.x / tileDimensions.width)
                    }]
                }]
                : [];
            if (enemy.aiState !== 'player') {
                if (enemy.aiState === 'eagle') {
                    for (let row = 0; row < height; row += 1) {
                        for (let column = 0; column < width; column += 1) {
                            if (mapGrid[row][column] === EAGLE_ID) {
                                targetCells.push({
                                    kind: 'eagle',
                                    cells: getElementFootprint(row, column, EAGLE_ID)
                                });
                            }
                        }
                    }
                }
            }

            if (targetCells.length === 0 && enemy.aiState !== 'escape') {
                return null;
            }

            const goalTargets = new Map();
            if (enemy.aiState === 'escape') {
                const playerRow = Math.floor(Player.y / tileDimensions.height);
                const playerColumn = Math.floor(Player.x / tileDimensions.width);
                let farthestDistance = -Infinity;
                const escapePositions = [];

                for (let row = 0; row < height; row += 1) {
                    for (let column = 0; column < width; column += 1) {
                        if (!isEnemyPathPositionWalkable(row, column)) {
                            continue;
                        }
                        const distance = Math.abs(row + 1 - (playerRow + 1)) +
                            Math.abs(column + 1 - (playerColumn + 1));
                        if (distance > farthestDistance) {
                            farthestDistance = distance;
                            escapePositions.length = 0;
                        }
                        if (distance === farthestDistance) {
                            escapePositions.push({ row, column });
                        }
                    }
                }

                escapePositions.forEach(({ row, column }) => {
                    goalTargets.set(row * width + column, {
                        direction: enemy.direction ?? 'UP',
                        kind: 'escape'
                    });
                });
            }

            targetCells.forEach((target) => {
                const minRow = Math.min(...target.cells.map((cell) => cell.row));
                const maxRow = Math.max(...target.cells.map((cell) => cell.row));
                const minColumn = Math.min(...target.cells.map((cell) => cell.column));
                const maxColumn = Math.max(...target.cells.map((cell) => cell.column));
                const approachPositions = [
                    ...Array.from({ length: maxColumn - minColumn + 1 }, (_, index) => ({
                        row: minRow - 2,
                        column: minColumn + index,
                        direction: 'DOWN'
                    })),
                    ...Array.from({ length: maxColumn - minColumn + 1 }, (_, index) => ({
                        row: maxRow + 2,
                        column: minColumn + index,
                        direction: 'UP'
                    })),
                    ...Array.from({ length: maxRow - minRow + 1 }, (_, index) => ({
                        row: minRow + index,
                        column: minColumn - 2,
                        direction: 'RIGHT'
                    })),
                    ...Array.from({ length: maxRow - minRow + 1 }, (_, index) => ({
                        row: minRow + index,
                        column: maxColumn + 2,
                        direction: 'LEFT'
                    }))
                ];

                approachPositions.forEach((position) => {
                    if (isEnemyPathPositionWalkable(position.row, position.column)) {
                        const goalIndex = position.row * width + position.column;
                        if (!goalTargets.has(goalIndex)) {
                            goalTargets.set(goalIndex, {
                                direction: position.direction,
                                kind: target.kind
                            });
                        }
                    }
                });
            });

            if (goalTargets.size === 0) {
                return null;
            }

            const now = gameTime;
            const blockedSteps = enemy.pathBlockedSteps ?? new Map();
            enemy.pathBlockedSteps = blockedSteps;
            for (const [key, blockedUntil] of blockedSteps) {
                if (blockedUntil <= now) {
                    blockedSteps.delete(key);
                }
            }

            const getNeighbors = (index) => {
                const row = Math.floor(index / width);
                const column = index % width;
                return [
                    { row: row - 1, column, direction: 'UP' },
                    { row: row + 1, column, direction: 'DOWN' },
                    { row, column: column - 1, direction: 'LEFT' },
                    { row, column: column + 1, direction: 'RIGHT' }
                ];
            };

            const pathCosts = new Float64Array(nodeCount);
            pathCosts.fill(Infinity);
            const settled = new Uint8Array(nodeCount);
            const pathQueue = [];
            const enqueuePathNode = (index, cost) => {
                let queueIndex = pathQueue.length;
                pathQueue.push({ index, cost });
                while (queueIndex > 0) {
                    const parentIndex = Math.floor((queueIndex - 1) / 2);
                    if (pathQueue[parentIndex].cost <= cost) {
                        break;
                    }
                    pathQueue[queueIndex] = pathQueue[parentIndex];
                    queueIndex = parentIndex;
                }
                pathQueue[queueIndex] = { index, cost };
            };
            const dequeuePathNode = () => {
                const firstNode = pathQueue[0];
                const lastNode = pathQueue.pop();
                if (pathQueue.length > 0 && lastNode) {
                    let queueIndex = 0;
                    while (true) {
                        const leftIndex = queueIndex * 2 + 1;
                        const rightIndex = leftIndex + 1;
                        if (leftIndex >= pathQueue.length) {
                            break;
                        }
                        const childIndex = rightIndex < pathQueue.length &&
                                pathQueue[rightIndex].cost < pathQueue[leftIndex].cost
                            ? rightIndex
                            : leftIndex;
                        if (pathQueue[childIndex].cost >= lastNode.cost) {
                            break;
                        }
                        pathQueue[queueIndex] = pathQueue[childIndex];
                        queueIndex = childIndex;
                    }
                    pathQueue[queueIndex] = lastNode;
                }
                return firstNode;
            };
            goalTargets.forEach((target, index) => {
                pathCosts[index] = 0;
                enqueuePathNode(index, 0);
            });

            while (pathQueue.length > 0) {
                const currentNode = dequeuePathNode();
                if (!currentNode || currentNode.cost !== pathCosts[currentNode.index]) {
                    continue;
                }
                const currentIndex = currentNode.index;
                const currentCost = currentNode.cost;
                settled[currentIndex] = 1;

                getNeighbors(currentIndex).forEach((neighbor) => {
                    if (!isEnemyPathPositionWalkable(neighbor.row, neighbor.column)) {
                        return;
                    }
                    const neighborIndex = neighbor.row * width + neighbor.column;
                    const reverseStepKey = `${neighbor.row},${neighbor.column}:${
                        reverseDirection(neighbor.direction)
                    }`;
                    if (
                        settled[neighborIndex] ||
                        (blockedSteps.get(reverseStepKey) ?? 0) > now
                    ) {
                        return;
                    }
                    const traversalCost = getEnemyPathPositionPreferenceCost(
                        neighbor.row,
                        neighbor.column
                    );
                    const nextCost = currentCost + traversalCost;
                    if (nextCost < pathCosts[neighborIndex]) {
                        pathCosts[neighborIndex] = nextCost;
                        enqueuePathNode(neighborIndex, nextCost);
                    }
                });
            }

            if (!Number.isFinite(pathCosts[startIndex])) {
                enemy.pathRouteCache = {
                    mapVersion: mapRenderVersion,
                    targetKey,
                    aiState: enemy.aiState,
                    steps: new Map([[startIndex, null]])
                };
                return null;
            }

            if (goalTargets.has(startIndex)) {
                const target = goalTargets.get(startIndex);
                const routeStep = target && target.kind !== 'escape'
                    ? { direction: target.direction, tileId: null, targetKind: target.kind }
                    : null;
                enemy.pathRouteCache = {
                    mapVersion: mapRenderVersion,
                    targetKey,
                    aiState: enemy.aiState,
                    steps: new Map([[startIndex, routeStep]])
                };
                return routeStep;
            }

            const steps = new Map();
            let currentIndex = startIndex;
            let currentDirection = enemy.direction;

            while (!goalTargets.has(currentIndex)) {
                const row = Math.floor(currentIndex / width);
                const column = currentIndex % width;
                const candidates = getNeighbors(currentIndex).filter((neighbor) => {
                    if (!isEnemyPathPositionWalkable(neighbor.row, neighbor.column)) {
                        return false;
                    }
                    const neighborIndex = neighbor.row * width + neighbor.column;
                    const blockedKey = `${row},${column}:${neighbor.direction}`;
                    return pathCosts[neighborIndex] < pathCosts[currentIndex] &&
                        (blockedSteps.get(blockedKey) ?? 0) <= now;
                }).map((neighbor) => {
                    const neighborIndex = neighbor.row * width + neighbor.column;
                    return {
                        ...neighbor,
                        index: neighborIndex,
                        preferenceCost: pathCosts[neighborIndex],
                        blockedKey: `${row},${column}:${neighbor.direction}`
                    };
                });

                if (candidates.length === 0) {
                    enemy.pathRouteCache = null;
                    return null;
                }

                const reverseCurrentDirection = reverseDirection(currentDirection);
                const bestStep = candidates.reduce((best, candidate) => {
                    const candidateScore = candidate.preferenceCost + (
                        candidate.direction === reverseCurrentDirection ? 0.75 : 0
                    );
                    const bestScore = best.preferenceCost + (
                        best.direction === reverseCurrentDirection ? 0.75 : 0
                    );

                    if (
                        candidateScore < bestScore ||
                        (Math.abs(candidateScore - bestScore) < 1e-9 &&
                            (candidate.direction === currentDirection ||
                                (candidate.direction !== reverseCurrentDirection &&
                                    best.direction === reverseCurrentDirection)))
                    ) {
                        return candidate;
                    }
                    return best;
                });
                const routeStep = {
                    direction: bestStep.direction,
                    tileId: getEnemyPathTileId(bestStep.row, bestStep.column),
                    routeRow: bestStep.row,
                    routeColumn: bestStep.column,
                    targetKind: null,
                    blockedKey: bestStep.blockedKey
                };
                steps.set(currentIndex, routeStep);
                currentIndex = bestStep.index;
                currentDirection = bestStep.direction;
            }

            const target = goalTargets.get(currentIndex);
            if (target) {
                steps.set(currentIndex, target.kind === 'escape'
                    ? null
                    : {
                        direction: target.direction,
                        tileId: null,
                        targetKind: target.kind,
                        blockedKey: null
                    });
            }

            enemy.pathRouteCache = {
                mapVersion: mapRenderVersion,
                targetKey,
                aiState: enemy.aiState,
                steps
            };
            return steps.get(startIndex) ?? null;
        }

        function alignEnemyToRouteCenter(enemy, direction, routeStep) {
            if (
                !Number.isInteger(routeStep?.routeRow) ||
                !Number.isInteger(routeStep?.routeColumn)
            ) {
                return;
            }

            const roadAnchors = [];
            for (let row = routeStep.routeRow; row < routeStep.routeRow + 2; row += 1) {
                for (
                    let column = routeStep.routeColumn;
                    column < routeStep.routeColumn + 2;
                    column += 1
                ) {
                    const road = getElementAnchor(row, column);
                    if (road && ROAD_TILE_IDS.has(road.tileId)) {
                        roadAnchors.push(road);
                    }
                }
            }
            if (roadAnchors.length === 0) {
                return;
            }

            const tileDimensions = getTileDimensions();
            const tankCenterX = enemy.physicsX / tileDimensions.width;
            const tankCenterY = enemy.physicsY / tileDimensions.height;
            const road = roadAnchors.reduce((best, candidate) => {
                const candidateSize = getElementFootprintSize(candidate.tileId);
                const bestSize = getElementFootprintSize(best.tileId);
                const candidateDistance = Math.hypot(
                    tankCenterX - (candidate.column + candidateSize.width / 2),
                    tankCenterY - (candidate.row + candidateSize.height / 2)
                );
                const bestDistance = Math.hypot(
                    tankCenterX - (best.column + bestSize.width / 2),
                    tankCenterY - (best.row + bestSize.height / 2)
                );
                return candidateDistance < bestDistance ? candidate : best;
            }, roadAnchors[0]);
            const roadSize = getElementFootprintSize(road.tileId);
            let nextX = enemy.physicsX;
            let nextY = enemy.physicsY;

            if (roadSize.width === roadSize.height) {
                nextX = (road.column + roadSize.width / 2) * tileDimensions.width;
                nextY = (road.row + roadSize.height / 2) * tileDimensions.height;
            } else if (roadSize.width > roadSize.height) {
                if (direction === 'UP' || direction === 'DOWN') {
                    nextX = (road.column + roadSize.width / 2) * tileDimensions.width;
                } else {
                    nextY = (road.row + roadSize.height / 2) * tileDimensions.height;
                }
            } else if (direction === 'LEFT' || direction === 'RIGHT') {
                nextY = (road.row + roadSize.height / 2) * tileDimensions.height;
            } else {
                nextX = (road.column + roadSize.width / 2) * tileDimensions.width;
            }

            const alignedPosition = quantizeWorldPosition(nextX, nextY);
            if (checkTankCollisionAt(
                alignedPosition.x,
                alignedPosition.y,
                direction,
                getPlayerDimensions(),
                enemy,
                true
            )) {
                return;
            }

            enemy.physicsX = alignedPosition.x;
            enemy.physicsY = alignedPosition.y;
            enemy.x = alignedPosition.x;
            enemy.y = alignedPosition.y;
        }

        function chooseEnemyDirection(enemy, forceReverse = false) {
            enemy.pathTargetTileId = null;
            enemy.pathTargetKind = null;
            enemy.pathRouteStep = null;

            if (
                ['f', 'e'].includes(enemy.textureType) &&
                (
                    enemy.aiState === 'eagle' ||
                    enemy.aiState === 'player' ||
                    enemy.aiState === 'escape'
                )
            ) {
                let path = getEnemyPathDirection(enemy);
                if (!path && enemy.aiState === 'eagle') {
                    enemy.primaryAiState = 'player';
                    enemy.aiState = 'player';
                    enemy.pathBlockedSteps?.clear();
                    enemy.pathRouteCache = null;
                    path = getEnemyPathDirection(enemy);
                }
                if (path) {
                    enemy.pathRouteStep = path;
                    enemy.pathTargetTileId = path.tileId;
                    enemy.pathTargetKind = path.targetKind;
                    enemy.pathBlockedStepKey = path.blockedKey ?? null;
                    return path.direction;
                }
            }
            enemy.pathBlockedStepKey = null;

            const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
            const currentDirection = enemy.direction ?? 'UP';
            const currentReverse = reverseDirection(currentDirection);
            const tankDimensions = getPlayerDimensions();
            const recentIceExitDirection = (
                enemy.recentIceExitDirection &&
                (enemy.recentIceExitUntil ?? 0) > gameTime
            )
                ? enemy.recentIceExitDirection
                : null;
            const openDirections = directions.filter((direction) => {
                const movement = getTileDimensions().width * 0.9;
                const nextPosition = gameCore.getPositionInDirection(
                    enemy.physicsX,
                    enemy.physicsY,
                    direction,
                    movement
                );
                const quantizedNext = quantizeWorldPosition(
                    nextPosition.x,
                    nextPosition.y
                );
                return !checkTankCollisionAt(
                    quantizedNext.x,
                    quantizedNext.y,
                    direction,
                    tankDimensions,
                    enemy,
                    true
                );
            });

            if (openDirections.length === 0) {
                return currentReverse;
            }

            if (enemy.aiState === 'random') {
                return gameCore.chooseRandomEnemyDirection(
                    openDirections,
                    recentIceExitDirection
                );
            }

            const preferredDirections = gameCore.getPreferredEnemyDirections(
                openDirections,
                currentDirection,
                currentReverse,
                recentIceExitDirection,
                forceReverse
            );

            const target = getEnemyAiTarget(enemy);
            return gameCore.chooseEnemyDirection(
                preferredDirections,
                currentDirection,
                currentReverse,
                enemy.aiState,
                target.x - enemy.physicsX,
                target.y - enemy.physicsY
            );
        }

        function getEnemyMuzzlePosition(enemy, direction = enemy.direction ?? 'UP') {
            const enemyDimensions = getPlayerDimensions();
            return gameCore.getMuzzlePosition(
                enemy.x,
                enemy.y,
                direction,
                enemyDimensions.width,
                enemyDimensions.height,
                PLAYER_MUZZLE_OFFSET_RATIO,
                PLAYER_MUZZLE_CENTER_PULL_PIXELS
            );
        }

        function getEnemyDirectionFree(enemy, direction) {
            const movement = getTileDimensions().width * 0.9;
            const nextPosition = gameCore.getPositionInDirection(
                enemy.physicsX,
                enemy.physicsY,
                direction,
                movement
            );
            const quantizedNext = quantizeWorldPosition(
                nextPosition.x,
                nextPosition.y
            );
            return !checkTankCollisionAt(
                quantizedNext.x,
                quantizedNext.y,
                direction,
                getPlayerDimensions(),
                enemy,
                true
            );
        }

        function isEnemyCompletelyEncased(enemy) {
            const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
            return directions.every((direction) => !getEnemyDirectionFree(enemy, direction));
        }

        function getAlignedPlayerDirection(enemy) {
            const tileDimensions = getTileDimensions();
            return gameCore.getAlignedPlayerDirection(
                Player.x,
                Player.y,
                enemy.x,
                enemy.y,
                tileDimensions.width,
                tileDimensions.height
            );
        }

        function getEnemyPlayerAimDirection(enemy) {
            const alignedDirection = getAlignedPlayerDirection(enemy);
            return gameCore.getEnemyPlayerAimDirection(
                alignedDirection,
                enemy.textureType,
                enemy.aiState
            );
        }

        function fireEnemyBullet(enemy, directionOverride = null) {
            if (!isSimulationActive || !enemy) {
                return;
            }

            const tankType = getEnemyTankType(enemy);
            const bulletLimit = getEnemyBulletLimit(enemy);
            const initialDirection = directionOverride ?? enemy.direction ?? 'UP';
            const directions = getTankBurstDirections(tankType, initialDirection);
            const activeEnemyBullets = bullets.filter(
                (bullet) => bullet.owner === 'enemy' && bullet.ownerId === enemy.id
            ).length;
            if (activeEnemyBullets + directions.length > bulletLimit) {
                return;
            }
            if (tankType === 9 && (
                enemyRank9Bursts.has(enemy.id) ||
                activeEnemyBullets > 0
            )) {
                return;
            }

            const cooldownMs = getEnemyFireCooldownMs(enemy);
            const cooldownPassed = gameTime >= (enemy.fireCooldownUntil ?? 0);
            if (!cooldownPassed) {
                return;
            }

            const direction = directionOverride ??
                getEnemyPlayerAimDirection(enemy) ??
                enemy.direction ??
                'UP';
            const burstDirections = getTankBurstDirections(tankType, direction);
            enemy.lastShotAt = gameTime;
            enemy.fireCooldownUntil = gameTime + cooldownMs;
            const tileDimensions = getTileDimensions();
            const bulletSize = Math.min(tileDimensions.width, tileDimensions.height)
                * BULLET_SIZE_IN_TILES;
            const offsets = getTankTwinShotEnabled(tankType)
                ? getTwinShotSpawnOffsets(burstDirections[0])
                : burstDirections.map(() => ({ x: 0, y: 0 }));

            if (tankType === 9) {
                const burstId = nextBulletBurstId++;
                spawnEnemyTankBullet(enemy, burstDirections[0], bulletSize, burstId);
                enemyRank9Bursts.set(enemy.id, {
                    enemy,
                    id: burstId,
                    direction: burstDirections[0],
                    tankType,
                    remaining: 2,
                    nextShotAt: gameTime + 90,
                    waitUntil: null
                });
                return;
            }

            burstDirections.forEach((bulletDirection, index) => {
                const offset = offsets[index] ?? { x: 0, y: 0 };
                spawnEnemyTankBullet(
                    enemy,
                    bulletDirection,
                    bulletSize,
                    null,
                    offset
                );
            });
        }

        function spawnEnemyTankBullet(
            enemy,
            direction,
            bulletSize,
            burstId = null,
            offset = { x: 0, y: 0 },
            tankType = getEnemyTankType(enemy)
        ) {
            const muzzle = getEnemyMuzzlePosition(enemy, direction);
            const directionVector = gameCore.getDirectionVector(direction);
            bullets.push({
                x: muzzle.x + offset.x,
                y: muzzle.y + offset.y,
                physicsX: muzzle.x + offset.x,
                physicsY: muzzle.y + offset.y,
                vx: directionVector.x,
                vy: directionVector.y,
                direction,
                owner: 'enemy',
                ownerId: enemy.id,
                burstId,
                size: bulletSize,
                hitboxes: BULLET_HITBOX_MASKS,
                projectileSpeedMultiplier: getTankProjectileSpeedMultiplier(tankType),
                canBreakSteel: getTankCanBreakSteel(tankType),
                reinforcedBrickDamageMultiplier:
                    getTankReinforcedBrickDamageMultiplier(tankType)
            });
        }

        function updateEnemyRank9Bursts() {
            enemyRank9Bursts.forEach((burst, enemyId) => {
                const bulletSize = Math.min(
                    getTileDimensions().width,
                    getTileDimensions().height
                ) * BULLET_SIZE_IN_TILES;
                if (burst.remaining > 0 && gameTime >= burst.nextShotAt) {
                    spawnEnemyTankBullet(
                        burst.enemy,
                        burst.direction,
                        bulletSize,
                        burst.id,
                        { x: 0, y: 0 },
                        burst.tankType
                    );
                    burst.remaining -= 1;
                    burst.nextShotAt += 90;
                }
                if (
                    burst.remaining === 0 &&
                    !bullets.some((bullet) =>
                        bullet.owner === 'enemy' &&
                        bullet.ownerId === enemyId &&
                        bullet.burstId === burst.id
                    )
                ) {
                    burst.waitUntil ??= gameTime + 200;
                    if (gameTime >= burst.waitUntil) {
                        enemyRank9Bursts.delete(enemyId);
                    }
                }
            });
        }

        function alignEnemyForDirection(enemy, direction) {
            alignTankForDirection(enemy, direction);
        }

        function getEnemyBlockingTileId(enemy, centerX, centerY, direction) {
            const dimensions = getPlayerDimensions();
            const tileDimensions = getTileDimensions();
            const samplePositions = gameCore.getForwardTileSamplePositions(
                centerX,
                centerY,
                direction,
                dimensions.width,
                dimensions.height,
                tileDimensions.width,
                tileDimensions.height
            );
            if (!samplePositions) {
                return null;
            }

            for (const { row, column, x: sampleX, y: sampleY } of samplePositions) {
                const element = getElementAnchor(row, column);
                const tileId = element?.tileId ?? mapGrid[row]?.[column] ?? null;

                if (
                    (tileId !== null &&
                        isBlockingTileAt(row, column, sampleX, sampleY)) ||
                    (element && isSolidTile(element.tileId))
                ) {
                    return tileId;
                }
            }

            return null;
        }

        function realignEnemyBeforePlayerSpawn(enemy) {
            if (!playerRespawnIntroActive || playerSpawnIntroStart <= 0) {
                return;
            }

            moveEnemyBesidePlayerSpawn(enemy, getActivePlayerSpawnTileId());
        }

        function updateEnemy(enemy, deltaSeconds) {
            const wasMoving = enemy.isMoving;
            const previousDirection = enemy.direction;
            enemy.isMoving = false;
            realignEnemyBeforePlayerSpawn(enemy);
            const wasTouchingIce = isEnemyTouchingTile(ICE_ID, enemy) ||
                isEnemyTouchingTile(COMPACT_ICE_ID, enemy);

            if (!enemy.substate) {
                enemy.substate = 'Normal';
            }

            if (enemy.substate === 'Trapped') {
                if (!isEnemyCompletelyEncased(enemy)) {
                    enemy.substate = 'Normal';
                    enemy.nextTrappedShotAt = 0;
                    clearEnemySliding(enemy);
                    enemy.direction = chooseEnemyDirection(enemy, false);
                    enemy.remainingDistance = 0;
                    return;
                }

                const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
                if (!enemy.nextTrappedShotAt || gameTime >= enemy.nextTrappedShotAt) {
                    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
                    enemy.direction = randomDirection;
                    fireEnemyBullet(enemy, randomDirection);
                    enemy.nextTrappedShotAt = gameTime + getEnemyFireCooldownMs(enemy);
                }
                return;
            }

            if (isEnemyCompletelyEncased(enemy)) {
                enemy.substate = 'Trapped';
                enemy.nextTrappedShotAt = gameTime;
                clearEnemySliding(enemy);
                enemy.direction = ['UP', 'RIGHT', 'DOWN', 'LEFT'][Math.floor(Math.random() * 4)];
                return;
            }
            if (!enemy.aiState || !enemy.aiStateUntil || gameTime >= enemy.aiStateUntil) {
                rotateEnemyAiState(enemy);
            }

            if (enemy.pauseUntil && gameTime < enemy.pauseUntil) {
                enemy.isMoving = false;
                return;
            }

            if (enemy.pauseUntil && gameTime >= enemy.pauseUntil) {
                enemy.pauseUntil = 0;
            }

            if (enemy.slidingDirection) {
                const touchingIce = isEnemyTouchingTile(ICE_ID, enemy);
                const touchingCompactIce = isEnemyTouchingTile(COMPACT_ICE_ID, enemy);
                if (enemy.slidingOnCompactIce && !touchingCompactIce) {
                    if (touchingIce) {
                        enemy.slidingOnCompactIce = false;
                        enemy.slidingDistance = 0;
                    } else {
                        clearEnemySliding(enemy);
                    }
                } else if (
                    enemy.slidingDirection &&
                    !enemy.slidingOnCompactIce &&
                    (!touchingIce ||
                        enemy.slidingDistance >= ICE_SLIDE_DISTANCE_TILES)
                ) {
                    clearEnemySliding(enemy);
                }

                const canKeepSliding = enemy.slidingDirection &&
                    getEnemyDirectionFree(enemy, enemy.slidingDirection);
                if (enemy.slidingDirection && !canKeepSliding) {
                    clearEnemySliding(enemy);
                    enemy.direction = chooseEnemyDirection(enemy, true);
                    enemy.remainingDistance = 0;
                } else if (!enemy.slidingDirection) {
                    enemy.remainingDistance = 0;
                }
            }

            if (enemy.slidingDirection) {
                enemy.direction = enemy.slidingDirection;
            }

            if (!enemy.remainingDistance || enemy.remainingDistance <= 0) {
                const followsSmartPath = ['f', 'e'].includes(enemy.textureType) &&
                    ['eagle', 'player', 'escape'].includes(enemy.aiState);
                enemy.remainingDistance = followsSmartPath
                    ? 1
                    : Math.random() * (
                        ENEMY_TANK_MAX_MOVE_TILES - ENEMY_TANK_MIN_MOVE_TILES
                    ) + ENEMY_TANK_MIN_MOVE_TILES;
                const nextDirection = chooseEnemyDirection(enemy, false);
                if (!enemy.slidingDirection && nextDirection !== enemy.direction) {
                    alignEnemyForDirection(enemy, nextDirection);
                }
                alignEnemyToRouteCenter(enemy, nextDirection, enemy.pathRouteStep);
                enemy.direction = nextDirection;
            }

            const movementDirection = enemy.slidingDirection ?? enemy.direction;
            if (['f', 'e'].includes(enemy.textureType)) {
                enemy.direction = movementDirection;
            }
            const subTileDimensions = getSubTileDimensions();
            const speedFactor = gameCore.getTankTerrainSpeedMultiplier(
                isEnemyTouchingTile(VERY_DENSE_BUSH_ID, enemy),
                isEnemyTouchingTile(DENSE_BUSH_ID, enemy),
                isEnemyTouchingRoute(enemy)
            );
            let movement = (enemy.speed ?? PLAYER_SPEED_TILES_PER_SECOND)
                * speedFactor * subTileDimensions.width * deltaSeconds;
            movement = gameCore.limitIceSlideMovement(
                movement,
                Boolean(enemy.slidingDirection),
                enemy.slidingOnCompactIce,
                enemy.slidingDistance,
                ICE_SLIDE_DISTANCE_TILES,
                getTileDimensions().width
            );
            const directionVector = gameCore.getDirectionVector(movementDirection)
                ?? { x: 0, y: 0 };
            const nextX = enemy.physicsX + directionVector.x * movement;
            const nextY = enemy.physicsY + directionVector.y * movement;
            const nextQuantized = quantizeWorldPosition(nextX, nextY);
            const tankDimensions = getPlayerDimensions();

            if (!checkTankCollisionAt(
                nextQuantized.x,
                nextQuantized.y,
                movementDirection,
                tankDimensions,
                enemy,
                true
            )) {
                enemy.physicsX = nextX;
                enemy.physicsY = nextY;
                enemy.x = nextQuantized.x;
                enemy.y = nextQuantized.y;
                enemy.lastBlockedTileId = null;
                enemy.remainingDistance -= movement / getTileDimensions().width;
                enemy.distanceTravelled = (enemy.distanceTravelled ?? 0) + movement;
                enemy.isMoving = true;
                playIceTurnSound(
                    wasMoving,
                    previousDirection,
                    movementDirection,
                    wasTouchingIce
                );
                updateEnemySlidingAfterMovement(enemy, movementDirection, movement);
                fireEnemyBullet(enemy);
                return;
            }

            enemy.isMoving = false;
            const blockingTileId = getEnemyBlockingTileId(
                enemy,
                nextQuantized.x,
                nextQuantized.y,
                movementDirection
            );
            enemy.lastBlockedTileId = blockingTileId;

            const blockedByBrick = BRICK_TILE_IDS.has(blockingTileId) ||
                (blockingTileId === null && BRICK_TILE_IDS.has(enemy.pathTargetTileId));
            const reachedPathTarget = (
                enemy.pathTargetKind === 'eagle' &&
                (blockingTileId === null || blockingTileId === EAGLE_ID)
            ) || (
                enemy.pathTargetKind === 'player' &&
                blockingTileId === null
            );

            if (
                ['f', 'e'].includes(enemy.textureType) &&
                (blockedByBrick || reachedPathTarget)
            ) {
                fireEnemyBullet(enemy, movementDirection);
                enemy.remainingDistance = 0;
                return;
            }

            if (
                ['f', 'e'].includes(enemy.textureType) &&
                (
                    enemy.aiState === 'eagle' ||
                    enemy.aiState === 'player' ||
                    enemy.aiState === 'escape'
                )
            ) {
                if (enemy.pathBlockedStepKey) {
                    const blockedSteps = enemy.pathBlockedSteps ?? new Map();
                    enemy.pathBlockedSteps = blockedSteps;
                    blockedSteps.set(
                        enemy.pathBlockedStepKey,
                        gameTime + ENEMY_PATH_BLOCKED_RETRY_MS
                    );
                }
                enemy.pathRouteCache = null;
                enemy.remainingDistance = 0;
                return;
            }

            if (Math.random() < ENEMY_TANK_STOP_CHANCE) {
                enemy.pauseUntil = gameTime + ENEMY_TANK_PAUSE_SECONDS * 1000;
                enemy.remainingDistance = 0;
                return;
            }

            enemy.direction = chooseEnemyDirection(enemy, true);
            enemy.remainingDistance = 0;
        }

        function separateOverlappingEnemies() {
            const enemyDimensions = getPlayerDimensions();
            const subTileDimensions = getSubTileDimensions();
            const gridStepX = subTileDimensions.width * MAGNET_STEP_IN_SUB_TILES;
            const gridStepY = subTileDimensions.height * MAGNET_STEP_IN_SUB_TILES;

            const overlaps = (first, second) => (
                Math.abs(first.x - second.x) < enemyDimensions.width &&
                Math.abs(first.y - second.y) < enemyDimensions.height
            );

            enemyTanks.forEach((enemy) => {
                const touchingPlayer = shouldDrawPlayerAfterSpawn &&
                    overlaps(enemy, Player) &&
                    !playerEnemyPairsIgnoringCollision.has(enemy.id);

                if (!touchingPlayer) {
                    return;
                }

                const candidates = [
                    { x: getNearestTankGridLine(enemy.physicsX - gridStepX, subTileDimensions.width), y: enemy.physicsY },
                    { x: getNearestTankGridLine(enemy.physicsX + gridStepX, subTileDimensions.width), y: enemy.physicsY },
                    { x: enemy.physicsX, y: getNearestTankGridLine(enemy.physicsY - gridStepY, subTileDimensions.height) },
                    { x: enemy.physicsX, y: getNearestTankGridLine(enemy.physicsY + gridStepY, subTileDimensions.height) }
                ];
                const candidate = candidates.find((position) => !checkTankCollisionAt(
                    position.x,
                    position.y,
                    enemy.direction,
                    enemyDimensions,
                    enemy,
                    true
                ));

                if (!candidate) {
                    return;
                }

                enemy.physicsX = candidate.x;
                enemy.physicsY = candidate.y;
                const quantized = quantizeWorldPosition(candidate.x, candidate.y);
                enemy.x = quantized.x;
                enemy.y = quantized.y;
                enemy.remainingDistance = 0;
            });
        }

        function updateEnemyCollisionPairs() {
            const enemyDimensions = getPlayerDimensions();
            const overlappingPairs = new Set();
            const overlappingPlayerPairs = new Set();

            for (let firstIndex = 0; firstIndex < enemyTanks.length; firstIndex += 1) {
                const first = enemyTanks[firstIndex];
                if (
                    shouldDrawPlayerAfterSpawn &&
                    Math.abs(first.x - Player.x) < enemyDimensions.width &&
                    Math.abs(first.y - Player.y) < enemyDimensions.height
                ) {
                    overlappingPlayerPairs.add(first.id);
                }

                for (let secondIndex = firstIndex + 1; secondIndex < enemyTanks.length; secondIndex += 1) {
                    const second = enemyTanks[secondIndex];
                    const overlaps = (
                        Math.abs(first.x - second.x) < enemyDimensions.width &&
                        Math.abs(first.y - second.y) < enemyDimensions.height
                    );

                    if (overlaps) {
                        overlappingPairs.add(getEnemyPairKey(first, second));
                    }
                }
            }

            enemyPairsIgnoringCollision = overlappingPairs;
            playerEnemyPairsIgnoringCollision = overlappingPlayerPairs;
        }

        function updateEnemies(deltaSeconds) {
            if (gameTime < enemyFrozenUntil) {
                enemyTanks.forEach((enemy) => {
                    enemy.isMoving = false;
                });
                return;
            }

            updateEnemyCollisionPairs();
            separateOverlappingEnemies();
            enemyTanks.forEach((enemy) => updateEnemy(enemy, deltaSeconds));
        }

        function drawEnemyHitboxOutline(enemy, color) {
            const enemyDimensions = getPlayerDimensions();
            const pixelWidth = enemyDimensions.width / PLAYER_HITBOX_GRID_SIZE;
            const pixelHeight = enemyDimensions.height / PLAYER_HITBOX_GRID_SIZE;
            const halfWidth = enemyDimensions.width / 2;
            const halfHeight = enemyDimensions.height / 2;
            const rotationByDirection = {
                UP: 0,
                RIGHT: Math.PI / 2,
                DOWN: Math.PI,
                LEFT: -Math.PI / 2
            };

            context.save();
            context.rotate(rotationByDirection[enemy.direction ?? 'UP'] ?? 0);
            context.strokeStyle = color;
            context.lineWidth = 1;
            context.beginPath();

            PLAYER_HITBOX_MASKS.object.forEach((row, rowIndex) => {
                Array.from(row).forEach((filled, columnIndex) => {
                    if (filled !== '1') {
                        return;
                    }

                    const left = -halfWidth + columnIndex * pixelWidth;
                    const top = -halfHeight + rowIndex * pixelHeight;
                    const right = left + pixelWidth;
                    const bottom = top + pixelHeight;
                    const hasFilled = (neighborRow, neighborColumn) => (
                        PLAYER_HITBOX_MASKS.object[neighborRow]?.[neighborColumn] === '1'
                    );

                    if (!hasFilled(rowIndex - 1, columnIndex)) {
                        context.moveTo(left, top);
                        context.lineTo(right, top);
                    }
                    if (!hasFilled(rowIndex + 1, columnIndex)) {
                        context.moveTo(left, bottom);
                        context.lineTo(right, bottom);
                    }
                    if (!hasFilled(rowIndex, columnIndex - 1)) {
                        context.moveTo(left, top);
                        context.lineTo(left, bottom);
                    }
                    if (!hasFilled(rowIndex, columnIndex + 1)) {
                        context.moveTo(right, top);
                        context.lineTo(right, bottom);
                    }
                });
            });

            context.stroke();
            context.restore();
        }

        function drawEnemies() {
            const enemiesToDraw = [
                ...enemyTanks,
                ...pendingTntDetonations.map(({ enemy }) => enemy)
            ];
            enemiesToDraw.forEach((enemy) => {
                const pendingDetonation = pendingTntDetonations.find(
                    (pending) => pending.enemy === enemy
                );
                if (
                    pendingDetonation &&
                    getTntDetonationBlinkFrame(
                        pendingDetonation.startedAt,
                        pendingDetonation.detonatesAt
                    ) === 1
                ) {
                    return;
                }

                const enemyDimensions = getPlayerDimensions();
                const halfWidth = enemyDimensions.width / 2;
                const halfHeight = enemyDimensions.height / 2;
                const visualPosition = getVisualWorldPosition(enemy.x, enemy.y);
                const enemyTexture = getEnemyTexture(enemy, previousFrameTime);

                context.save();
                context.translate(visualPosition.x, visualPosition.y);

                if (enemyTexture) {
                    context.drawImage(
                        enemyTexture,
                        -halfWidth,
                        -halfHeight,
                        enemyDimensions.width,
                        enemyDimensions.height
                    );
                }

                if (areHitboxesVisible) {
                    drawEnemyHitboxOutline(enemy, '#ff7a7a');
                }

                context.restore();
            });
        }

        function drawPlayer() {
            const playerDimensions = getPlayerDimensions();
            const halfWidth = playerDimensions.width / 2;
            const halfHeight = playerDimensions.height / 2;
            const playerTexture = getPlayerTexture(previousFrameTime);
            const visualPosition = getVisualPlayerPosition();

            context.save();
            context.translate(visualPosition.x, visualPosition.y);
            let usingFallbackPlayer = false;

            if (playerTexture) {
                context.drawImage(
                    playerTexture,
                    -halfWidth,
                    -halfHeight,
                    playerDimensions.width,
                    playerDimensions.height
                );
            } else {
                usingFallbackPlayer = true;
                context.fillStyle = PLAYER_COLOR;
                context.fillRect(
                    -halfWidth,
                    -halfHeight,
                    playerDimensions.width,
                    playerDimensions.height
                );
            }

            if (usingFallbackPlayer) {
                const gunRotation = {
                    UP: 0,
                    RIGHT: Math.PI / 2,
                    DOWN: Math.PI,
                    LEFT: -Math.PI / 2
                };

                context.save();
                context.rotate(gunRotation[Player.direction]);
                context.fillStyle = PLAYER_GUN_COLOR;
                context.fillRect(-3, -halfHeight - 7, 6, 10);
                context.restore();
            }

            if (areHitboxesVisible) {
                drawPlayerHitboxOutline('object', '#ffe066');
                drawPlayerHitboxOutline('enemyBullet', '#ff9e5a');
            }

            if (gameTime < playerInvincibleUntil) {
                const shieldTexture = shieldTextures[
                    Math.floor(gameTime / 100) % shieldTextures.length
                ];
                if (shieldTexture) {
                    context.drawImage(
                        shieldTexture,
                        -halfWidth,
                        -halfHeight,
                        playerDimensions.width,
                        playerDimensions.height
                    );
                }
            }

            context.restore();
        }

        function drawPlayerHitboxOutline(hitboxName, color) {
            const mask = PLAYER_HITBOX_MASKS[hitboxName];
            const playerDimensions = getPlayerDimensions();
            const pixelWidth = playerDimensions.width / PLAYER_HITBOX_GRID_SIZE;
            const pixelHeight = playerDimensions.height / PLAYER_HITBOX_GRID_SIZE;
            const halfWidth = playerDimensions.width / 2;
            const halfHeight = playerDimensions.height / 2;

            const rotationByDirection = {
                UP: 0,
                RIGHT: Math.PI / 2,
                DOWN: Math.PI,
                LEFT: -Math.PI / 2
            };

            context.save();
            context.rotate(rotationByDirection[Player.direction] ?? 0);
            context.strokeStyle = color;
            context.lineWidth = 1;
            context.beginPath();

            mask.forEach((row, rowIndex) => {
                Array.from(row).forEach((filled, columnIndex) => {
                    if (filled !== '1') {
                        return;
                    }

                    const left = -halfWidth + columnIndex * pixelWidth;
                    const top = -halfHeight + rowIndex * pixelHeight;
                    const right = left + pixelWidth;
                    const bottom = top + pixelHeight;
                    const hasFilled = (neighborRow, neighborColumn) => (
                        mask[neighborRow]?.[neighborColumn] === '1'
                    );

                    if (!hasFilled(rowIndex - 1, columnIndex)) {
                        context.moveTo(left, top);
                        context.lineTo(right, top);
                    }
                    if (!hasFilled(rowIndex + 1, columnIndex)) {
                        context.moveTo(left, bottom);
                        context.lineTo(right, bottom);
                    }
                    if (!hasFilled(rowIndex, columnIndex - 1)) {
                        context.moveTo(left, top);
                        context.lineTo(left, bottom);
                    }
                    if (!hasFilled(rowIndex, columnIndex + 1)) {
                        context.moveTo(right, top);
                        context.lineTo(right, bottom);
                    }
                });
            });

            context.stroke();
            context.restore();
        }

        function startSimulation(startMuted = false, { deferSpawns = false } = {}) {
            if (!findTileCenter(PLAYER_INITIAL_SPAWN_ID)) {
                showMessage('The map needs a Player Initial Spawn before playing.');
                return;
            }

            resumeSimulationAfterBackground = false;
            playerRank9Burst = null;
            enemyRank9Bursts.clear();
            tntBlockDetonations.clear();
            setMapZoom(100, false);
            window.clearTimeout(packGameOverReturnTimeout);
            packGameOverReturnTimeout = 0;
            reloadAssetsButton.disabled = true;
            if (!startMuted) {
                unlockGameAudio();
            }
            stopMovementAudio();
            restoreTemporarySteel();
            const snapshot = takeSimulationSnapshot();
            simulationMapSnapshot = snapshot.mapGrid;
            simulationBrickDamageSnapshot = snapshot.brickDamage;
            clearSelection();
            isSimulationActive = true;
            isGamePaused = false;
            editorInactivePauseMessage.classList.remove('visible');
            gamePauseMessage.classList.remove('visible');
            reloadAssetsButton.disabled = true;
            canvasModeControls.style.pointerEvents = 'none';
            updateTouchControlsVisibility();
            isGameOver = false;
            isPlayerDead = false;
            setGameSoundsMuted(startMuted);
            enableGameAudioButton.hidden = !startMuted;
            gameOverMessage.classList.remove('visible');
            gameOverMessage.classList.remove('game-over-intro');
            levelScoreScreen.hidden = true;
            stopLevelScoreAnimation();
            powerUpsOnMap.length = 0;
            enemyFrozenUntil = 0;
            playerLives = getConfiguredInitialLives();
            updatePlayerLivesDisplay();
            defeatedEnemyCount = 0;
            defeatedEnemiesByRank.fill(0);
            updateEnemyLivesDisplay();
            playerHasRespawned = false;
            destroyedEagleTiles.clear();
            shouldDrawPlayerAfterSpawn = false;
            playerRespawnIntroActive = false;
            playerRespawnPending = false;
            nextEnemySpawnOrderIndex = 0;
            nextEnemySpawnAllowedAt = 0;
            areInitialSpawnsDeferred = deferSpawns;
            playerSpawnIntroStart = deferSpawns ? 0 : gameTime;
            playerInvincibleUntil = gameTime + 4000;
            playerSpawnIntroUntil = deferSpawns
                ? 0
                : playerSpawnIntroStart + (
                    PLAYER_SPAWN_SEQUENCE.length * SPAWN_ANIMATION_FRAME_DURATION
                );
            enemySpawnIntroStartByTile.clear();
            enemyTanks = [];
            pendingTntDetonations = [];
            tntBlockDetonations.clear();
            enemyPairsIgnoringCollision.clear();
            playerEnemyPairsIgnoringCollision.clear();
            resetPlayerToSpawn();
            if (!deferSpawns) {
                beginEnemySpawnIntros();
            }
            resetPlayerToSpawn();
            simulationButton.textContent = 'Stop Simulation';
            fitSimulationButtonText();
            simulationButton.classList.add('is-playing');
            tileSelector.style.pointerEvents = 'none';
        }

        function releaseInitialSpawns() {
            if (!areInitialSpawnsDeferred || !isSimulationActive || isGameOver) {
                return;
            }
            areInitialSpawnsDeferred = false;
            playerSpawnIntroStart = gameTime;
            playerInvincibleUntil = gameTime + 4000;
            playerSpawnIntroUntil = playerSpawnIntroStart + (
                PLAYER_SPAWN_SEQUENCE.length * SPAWN_ANIMATION_FRAME_DURATION
            );
            nextEnemySpawnAllowedAt = gameTime;
            beginEnemySpawnIntros();
        }

        function toggleGamePause() {
            if (!document.body.classList.contains('pack-game-active') ||
                !isSimulationActive || isGameOver) {
                return;
            }

            isGamePaused = !isGamePaused;
            gamePauseMessage.classList.toggle('visible', isGamePaused);
            if (isGamePaused) {
                playSoundEffect('pause');
            }
            pressedKeys.clear();
            activeTouchDirections.clear();
            requestedDirection = null;
            clearPlayerSliding();
            Player.isMoving = false;
            stopMovementAudio();
            if (touchFireIntervalId !== null) {
                window.clearInterval(touchFireIntervalId);
                touchFireIntervalId = null;
            }
            touchFirePointerId = null;
            mobileGameControls.querySelectorAll('.is-pressed').forEach((button) => {
                button.classList.remove('is-pressed');
            });
        }

        function stopSimulation(resetLives = true) {
            window.clearTimeout(packGameOverReturnTimeout);
            packGameOverReturnTimeout = 0;
            window.clearTimeout(packWorldAutoAdvanceTimeout);
            packWorldAutoAdvanceTimeout = 0;
            packWorldAutoAdvanceGeneration += 1;
            playingPackStage = null;
            setPlayerTankRank(0);
            const stoppedBullets = bullets.splice(0, bullets.length);
            stoppedBullets.forEach((bullet) => {
                explosions.push({
                    x: bullet.x,
                    y: bullet.y,
                    startedAt: gameTime,
                    type: 'bullet'
                });
            });
            stopMovementAudio();
            stopAllSoundSources();
            restoreTemporarySteel();
            powerUpsOnMap.length = 0;
            enemyFrozenUntil = 0;
            isSimulationActive = false;
            isGamePaused = false;
            resumeSimulationAfterBackground = false;
            levelIntro.cancel();
            areInitialSpawnsDeferred = false;
            editorInactivePauseMessage.classList.remove('visible');
            gamePauseMessage.classList.remove('visible');
            enableGameAudioButton.hidden = true;
            isGameOver = false;
            setGameSoundsMuted(false);
            gameOverMessage.classList.remove('visible');
            levelScoreScreen.hidden = true;
            stopLevelScoreAnimation();
            if (resetLives) {
                playerLives = MAX_PLAYER_LIVES;
                updatePlayerLivesDisplay();
            }
            playerHasRespawned = false;
            defeatedEnemyCount = 0;
            defeatedEnemiesByRank.fill(0);
            updateEnemyLivesDisplay();
            destroyedEagleTiles.clear();
            shouldDrawPlayerAfterSpawn = false;
            playerRespawnIntroActive = false;
            playerRespawnPending = false;
            playerSpawnIntroStart = 0;
            playerSpawnIntroUntil = 0;
            playerInvincibleUntil = 0;
            enemySpawnIntroStartByTile.clear();
            enemyTanks = [];
            pendingTntDetonations = [];
            enemyPairsIgnoringCollision.clear();
            playerEnemyPairsIgnoringCollision.clear();
            pressedKeys.clear();
            activeTouchDirections.clear();
            requestedDirection = null;
            clearPlayerSliding();
            touchFirePointerId = null;
            if (touchFireIntervalId !== null) {
                window.clearInterval(touchFireIntervalId);
                touchFireIntervalId = null;
            }
            mobileGameControls.querySelectorAll('.is-pressed').forEach((button) => {
                button.classList.remove('is-pressed');
            });
            resetPlayerToSpawn();
            if (simulationMapSnapshot) {
                restoreSimulationSnapshot({
                    mapGrid: simulationMapSnapshot,
                    brickDamage: simulationBrickDamageSnapshot
                });
                simulationMapSnapshot = null;
                simulationBrickDamageSnapshot = null;
            }
            simulationButton.textContent = 'Play Level';
            fitSimulationButtonText();
            simulationButton.classList.remove('is-playing');
            reloadAssetsButton.disabled = false;
            canvasModeControls.style.pointerEvents = '';
            updateTouchControlsVisibility(true);
            tileSelector.style.pointerEvents = '';
        }

        function paintMapTile(row, column, tileId, showErrors = true) {
            if (tileId === AIR_ID) {
                if (clearElementAt(row, column)) {
                    return true;
                }

                const tileChanged = mapGrid[row][column] !== AIR_ID ||
                    brickDamage.has(`${row},${column}`);
                clearBrickDamage(row, column);
                mapGrid[row][column] = AIR_ID;
                if (tileChanged) {
                    mapRenderVersion += 1;
                }
                return true;
            }

            const resolvedTileId = tileId === PLAYER_INITIAL_SPAWN_ID
                ? getPlayerSpawnPlacementTileId()
                : tileId === ENEMY_SPAWN_A_ID
                    ? getEnemySpawnPlacementTileId()
                    : tileId;

            if (resolvedTileId === null) {
                if (showErrors) {
                    showMessage(`Tile limit exceeded for ID ${tileId}.`);
                }
                return false;
            }

            const footprint = getElementFootprint(row, column, resolvedTileId);
            const { width: placementWidth, height: placementHeight } =
                getElementFootprintSize(resolvedTileId);
            const placementSize = `${placementWidth}x${placementHeight}`;

            if (
                footprint.some((cell) => (
                    cell.row >= mapHeight || cell.column >= mapWidth
                ))
            ) {
                if (showErrors) {
                    showMessage(`A ${placementSize} tile cannot extend beyond the map boundary.`);
                }
                return false;
            }

            if (footprint.some((cell) => getElementAnchor(cell.row, cell.column))) {
                if (showErrors) {
                    showMessage(`The ${placementSize} placement overlaps another element.`);
                }
                return false;
            }

            if (footprint.some((cell) => mapGrid[cell.row][cell.column] !== AIR_ID)) {
                if (showErrors) {
                    showMessage(`The ${placementSize} placement overlaps an occupied tile.`);
                }
                return false;
            }

            if (Object.hasOwn(TILE_LIMITS, resolvedTileId)) {
                if (tileCounters[resolvedTileId] >= TILE_LIMITS[resolvedTileId]) {
                    if (showErrors) {
                        showMessage(`Tile limit exceeded for ID ${resolvedTileId}.`);
                    }
                    return false;
                }

                tileCounters[resolvedTileId] += 1;
            }

            clearBrickDamage(row, column);
            mapGrid[row][column] = resolvedTileId;
            mapRenderVersion += 1;
            return true;
        }

        function createTileSelector() {
            const mouseButton = document.createElement('button');
            mouseButton.type = 'button';
            mouseButton.className = 'mouse-mode-button';
            mouseButton.dataset.mouseMode = 'true';
            mouseButton.textContent = 'Mouse: Move';
            mouseButton.addEventListener('click', () => {
                selectTile(null, false);
            });
            canvasModeControls.appendChild(mouseButton);

            const selectionButton = document.createElement('button');
            selectionButton.type = 'button';
            selectionButton.className = 'mouse-mode-button selection-mode-button';
            selectionButton.dataset.selectionMode = 'true';
            selectionButton.textContent = 'Select';
            selectionButton.addEventListener('click', () => {
                setSelectionMode(true);
            });
            canvasModeControls.appendChild(selectionButton);

            const exportMapButton = document.createElement('button');
            exportMapButton.type = 'button';
            exportMapButton.className = 'mouse-mode-button export-map-button';
            exportMapButton.textContent = 'PNG';
            exportMapButton.setAttribute('aria-label', 'Export map as PNG');
            exportMapButton.title = 'Export map as PNG';
            exportMapButton.addEventListener('click', () => {
                pngExportUi.open();
            });
            canvasModeControls.appendChild(exportMapButton);

            const eraserButton = document.createElement('button');
            eraserButton.type = 'button';
            eraserButton.className = 'mouse-mode-button eraser-mode-button';
            eraserButton.dataset.eraserMode = 'true';
            eraserButton.textContent = 'Eraser';
            eraserButton.setAttribute('aria-label', 'Eraser');
            eraserButton.addEventListener('click', () => {
                selectEraserMode();
            });
            canvasModeControls.appendChild(eraserButton);

            const squareButton = document.createElement('button');
            squareButton.type = 'button';
            squareButton.className = 'mouse-mode-button square-mode-button';
            squareButton.dataset.squareMode = 'true';
            squareButton.textContent = 'Square';
            squareButton.setAttribute(
                'aria-label',
                'Draw a rectangle with the selected tile; hold Ctrl to draw a square'
            );
            squareButton.title = 'Draw a rectangle; hold Ctrl while dragging to constrain it to a square';
            squareButton.addEventListener('click', () => {
                if (selectedTileId === null) {
                    showMessage('Select a tile first, then choose the square tool.');
                    return;
                }
                cancelPastePlacement();
                isPanModeEnabled = false;
                isSelectionMode = false;
                isEraserMode = false;
                isFillMode = false;
                isSquareMode = !isSquareMode;
                updatePanModeButton();
                updateCanvasToolSelection();
            });
            canvasModeControls.appendChild(squareButton);

            const fillButton = document.createElement('button');
            fillButton.type = 'button';
            fillButton.className = 'mouse-mode-button fill-mode-button';
            fillButton.dataset.fillMode = 'true';
            fillButton.textContent = 'Fill';
            fillButton.setAttribute('aria-label', 'Paint bucket: fill the connected empty area with the selected tile');
            fillButton.title = 'Fill the connected empty area with the selected tile';
            fillButton.addEventListener('click', () => {
                if (selectedTileId === null) {
                    showMessage('Select a tile first, then choose the fill tool.');
                    return;
                }
                cancelPastePlacement();
                isPanModeEnabled = false;
                isSelectionMode = false;
                isEraserMode = false;
                isSquareMode = false;
                isFillMode = !isFillMode;
                updatePanModeButton();
                updateCanvasToolSelection();
            });
            canvasModeControls.appendChild(fillButton);

            const addTileButton = (tile) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'tile-button';
                button.dataset.tileId = tile.id;
                const tileLabel = `${tile.id}: ${tile.name}`;
                button.dataset.tileLabel = tileLabel;
                button.setAttribute('aria-label', tileLabel);
                button.title = tileLabel;
                button.style.backgroundColor = TILE_COLORS[tile.id];
                button.style.setProperty('--tile-color', TILE_COLORS[tile.id] ?? TILE_COLORS[AIR_ID]);
                button.addEventListener('click', () => {
                    selectTile(tile.id, true);
                });
                tileSelector.appendChild(button);
                tileSelectorButtons.set(tile.id, button);
            };
            tileDefinitions
                .filter((tile) => tile.id !== TNT_BLOCK_ID)
                .forEach(addTileButton);

            const routeButton = document.createElement('button');
            routeButton.type = 'button';
            routeButton.className = 'tile-button route-family-button';
            routeButton.setAttribute('aria-label', 'Open route variant palette');
            routeButton.setAttribute('aria-expanded', 'false');
            routeButton.title = 'Choose a route shape and marking';
            routeFamilyPreviewCanvas = document.createElement('canvas');
            routeFamilyPreviewCanvas.width = 64;
            routeFamilyPreviewCanvas.height = 64;
            routeFamilyPreviewCanvas.setAttribute('aria-hidden', 'true');
            routeButton.append(routeFamilyPreviewCanvas);
            routeButton.addEventListener('click', () => {
                selectTile(selectedRoadTileId, true);
                const opening = routeVariantPalette.hidden;
                routeVariantPalette.hidden = !opening;
                routeButton.setAttribute('aria-expanded', String(opening));
                if (opening) {
                    setRouteVariantPaletteCategory(
                        getRoadTileState(selectedRoadTileId).definition.category
                    );
                }
            });
            tileSelector.append(routeButton);
            const tntTileDefinition = tileDefinitions.find(
                (tile) => tile.id === TNT_BLOCK_ID
            );
            if (tntTileDefinition) {
                addTileButton(tntTileDefinition);
            }

            routeVariantPalette.querySelectorAll('[data-route-tab]').forEach((tab) => {
                tab.addEventListener('click', () => {
                    setRouteVariantPaletteCategory(tab.dataset.routeTab);
                });
            });
            ['straight', 'l', 't', 'x'].forEach((category) => {
                const definitions = ROAD_TILE_DEFINITIONS.filter(
                    (definition) => definition.category === category
                );
                const rotations = category === 'x'
                    ? [0]
                    : category === 'straight' ? [0, 1] : [0, 1, 2, 3];
                const optionsContainer = routeVariantPalette.querySelector(
                    `[data-route-category="${category}"] .route-variant-options`
                );
                rotations.forEach((rotation) => {
                    const row = document.createElement('div');
                    row.className = 'route-variant-row';
                    definitions.forEach((definition) => {
                        const tileId = ROAD_TILE_ID_BY_STATE.get(
                            `${definition.id}:${rotation}`
                        );
                        const option = document.createElement('button');
                        option.type = 'button';
                        option.className = 'route-variant-option';
                        option.dataset.routeId = String(tileId);
                        option.setAttribute(
                            'aria-label',
                            `${category.toUpperCase()} route: ${definition.name}, ${rotation * 90} degrees`
                        );
                        option.setAttribute('aria-pressed', 'false');
                        option.title = `${definition.name} (${definition.width} × ${definition.height}), ${rotation * 90}°`;
                        const preview = document.createElement('canvas');
                        preview.width = 64;
                        preview.height = 64;
                        option.append(preview);
                        option.addEventListener('click', () => {
                            selectTile(tileId, true);
                        });
                        row.append(option);
                        routeVariantButtonById.set(tileId, option);
                    });
                    optionsContainer.append(row);
                });
            });
            drawRouteVariantPreviews();
            drawRouteFamilyPreview();
            selectTile(selectedTileId);
        }

        function updateRouteVariantSelection() {
            routeVariantButtonById.forEach((button, tileId) => {
                const isSelected = hasSelectedRoadVariant && selectedRoadTileId === tileId;
                button.setAttribute('aria-pressed', String(isSelected));
            });
            tileSelector.querySelector('.route-family-button')?.classList.toggle(
                'selected',
                ROAD_TILE_IDS.has(selectedTileId)
            );
            drawRouteVariantPreviews();
        }

        function setRouteVariantPaletteCategory(category) {
            if (!['straight', 'l', 't', 'x'].includes(category)) {
                return;
            }
            routeVariantPaletteCategory = category;
            routeVariantPalette.querySelectorAll('[data-route-tab]').forEach((tab) => {
                const isSelected = tab.dataset.routeTab === category;
                tab.setAttribute('aria-selected', String(isSelected));
                tab.tabIndex = isSelected ? 0 : -1;
            });
            routeVariantPalette.querySelectorAll('.route-variant-group').forEach((group) => {
                group.hidden = group.dataset.routeCategory !== category;
            });
        }

        function drawRouteVariantPreviews() {
            routeVariantButtonById.forEach((option, tileId) => {
                const { definition } = getRoadTileState(tileId);
                const texture = tileTextures.get(definition.id);
                const preview = option?.querySelector('canvas');
                const previewContext = preview?.getContext('2d');
                if (!preview || !previewContext) {
                    return;
                }
                previewContext.imageSmoothingEnabled = false;
                previewContext.clearRect(0, 0, preview.width, preview.height);
                if (!texture) {
                    return;
                }
                drawRoutePreview(previewContext, texture, tileId, 0, 0, 64, 64);
            });
            drawRouteFamilyPreview();
        }

        function drawRouteFamilyPreview() {
            const previewContext = routeFamilyPreviewCanvas?.getContext('2d');
            if (!routeFamilyPreviewCanvas || !previewContext) {
                return;
            }

            const selectedState = getRoadTileState(selectedRoadTileId);
            const texture = tileTextures.get(selectedState.definition.id);
            previewContext.imageSmoothingEnabled = false;
            previewContext.clearRect(
                0,
                0,
                routeFamilyPreviewCanvas.width,
                routeFamilyPreviewCanvas.height
            );
            if (texture) {
                drawRoutePreview(
                    previewContext,
                    texture,
                    selectedRoadTileId,
                    0,
                    0,
                    routeFamilyPreviewCanvas.width,
                    routeFamilyPreviewCanvas.height
                );
            }

            const routeButton = tileSelector.querySelector('.route-family-button');
            routeButton?.setAttribute(
                'aria-label',
                `Open route palette; selected ${selectedState.definition.category.toUpperCase()} ${selectedState.definition.name}, rotation ${selectedState.rotation * 90} degrees`
            );
        }

        const canvasControlsLayoutModule = window.BC90ECanvasControlsLayout;
        if (!canvasControlsLayoutModule) {
            throw new Error('The canvas controls layout module did not load.');
        }
        canvasControlsLayout =
            canvasControlsLayoutModule.createCanvasControlsLayout({
                tileSelector,
                canvasModeControls,
                mapZoomControls,
                canvasToolButtonSizeInput,
                mapZoomButtonSizeInput,
                worldTileSize: WORLD_TILE_SIZE,
                isTileTexturesVisible: () =>
                    document.body.classList.contains('tile-textures-mode'),
                resizeCanvas
            });

        const canvasToolSelectionUiModule = window.BC90ECanvasToolSelectionUi;
        if (!canvasToolSelectionUiModule) {
            throw new Error('The canvas tool selection UI module did not load.');
        }
        const canvasToolSelectionUi =
            canvasToolSelectionUiModule.createCanvasToolSelectionUi({
                canvasModeControls,
                tileSelector,
                tileSelectorButtons,
                roadTileIds: ROAD_TILE_IDS,
                getSelectionState: () => ({
                    isPanModeEnabled,
                    selectedTileId,
                    isEraserMode,
                    isSelectionMode,
                    isSquareMode,
                    isFillMode
                }),
                updateRouteVariantSelection
            });

        function updateTileSelectorTextures(timestamp, force = false) {
            tileSelectorPreviews.update(timestamp, force);
        }

        function updateCanvasToolSelection() {
            canvasToolSelectionUi.update();
        }

        function selectTile(tileId, preserveSquareMode = false) {
            cancelPastePlacement();
            selectedTileId = tileId;
            if (ROAD_TILE_IDS.has(tileId)) {
                selectedRoadTileId = tileId;
                hasSelectedRoadVariant = true;
            }
            isSelectionMode = false;
            isEraserMode = false;
            if (!preserveSquareMode) {
                isSquareMode = false;
                isFillMode = false;
            }
            isPanModeEnabled = false;
            updatePanModeButton();
            updateCanvasToolSelection();
        }

        function selectEraserMode() {
            cancelPastePlacement();
            selectedTileId = null;
            isSelectionMode = false;
            isEraserMode = true;
            isSquareMode = false;
            isFillMode = false;
            isPanModeEnabled = false;
            updatePanModeButton();
            updateCanvasToolSelection();
        }

        function setSelectionMode(enabled) {
            cancelPastePlacement();
            isSelectionMode = enabled;
            selectedTileId = null;
            isEraserMode = false;
            isSquareMode = false;
            isFillMode = false;
            isPanModeEnabled = false;
            updatePanModeButton();
            updateCanvasToolSelection();
        }

        function clearSelection() {
            selectionRegion = null;
            selectionStart = null;
            selectionDragEnd = null;
            isSelecting = false;
            isMovingSelection = false;
            movingSelection = null;
            selectionMovePreview = null;
            pendingCut = null;
            selectionActionOpacity = 1;
            selectionActionOpacityTarget = 1;
            canvas.classList.remove('moving-cursor');
        }

        function getGridPosition(event) {
            const bounds = canvas.getBoundingClientRect();
            const column = Math.floor(
                ((event.clientX - bounds.left) / bounds.width) * mapWidth
            );
            const row = Math.floor(
                ((event.clientY - bounds.top) / bounds.height) * mapHeight
            );

            if (
                column < 0 || column >= mapWidth ||
                row < 0 || row >= mapHeight
            ) {
                return null;
            }

            return { column, row };
        }

        function updatePanModeButton() {
            panModeButton.setAttribute('aria-pressed', String(isPanModeEnabled));
            panModeButton.title = `Pan mode: ${isPanModeEnabled ? 'ON' : 'OFF'}`;
            mapViewport.classList.toggle('pan-mode', isPanModeEnabled);
            setToggleButtonState(panModeButton, isPanModeEnabled);
            mapCamera.updateEdgeIndicators();
            updateCanvasToolSelection();
        }

        function setMapZoom(requestedPercent, preserveCenter = true) {
            mapCamera.setZoom(requestedPercent, preserveCenter);
        }

        function updateMapZoomInputVisibility() {
            isMapZoomInputVisible = mapZoomInputVisibleInput.checked;
            mapZoomInputControl.hidden = !isMapZoomInputVisible;
        }

        function setPanModeEnabled(enabled) {
            if (enabled) {
                cancelPastePlacement();
            }
            isPanModeEnabled = enabled;
            if (enabled) {
                selectedTileId = null;
                isSelectionMode = false;
                isEraserMode = false;
                isSquareMode = false;
                isFillMode = false;
                clearSelection();
                stopPainting();
            }
            updatePanModeButton();
        }

        function getPlacedElementAt(row, column) {
            const largeElement = getElementAnchor(row, column);

            if (largeElement) {
                return largeElement;
            }

            const tileId = mapGrid[row][column];

            if (tileId !== AIR_ID) {
                return { row, column, tileId };
            }

            return null;
        }

        function removeElementForMoving(element) {
            mapGrid[element.row][element.column] = AIR_ID;

            if (Object.hasOwn(tileCounters, element.tileId)) {
                tileCounters[element.tileId] -= 1;
            }
        }

        function isValidMoveTarget(row, column, tileId) {
            const footprint = getElementFootprint(row, column, tileId);

            return !footprint.some((cell) => (
                cell.row < 0 || cell.row >= mapHeight ||
                cell.column < 0 || cell.column >= mapWidth ||
                mapGrid[cell.row][cell.column] !== AIR_ID ||
                getElementAnchor(cell.row, cell.column) !== null
            ));
        }

        function updateMovePreview(event) {
            const gridPosition = getGridPosition(event);

            movePreview = gridPosition && movingElement
                ? { ...gridPosition, tileId: movingElement.tileId }
                : null;
        }

        function startMovingElement(event) {
            const gridPosition = getGridPosition(event);

            if (!gridPosition) {
                return;
            }

            const element = getPlacedElementAt(
                gridPosition.row,
                gridPosition.column
            );

            if (!element) {
                return;
            }

            movingElement = { ...element };
            removeElementForMoving(movingElement);
            isMovingElement = true;
            updateMovePreview(event);
            canvas.classList.add('moving-cursor');
        }

        function finishMovingElement() {
            if (!isMovingElement || !movingElement) {
                return;
            }

            const canPlace = movePreview && isValidMoveTarget(
                movePreview.row,
                movePreview.column,
                movingElement.tileId
            );

            if (canPlace) {
                mapGrid[movePreview.row][movePreview.column] = movingElement.tileId;
                if (Object.hasOwn(tileCounters, movingElement.tileId)) {
                    tileCounters[movingElement.tileId] += 1;
                }
            } else {
                mapGrid[movingElement.row][movingElement.column] = movingElement.tileId;
                if (Object.hasOwn(tileCounters, movingElement.tileId)) {
                    tileCounters[movingElement.tileId] += 1;
                }
            }

            mapRenderVersion += 1;

            isMovingElement = false;
            movingElement = null;
            movePreview = null;
            canvas.classList.remove('moving-cursor');
        }

        function normalizeSelection(start, end) {
            return {
                startRow: Math.min(start.row, end.row),
                startColumn: Math.min(start.column, end.column),
                endRow: Math.max(start.row, end.row),
                endColumn: Math.max(start.column, end.column)
            };
        }

        function getSelectionBounds() {
            if (!selectionRegion) {
                return null;
            }

            return normalizeSelection(
                { row: selectionRegion.startRow, column: selectionRegion.startColumn },
                { row: selectionRegion.endRow, column: selectionRegion.endColumn }
            );
        }

        function finishSelecting(event) {
            const gridPosition = getGridPosition(event);

            if (!selectionStart || !gridPosition) {
                isSelecting = false;
                selectionStart = null;
                return;
            }

            const bounds = normalizeSelection(selectionStart, gridPosition);
            for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
                for (let column = bounds.startColumn; column <= bounds.endColumn; column += 1) {
                    const element = getElementAnchor(row, column);
                    if (!element) {
                        continue;
                    }

                    bounds.startRow = Math.min(bounds.startRow, element.row);
                    bounds.startColumn = Math.min(bounds.startColumn, element.column);
                    bounds.endRow = Math.max(
                        bounds.endRow,
                        element.row + getElementFootprintSize(element.tileId).height - 1
                    );
                    bounds.endColumn = Math.max(
                        bounds.endColumn,
                        element.column + getElementFootprintSize(element.tileId).width - 1
                    );
                }
            }
            const tiles = [];

            for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
                tiles.push(mapGrid[row].slice(bounds.startColumn, bounds.endColumn + 1));
            }

            selectionRegion = { ...bounds, tiles };
            isSelecting = false;
            selectionStart = null;
            selectionDragEnd = null;
            mapRenderVersion += 1;
        }

        function drawMovingSelectionTiles(
            tiles,
            startRow,
            startColumn,
            tileWidth,
            tileHeight,
            timestamp,
            opacity
        ) {
            context.save();
            context.globalAlpha = opacity;
            tiles.forEach((tileRow, rowOffset) => {
                tileRow.forEach((tileId, columnOffset) => {
                    if (tileId === AIR_ID) {
                        return;
                    }

                    const row = startRow + rowOffset;
                    const column = startColumn + columnOffset;
                    const renderX = Math.round(column * tileWidth);
                    const renderY = Math.round(row * tileHeight);
                    const { width: footprintWidth, height: footprintHeight } =
                        getElementFootprintSize(tileId);
                    const renderWidth = Math.max(1, Math.ceil(tileWidth * footprintWidth));
                    const renderHeight = Math.max(1, Math.ceil(tileHeight * footprintHeight));
                    const texture = getTileTexture(tileId, timestamp);

                    if (tileId === VACIO_SOLIDO_ID) {
                        context.fillStyle = MAP_BACKGROUND_COLOR;
                        context.fillRect(renderX, renderY, renderWidth, renderHeight);
                    } else if (texture && ROAD_TILE_IDS.has(tileId)) {
                        drawRouteTexture(
                            context,
                            texture,
                            tileId,
                            renderX,
                            renderY,
                            renderWidth,
                            renderHeight
                        );
                    } else if (texture) {
                        context.drawImage(texture, renderX, renderY, renderWidth, renderHeight);
                    } else {
                        context.fillStyle = TILE_COLORS[tileId] ?? TILE_COLORS[AIR_ID];
                        context.fillRect(renderX, renderY, renderWidth, renderHeight);
                    }

                    if (
                        isLargeTile(tileId) &&
                        Object.hasOwn(EDITOR_TILE_TINTS, tileId)
                    ) {
                        context.save();
                        context.globalAlpha *= 0.38;
                        context.fillStyle = EDITOR_TILE_TINTS[tileId];
                        context.fillRect(renderX, renderY, tileWidth, tileHeight);
                        context.restore();
                        drawPixelDigitOnTile(
                            tileId,
                            renderX,
                            renderY,
                            Math.max(1, Math.ceil(tileWidth)),
                            Math.max(1, Math.ceil(tileHeight))
                        );
                    }
                });
            });
            context.restore();
        }

        function drawSelectionOverlay(
            tileWidth,
            tileHeight,
            displayWidth,
            displayHeight,
            timestamp
        ) {
            let bounds = getSelectionBounds();

            if (!bounds && performance.now() < selectionActionCheckUntil) {
                bounds = selectionActionFeedbackBounds;
            }

            if (isSelecting && selectionStart && selectionDragEnd) {
                bounds = normalizeSelection(selectionStart, selectionDragEnd);
            } else if (isMovingSelection && movingSelection && selectionMovePreview) {
                bounds = {
                    startRow: selectionMovePreview.row,
                    startColumn: selectionMovePreview.column,
                    endRow: selectionMovePreview.row + movingSelection.height - 1,
                    endColumn: selectionMovePreview.column + movingSelection.width - 1
                };
            }

            if (!bounds) {
                drawPastePreview(tileWidth, tileHeight, displayWidth, displayHeight);
                return;
            }

            if (isMovingSelection && movingSelection) {
                const movingOpacity = 0.75 + 0.25 * Math.sin(
                    timestamp * (Math.PI * 2 / 1200)
                );
                drawMovingSelectionTiles(
                    movingSelection.tiles,
                    movingSelection.startRow,
                    movingSelection.startColumn,
                    tileWidth,
                    tileHeight,
                    timestamp,
                    0.25
                );
                if (selectionMovePreview) {
                    drawMovingSelectionTiles(
                        movingSelection.tiles,
                        selectionMovePreview.row,
                        selectionMovePreview.column,
                        tileWidth,
                        tileHeight,
                        timestamp,
                        movingOpacity
                    );
                }
                return;
            }

            const left = bounds.startColumn * tileWidth;
            const top = bounds.startRow * tileHeight;
            const width = (bounds.endColumn - bounds.startColumn + 1) * tileWidth;
            const height = (bounds.endRow - bounds.startRow + 1) * tileHeight;

            context.save();
            context.fillStyle = 'rgba(100, 210, 255, 0.3921568627)';
            context.fillRect(left, top, width, height);
            const selectionBorderWidth = Math.min(tileWidth, tileHeight) / 8;
            context.strokeStyle = 'rgba(100, 210, 255, 1)';
            context.lineWidth = selectionBorderWidth;
            context.strokeRect(
                left + selectionBorderWidth / 2,
                top + selectionBorderWidth / 2,
                width - selectionBorderWidth,
                height - selectionBorderWidth
            );

            const actionTileSpan = mapWidth < 6 ? 1 : 2;
            const actionWidth = tileWidth * actionTileSpan;
            const actionHeight = tileHeight * actionTileSpan;
            const actionCount = selectionClipboard ? 4 : 3;
            const actionsWidth = actionCount * actionWidth;
            const actionLeft = Math.min(
                Math.max(0, left + width - actionsWidth),
                displayWidth - actionsWidth
            );
            const actionTop = Math.min(
                top + height,
                displayHeight - actionHeight
            );

            for (let actionIndex = 0; actionIndex < actionCount; actionIndex += 1) {
                const actionX = actionLeft + actionIndex * actionWidth;
                context.globalAlpha = selectionActionOpacity;
                context.fillStyle = 'rgba(100, 210, 255, 0.3921568627)';
                context.fillRect(actionX, actionTop, actionWidth, actionHeight);
                const actionTexture = selectionActionTextures[actionIndex];
                const showCheck = selectionActionCheckTexture &&
                    performance.now() < selectionActionCheckUntil &&
                    selectionActionCheckIndex === actionIndex;
                if (showCheck) {
                    context.drawImage(
                        selectionActionCheckTexture,
                        actionX,
                        actionTop,
                        actionWidth,
                        actionHeight
                    );
                } else if (actionTexture) {
                    context.imageSmoothingEnabled = false;
                    context.drawImage(
                        actionTexture,
                        actionX,
                        actionTop,
                        actionWidth,
                        actionHeight
                    );
                }
                if (selectionActionHoverIndex === actionIndex) {
                    const hoverPulse = 0.18 + (
                        (Math.sin(performance.now() / 90) + 1) * 0.08
                    );
                    context.fillStyle = `rgba(255, 255, 255, ${hoverPulse})`;
                    context.fillRect(actionX, actionTop, actionWidth, actionHeight);
                }
            }
            context.globalAlpha = 1;
            context.restore();
            drawPastePreview(tileWidth, tileHeight, displayWidth, displayHeight);
        }

        function getPastePlacementStatus(position) {
            if (!selectionClipboard || !position) {
                return { valid: false, entries: [] };
            }

            const { width, height, tiles } = selectionClipboard;
            if (
                position.row < 0 || position.column < 0 ||
                position.row + height > mapHeight ||
                position.column + width > mapWidth
            ) {
                return { valid: false, entries: [] };
            }

            for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
                for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
                    const row = position.row + rowOffset;
                    const column = position.column + columnOffset;
                    if (
                        mapGrid[row][column] !== AIR_ID ||
                        getElementAnchor(row, column) !== null
                    ) {
                        return { valid: false, entries: [] };
                    }
                }
            }

            const entries = [];
            const occupiedTargets = new Set();
            const additionalCounters = createTileCounters();
            for (let rowOffset = 0; rowOffset < height; rowOffset += 1) {
                for (let columnOffset = 0; columnOffset < width; columnOffset += 1) {
                    const tileId = tiles[rowOffset][columnOffset];
                    if (tileId === AIR_ID) {
                        continue;
                    }

                    const { width: footprintWidth, height: footprintHeight } =
                        getElementFootprintSize(tileId);
                    if (
                        rowOffset + footprintHeight > height ||
                        columnOffset + footprintWidth > width
                    ) {
                        return { valid: false, entries: [] };
                    }

                    const targetRow = position.row + rowOffset;
                    const targetColumn = position.column + columnOffset;
                    const footprint = getElementFootprint(targetRow, targetColumn, tileId);
                    if (footprint.some((cell) => (
                        cell.row < 0 || cell.row >= mapHeight ||
                        cell.column < 0 || cell.column >= mapWidth ||
                        mapGrid[cell.row][cell.column] !== AIR_ID ||
                        getElementAnchor(cell.row, cell.column) !== null ||
                        occupiedTargets.has(cell.row * mapWidth + cell.column)
                    ))) {
                        return { valid: false, entries: [] };
                    }

                    footprint.forEach((cell) => {
                        occupiedTargets.add(cell.row * mapWidth + cell.column);
                    });
                    entries.push({ row: targetRow, column: targetColumn, tileId });
                    if (Object.hasOwn(additionalCounters, tileId)) {
                        additionalCounters[tileId] += 1;
                    }
                }
            }

            const currentCounters = countRestrictedTiles(mapGrid);
            const exceedsLimit = Object.keys(TILE_LIMITS).some((tileId) =>
                currentCounters[tileId] + additionalCounters[tileId] > TILE_LIMITS[tileId]
            );
            return { valid: !exceedsLimit, entries };
        }

        function drawPastePreview(tileWidth, tileHeight, displayWidth, displayHeight) {
            if (!isPasteMode || !selectionClipboard || !pastePreview) {
                return;
            }

            const { width, height, tiles } = selectionClipboard;
            const placement = getPastePlacementStatus(pastePreview);
            const left = pastePreview.column * tileWidth;
            const top = pastePreview.row * tileHeight;
            const previewWidth = width * tileWidth;
            const previewHeight = height * tileHeight;
            context.save();
            context.globalAlpha = 0.72;
            tiles.forEach((tileRow, rowOffset) => {
                tileRow.forEach((tileId, columnOffset) => {
                    if (tileId === AIR_ID) {
                        return;
                    }

                    const x = left + columnOffset * tileWidth;
                    const y = top + rowOffset * tileHeight;
                    const { width: footprintWidth, height: footprintHeight } =
                        getElementFootprintSize(tileId);
                    const drawWidth = tileWidth * footprintWidth;
                    const drawHeight = tileHeight * footprintHeight;
                    const texture = getTileTexture(tileId, gameTime);
                    if (texture) {
                        if (ROAD_TILE_IDS.has(tileId)) {
                            drawRouteTexture(
                                context,
                                texture,
                                tileId,
                                x,
                                y,
                                drawWidth,
                                drawHeight
                            );
                        } else {
                            context.drawImage(texture, x, y, drawWidth, drawHeight);
                        }
                    } else {
                        context.fillStyle = TILE_COLORS[tileId] ?? TILE_COLORS[AIR_ID];
                        context.fillRect(x, y, drawWidth, drawHeight);
                    }
                });
            });
            context.globalAlpha = 1;
            context.strokeStyle = placement.valid ? '#75c784' : '#ff5b5b';
            context.lineWidth = Math.max(1, Math.min(tileWidth, tileHeight) / 8);
            context.strokeRect(left, top, previewWidth, previewHeight);
            context.restore();

            if (
                left >= 0 && top >= 0 &&
                left + previewWidth <= displayWidth &&
                top + previewHeight <= displayHeight
            ) {
                return;
            }
        }

        function clearSelectionCells(bounds) {
            for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
                for (let column = bounds.startColumn; column <= bounds.endColumn; column += 1) {
                    clearBrickDamage(row, column);
                    mapGrid[row][column] = AIR_ID;
                }
            }
        }

        function deleteSelection() {
            if (!selectionRegion || isSimulationActive) {
                return;
            }

            clearSelectionCells(getSelectionBounds());
            const nextCounters = countRestrictedTiles(mapGrid);
            Object.keys(tileCounters).forEach((tileId) => {
                tileCounters[tileId] = nextCounters[tileId];
            });
            clearSelection();
            mapRenderVersion += 1;
        }

        function showSelectionActionCheck(actionIndex, bounds = getSelectionBounds()) {
            selectionActionCheckIndex = actionIndex;
            selectionActionCheckUntil = performance.now() + 600;
            selectionActionFeedbackBounds = bounds;
            document.body.classList.add('selection-action-locked');
            document.querySelector('.app-shell').setAttribute('aria-busy', 'true');
            settingsButton.disabled = true;
            window.clearTimeout(selectionActionUnlockTimer);
            selectionActionUnlockTimer = window.setTimeout(() => {
                document.body.classList.remove('selection-action-locked');
                document.querySelector('.app-shell').removeAttribute('aria-busy');
                settingsButton.disabled = false;
                selectionActionUnlockTimer = 0;
            }, 600);
        }

        const blockSelectionActionInput = (event) => {
            if (!document.body.classList.contains('selection-action-locked')) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();
        };
        ['pointerdown', 'pointerup', 'click', 'keydown'].forEach((eventName) => {
            document.addEventListener(eventName, blockSelectionActionInput, true);
        });

        function copySelection() {
            if (!selectionRegion || isSimulationActive) {
                return false;
            }

            const bounds = getSelectionBounds();
            selectionClipboard = {
                width: bounds.endColumn - bounds.startColumn + 1,
                height: bounds.endRow - bounds.startRow + 1,
                tiles: selectionRegion.tiles.map((row) => row.slice())
            };
            showSelectionActionCheck(1);
            return true;
        }

        function cutSelection() {
            if (!selectionRegion || isSimulationActive) {
                return false;
            }

            const bounds = getSelectionBounds();
            selectionClipboard = {
                width: bounds.endColumn - bounds.startColumn + 1,
                height: bounds.endRow - bounds.startRow + 1,
                tiles: selectionRegion.tiles.map((row) => row.slice())
            };
            showSelectionActionCheck(2, bounds);
            pendingCut = { bounds };
            return true;
        }

        function finishPendingCut() {
            if (!pendingCut || performance.now() < selectionActionCheckUntil) {
                return;
            }

            clearSelectionCells(pendingCut.bounds);
            const nextCounters = countRestrictedTiles(mapGrid);
            Object.keys(tileCounters).forEach((tileId) => {
                tileCounters[tileId] = nextCounters[tileId];
            });
            selectionRegion = null;
            pendingCut = null;
            mapRenderVersion += 1;
        }

        function getSelectionActionIndex(event) {
            const bounds = getSelectionBounds();
            if (!bounds || isMovingSelection) {
                return null;
            }

            const canvasDimensions = getCanvasDimensions();
            const displayWidth = canvasDimensions.width;
            const displayHeight = canvasDimensions.height;
            const tileWidth = displayWidth / mapWidth;
            const tileHeight = displayHeight / mapHeight;
            const actionTileSpan = mapWidth < 6 ? 1 : 2;
            const actionWidth = tileWidth * actionTileSpan;
            const actionHeight = tileHeight * actionTileSpan;
            const actionCount = selectionClipboard ? 4 : 3;
            const actionsWidth = actionWidth * actionCount;
            const left = bounds.startColumn * tileWidth;
            const top = bounds.startRow * tileHeight;
            const selectionWidth = (bounds.endColumn - bounds.startColumn + 1) * tileWidth;
            const selectionHeight = (bounds.endRow - bounds.startRow + 1) * tileHeight;
            const actionLeft = Math.min(
                Math.max(0, left + selectionWidth - actionsWidth),
                displayWidth - actionsWidth
            );
            const actionTop = Math.min(
                top + selectionHeight,
                displayHeight - actionHeight
            );
            const canvasBounds = canvas.getBoundingClientRect();
            const x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * displayWidth;
            const y = ((event.clientY - canvasBounds.top) / canvasBounds.height) * displayHeight;

            if (
                x < actionLeft || x >= actionLeft + actionsWidth ||
                y < actionTop || y >= actionTop + actionHeight
            ) {
                return null;
            }

            const actionIndex = Math.floor((x - actionLeft) / actionWidth);
            return actionIndex < actionCount ? actionIndex : null;
        }

        function cancelPastePlacement() {
            isPasteMode = false;
            pastePreview = null;
            mapViewport.classList.remove('paste-mode');
        }

        function startPastePlacement(position = lastMapPointerPosition) {
            if (!selectionClipboard || isSimulationActive) {
                return false;
            }

            clearSelection();
            selectedTileId = null;
            isSelectionMode = false;
            isEraserMode = false;
            isSquareMode = false;
            isFillMode = false;
            isPanModeEnabled = false;
            isPasteMode = true;
            pastePreview = position ? { ...position } : null;
            mapViewport.classList.add('paste-mode');
            updatePanModeButton();
            updateCanvasToolSelection();
            return true;
        }

        function commitPastePlacement(position) {
            if (!isPasteMode || !selectionClipboard || !position) {
                return false;
            }

            const placement = getPastePlacementStatus(position);
            if (!placement.valid) {
                showMessage('This paste location is blocked or outside the map.');
                return false;
            }

            placement.entries.forEach(({ row, column, tileId }) => {
                mapGrid[row][column] = tileId;
                getElementFootprint(row, column, tileId).forEach((cell) => {
                    clearBrickDamage(cell.row, cell.column);
                });
            });

            const nextCounters = countRestrictedTiles(mapGrid);
            Object.keys(tileCounters).forEach((tileId) => {
                tileCounters[tileId] = nextCounters[tileId];
            });
            const bounds = {
                startRow: position.row,
                startColumn: position.column,
                endRow: position.row + selectionClipboard.height - 1,
                endColumn: position.column + selectionClipboard.width - 1
            };
            selectionRegion = {
                ...bounds,
                tiles: mapGrid
                    .slice(bounds.startRow, bounds.endRow + 1)
                    .map((row) => row.slice(bounds.startColumn, bounds.endColumn + 1))
            };
            cancelPastePlacement();
            mapRenderVersion += 1;
            return true;
        }

        function restoreSelectionAt(row, column, tiles) {
            tiles.forEach((tileRow, rowOffset) => {
                tileRow.forEach((tileId, columnOffset) => {
                    mapGrid[row + rowOffset][column + columnOffset] = tileId;
                });
            });
            const nextCounters = countRestrictedTiles(mapGrid);
            Object.keys(tileCounters).forEach((tileId) => {
                tileCounters[tileId] = nextCounters[tileId];
            });
            mapRenderVersion += 1;
        }

        function startMovingSelection(event) {
            const gridPosition = getGridPosition(event);
            const bounds = getSelectionBounds();

            if (!gridPosition || !bounds ||
                gridPosition.row < bounds.startRow || gridPosition.row > bounds.endRow ||
                gridPosition.column < bounds.startColumn || gridPosition.column > bounds.endColumn
            ) {
                return;
            }

            movingSelection = {
                tiles: selectionRegion.tiles.map((row) => row.slice()),
                startRow: bounds.startRow,
                startColumn: bounds.startColumn,
                width: bounds.endColumn - bounds.startColumn + 1,
                height: bounds.endRow - bounds.startRow + 1,
                offsetRow: gridPosition.row - bounds.startRow,
                offsetColumn: gridPosition.column - bounds.startColumn
            };
            clearSelectionCells(bounds);
            isMovingSelection = true;
            setSelectionActionOpacity(0);
            updateSelectionMovePreview(event);
            canvas.classList.add('moving-cursor');
        }

        function updateSelectionMovePreview(event) {
            const gridPosition = getGridPosition(event);

            selectionMovePreview = gridPosition && movingSelection
                ? {
                    row: gridPosition.row - movingSelection.offsetRow,
                    column: gridPosition.column - movingSelection.offsetColumn
                }
                : null;
        }

        function finishMovingSelection() {
            if (!isMovingSelection || !movingSelection) {
                return;
            }

            const target = selectionMovePreview;
            const canPlace = target && target.row >= 0 && target.column >= 0 &&
                target.row + movingSelection.height <= mapHeight &&
                target.column + movingSelection.width <= mapWidth &&
                movingSelection.tiles.every((tileRow, rowOffset) => tileRow.every((tileId, columnOffset) => (
                    mapGrid[target.row + rowOffset][target.column + columnOffset] === AIR_ID
                )));

            if (canPlace) {
                restoreSelectionAt(target.row, target.column, movingSelection.tiles);
                selectionRegion = {
                    startRow: target.row,
                    startColumn: target.column,
                    endRow: target.row + movingSelection.height - 1,
                    endColumn: target.column + movingSelection.width - 1,
                    tiles: movingSelection.tiles
                };
            } else {
                restoreSelectionAt(
                    selectionRegion.startRow,
                    selectionRegion.startColumn,
                    movingSelection.tiles
                );
            }

            isMovingSelection = false;
            movingSelection = null;
            selectionMovePreview = null;
            setSelectionActionOpacity(1);
            canvas.classList.remove('moving-cursor');
        }

        function setSelectionActionOpacity(target) {
            selectionActionOpacityTarget = target;
            selectionActionOpacityStartedAt = performance.now();
        }

        function updateSelectionActionOpacity() {
            if (selectionActionOpacity === selectionActionOpacityTarget) {
                return;
            }

            const progress = Math.min(
                1,
                (performance.now() - selectionActionOpacityStartedAt) / 250
            );
            const start = selectionActionOpacity;
            const rawOpacity = start + (selectionActionOpacityTarget - start) * progress;
            selectionActionOpacity = Math.round(rawOpacity * 4) / 4;

            if (progress >= 1) {
                selectionActionOpacity = selectionActionOpacityTarget;
            }
        }

        function paintTile(event) {
            if (selectedTileId === null && !isEraserMode && event.button !== 2) {
                return;
            }

            const gridPosition = getGridPosition(event);

            if (!gridPosition) {
                return;
            }

            const { column, row } = gridPosition;

            if (column === lastEditedX && row === lastEditedY) {
                return;
            }

            paintMapTile(row, column, getTileIdForEvent(event));
            lastEditedX = column;
            lastEditedY = row;
        }

        function fillConnectedEmptyArea(start) {
            if (!start || selectedTileId === null || selectedTileId === AIR_ID) {
                return;
            }

            const startIndex = start.row * mapWidth + start.column;
            const isOpenCell = (row, column) =>
                mapGrid[row]?.[column] === AIR_ID && !getElementAnchor(row, column);
            if (!isOpenCell(start.row, start.column)) {
                return;
            }

            const visited = new Uint8Array(mapWidth * mapHeight);
            const pending = [startIndex];
            const region = [];
            visited[startIndex] = 1;
            for (let index = 0; index < pending.length; index += 1) {
                const cellIndex = pending[index];
                const row = Math.floor(cellIndex / mapWidth);
                const column = cellIndex % mapWidth;
                region.push({ row, column });

                for (const [nextRow, nextColumn] of [
                    [row - 1, column],
                    [row + 1, column],
                    [row, column - 1],
                    [row, column + 1]
                ]) {
                    if (
                        nextRow < 0 || nextRow >= mapHeight ||
                        nextColumn < 0 || nextColumn >= mapWidth
                    ) {
                        continue;
                    }
                    const nextIndex = nextRow * mapWidth + nextColumn;
                    if (!visited[nextIndex] && isOpenCell(nextRow, nextColumn)) {
                        visited[nextIndex] = 1;
                        pending.push(nextIndex);
                    }
                }
            }

            let placedCount = 0;
            let placementFailed = false;
            if (isMultiCellElement(selectedTileId)) {
                const { width: footprintWidth, height: footprintHeight } =
                    getElementFootprintSize(selectedTileId);
                const regionCells = new Set(region.map(({ row, column }) =>
                    row * mapWidth + column
                ));
                for (const { row, column } of region) {
                    if (
                        (row - start.row) % footprintHeight !== 0 ||
                        (column - start.column) % footprintWidth !== 0
                    ) {
                        continue;
                    }
                    const footprintIsOpen = getElementFootprint(
                        row,
                        column,
                        selectedTileId
                    ).every((cell) =>
                        regionCells.has(cell.row * mapWidth + cell.column)
                    );
                    if (!footprintIsOpen) {
                        continue;
                    }
                    if (paintMapTile(row, column, selectedTileId, false)) {
                        placedCount += 1;
                    } else {
                        placementFailed = true;
                    }
                }
            } else {
                for (const { row, column } of region) {
                    if (paintMapTile(row, column, selectedTileId, false)) {
                        placedCount += 1;
                    } else {
                        placementFailed = true;
                    }
                }
            }

            if (placementFailed && placedCount === 0) {
                showMessage('The fill could not place the selected tile here.');
            } else if (placementFailed) {
                showMessage('The fill stopped because a tile placement limit was reached.');
            }
        }

        function getSquareDrawBounds(start, end, constrainToSquare = false) {
            if (!start || !end) {
                return null;
            }

            const rowDirection = end.row >= start.row ? 1 : -1;
            const columnDirection = end.column >= start.column ? 1 : -1;
            const tileSize = selectedTileId === null
                ? { width: 1, height: 1 }
                : getElementFootprintSize(selectedTileId);
            const requestedHeight = Math.abs(end.row - start.row) + 1;
            const requestedWidth = Math.abs(end.column - start.column) + 1;
            const availableHeight = rowDirection > 0
                ? mapHeight - start.row
                : start.row + 1;
            const availableWidth = columnDirection > 0
                ? mapWidth - start.column
                : start.column + 1;
            const requestedSide = Math.max(requestedHeight, requestedWidth);
            const availableSide = Math.min(availableHeight, availableWidth);
            const tileAlignedSize = (size, stride) =>
                Math.ceil(size / stride) * stride;
            const height = Math.min(
                constrainToSquare
                    ? tileAlignedSize(requestedSide, tileSize.height)
                    : tileAlignedSize(requestedHeight, tileSize.height),
                Math.floor((constrainToSquare ? availableSide : availableHeight) / tileSize.height) *
                    tileSize.height
            );
            const width = Math.min(
                constrainToSquare
                    ? tileAlignedSize(requestedSide, tileSize.width)
                    : tileAlignedSize(requestedWidth, tileSize.width),
                Math.floor((constrainToSquare ? availableSide : availableWidth) / tileSize.width) *
                    tileSize.width
            );
            if (height < tileSize.height || width < tileSize.width) {
                return null;
            }
            const lastRow = start.row + rowDirection * (height - 1);
            const lastColumn = start.column + columnDirection * (width - 1);

            return {
                top: Math.min(start.row, lastRow),
                left: Math.min(start.column, lastColumn),
                bottom: Math.max(start.row, lastRow),
                right: Math.max(start.column, lastColumn)
            };
        }

        function paintSquare(start, end, constrainToSquare = false) {
            const bounds = getSquareDrawBounds(start, end, constrainToSquare);
            if (!bounds || selectedTileId === null) {
                return;
            }

            const tileId = selectedTileId;
            const { width: footprintWidth, height: footprintHeight } =
                getElementFootprintSize(tileId);

            for (let row = bounds.top; row <= bounds.bottom; row += footprintHeight) {
                for (let column = bounds.left; column <= bounds.right; column += footprintWidth) {
                    paintMapTile(row, column, tileId, false);
                }
            }
        }

        function drawSquarePreview(tileWidth, tileHeight) {
            if (!isDrawingSquare || selectedTileId === null) {
                return;
            }

            const bounds = getSquareDrawBounds(
                squareDrawStart,
                squareDrawEnd,
                isSquareConstraintActive
            );
            if (!bounds) {
                return;
            }

            const left = bounds.left * tileWidth;
            const top = bounds.top * tileHeight;
            const width = (bounds.right - bounds.left + 1) * tileWidth;
            const height = (bounds.bottom - bounds.top + 1) * tileHeight;

            context.save();
            context.globalAlpha = 0.35;
            context.fillStyle = TILE_COLORS[selectedTileId] ?? '#ffffff';
            context.fillRect(left, top, width, height);
            context.globalAlpha = 0.9;
            context.strokeStyle = TILE_COLORS[selectedTileId] ?? '#ffffff';
            context.lineWidth = Math.max(1, Math.min(tileWidth, tileHeight) / 8);
            context.strokeRect(left, top, width, height);
            context.restore();
        }

        function drawBrickTile(
            texture,
            renderX,
            renderY,
            tileWidth,
            tileHeight,
            row,
            column,
            tileId,
            shineTexture,
            targetContext = context
        ) {
            const sourceWidth = texture?.naturalWidth || texture?.width || 1;
            const sourceHeight = texture?.naturalHeight || texture?.height || 1;

            let canDrawWholeTile = Boolean(texture);
            for (let subtileIndex = 0; canDrawWholeTile &&
                subtileIndex < BRICK_SUBTILE_GRID_SIZE * BRICK_SUBTILE_GRID_SIZE;
                subtileIndex += 1) {
                if (
                    !isBrickSubtileIntact(row, column, subtileIndex) ||
                    (tileId === REINFORCED_BRICKS_ID &&
                        getBrickSubtileHits(row, column, subtileIndex) !== 0)
                ) {
                    canDrawWholeTile = false;
                }
            }

            if (canDrawWholeTile) {
                targetContext.drawImage(texture, renderX, renderY, tileWidth, tileHeight);

                if (tileId === REINFORCED_BRICKS_ID && shineTexture) {
                    targetContext.drawImage(
                        shineTexture,
                        renderX,
                        renderY,
                        tileWidth,
                        tileHeight
                    );
                }
                return;
            }

            const subtileWidth = tileWidth / BRICK_SUBTILE_GRID_SIZE;
            const subtileHeight = tileHeight / BRICK_SUBTILE_GRID_SIZE;

            for (let subtileRow = 0; subtileRow < BRICK_SUBTILE_GRID_SIZE; subtileRow += 1) {
                for (let subtileColumn = 0; subtileColumn < BRICK_SUBTILE_GRID_SIZE; subtileColumn += 1) {
                    const subtileIndex = subtileRow * BRICK_SUBTILE_GRID_SIZE + subtileColumn;

                    if (!isBrickSubtileIntact(row, column, subtileIndex)) {
                        continue;
                    }

                    const destinationX = renderX + subtileColumn * subtileWidth;
                    const destinationY = renderY + subtileRow * subtileHeight;
                    const subtileHits = getBrickSubtileHits(row, column, subtileIndex);
                    const subtileTexture = tileId === REINFORCED_BRICKS_ID
                        ? animationFrames.get(REINFORCED_BRICKS_ID)?.[subtileHits]
                            ?? animationFrames.get(REINFORCED_BRICKS_ID)?.[0]
                        : texture;
                    const subtileSourceWidth = subtileTexture?.naturalWidth
                        || subtileTexture?.width
                        || sourceWidth;
                    const subtileSourceHeight = subtileTexture?.naturalHeight
                        || subtileTexture?.height
                        || sourceHeight;

                    if (subtileTexture) {
                        targetContext.drawImage(
                            subtileTexture,
                            subtileColumn * subtileSourceWidth / BRICK_SUBTILE_GRID_SIZE,
                            subtileRow * subtileSourceHeight / BRICK_SUBTILE_GRID_SIZE,
                            subtileSourceWidth / BRICK_SUBTILE_GRID_SIZE,
                            subtileSourceHeight / BRICK_SUBTILE_GRID_SIZE,
                            destinationX,
                            destinationY,
                            subtileWidth,
                            subtileHeight
                        );

                        if (tileId === REINFORCED_BRICKS_ID && shineTexture) {
                            const shineAlpha = subtileHits === 0
                                ? 1
                                : subtileHits === 1
                                    ? 0.5
                                    : subtileHits === 2
                                        ? 0.3
                                        : 0.1;

                            if (shineAlpha > 0) {
                                targetContext.save();
                                targetContext.globalAlpha = shineAlpha;
                                targetContext.drawImage(
                                    shineTexture,
                                    subtileColumn * subtileSourceWidth / BRICK_SUBTILE_GRID_SIZE,
                                    subtileRow * subtileSourceHeight / BRICK_SUBTILE_GRID_SIZE,
                                    subtileSourceWidth / BRICK_SUBTILE_GRID_SIZE,
                                    subtileSourceHeight / BRICK_SUBTILE_GRID_SIZE,
                                    destinationX,
                                    destinationY,
                                    subtileWidth,
                                    subtileHeight
                                );
                                targetContext.restore();
                            }
                        }
                    } else {
                        targetContext.fillStyle = TILE_COLORS[tileId] ?? TILE_COLORS[SOLID_BLOCK_2_ID];
                        targetContext.fillRect(destinationX, destinationY, subtileWidth, subtileHeight);
                    }
                }
            }
        }

        function drawBrickHitbox(tileX, tileY, tileWidth, tileHeight, row, column) {
            const damagedSubtiles = brickDamage.get(`${row},${column}`) ?? new Set();
            const subtileWidth = tileWidth / BRICK_SUBTILE_GRID_SIZE;
            const subtileHeight = tileHeight / BRICK_SUBTILE_GRID_SIZE;

            context.save();
            context.strokeStyle = '#ff4d6d';
            context.lineWidth = 1;
            context.beginPath();

            for (let subtileRow = 0; subtileRow < BRICK_SUBTILE_GRID_SIZE; subtileRow += 1) {
                for (let subtileColumn = 0; subtileColumn < BRICK_SUBTILE_GRID_SIZE; subtileColumn += 1) {
                    const subtileIndex = subtileRow * BRICK_SUBTILE_GRID_SIZE + subtileColumn;

                    if (!isBrickSubtileIntact(row, column, subtileIndex)) {
                        continue;
                    }

                    const left = tileX + subtileColumn * subtileWidth;
                    const top = tileY + subtileRow * subtileHeight;
                    context.rect(left, top, subtileWidth, subtileHeight);
                }
            }

            context.stroke();
            context.restore();
        }

        function drawSteelHitbox(tileX, tileY, tileWidth, tileHeight) {
            context.save();
            context.strokeStyle = '#55aaff';
            context.lineWidth = 2;
            context.strokeRect(
                Math.round(tileX) + 1,
                Math.round(tileY) + 1,
                Math.max(0, Math.round(tileWidth) - 2),
                Math.max(0, Math.round(tileHeight) - 2)
            );
            context.restore();
        }

        function stopPainting() {
            isPainting = false;
            lastEditedX = null;
            lastEditedY = null;
        }

        function resizeCanvas() {
            mapCamera.resizeCanvas();
        }

        function isEditorDynamicTile(tileId) {
            return tileId === EAGLE_ID ||
                tileId === TNT_BLOCK_ID ||
                isSpawnerTile(tileId) ||
                REINFORCED_ANIMATION_IDS.has(tileId) ||
                (TILE_ANIMATION_FRAME_COUNTS[tileId] ?? 0) > 0;
        }

        function createAirFloorPattern(targetContext, texture, tileWidth, tileHeight) {
            if (!texture) {
                return null;
            }
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = Math.max(1, Math.round(tileWidth * LARGE_TILE_SIZE));
            patternCanvas.height = Math.max(1, Math.round(tileHeight * LARGE_TILE_SIZE));
            const patternContext = patternCanvas.getContext('2d');
            if (!patternContext) {
                return null;
            }
            patternContext.imageSmoothingEnabled = false;
            patternContext.drawImage(
                texture,
                0,
                0,
                patternCanvas.width,
                patternCanvas.height
            );
            return targetContext.createPattern(patternCanvas, 'repeat');
        }

        function buildEditorStaticLayer(
            displayWidth,
            displayHeight,
            timestamp,
            baseAirTexture,
            coveredElementCells
        ) {
            const layerCanvas = document.createElement('canvas');
            layerCanvas.width = displayWidth;
            layerCanvas.height = displayHeight;
            const layerContext = layerCanvas.getContext('2d');
            layerContext.imageSmoothingEnabled = false;
            layerContext.fillStyle = MAP_BACKGROUND_COLOR;
            layerContext.fillRect(0, 0, displayWidth, displayHeight);

            const airPattern = createAirFloorPattern(
                layerContext,
                baseAirTexture,
                displayWidth / mapWidth,
                displayHeight / mapHeight
            );
            if (airPattern) {
                layerContext.fillStyle = airPattern;
                layerContext.fillRect(0, 0, displayWidth, displayHeight);
            }

            const dynamicTileIndexes = new Set();
            const tileWidth = displayWidth / mapWidth;
            const tileHeight = displayHeight / mapHeight;

            for (let row = 0; row < mapHeight; row += 1) {
                for (let column = 0; column < mapWidth; column += 1) {
                    const tileId = mapGrid[row][column];
                    const index = row * mapWidth + column;
                    const isTemporarySteel = temporarySteelEffect?.tileId === tileId &&
                        temporarySteelEffect.cellKeys.has(`${row},${column}`);

                    if (
                        isEditorDynamicTile(tileId) ||
                        isTemporarySteel
                    ) {
                        dynamicTileIndexes.add(index);
                        continue;
                    }

                    if (
                        tileId === AIR_ID ||
                        coveredElementCells.has(`${row},${column}`)
                    ) {
                        continue;
                    }

                    const renderX = column * tileWidth;
                    const renderY = row * tileHeight;
                    const { width: footprintWidth, height: footprintHeight } =
                        getElementFootprintSize(tileId);
                    const renderWidth = tileWidth * footprintWidth;
                    const renderHeight = tileHeight * footprintHeight;
                    const texture = getTileTexture(tileId, timestamp);

                    if (tileId === VACIO_SOLIDO_ID) {
                        layerContext.fillStyle = MAP_BACKGROUND_COLOR;
                        layerContext.fillRect(renderX, renderY, renderWidth, renderHeight);
                        continue;
                    }

                    if (BRICK_TILE_IDS.has(tileId)) {
                        drawBrickTile(
                            texture,
                            renderX,
                            renderY,
                            renderWidth,
                            renderHeight,
                            row,
                            column,
                            tileId,
                            null,
                            layerContext
                        );
                    } else if (texture) {
                        if (ROAD_TILE_IDS.has(tileId)) {
                            drawRouteTexture(
                                layerContext,
                                texture,
                                tileId,
                                renderX,
                                renderY,
                                renderWidth,
                                renderHeight
                            );
                        } else {
                            layerContext.drawImage(
                                texture,
                                renderX,
                                renderY,
                                renderWidth,
                                renderHeight
                            );
                        }
                    } else {
                        layerContext.fillStyle = TILE_COLORS[tileId] ?? TILE_COLORS[AIR_ID];
                        layerContext.fillRect(renderX, renderY, renderWidth, renderHeight);
                    }

                    if (
                        isLargeTile(tileId) &&
                        Object.hasOwn(EDITOR_TILE_TINTS, tileId)
                    ) {
                        layerContext.save();
                        layerContext.globalAlpha = 0.38;
                        layerContext.fillStyle = EDITOR_TILE_TINTS[tileId];
                        layerContext.fillRect(renderX, renderY, tileWidth, tileHeight);
                        layerContext.restore();
                        drawPixelDigitOnTile(
                            tileId,
                            renderX,
                            renderY,
                            tileWidth,
                            tileHeight,
                            layerContext
                        );
                    }
                }
            }

            editorDynamicTileIndexes = dynamicTileIndexes;
            editorStaticLayerCache = {
                canvas: layerCanvas,
                width: displayWidth,
                height: displayHeight,
                version: mapRenderVersion,
                texture: baseAirTexture
            };
        }

        function getEnemyPathDebugPoints(enemy) {
            if (
                !enemy ||
                !['f', 'e'].includes(enemy.textureType) ||
                !enemy.pathRouteCache?.steps
            ) {
                return [];
            }

            const tileDimensions = getTileDimensions();
            const width = mapWidth;
            const height = mapHeight;
            const startRow = Math.round(enemy.physicsY / tileDimensions.height) - 1;
            const startColumn = Math.round(enemy.physicsX / tileDimensions.width) - 1;
            const route = enemy.pathRouteCache.steps;
            const points = [{ x: enemy.x, y: enemy.y }];
            let row = startRow;
            let column = startColumn;
            let visited = new Set();
            let currentIndex = row * width + column;

            while (route.has(currentIndex) && !visited.has(currentIndex)) {
                visited.add(currentIndex);
                const step = route.get(currentIndex);
                if (!step) {
                    break;
                }

                const nextRow = row + (
                    step.direction === 'DOWN' ? 1 : step.direction === 'UP' ? -1 : 0
                );
                const nextColumn = column + (
                    step.direction === 'RIGHT' ? 1 : step.direction === 'LEFT' ? -1 : 0
                );

                if (
                    nextRow < 0 || nextRow >= height ||
                    nextColumn < 0 || nextColumn >= width
                ) {
                    break;
                }

                row = nextRow;
                column = nextColumn;
                currentIndex = row * width + column;
                points.push({
                    x: (column + 1) * tileDimensions.width,
                    y: (row + 1) * tileDimensions.height
                });
            }

            return points;
        }

        function drawEnemyPathDebugLines() {
            if (!isEnemyDebugEnabled || !isSimulationActive || !enemyTanks.length) {
                return;
            }

            context.save();
            context.strokeStyle = '#63f2a7';
            context.lineWidth = 2;
            context.setLineDash([6, 4]);

            enemyTanks.forEach((enemy) => {
                if (!['f', 'e'].includes(enemy.textureType)) {
                    return;
                }

                const points = getEnemyPathDebugPoints(enemy);
                if (points.length < 2) {
                    return;
                }

                context.beginPath();
                context.strokeStyle = enemy.textureType === 'e' ? '#58a6ff' : '#63f2a7';
                context.moveTo(points[0].x, points[0].y);
                for (let index = 1; index < points.length; index += 1) {
                    context.lineTo(points[index].x, points[index].y);
                }
                context.stroke();
            });

            context.restore();
        }

        function renderMap(timestamp = 0) {
            const canvasDimensions = getCanvasDimensions();
            const displayWidth = canvasDimensions.width;
            const displayHeight = canvasDimensions.height;
            const tileWidth = displayWidth / mapWidth;
            const tileHeight = displayHeight / mapHeight;
            const baseAirTexture = getTileTexture(AIR_ID, timestamp);
            const shineTexture = getShineTexture(timestamp);

            context.clearRect(0, 0, displayWidth, displayHeight);

            if (
                !coveredElementCellsCache ||
                coveredElementCellsCacheVersion !== mapRenderVersion
            ) {
                coveredElementCellsCache = new Set();

                for (let row = 0; row < mapHeight; row += 1) {
                    for (let column = 0; column < mapWidth; column += 1) {
                        if (!isMultiCellElement(mapGrid[row][column])) {
                            continue;
                        }

                        for (const cell of getElementFootprint(row, column, mapGrid[row][column])) {
                            if (cell.row !== row || cell.column !== column) {
                                coveredElementCellsCache.add(`${cell.row},${cell.column}`);
                            }
                        }
                    }
                }

                coveredElementCellsCacheVersion = mapRenderVersion;
            }

            const coveredElementCells = coveredElementCellsCache;

            if (isSimulationActive) {
                if (
                    !baseLayerCache ||
                    baseLayerCache.width !== displayWidth ||
                    baseLayerCache.height !== displayHeight ||
                    baseLayerCache.texture !== baseAirTexture
                ) {
                    const layerCanvas = document.createElement('canvas');
                    layerCanvas.width = displayWidth;
                    layerCanvas.height = displayHeight;
                    const layerContext = layerCanvas.getContext('2d');
                    layerContext.imageSmoothingEnabled = false;

                    const airPattern = createAirFloorPattern(
                        layerContext,
                        baseAirTexture,
                        displayWidth / mapWidth,
                        displayHeight / mapHeight
                    );
                    if (airPattern) {
                        layerContext.fillStyle = airPattern;
                        layerContext.fillRect(0, 0, displayWidth, displayHeight);
                    }

                    baseLayerCache = {
                        width: displayWidth,
                        height: displayHeight,
                        texture: baseAirTexture,
                        canvas: layerCanvas
                    };
                }
                context.drawImage(baseLayerCache.canvas, 0, 0);
            } else {
                if (
                    !editorStaticLayerCache ||
                    editorStaticLayerCache.width !== displayWidth ||
                    editorStaticLayerCache.height !== displayHeight ||
                    editorStaticLayerCache.version !== mapRenderVersion ||
                    editorStaticLayerCache.texture !== baseAirTexture
                ) {
                    buildEditorStaticLayer(
                        displayWidth,
                        displayHeight,
                        timestamp,
                        baseAirTexture,
                        coveredElementCells
                    );
                }
                context.drawImage(editorStaticLayerCache.canvas, 0, 0);
            }

            const frameTextures = new Map();
            const activePlayerSpawnId = getActivePlayerSpawnTileId();

            for (let row = 0; row < mapHeight; row += 1) {
                for (let column = 0; column < mapWidth; column += 1) {
                    const tileId = mapGrid[row][column];
                    if (
                        isSimulationActive &&
                        areInitialSpawnsDeferred &&
                        isSpawnerTile(tileId)
                    ) {
                        continue;
                    }
                    if (
                        !isSimulationActive &&
                        !editorDynamicTileIndexes.has(row * mapWidth + column)
                    ) {
                        continue;
                    }
                    if (
                        tileId === activePlayerSpawnId &&
                        isSimulationActive &&
                        gameTime >= playerSpawnIntroUntil
                    ) {
                        continue;
                    }
                    const tileColor = isSimulationActive
                        ? SIMULATION_TILE_COLORS[tileId] ?? TILE_COLORS[tileId] ?? TILE_COLORS[AIR_ID]
                        : TILE_COLORS[tileId] ?? TILE_COLORS[AIR_ID];
                    const isLargeTileAnchor = isLargeTile(tileId);
                    const isCoveredByAnotherElement = coveredElementCells.has(`${row},${column}`);
                    const { width: footprintWidth, height: footprintHeight } =
                        getElementFootprintSize(tileId);
                    const renderWidth = tileWidth * footprintWidth;
                    const renderHeight = tileHeight * footprintHeight;
                    const renderX = Math.round(column * tileWidth);
                    const renderY = Math.round(row * tileHeight);
                    let texture = frameTextures.get(tileId);

                    if (!frameTextures.has(tileId)) {
                        texture = getTileTexture(tileId, timestamp);
                        frameTextures.set(tileId, texture);
                    }
                    const tntBlockDetonation = tileId === TNT_BLOCK_ID
                        ? tntBlockDetonations.get(`${row},${column}`)
                        : null;
                    if (tntBlockDetonation) {
                        const frames = animationFrames.get(TNT_BLOCK_ID);
                        texture = frames?.[getTntDetonationBlinkFrame(
                            tntBlockDetonation.startedAt,
                            tntBlockDetonation.detonatesAt
                        )] ?? frames?.[0] ?? texture;
                    }
                    if (tileId === EAGLE_ID && destroyedEagleTiles.has(`${row},${column}`)) {
                        texture = animationFrames.get(EAGLE_ID)?.[1] ?? texture;
                    }
                    const canRenderTile = !isCoveredByAnotherElement;
                    const isBlinkingTemporarySteel = temporarySteelEffect?.tileId === tileId &&
                        temporarySteelEffect.cellKeys.has(`${row},${column}`) &&
                        temporarySteelEffect.expiresAt - gameTime <= 3000;

                    if (canRenderTile) {
                        context.save();
                        if (
                            isBlinkingTemporarySteel &&
                            Math.floor(timestamp / 250) % 2 === 0
                        ) {
                            context.globalAlpha = 0.5;
                        }

                        if (tileId === VACIO_SOLIDO_ID) {
                            context.fillStyle = MAP_BACKGROUND_COLOR;
                            context.fillRect(
                                renderX,
                                renderY,
                                Math.max(1, Math.ceil(renderWidth)),
                                Math.max(1, Math.ceil(renderHeight))
                            );
                            context.restore();
                            continue;
                        }

                        if (BRICK_TILE_IDS.has(tileId)) {
                            drawBrickTile(
                                texture,
                                renderX,
                                renderY,
                                renderWidth,
                                renderHeight,
                                row,
                                column,
                                tileId,
                                shineTexture
                            );
                        } else if (texture) {
                            const drawingWidth = Math.max(1, Math.ceil(renderWidth));
                            const drawingHeight = Math.max(1, Math.ceil(renderHeight));
                            if (ROAD_TILE_IDS.has(tileId)) {
                                drawRouteTexture(
                                    context,
                                    texture,
                                    tileId,
                                    renderX,
                                    renderY,
                                    drawingWidth,
                                    drawingHeight
                                );
                            } else {
                                context.drawImage(
                                    texture,
                                    renderX,
                                    renderY,
                                    drawingWidth,
                                    drawingHeight
                                );
                            }
                        } else {
                            context.fillStyle = tileColor;
                            context.fillRect(
                                renderX,
                                renderY,
                                Math.max(1, Math.ceil(renderWidth)),
                                Math.max(1, Math.ceil(renderHeight))
                            );
                        }

                        if (
                            shineTexture &&
                            tileId === REINFORCED_STEEL_ID
                        ) {
                            context.drawImage(
                                shineTexture,
                                renderX,
                                renderY,
                                Math.max(1, Math.ceil(renderWidth)),
                                Math.max(1, Math.ceil(renderHeight))
                            );
                        }

                        if (
                            !isSimulationActive &&
                            isLargeTileAnchor &&
                            Object.hasOwn(EDITOR_TILE_TINTS, tileId)
                        ) {
                            context.save();
                            context.globalAlpha = 0.38;
                            context.fillStyle = EDITOR_TILE_TINTS[tileId];
                            context.fillRect(
                                renderX,
                                renderY,
                                Math.max(1, Math.ceil(tileWidth)),
                                Math.max(1, Math.ceil(tileHeight))
                            );
                            context.restore();

                            drawPixelDigitOnTile(
                                tileId,
                                renderX,
                                renderY,
                                Math.max(1, Math.ceil(tileWidth)),
                                Math.max(1, Math.ceil(tileHeight))
                            );
                        }

                        context.restore();
                    }
                }
            }

            if (areHitboxesVisible) {
                for (let row = 0; row < mapHeight; row += 1) {
                    for (let column = 0; column < mapWidth; column += 1) {
                        const tileId = mapGrid[row][column];
                        if (BRICK_TILE_IDS.has(tileId)) {
                            drawBrickHitbox(
                                Math.round(column * tileWidth),
                                Math.round(row * tileHeight),
                                tileWidth,
                                tileHeight,
                                row,
                                column,
                                tileId
                            );
                        } else if (tileId === SOLID_BLOCK_ID) {
                            drawSteelHitbox(
                                Math.round(column * tileWidth),
                                Math.round(row * tileHeight),
                                tileWidth,
                                tileHeight
                            );
                        }
                    }
                }
            }

            if (movePreview && movingElement) {
                const { width: footprintWidth, height: footprintHeight } =
                    getElementFootprintSize(movingElement.tileId);
                const previewWidth = tileWidth * footprintWidth;
                const previewHeight = tileHeight * footprintHeight;

                context.save();
                context.globalAlpha = 0.45;
                context.fillStyle = TILE_COLORS[movingElement.tileId];
                context.fillRect(
                    movePreview.column * tileWidth,
                    movePreview.row * tileHeight,
                    previewWidth,
                    previewHeight
                );
                context.restore();
            }

            if (isSimulationActive && !isPlayerDead && shouldDrawPlayerAfterSpawn) {
                drawBullets();
                drawPlayer();
                drawEnemies();
            } else if (isSimulationActive) {
                drawBullets();
                drawEnemies();
            }

            if (isSimulationActive) {
                const foregroundTileIds = [
                    BUSH_ID,
                    DENSE_BUSH_ID,
                    VERY_DENSE_BUSH_ID
                ];

                for (let row = 0; row < mapHeight; row += 1) {
                    for (let column = 0; column < mapWidth; column += 1) {
                        const tileId = mapGrid[row][column];
                        if (!foregroundTileIds.includes(tileId)) {
                            continue;
                        }

                        const foregroundTexture = getTileTexture(tileId, timestamp);
                        const renderX = Math.round(column * tileWidth);
                        const renderY = Math.round(row * tileHeight);
                        const renderWidth = Math.max(1, Math.ceil(tileWidth));
                        const renderHeight = Math.max(1, Math.ceil(tileHeight));

                        if (foregroundTexture) {
                            context.drawImage(
                                foregroundTexture,
                                renderX,
                                renderY,
                                renderWidth,
                                renderHeight
                            );
                        } else {
                            context.fillStyle = TILE_COLORS[tileId];
                            context.fillRect(renderX, renderY, renderWidth, renderHeight);
                        }
                    }
                }
            }

            if (isSimulationActive) {
                drawPowerUps();
            }

            if (isGridVisible) {
                context.beginPath();
                context.strokeStyle = gridColor;
                context.lineWidth = 1;

                for (let column = 0; column <= mapWidth; column += 1) {
                    const x = Math.round(column * tileWidth) + 0.5;
                    context.moveTo(x, 0);
                    context.lineTo(x, displayHeight);
                }

                for (let row = 0; row <= mapHeight; row += 1) {
                    const y = Math.round(row * tileHeight) + 0.5;
                    context.moveTo(0, y);
                    context.lineTo(displayWidth, y);
                }

                context.stroke();
            }

            drawEnemyPathDebugLines();
            drawSquarePreview(tileWidth, tileHeight);
            drawSelectionOverlay(
                tileWidth,
                tileHeight,
                displayWidth,
                displayHeight,
                timestamp
            );

            drawExplosions();
        }

        function encodeMap() {
            return levelDataCodec.encodeMap(mapGrid);
        }

        function getMapRequirementsError(counters) {
            const requiredTiles = [
                PLAYER_INITIAL_SPAWN_ID,
                ENEMY_SPAWN_A_ID
            ];

            for (const tileId of requiredTiles) {
                if (counters[tileId] !== 1) {
                    return `The map must contain exactly 1 tile with ID ${tileId}.`;
                }
            }

            return null;
        }

        function showLevelActionCheck(button) {
            button.classList.remove('action-succeeded');
            void button.offsetWidth;
            button.classList.add('action-succeeded');
        }

        function getMapPngFileName() {
            return levelName.value.trim()
                .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_') || 'battle-city-map';
        }

        function getExportTileTexture(tileId) {
            const frames = getAvailableAnimationFrames(tileId);
            if (
                isSpawnerTile(tileId)
            ) {
                return frames[4] ?? frames.find(Boolean) ?? tileTextures.get(tileId) ?? null;
            }
            if (
                tileId === WATER_ID ||
                tileId === LAVA_ID ||
                tileId === BUSH_ID ||
                tileId === ICE_ID ||
                tileId === REINFORCED_BRICKS_ID ||
                tileId === DENSE_BUSH_ID ||
                tileId === VERY_DENSE_BUSH_ID ||
                tileId === COMPACT_ICE_ID
            ) {
                return frames[0] ?? tileTextures.get(tileId) ?? null;
            }
            return getTileTexture(tileId, 0);
        }

        const mapPngRendererModule = window.BC90EMapPngRenderer;
        if (!mapPngRendererModule) {
            throw new Error('The map PNG renderer module did not load.');
        }
        const mapPngRenderer = mapPngRendererModule.createMapPngRenderer({
            getMapState: () => ({ mapGrid, mapWidth, mapHeight }),
            tileIds: { AIR: AIR_ID, SOLID_EMPTY: VACIO_SOLIDO_ID },
            backgroundColor: MAP_BACKGROUND_COLOR,
            brickTileIds: BRICK_TILE_IDS,
            roadTileIds: ROAD_TILE_IDS,
            tileColors: TILE_COLORS,
            solidBlockId: SOLID_BLOCK_2_ID,
            getExportTileTexture,
            createAirFloorPattern,
            isMultiCellElement,
            getElementFootprint,
            getElementFootprintSize,
            drawRouteTexture
        });
        function renderMapForPng(tileSize) {
            return mapPngRenderer.renderMap(tileSize);
        }

        function compileLevelData(name = levelName.value, validatePlayableMap = true) {
            if (name.includes('|')) {
                showMessage('The level name cannot contain the | character.');
                return null;
            }

            if (validatePlayableMap) {
                const requirementsError = getMapRequirementsError(tileCounters);
                if (requirementsError) {
                    showMessage(requirementsError);
                    return null;
                }
            }

            return [
                FORMAT_PREFIX,
                `${mapWidth},${mapHeight}`,
                name,
                encodeEnemySpawnOrder(),
                eagleMode.value,
                getConfiguredInitialLives(),
                getConfiguredMaxActiveEnemies(),
                isForceInitialLivesEnabled ? '1' : '0',
                encodeMap()
            ].join('|');
        }

        function importLevel() {
            const code = levelCode.value.trim();
            const parsed = levelDataCodec.parseLevelCode(code, {
                validTileIds: TILE_COLORS,
                defaultEnemySpawnOrder: createDefaultEnemySpawnOrder,
                defaultInitialLives: MAX_PLAYER_LIVES,
                defaultMaxActiveEnemies: DEFAULT_MAX_ACTIVE_ENEMIES,
                maxPlayerLives: 999,
                maxActiveEnemies: MAX_ACTIVE_ENEMIES,
                maxMapDimension: MAX_MAP_DIMENSION,
                powerUpCount: powerUpTextures.length
            });
            if (parsed.error === 'prefix') {
                showMessage('Invalid level prefix.');
                return false;
            }
            if (parsed.error === 'format') {
                showMessage('Invalid level format. Level names cannot contain |.');
                return false;
            }
            if (parsed.error === 'properties') {
                showMessage('Invalid level dimensions or Eagle mode.');
                return false;
            }
            if (parsed.error === 'dimensions-too-large') {
                showMessage(
                    `Imported maps cannot exceed ${MAX_MAP_DIMENSION}x${MAX_MAP_DIMENSION}.`
                );
                return false;
            }

            if (parsed.error === 'map') {
                showMessage('Invalid or incomplete compressed map data.');
                return false;
            }
            const {
                name,
                width,
                height,
                enemySpawnOrder: importedEnemyOrder,
                eagleMode: importedMode,
                initialLives: importedLives,
                maxActiveEnemies: importedMaxActiveEnemies,
                forceInitialLives: importedForceInitialLives,
                grid: importedGrid
            } = parsed.level;

            if (!validateLargeTileFootprints(importedGrid, width, height)) {
                showMessage('Imported map contains invalid multi-tile element footprints.');
                return false;
            }

            const importedCounters = countRestrictedTiles(importedGrid);
            const limitError = Object.keys(TILE_LIMITS).find(
                (tileId) => importedCounters[tileId] > TILE_LIMITS[tileId]
            );

            if (limitError !== undefined) {
                showMessage(`Tile limit exceeded for ID ${limitError}.`);
                return false;
            }

            if (isSimulationActive) {
                stopSimulation();
            }

            replaceMap(width, height, importedGrid);
            mapCamera.setZoom(100, false);
            enemySpawnOrder = importedEnemyOrder;
            nextEnemySpawnOrderIndex = 0;
            defeatedEnemyCount = 0;
            updateEnemyLivesDisplay();
            renderEnemySpawnOrderEditor();
            levelName.value = name;
            eagleMode.value = importedMode;
            setConfiguredInitialLives(importedLives);
            isForceInitialLivesEnabled = importedForceInitialLives;
            forceInitialLivesToggleButton.textContent =
                `Force Initial Lives: ${isForceInitialLivesEnabled ? 'ON' : 'OFF'}`;
            forceInitialLivesToggleButton.setAttribute(
                'aria-pressed',
                String(isForceInitialLivesEnabled)
            );
            setToggleButtonState(
                forceInitialLivesToggleButton,
                isForceInitialLivesEnabled
            );
            setConfiguredMaxActiveEnemies(importedMaxActiveEnemies);
            resizeCanvas();
            hasUnsavedLevelChanges = true;
            showLevelActionCheck(importButton);
            return true;
        }

        function renderFrame(timestamp = 0) {
            const realDeltaSeconds = previousFrameTime
                ? Math.min((timestamp - previousFrameTime) / 1000, 0.05)
                : 0;
            const deltaSeconds = (isGamePaused && !levelIntro.isAnimating()
                ? 0
                : realDeltaSeconds) * (
                isSlowMotionEnabled ? slowMotionTimeScale : 1
            );

            previousFrameTime = timestamp;
            gameTime += deltaSeconds * 1000;
            updateTemporarySteel();

            if (
                isSimulationActive &&
                !isPlayerDead &&
                !shouldDrawPlayerAfterSpawn &&
                playerSpawnIntroUntil > 0 &&
                gameTime >= playerSpawnIntroUntil
            ) {
                shouldDrawPlayerAfterSpawn = true;
                playerRespawnIntroActive = false;
            }

            if (isSimulationActive) {
                beginPendingPlayerRespawn();
                beginEnemySpawnIntros();
                finishEnemySpawnIntroductions();
                updateEnemyCollisionPairs();
            }

            if (isSimulationActive && !isPlayerDead && shouldDrawPlayerAfterSpawn) {
                updatePlayer(deltaSeconds);
            }
            if (isSimulationActive) {
                updateEnemies(deltaSeconds);
                updatePowerUpPickups();
            }
            updateMovementAudio();
            updateSelectionActionOpacity();
            updatePlayerRank9Burst();
            updateEnemyRank9Bursts();
            updateBullets(deltaSeconds);
            updatePendingTntBlockDetonations();
            updatePendingTntDetonations();
            updateExplosions();
            finishPendingCut();
            refreshEnemyDebugPanel();
            if (
                isSimulationActive ||
                timestamp - lastEditorMapRenderAt >= EDITOR_MAP_RENDER_INTERVAL
            ) {
                renderMap(gameTime);
                lastEditorMapRenderAt = timestamp;
            }
            updateEnemySpawnOrderPreviews(gameTime);
            updateTileSelectorTextures(gameTime);
            window.requestAnimationFrame(renderFrame);
        }

        canvas.addEventListener('pointerdown', (event) => {
            if (isSimulationActive) {
                return;
            }

            event.preventDefault();
            canvas.setPointerCapture(event.pointerId);
            const pointerPosition = getGridPosition(event);
            lastMapPointerPosition = pointerPosition;

            if (event.button === 0 && isPasteMode) {
                commitPastePlacement(pointerPosition);
                return;
            }

            if (
                event.button === 0 &&
                (isPanModeEnabled || (event.pointerType === 'mouse' && event.shiftKey))
            ) {
                mapCamera.beginPan(event);
                return;
            }

            if (event.button === 0 && selectionRegion) {
                const actionIndex = getSelectionActionIndex(event);
                if (actionIndex === 0) {
                    deleteSelection();
                    return;
                }
                if (actionIndex === 1) {
                    copySelection();
                    return;
                }
                if (actionIndex === 2) {
                    cutSelection();
                    return;
                }
                if (actionIndex === 3) {
                    startPastePlacement(pointerPosition);
                    return;
                }
            }

            if (event.button === 2) {
                if (selectionRegion) {
                    clearSelection();
                }
                isPainting = true;
                paintTile(event);
                return;
            }

            if (isEraserMode) {
                if (selectionRegion) {
                    clearSelection();
                }
                isPainting = true;
                paintTile(event);
                return;
            }

            if (isSelectionMode) {
                selectionStart = getGridPosition(event);
                selectionDragEnd = selectionStart;
                isSelecting = Boolean(selectionStart);
                return;
            }

            if (event.button === 0 && isFillMode) {
                if (selectionRegion) {
                    clearSelection();
                }
                fillConnectedEmptyArea(getGridPosition(event));
                return;
            }

            if (isSquareMode && selectedTileId !== null) {
                if (selectionRegion) {
                    clearSelection();
                }
                squareDrawStart = getGridPosition(event);
                squareDrawEnd = squareDrawStart;
                isSquareConstraintActive = event.ctrlKey;
                isDrawingSquare = Boolean(squareDrawStart);
                return;
            }

            if (selectedTileId === null) {
                if (selectionRegion) {
                    const gridPosition = getGridPosition(event);
                    const bounds = getSelectionBounds();
                    const isInsideSelection = gridPosition && bounds &&
                        gridPosition.row >= bounds.startRow && gridPosition.row <= bounds.endRow &&
                        gridPosition.column >= bounds.startColumn && gridPosition.column <= bounds.endColumn;

                    if (isInsideSelection) {
                        startMovingSelection(event);
                    } else {
                        clearSelection();
                    }
                } else {
                    startMovingElement(event);
                }
                return;
            }

            if (selectionRegion) {
                clearSelection();
            }
            isPainting = true;
            paintTile(event);
        });
        canvas.addEventListener('pointermove', (event) => {
            if (mapCamera.hasActivePan(event.pointerId)) {
                mapCamera.movePan(event);
                return;
            }
            lastMapPointerPosition = getGridPosition(event);
            if (isPasteMode) {
                pastePreview = lastMapPointerPosition
                    ? { ...lastMapPointerPosition }
                    : null;
            }

            selectionActionHoverIndex = selectionRegion && !isMovingSelection
                ? getSelectionActionIndex(event)
                : null;

            if (!isSimulationActive && isSelecting) {
                selectionDragEnd = getGridPosition(event);
            } else if (!isSimulationActive && isDrawingSquare) {
                isSquareConstraintActive = event.ctrlKey;
                squareDrawEnd = getGridPosition(event) ?? squareDrawEnd;
            } else if (!isSimulationActive && isMovingSelection) {
                updateSelectionMovePreview(event);
            } else if (!isSimulationActive && isMovingElement) {
                updateMovePreview(event);
            } else if (!isSimulationActive && isPainting) {
                paintTile(event);
            }
        });
        canvas.addEventListener('pointerup', (event) => {
            if (mapCamera.hasActivePan(event.pointerId)) {
                mapCamera.stopPan();
                return;
            }

            if (isSelecting) {
                finishSelecting(event);
            } else if (isDrawingSquare) {
                isSquareConstraintActive = event.ctrlKey;
                squareDrawEnd = getGridPosition(event) ?? squareDrawEnd;
                paintSquare(squareDrawStart, squareDrawEnd, isSquareConstraintActive);
                isDrawingSquare = false;
                isSquareConstraintActive = false;
                squareDrawStart = null;
                squareDrawEnd = null;
            } else if (isMovingSelection) {
                updateSelectionMovePreview(event);
                finishMovingSelection();
            } else if (isMovingElement) {
                updateMovePreview(event);
                finishMovingElement();
            }

            stopPainting();
        });
        canvas.addEventListener('dblclick', (event) => {
            if (isSimulationActive || !isSelectionMode) {
                return;
            }

            event.preventDefault();
            if (isMovingSelection) {
                finishMovingSelection();
            }
            selectionRegion = {
                startRow: 0,
                startColumn: 0,
                endRow: mapHeight - 1,
                endColumn: mapWidth - 1,
                tiles: mapGrid.map((row) => row.slice())
            };
            isSelecting = false;
            selectionStart = null;
            selectionDragEnd = null;
            mapRenderVersion += 1;
        });
        canvas.addEventListener('pointerleave', () => {
            if (isPasteMode) {
                pastePreview = null;
            }
            lastMapPointerPosition = null;
            stopPainting();
            selectionActionHoverIndex = null;
        });
        canvas.addEventListener('pointercancel', (event) => {
            if (mapCamera.hasActivePan(event.pointerId)) {
                mapCamera.stopPan();
            }
            isDrawingSquare = false;
            isSquareConstraintActive = false;
            squareDrawStart = null;
            squareDrawEnd = null;
            stopPainting();
            selectionActionHoverIndex = null;
        });
        window.addEventListener('keydown', (event) => {
            const isEditingText = isEditableTextTarget(event.target);
            if (!isEditingText && isDrawingSquare && event.key === 'Control') {
                isSquareConstraintActive = true;
            }
            if (
                !isEditingText &&
                event.key === 'Shift' &&
                !isSimulationActive &&
                !settingsDialog.open
            ) {
                mapZoomControls.classList.add('shift-pan-active');
                if (document.activeElement === zoomInButton) {
                    zoomInButton.blur();
                }
            }
        });
        window.addEventListener('keyup', (event) => {
            const isEditingText = isEditableTextTarget(event.target);
            if (!isEditingText && isDrawingSquare && event.key === 'Control') {
                isSquareConstraintActive = false;
            }
            if (event.key === 'Shift') {
                mapZoomControls.classList.remove('shift-pan-active');
                if (document.activeElement === panModeButton) {
                    panModeButton.blur();
                }
            }
        });
        window.addEventListener('blur', () => {
            mapZoomControls.classList.remove('shift-pan-active');
        });
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        window.addEventListener('pointerup', (event) => {
            if (isSelecting) {
                finishSelecting(event);
            } else if (isMovingSelection) {
                updateSelectionMovePreview(event);
                finishMovingSelection();
            } else if (isMovingElement) {
                updateMovePreview(event);
                finishMovingElement();
            }

            stopPainting();
        });
        mobileGameControls.querySelectorAll('[data-game-direction]').forEach((button) => {
            const direction = button.dataset.gameDirection;
            const releaseDirection = (event) => {
                const activeDirection = activeTouchDirections.get(event.pointerId);

                if (!activeDirection) {
                    return;
                }

                activeTouchDirections.delete(event.pointerId);
                if (!Array.from(activeTouchDirections.values()).includes(activeDirection)) {
                    button.classList.remove('is-pressed');
                }
                restoreRequestedDirection(activeDirection);
            };

            button.addEventListener('pointerdown', (event) => {
                if (!isSimulationActive || isGamePaused ||
                    activeTouchDirections.has(event.pointerId)) {
                    return;
                }

                event.preventDefault();
                button.setPointerCapture(event.pointerId);
                activeTouchDirections.set(event.pointerId, direction);
                requestedDirection = direction;
                isPlayerWaitingAfterIceSlide = false;
                button.classList.add('is-pressed');
            });
            button.addEventListener('pointerup', releaseDirection);
            button.addEventListener('pointercancel', releaseDirection);
            button.addEventListener('lostpointercapture', releaseDirection);
        });
        const touchFireButton = mobileGameControls.querySelector('[data-game-fire]');
        const releaseTouchFire = (event) => {
            if (touchFirePointerId !== event.pointerId) {
                return;
            }

            touchFirePointerId = null;
            if (touchFireIntervalId !== null) {
                window.clearInterval(touchFireIntervalId);
                touchFireIntervalId = null;
            }
            touchFireButton.classList.remove('is-pressed');
        };

        touchFireButton.addEventListener('pointerdown', (event) => {
            if (!levelScoreScreen.hidden) {
                event.preventDefault();
                continueFromLevelScore();
                return;
            }

            if (!isSimulationActive || isGamePaused || touchFirePointerId !== null) {
                return;
            }

            event.preventDefault();
            touchFireButton.setPointerCapture(event.pointerId);
            touchFirePointerId = event.pointerId;
            touchFireButton.classList.add('is-pressed');
            fireBullet();
            touchFireIntervalId = window.setInterval(
                fireBullet,
                BULLET_FIRE_COOLDOWN_SECONDS * 1000
            );
        });
        touchFireButton.addEventListener('pointerup', releaseTouchFire);
        touchFireButton.addEventListener('pointercancel', releaseTouchFire);
        touchFireButton.addEventListener('lostpointercapture', releaseTouchFire);
        mobileGameControls.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        settingsButton.addEventListener('click', () => {
            settingsDialog.classList.remove('menu-settings');
            settingsDialog.showModal();
            window.requestAnimationFrame(applyTouchControlSettings);
        });
        menuFrameToggleInput.addEventListener('change', () => {
            appShellUi.applyMenuFrameState(menuFrameToggleInput.checked);
            appShellUi.setMenuFramePreference(menuFrameToggleInput.checked);
        });
        settingsDialog.addEventListener('close', () => {
            settingsDialog.classList.remove('menu-settings');
        });
        async function handleMenuReturn() {
            const confirmationMessage = hasUnsavedLevelChanges
                ? 'Return to the main menu? Your current level remains in this tab, but unsaved changes will be lost if you close or reload the page.'
                : 'Return to the main menu? The current game will stop.';
            if (!await showMessageConfirmation(confirmationMessage)) {
                return;
            }
            hasUnsavedLevelChanges = false;
            packEditorScreen.hidden = true;
            document.body.classList.remove('pack-editor-open');
            document.body.classList.remove('pack-play-mode');
            isPackPlayMode = false;
            playingPackStage = null;
            if (settingsDialog.open) {
                settingsDialog.close();
            }
            if (isSimulationActive) {
                stopSimulation();
            }
            appShell.hidden = true;
            startMenu.hidden = false;
        }
        window.BC90EAppNavigation.bindReturnControls({
            onMenuReturn: handleMenuReturn,
            onPackEditorReturn: handlePackEditorReturn,
            onGameplayReturn: handleGameplayReturn
        });

        closeSettingsButton.addEventListener('click', () => {
            settingsDialog.close();
        });
        const animatedFoldTimers = new WeakMap();
        const expandedFoldSections = new WeakSet();
        document.querySelectorAll('.settings-section, .level-data-section').forEach((section) => {
            const summary = section.querySelector(':scope > summary');
            const content = summary?.nextElementSibling;
            if (!summary || !content) {
                return;
            }

            section.classList.toggle('is-expanded', section.open);
            if (section.open) {
                expandedFoldSections.add(section);
            }
            content.inert = !section.open;
            summary.addEventListener('click', (event) => {
                event.preventDefault();
                window.clearTimeout(animatedFoldTimers.get(section));
                animatedFoldTimers.delete(section);

                if (!expandedFoldSections.has(section)) {
                    expandedFoldSections.add(section);
                    section.open = true;
                    content.inert = false;
                    window.requestAnimationFrame(() => {
                        if (expandedFoldSections.has(section)) {
                            section.classList.add('is-expanded');
                        }
                    });
                    return;
                }

                expandedFoldSections.delete(section);
                section.classList.remove('is-expanded');
                animatedFoldTimers.set(section, window.setTimeout(() => {
                    if (!expandedFoldSections.has(section)) {
                        content.inert = true;
                        section.open = false;
                    }
                    animatedFoldTimers.delete(section);
                }, 190));
            });
        });
        levelDataPanel.querySelector('summary').addEventListener('click', (event) => {
            event.preventDefault();
            window.clearTimeout(levelDataCloseTimer);

            if (!levelDataExpander.classList.contains('is-expanded')) {
                levelDataPanel.open = true;
                levelDataExpander.inert = false;
                window.requestAnimationFrame(() => {
                    if (levelDataPanel.open) {
                        levelDataExpander.classList.add('is-expanded');
                    }
                });
                return;
            }

            levelDataExpander.classList.remove('is-expanded');
            levelDataCloseTimer = window.setTimeout(() => {
                if (!levelDataExpander.classList.contains('is-expanded')) {
                    levelDataExpander.inert = true;
                    levelDataPanel.open = false;
                }
            }, 190);
        });
        window.addEventListener('keydown', (event) => {
            if (
                !levelScoreScreen.hidden &&
                event.key.toLowerCase() === 'z'
            ) {
                event.preventDefault();
                if (!event.repeat) {
                    continueFromLevelScore();
                }
                return;
            }

            if (
                document.body.classList.contains('pack-game-active') &&
                isSimulationActive &&
                event.code === 'Space'
            ) {
                event.preventDefault();
                if (!event.repeat) {
                    toggleGamePause();
                }
                return;
            }

            if (event.key === 'Escape' && isPasteMode) {
                event.preventDefault();
                cancelPastePlacement();
                return;
            }
            if (isEditableTextTarget(event.target)) {
                return;
            }
            const isButtonTarget = event.target instanceof HTMLButtonElement;
            if (document.body.classList.contains('pack-game-active') && isGamePaused) {
                if (getDirectionForKey(event.key) || event.key.toLowerCase() === 'z') {
                    event.preventDefault();
                }
                return;
            }

            if (
                (event.ctrlKey || event.metaKey) &&
                !event.altKey &&
                !isSimulationActive &&
                !settingsDialog.open &&
                selectionRegion &&
                ['c', 'x'].includes(event.key.toLowerCase())
            ) {
                const handled = event.key.toLowerCase() === 'c'
                    ? copySelection()
                    : cutSelection();
                if (handled) {
                    event.preventDefault();
                }
                return;
            }

            if (
                (event.ctrlKey || event.metaKey) &&
                !event.altKey &&
                event.key.toLowerCase() === 'v' &&
                selectionClipboard &&
                !isSimulationActive &&
                !settingsDialog.open
            ) {
                event.preventDefault();
                if (!isPasteMode) {
                    startPastePlacement();
                }
                return;
            }

            if (event.key === 'Backspace') {
                if (selectionRegion) {
                    event.preventDefault();
                    deleteSelection();
                } else if (!isButtonTarget && selectedTileId === null) {
                    event.preventDefault();
                }
                return;
            }

            if (!isButtonTarget && !event.repeat && event.code === 'Space') {
                event.preventDefault();
                simulationButton.click();
                return;
            }

            const direction = getDirectionForKey(event.key);

            if (event.key.toLowerCase() === 'z' && isSimulationActive) {
                event.preventDefault();
                fireBullet();
                return;
            }

            if (!direction) {
                return;
            }

            event.preventDefault();

            const normalizedKey = normalizeKeyName(event.key);
            pressedKeys.add(normalizedKey);
            requestedDirection = direction;
            if (!event.repeat) {
                isPlayerWaitingAfterIceSlide = false;
            }
        });
        window.addEventListener('keyup', (event) => {
            if (isEditableTextTarget(event.target)) {
                return;
            }
            const normalizedKey = normalizeKeyName(event.key);
            const direction = getDirectionForKey(normalizedKey);

            if (event.key.toLowerCase() === 'z') {
                return;
            }

            if (!direction) {
                return;
            }

            pressedKeys.delete(normalizedKey);
            restoreRequestedDirection(direction);
        });
        function clearGameInputState() {
            pressedKeys.clear();
            activeTouchDirections.clear();
            requestedDirection = null;
            touchFirePointerId = null;
            if (touchFireIntervalId !== null) {
                window.clearInterval(touchFireIntervalId);
                touchFireIntervalId = null;
            }
            mobileGameControls.querySelectorAll('.is-pressed').forEach((button) => {
                button.classList.remove('is-pressed');
            });
        }

        const gameplayLifecycleModule = window.BC90EGameplayLifecycle;
        if (!gameplayLifecycleModule) {
            throw new Error('The gameplay lifecycle module did not load.');
        }
        gameplayLifecycleModule.createGameplayLifecycle({
            shouldPause: () => isSimulationActive && !isGamePaused && !isGameOver,
            isSimulationActive: () => isSimulationActive,
            isGameOver: () => isGameOver,
            isResumePending: () => resumeSimulationAfterBackground,
            setResumePending: (isPending) => {
                resumeSimulationAfterBackground = isPending;
            },
            setGamePaused: (isPaused) => {
                isGamePaused = isPaused;
            },
            isPackGameActive: () =>
                document.body.classList.contains('pack-game-active'),
            setEditorInactivePauseVisible: (isVisible) => {
                editorInactivePauseMessage.classList.toggle('visible', isVisible);
            },
            setGamePauseVisible: (isVisible) => {
                gamePauseMessage.classList.toggle('visible', isVisible);
            },
            clearGameInputState,
            clearPlayerSliding,
            stopPlayerMovement: () => {
                Player.isMoving = false;
            },
            stopMovementAudio,
            resetFrameTime: () => {
                previousFrameTime = 0;
            }
        });
        const preventGestureZoom = (event) => event.preventDefault();
        ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
            document.addEventListener(eventName, preventGestureZoom, { passive: false });
        });
        window.addEventListener('resize', resizeCanvas);
        loadTileTextures();
        loadPlayerTextures();
        loadEnemyTextures();
        loadBulletTexture();
        loadPowerUpTextures();
        loadExplosionTextures();
        loadShieldTextures();
        loadSelectionActionTextures();
        function getCanvasCursorState() {
            if (isMovingElement) {
                return 'objectMove';
            }

            if (isEraserMode) {
                return 'erase';
            }

            if (isPainting) {
                return selectedTileId === AIR_ID ? 'erase' : 'draw';
            }

            return selectedTileId === null ? 'move' : 'selectable';
        }

        const pixelCursorUiApi = window.BC90EPixelCursorUi;
        if (!pixelCursorUiApi) {
            throw new Error('The pixel cursor UI module did not load.');
        }
        const pixelCursorUi = pixelCursorUiApi.createPixelCursorUi({
            image: pixelCursorImage,
            sizeInput: pixelCursorSizeInput,
            canvas,
            uiTextureDirectory: UI_TEXTURE_DIRECTORY,
            getCanvasCursorState,
            isSimulationActive: () => isSimulationActive,
            isMovingElement: () => isMovingElement
        });
        function setToggleButtonState(button, isEnabled) {
            button.classList.toggle('toggle-on', isEnabled);
            button.classList.toggle('toggle-off', !isEnabled);
        }

        const pngExportUiModule = window.BC90EPngExportUi;
        if (!pngExportUiModule) {
            throw new Error('The PNG export UI module did not load.');
        }
        const pngExportUi = pngExportUiModule.createPngExportUi({
            dialog: pngExportDialog,
            form: pngExportForm,
            tileSizeInput: pngExportTileSizeInput,
            status: pngExportStatus,
            preview: pngExportPreview,
            cancelButton: pngExportCancelButton,
            shareButton: pngExportShareButton,
            downloadLink: pngExportDownloadLink,
            renderMap: renderMapForPng,
            getMapDimensions: () => ({ width: mapWidth, height: mapHeight }),
            getFileName: getMapPngFileName
        });

        const appearanceUiModule = window.BC90EAppearanceUi;
        const settingsModule = window.BC90ESettings;
        if (!appearanceUiModule || !settingsModule) {
            throw new Error('The appearance UI or settings module did not load.');
        }
        const appearanceUi = appearanceUiModule.createAppearanceUi({
            themeToggleButton,
            roundedUiButton,
            pixelatedUiButton,
            pixelatedUiFontSizeInput,
            setToggleButtonState,
            settings: settingsModule
        });

        const pageScaleUiModule = window.BC90EPageScaleUi;
        if (!pageScaleUiModule) {
            throw new Error('The page scale UI module did not load.');
        }
        const pageScaleUi = pageScaleUiModule.createPageScaleUi({
            enabledInput: pageScaleEnabledInput,
            scaleInput: pageScaleInput,
            scaleValue: pageScaleValue,
            appShell,
            applyTouchControlSettings,
            getMapBaseWidth: () => mapCamera.getBaseWidth(),
            resizeCanvas
        });
        const updatePageScale = pageScaleUi.update;

        document.addEventListener('focusin', (event) => {
            if (isEditableTextTarget(event.target)) {
                clearGameInputState();
            }
        });

        const debugControlsUiModule = window.BC90EDebugControlsUi;
        if (!debugControlsUiModule) {
            throw new Error('The debug controls UI module did not load.');
        }
        const debugControlsUi = debugControlsUiModule.createDebugControlsUi({
            debugSettingsRow,
            debugToggleButton,
            enemyDebugPanel,
            enemyDebugToggleButton,
            hitboxToggleButton,
            slowMotionButton,
            slowMotionScaleInput,
            playerTextureRowInput,
            playerTextureTypeInput,
            setToggleButtonState,
            getDebugEnabled: () => isDebugEnabled,
            setDebugEnabled: (enabled) => {
                isDebugEnabled = enabled;
            },
            getEnemyDebugEnabled: () => isEnemyDebugEnabled,
            setEnemyDebugEnabled: (enabled) => {
                isEnemyDebugEnabled = enabled;
            },
            getHitboxesVisible: () => areHitboxesVisible,
            setHitboxesVisible: (visible) => {
                areHitboxesVisible = visible;
            },
            getSlowMotionEnabled: () => isSlowMotionEnabled,
            setSlowMotionEnabled: (enabled) => {
                isSlowMotionEnabled = enabled;
            },
            setSlowMotionTimeScale: (scale) => {
                slowMotionTimeScale = scale;
            },
            refreshEnemyDebugPanel,
            loadPlayerTextures,
            setPlayerTextureRow: (row) => {
                playerTextureRow = row;
            },
            setPlayerTextureType: (type) => {
                playerTextureType = type;
            }
        });

        const editorViewControlsUiModule = window.BC90EEditorViewControlsUi;
        if (!editorViewControlsUiModule) {
            throw new Error('The editor view controls UI module did not load.');
        }
        const editorViewControlsUi = editorViewControlsUiModule
            .createEditorViewControlsUi({
                gridToggleButton,
                tileTextureToggle,
                tileNameToggle,
                mobileControlsToggleButton,
                canvasModeControlsToggleButton,
                mapZoomControlsToggleButton,
                mapZoomInputVisibleInput,
                mapZoomButtonSizeInput,
                canvasToolButtonSizeInput,
                canvasModeControls,
                mapZoomControls,
                editorLayout,
                setToggleButtonState,
                getGridVisible: () => isGridVisible,
                setGridVisible: (visible) => {
                    isGridVisible = visible;
                },
                getTileTexturesVisible: () => areTileTexturesVisible,
                setTileTexturesVisible: (visible) => {
                    areTileTexturesVisible = visible;
                },
                getTileNamesVisible: () => isTileNamesVisible,
                setTileNamesVisible: (visible) => {
                    isTileNamesVisible = visible;
                },
                getTouchControlsEnabled: () => areTouchControlsEnabled,
                setTouchControlsEnabled: (enabled) => {
                    areTouchControlsEnabled = enabled;
                },
                getCanvasModeControlsVisible: () => areCanvasModeControlsVisible,
                setCanvasModeControlsVisible: (visible) => {
                    areCanvasModeControlsVisible = visible;
                },
                getMapZoomControlsVisible: () => areMapZoomControlsVisible,
                setMapZoomControlsVisible: (visible) => {
                    areMapZoomControlsVisible = visible;
                },
                getMapZoomInputVisible: () => isMapZoomInputVisible,
                getPanModeEnabled: () => isPanModeEnabled,
                setPanModeEnabled,
                updateMapZoomInputVisibility,
                updateTileSelectorTextures: (timestamp, force) => {
                    updateTileSelectorTextures(timestamp ?? previousFrameTime, force);
                },
                updateZoomButtonLabels,
                updateTouchControlsVisibility,
                clearGameInputState,
                resizeCanvas
            });
        editorViewControlsUi.initialize();
        editorViewControlsUi.bindPanModeButton(panModeButton);
        debugControlsUi.initialize();
        setToggleButtonState(pixelCursorButton, pixelCursorUi.isEnabled());
        appearanceUi.initialize();
        updatePanModeButton();
        reloadAssetsButton.disabled = isSimulationActive;
        setConfiguredInitialLives(getConfiguredInitialLives());
        setConfiguredMaxActiveEnemies(getConfiguredMaxActiveEnemies());
        updatePageScale();
        updateZoomButtonLabels();
        debugControlsUi.update();
        renderEnemySpawnOrderEditor();
        updateEnemyOrderSize();
        updateEnemyLivesDisplay();
        window.BC90ENumberInputSteppers.initialize();
        addEnemySpawnOrderButton.addEventListener('click', () => {
            enemySpawnOrder.push({
                type: ENEMY_TANK_TYPE,
                textureType: ENEMY_TANK_TEXTURE_TYPE,
                powerUps: []
            });
            updateEnemyLivesDisplay();
            renderEnemySpawnOrderEditor();
        });
        importButton.addEventListener('click', importLevel);
        resizeMapButton.addEventListener('click', resizeMap);
        const levelCodeActionsModule = window.BC90ELevelCodeActions;
        if (!levelCodeActionsModule) {
            throw new Error('The level code actions module did not load.');
        }
        levelCodeActionsModule.createLevelCodeActions({
            levelCode,
            levelName,
            exportButton,
            copyButton: copyLevelCodeButton,
            pasteButton: pasteLevelCodeButton,
            shareButton: shareLevelCodeButton,
            compileLevelData,
            importLevel,
            showMessage,
            showActionSuccess: showLevelActionCheck
        });
        mapCamera.bindZoomControls(zoomFitButton);
        pageScaleEnabledInput.addEventListener('change', updatePageScale);
        pageScaleInput.addEventListener('input', updatePageScale);
        pixelCursorButton.addEventListener('click', () => {
            const enabled = !pixelCursorUi.isEnabled();
            pixelCursorUi.setEnabled(enabled);
            document.body.classList.toggle('pixel-cursor', enabled);
            pixelCursorButton.textContent = `Pixel Cursor: ${enabled ? 'ON' : 'OFF'}`;
            setToggleButtonState(pixelCursorButton, enabled);
            if (enabled) {
                pixelCursorUi.setState('normal');
            }
        });
        pixelCursorUi.setSize(Number.parseInt(pixelCursorSizeInput.value, 10) || 24);
        gridColorInput.addEventListener('input', () => {
            gridColor = gridColorInput.value;
        });
        initialLivesInput.addEventListener('input', () => {
            if (isSimulationActive) {
                return;
            }

            const value = Number.parseInt(initialLivesInput.value, 10);
            if (Number.isInteger(value)) {
                playerLivesCount.textContent =
                    String(Math.min(999, Math.max(0, value))).padStart(3, '0');
            }
        });
        initialLivesInput.addEventListener('change', () => {
            setConfiguredInitialLives(getConfiguredInitialLives());
        });
        forceInitialLivesToggleButton.addEventListener('click', () => {
            isForceInitialLivesEnabled = !isForceInitialLivesEnabled;
            forceInitialLivesToggleButton.textContent =
                `Force Initial Lives: ${isForceInitialLivesEnabled ? 'ON' : 'OFF'}`;
            forceInitialLivesToggleButton.setAttribute(
                'aria-pressed',
                String(isForceInitialLivesEnabled)
            );
            setToggleButtonState(
                forceInitialLivesToggleButton,
                isForceInitialLivesEnabled
            );
        });
        maxActiveEnemiesInput.addEventListener('change', () => {
            setConfiguredMaxActiveEnemies(getConfiguredMaxActiveEnemies());
        });
        resetMessagesButton.addEventListener('click', resetMessagePreferences);
        reloadAssetsButton.addEventListener('click', reloadAllAssets);
        deleteAssetsCacheButton.addEventListener('click', async () => {
            if (!await showMessageConfirmation(
                'Delete the saved asset cache? Assets already loaded in this session will keep working. Newly loaded assets will not be cached until the app is reopened.'
            )) {
                return;
            }

            deleteAssetsCacheButton.disabled = true;
            assetCacheStatus.textContent = 'Deleting saved asset cache...';
            try {
                const wasDeleted = await persistentAssetCache.clear({
                    disableWrites: true
                });
                if (!wasDeleted) {
                    throw new Error('The browser could not delete the saved asset cache.');
                }
                assetCacheStatus.textContent = 'Saved asset cache deleted.';
            } catch (error) {
                assetCacheStatus.textContent =
                    `Could not delete the asset cache: ${error.message}`;
                console.error('Unable to delete the persistent asset cache.', error);
            } finally {
                deleteAssetsCacheButton.disabled = false;
            }
        });
        recoverAudioButton.addEventListener('click', async () => {
            recoverAudioButton.disabled = true;
            recoverAudioButton.textContent = 'Activating audio...';
            audioRecoveryStatus.textContent = '';
            try {
                await warmUpGameAudio();
                await preloadGameSounds();
                assertAllGameSoundsLoaded();

                setGameSoundsMuted(false);
                startAudioKeepAlive();
                flushPendingSoundEffects();
                if (isSimulationActive && !isGameOver) {
                    updateMovementAudio();
                }
                scheduleAudioIdleSuspension();
                audioRecoveryStatus.textContent = 'Audio enabled.';
            } catch (error) {
                console.error('Unable to enable game audio from settings.', error);
                audioRecoveryStatus.textContent = `Audio could not be enabled: ${error.message}`;
            } finally {
                recoverAudioButton.disabled = false;
                recoverAudioButton.textContent = 'Enable / retry audio';
            }
        });
        startLoadedLevelButton.addEventListener('click', async () => {
            startLoadedLevelButton.disabled = true;
            audioLoadingText.textContent = 'Activating game audio...';
            try {
                await warmUpGameAudio();
                audioLoadingDialog.classList.remove('visible');
                await startPreparedLevel();
            } catch (error) {
                console.error('Unable to start game audio.', error);
                audioLoadingText.classList.add('has-error');
                audioLoadingText.textContent =
                    'The browser could not activate audio. Retry, or start muted.';
                startLoadedLevelButton.disabled = false;
                startLoadedLevelButton.textContent = 'Retry audio';
            }
        });
        const startupAssetsModule = window.BC90EStartupAssets;
        if (!startupAssetsModule) {
            throw new Error('The startup assets module did not load.');
        }
        const startupAssets = startupAssetsModule.createStartupAssets({
            loading: initialAssetLoading,
            loadingLabel: initialAssetLoadingLabel,
            loadingProgress: initialAssetLoadingProgress,
            assetReport: initialAssetReport,
            retryButton: retryInitialAssetsButton,
            getLoadingAssetLabel,
            updateAssetProgress: () => window.updateAssetProgress(),
            ensureGameAssetsReady,
            failedTextureLoads,
            preloadGameSounds,
            failedSoundLoads,
            soundBuffers,
            soundFiles,
            ensureGameFontsReady,
            renderDiagnosticReport: renderAssetDiagnosticReport,
            setProgressPhase: (phase) => {
                startupAssetProgressPhase = phase;
            },
            startMenuIntro: () => {
                if (typeof window.BC90EStartMenu?.playStartMenuIntro !== 'function') {
                    throw new Error('The start menu module did not initialize.');
                }
                window.BC90EStartMenu.playStartMenuIntro();
            }
        });
        const { prepareStartupAssets } = startupAssets;
        retryInitialAssetsButton.addEventListener('click', () => {
            retryInitialAssetsButton.disabled = true;
            reloadAllAssets();
            retryFailedDocumentImages();
            void prepareStartupAssets().finally(() => {
                retryInitialAssetsButton.disabled = false;
            });
        });
        startMutedLevelButton.addEventListener('click', () => {
            audioLoadingDialog.classList.remove('visible');
            void startPreparedLevel(true);
        });
        retryGameAssetsButton.addEventListener('click', () => {
            retryGameAssetsButton.hidden = true;
            retryFailedDocumentImages();
            reloadAllAssets();
            showAudioLoadingScreen();
        });
        enableGameAudioButton.addEventListener('click', async () => {
            enableGameAudioButton.disabled = true;
            enableGameAudioButton.textContent = 'Enabling Audio...';
            try {
                await warmUpGameAudio();
                await preloadGameSounds();
                assertAllGameSoundsLoaded();

                setGameSoundsMuted(false);
                startAudioKeepAlive();
                flushPendingSoundEffects();
                enableGameAudioButton.hidden = true;
                enableGameAudioButton.textContent = 'Enable Audio';
            } catch (error) {
                console.error('Unable to enable game audio.', error);
                enableGameAudioButton.textContent = 'Retry Audio';
                showMessage(`Audio could not be enabled: ${error.message}`);
            } finally {
                enableGameAudioButton.disabled = false;
            }
        });
        simulationButton.addEventListener('click', () => {
            simulationButton.classList.remove('is-triggered');
            void simulationButton.offsetWidth;
            simulationButton.classList.add('is-triggered');
            if (isSimulationActive) {
                stopSimulation();
            } else if (!audioLoadingScreenShown) {
                showAudioLoadingScreen();
            } else {
                startSimulation();
            }
        });
        createTileSelector();
        canvasControlsLayout.initialize();
        document.addEventListener('input', (event) => {
            if (event.target.closest?.('.app-shell')) {
                hasUnsavedLevelChanges = true;
            }
        });
        document.addEventListener('change', (event) => {
            if (event.target.closest?.('.app-shell')) {
                hasUnsavedLevelChanges = true;
            }
        });
        enemySpawnOrderEditor.addEventListener('pointerdown', () => {
            hasUnsavedLevelChanges = true;
        });
        addEnemySpawnOrderButton.addEventListener('click', () => {
            hasUnsavedLevelChanges = true;
        });
        canvas.addEventListener('pointerdown', () => {
            if (!isSimulationActive) {
                hasUnsavedLevelChanges = true;
            }
        });
        window.addEventListener('beforeunload', (event) => {
            if (!hasUnsavedLevelChanges) {
                return;
            }
            event.preventDefault();
            event.returnValue = '';
        });
        resizeCanvas();
        window.requestAnimationFrame(renderFrame);
        void prepareStartupAssets();
    