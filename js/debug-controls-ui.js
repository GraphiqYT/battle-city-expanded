(function (global) {
    'use strict';

    function createDebugControlsUi({
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
        getDebugEnabled,
        setDebugEnabled,
        getEnemyDebugEnabled,
        setEnemyDebugEnabled,
        getHitboxesVisible,
        setHitboxesVisible,
        getSlowMotionEnabled,
        setSlowMotionEnabled,
        setSlowMotionTimeScale,
        refreshEnemyDebugPanel,
        loadPlayerTextures,
        setPlayerTextureRow,
        setPlayerTextureType
    }) {
        function update() {
            const isDebugEnabled = getDebugEnabled();
            debugSettingsRow.hidden = !isDebugEnabled;
            debugToggleButton.textContent = `Debug: ${isDebugEnabled ? 'ON' : 'OFF'}`;
            setToggleButtonState(debugToggleButton, isDebugEnabled);

            if (!isDebugEnabled) {
                enemyDebugPanel.hidden = true;
                enemyDebugPanel.textContent = '';
                setEnemyDebugEnabled(false);
                enemyDebugToggleButton.textContent = 'Enemy Debug: OFF';
                setToggleButtonState(enemyDebugToggleButton, false);
            }
        }

        function initialize() {
            setToggleButtonState(hitboxToggleButton, getHitboxesVisible());
            setToggleButtonState(slowMotionButton, getSlowMotionEnabled());
            setToggleButtonState(debugToggleButton, getDebugEnabled());

            debugToggleButton.addEventListener('click', () => {
                setDebugEnabled(!getDebugEnabled());
                update();
            });
            enemyDebugToggleButton.addEventListener('click', () => {
                if (!getDebugEnabled()) {
                    setDebugEnabled(true);
                    update();
                }
                const isEnemyDebugEnabled = !getEnemyDebugEnabled();
                setEnemyDebugEnabled(isEnemyDebugEnabled);
                enemyDebugToggleButton.textContent =
                    `Enemy Debug: ${isEnemyDebugEnabled ? 'ON' : 'OFF'}`;
                setToggleButtonState(enemyDebugToggleButton, isEnemyDebugEnabled);
                refreshEnemyDebugPanel();
            });
            hitboxToggleButton.addEventListener('click', () => {
                const areHitboxesVisible = !getHitboxesVisible();
                setHitboxesVisible(areHitboxesVisible);
                hitboxToggleButton.textContent =
                    `Hitboxes: ${areHitboxesVisible ? 'ON' : 'OFF'}`;
                setToggleButtonState(hitboxToggleButton, areHitboxesVisible);
            });
            slowMotionButton.addEventListener('click', () => {
                const isSlowMotionEnabled = !getSlowMotionEnabled();
                setSlowMotionEnabled(isSlowMotionEnabled);
                slowMotionButton.textContent =
                    `Slow Motion: ${isSlowMotionEnabled ? 'ON' : 'OFF'}`;
                setToggleButtonState(slowMotionButton, isSlowMotionEnabled);
            });
            slowMotionScaleInput.addEventListener('change', () => {
                const requestedScale = Number.parseFloat(slowMotionScaleInput.value);
                const slowMotionTimeScale = Number.isFinite(requestedScale)
                    ? Math.min(1, Math.max(0, requestedScale))
                    : 0.35;
                setSlowMotionTimeScale(slowMotionTimeScale);
                slowMotionScaleInput.value = String(slowMotionTimeScale);
            });
            playerTextureRowInput.addEventListener('change', () => {
                const playerTextureRow = Math.min(
                    10,
                    Math.max(0, Number.parseInt(playerTextureRowInput.value, 10) || 0)
                );
                setPlayerTextureRow(playerTextureRow);
                playerTextureRowInput.value = String(playerTextureRow);
                loadPlayerTextures();
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
            });
        }

        return Object.freeze({ initialize, update });
    }

    global.BC90EDebugControlsUi = Object.freeze({ createDebugControlsUi });
})(window);
