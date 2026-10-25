(function (global) {
    'use strict';

    function createEditorViewControlsUi({
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
        getGridVisible,
        setGridVisible,
        getTileTexturesVisible,
        setTileTexturesVisible,
        getTileNamesVisible,
        setTileNamesVisible,
        getTouchControlsEnabled,
        setTouchControlsEnabled,
        getCanvasModeControlsVisible,
        setCanvasModeControlsVisible,
        getMapZoomControlsVisible,
        setMapZoomControlsVisible,
        getMapZoomInputVisible,
        getPanModeEnabled,
        setPanModeEnabled,
        updateMapZoomInputVisibility,
        updateTileSelectorTextures,
        updateZoomButtonLabels,
        updateTouchControlsVisibility,
        clearGameInputState,
        resizeCanvas
    }) {
        function initialize() {
            const isGridVisible = getGridVisible();
            const areTileTexturesVisible = getTileTexturesVisible();
            const areTouchControlsEnabled = getTouchControlsEnabled();
            const areCanvasModeControlsVisible = getCanvasModeControlsVisible();
            const areMapZoomControlsVisible = getMapZoomControlsVisible();

            setToggleButtonState(gridToggleButton, isGridVisible);
            setToggleButtonState(tileTextureToggle, areTileTexturesVisible);
            setToggleButtonState(mobileControlsToggleButton, areTouchControlsEnabled);
            setToggleButtonState(
                canvasModeControlsToggleButton,
                areCanvasModeControlsVisible
            );
            gridToggleButton.textContent = `Show Grid: ${isGridVisible ? 'ON' : 'OFF'}`;
            gridToggleButton.setAttribute('aria-pressed', String(isGridVisible));
            canvasModeControlsToggleButton.textContent =
                `Canvas tools: ${areCanvasModeControlsVisible ? 'ON' : 'OFF'}`;
            canvasModeControlsToggleButton.setAttribute(
                'aria-pressed',
                String(areCanvasModeControlsVisible)
            );
            canvasModeControls.hidden = !areCanvasModeControlsVisible;
            setToggleButtonState(
                mapZoomControlsToggleButton,
                areMapZoomControlsVisible
            );
            mapZoomControlsToggleButton.textContent =
                `Map zoom: ${areMapZoomControlsVisible ? 'ON' : 'OFF'}`;
            mapZoomControlsToggleButton.setAttribute(
                'aria-pressed',
                String(areMapZoomControlsVisible)
            );
            mapZoomControls.hidden = !areMapZoomControlsVisible;
            mapZoomInputVisibleInput.checked = getMapZoomInputVisible();
            updateMapZoomInputVisibility();
            editorLayout.classList.toggle(
                'zoom-controls-hidden',
                !areMapZoomControlsVisible
            );

            gridToggleButton.addEventListener('click', () => {
                const isGridVisible = !getGridVisible();
                setGridVisible(isGridVisible);
                gridToggleButton.textContent =
                    `Show Grid: ${isGridVisible ? 'ON' : 'OFF'}`;
                gridToggleButton.setAttribute('aria-pressed', String(isGridVisible));
                setToggleButtonState(gridToggleButton, isGridVisible);
            });
            tileTextureToggle.addEventListener('click', () => {
                const areTileTexturesVisible = !getTileTexturesVisible();
                setTileTexturesVisible(areTileTexturesVisible);
                document.body.classList.toggle(
                    'tile-textures-mode',
                    areTileTexturesVisible
                );
                tileTextureToggle.textContent =
                    `Tile textures: ${areTileTexturesVisible ? 'ON' : 'OFF'}`;
                setToggleButtonState(tileTextureToggle, areTileTexturesVisible);
                updateTileSelectorTextures(undefined, true);
            });
            tileNameToggle.addEventListener('click', () => {
                const isTileNamesVisible = !getTileNamesVisible();
                setTileNamesVisible(isTileNamesVisible);
                document.body.classList.toggle(
                    'tile-names-mode',
                    isTileNamesVisible
                );
                tileNameToggle.textContent =
                    `Tile name: ${isTileNamesVisible ? 'ON' : 'OFF'}`;
                setToggleButtonState(tileNameToggle, isTileNamesVisible);
                updateZoomButtonLabels();
            });
            mobileControlsToggleButton.addEventListener('click', () => {
                const areTouchControlsEnabled = !getTouchControlsEnabled();
                setTouchControlsEnabled(areTouchControlsEnabled);
                mobileControlsToggleButton.textContent =
                    `Touch Controls: ${areTouchControlsEnabled ? 'ON' : 'OFF'}`;
                mobileControlsToggleButton.setAttribute(
                    'aria-pressed',
                    String(areTouchControlsEnabled)
                );
                setToggleButtonState(
                    mobileControlsToggleButton,
                    areTouchControlsEnabled
                );
                updateTouchControlsVisibility();
                if (!areTouchControlsEnabled) {
                    clearGameInputState();
                }
            });
            canvasModeControlsToggleButton.addEventListener('click', () => {
                const areCanvasModeControlsVisible =
                    !getCanvasModeControlsVisible();
                setCanvasModeControlsVisible(areCanvasModeControlsVisible);
                canvasModeControls.hidden = !areCanvasModeControlsVisible;
                canvasModeControlsToggleButton.textContent =
                    `Canvas tools: ${areCanvasModeControlsVisible ? 'ON' : 'OFF'}`;
                canvasModeControlsToggleButton.setAttribute(
                    'aria-pressed',
                    String(areCanvasModeControlsVisible)
                );
                setToggleButtonState(
                    canvasModeControlsToggleButton,
                    areCanvasModeControlsVisible
                );
                resizeCanvas();
            });
            mapZoomControlsToggleButton.addEventListener('click', () => {
                const areMapZoomControlsVisible = !getMapZoomControlsVisible();
                setMapZoomControlsVisible(areMapZoomControlsVisible);
                mapZoomControls.hidden = !areMapZoomControlsVisible;
                editorLayout.classList.toggle(
                    'zoom-controls-hidden',
                    !areMapZoomControlsVisible
                );
                mapZoomControlsToggleButton.textContent =
                    `Map zoom: ${areMapZoomControlsVisible ? 'ON' : 'OFF'}`;
                mapZoomControlsToggleButton.setAttribute(
                    'aria-pressed',
                    String(areMapZoomControlsVisible)
                );
                setToggleButtonState(
                    mapZoomControlsToggleButton,
                    areMapZoomControlsVisible
                );
                resizeCanvas();
            });
            mapZoomInputVisibleInput.addEventListener(
                'change',
                updateMapZoomInputVisibility
            );
            mapZoomButtonSizeInput.addEventListener('change', resizeCanvas);
            canvasToolButtonSizeInput.addEventListener('change', resizeCanvas);
        }

        function bindPanModeButton(panModeButton) {
            panModeButton.addEventListener('click', () => {
                setPanModeEnabled(!getPanModeEnabled());
            });
        }

        return Object.freeze({ initialize, bindPanModeButton });
    }

    global.BC90EEditorViewControlsUi = Object.freeze({
        createEditorViewControlsUi
    });
})(window);
