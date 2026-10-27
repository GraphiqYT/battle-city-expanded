(function (global) {
    'use strict';

    function createDebugControlsUi({
        debugSettingsRow,
        debugToggleButton,
        enemyDebugPanel,
        enemyDebugToggleButton,
        hitboxToggleButton,
        slowMotionButton,
        defeatAllEnemiesButton,
        slowMotionScaleInput,
        playerTextureRowInput,
        playerTextureTypeInput,
        setToggleButtonState,
        getDebugEnabled,
        setDebugEnabled,
        getEnemyDebugEnabled,
        setEnemyDebugEnabled,
        getHitboxesVisible,
        setHitboxesVisible,
        getSlowMotionEnabled,
        setSlowMotionEnabled,
        defeatAllActiveEnemies,
        setSlowMotionTimeScale,
        refreshEnemyDebugPanel,
        loadPlayerTextures,
        setPlayerTextureRow,
        setPlayerTextureType,
        settings
    }) {
        let savedFeatureSettings = null;

        function captureFeatureSettings() {
            return {
                enemyEnabled: getEnemyDebugEnabled(),
                hitboxes: getHitboxesVisible(),
                slowMotion: getSlowMotionEnabled(),
                slowMotionScale: Number(slowMotionScaleInput.value),
                playerTextureRow: Number(playerTextureRowInput.value),
                playerTextureType: playerTextureTypeInput.value
            };
        }

        function applyFeatureSettings(featureSettings) {
            setEnemyDebugEnabled(featureSettings.enemyEnabled);
            setHitboxesVisible(featureSettings.hitboxes);
            setSlowMotionEnabled(featureSettings.slowMotion);
            setSlowMotionTimeScale(featureSettings.slowMotionScale);
            slowMotionScaleInput.value = String(featureSettings.slowMotionScale);
            setPlayerTextureRow(featureSettings.playerTextureRow);
            playerTextureRowInput.value = String(featureSettings.playerTextureRow);
            setPlayerTextureType(featureSettings.playerTextureType);
            playerTextureTypeInput.value = featureSettings.playerTextureType;
            loadPlayerTextures();
        }

        function setDebugModeEnabled(enabled) {
            if (enabled) {
                setDebugEnabled(true);
                applyFeatureSettings(savedFeatureSettings);
                return;
            }

            savedFeatureSettings = captureFeatureSettings();
            setDebugEnabled(false);
            setEnemyDebugEnabled(false);
            setHitboxesVisible(false);
            setSlowMotionEnabled(false);
            setPlayerTextureRow(0);
            playerTextureRowInput.value = '0';
            setPlayerTextureType('a');
            playerTextureTypeInput.value = 'a';
            loadPlayerTextures();
        }

        function update() {
            const isDebugEnabled = getDebugEnabled();
            debugSettingsRow.hidden = !isDebugEnabled;
            debugToggleButton.textContent = `Debug: ${isDebugEnabled ? 'ON' : 'OFF'}`;
            setToggleButtonState(debugToggleButton, isDebugEnabled);
            enemyDebugToggleButton.textContent =
                `Enemy Debug: ${getEnemyDebugEnabled() ? 'ON' : 'OFF'}`;
            setToggleButtonState(enemyDebugToggleButton, getEnemyDebugEnabled());
            hitboxToggleButton.textContent =
                `Hitboxes: ${getHitboxesVisible() ? 'ON' : 'OFF'}`;
            setToggleButtonState(hitboxToggleButton, getHitboxesVisible());
            slowMotionButton.textContent =
                `Slow Motion: ${getSlowMotionEnabled() ? 'ON' : 'OFF'}`;
            setToggleButtonState(slowMotionButton, getSlowMotionEnabled());

            if (!isDebugEnabled) {
                enemyDebugPanel.hidden = true;
                enemyDebugPanel.textContent = '';
            }
        }

        function initialize({ allowDebug = true } = {}) {
            if (!allowDebug) {
                setDebugEnabled(false);
                setEnemyDebugEnabled(false);
                setHitboxesVisible(false);
                setSlowMotionEnabled(false);
                enemyDebugPanel.hidden = true;
                enemyDebugPanel.textContent = '';
                debugToggleButton.closest('details.settings-section').hidden = true;
                debugSettingsRow.hidden = true;
                return;
            }

            const savedDebug = settings.readPreference('debugSettings', {});
            if (savedDebug && typeof savedDebug === 'object') {
                setDebugEnabled(savedDebug.enabled === true);
                setEnemyDebugEnabled(savedDebug.enemyEnabled === true);
                setHitboxesVisible(savedDebug.hitboxes === true);
                setSlowMotionEnabled(savedDebug.slowMotion === true);
                const slowMotionScale = Number(savedDebug.slowMotionScale);
                if (Number.isFinite(slowMotionScale)) {
                    slowMotionScaleInput.value = String(
                        Math.min(1, Math.max(0, slowMotionScale))
                    );
                    setSlowMotionTimeScale(Number(slowMotionScaleInput.value));
                }
                const playerTextureRow = Number(savedDebug.playerTextureRow);
                if (Number.isInteger(playerTextureRow)) {
                    playerTextureRowInput.value = String(
                        Math.min(10, Math.max(0, playerTextureRow))
                    );
                    setPlayerTextureRow(Number(playerTextureRowInput.value));
                }
                if (typeof savedDebug.playerTextureType === 'string') {
                    const textureType = [
                        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'
                    ].includes(savedDebug.playerTextureType)
                        ? savedDebug.playerTextureType
                        : 'a';
                    playerTextureTypeInput.value = textureType;
                    setPlayerTextureType(textureType);
                }
            }

            savedFeatureSettings = captureFeatureSettings();
            if (!getDebugEnabled()) {
                setEnemyDebugEnabled(false);
                setHitboxesVisible(false);
                setSlowMotionEnabled(false);
                setPlayerTextureRow(0);
                playerTextureRowInput.value = '0';
                setPlayerTextureType('a');
                playerTextureTypeInput.value = 'a';
                loadPlayerTextures();
            }

            function saveDebugSettings() {
                const featureSettings = getDebugEnabled()
                    ? captureFeatureSettings()
                    : savedFeatureSettings;
                settings.writePreference('debugSettings', {
                    enabled: getDebugEnabled(),
                    ...featureSettings
                });
            }

            update();

            debugToggleButton.addEventListener('click', () => {
                setDebugModeEnabled(!getDebugEnabled());
                update();
                saveDebugSettings();
            });
            enemyDebugToggleButton.addEventListener('click', () => {
                if (!getDebugEnabled()) {
                    setDebugModeEnabled(true);
                }
                setEnemyDebugEnabled(!getEnemyDebugEnabled());
                savedFeatureSettings = captureFeatureSettings();
                update();
                refreshEnemyDebugPanel();
                saveDebugSettings();
            });
            hitboxToggleButton.addEventListener('click', () => {
                setHitboxesVisible(!getHitboxesVisible());
                savedFeatureSettings = captureFeatureSettings();
                update();
                saveDebugSettings();
            });
            slowMotionButton.addEventListener('click', () => {
                setSlowMotionEnabled(!getSlowMotionEnabled());
                savedFeatureSettings = captureFeatureSettings();
                update();
                saveDebugSettings();
            });
            defeatAllEnemiesButton.addEventListener('click', defeatAllActiveEnemies);
            slowMotionScaleInput.addEventListener('change', () => {
                const requestedScale = Number.parseFloat(slowMotionScaleInput.value);
                const slowMotionTimeScale = Number.isFinite(requestedScale)
                    ? Math.min(1, Math.max(0, requestedScale))
                    : 0.35;
                setSlowMotionTimeScale(slowMotionTimeScale);
                slowMotionScaleInput.value = String(slowMotionTimeScale);
                savedFeatureSettings = captureFeatureSettings();
                saveDebugSettings();
            });
            playerTextureRowInput.addEventListener('change', () => {
                const playerTextureRow = Math.min(
                    10,
                    Math.max(0, Number.parseInt(playerTextureRowInput.value, 10) || 0)
                );
                setPlayerTextureRow(playerTextureRow);
                playerTextureRowInput.value = String(playerTextureRow);
                loadPlayerTextures();
                savedFeatureSettings = captureFeatureSettings();
                saveDebugSettings();
            });
            playerTextureTypeInput.addEventListener('change', () => {
                const playerTextureType = [
                    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'
                ].includes(playerTextureTypeInput.value)
                    ? playerTextureTypeInput.value
                    : 'a';
                setPlayerTextureType(playerTextureType);
                playerTextureTypeInput.value = playerTextureType;
                loadPlayerTextures();
                savedFeatureSettings = captureFeatureSettings();
                saveDebugSettings();
            });
        }

        return Object.freeze({ initialize, update });
    }

    global.BC90EDebugControlsUi = Object.freeze({ createDebugControlsUi });
})(window);
