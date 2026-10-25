(function (global) {
    'use strict';

    function createCanvasControlsLayout({
        tileSelector,
        canvasModeControls,
        mapZoomControls,
        canvasToolButtonSizeInput,
        mapZoomButtonSizeInput,
        worldTileSize,
        isTileTexturesVisible,
        resizeCanvas
    }) {
        function syncSize() {
            const canvasToolScale = Number(canvasToolButtonSizeInput.value) || 2;
            const zoomButtonScale = Number(mapZoomButtonSizeInput.value) || 2;
            const tileButton = tileSelector.querySelector('.tile-button');
            const tileButtonBounds = tileButton?.getBoundingClientRect();
            const displayedTileSize = tileButtonBounds?.width > 0 &&
                tileButtonBounds?.height > 0 &&
                isTileTexturesVisible()
                ? Math.min(tileButtonBounds.width, tileButtonBounds.height)
                : worldTileSize * 2;
            const canvasToolSize = displayedTileSize * canvasToolScale / 2;

            canvasModeControls.style.setProperty(
                '--canvas-tool-size',
                `${canvasToolSize}px`
            );
            canvasModeControls.style.setProperty(
                '--canvas-tool-label-size',
                `${Math.min(10, Math.max(6, canvasToolSize * 0.3))}px`
            );
            mapZoomControls.style.setProperty(
                '--map-zoom-button-size',
                `${displayedTileSize * zoomButtonScale / 2}px`
            );
        }

        function initialize() {
            syncSize();
            if (typeof global.ResizeObserver === 'function') {
                new global.ResizeObserver(() => {
                    syncSize();
                    resizeCanvas();
                }).observe(tileSelector);
            }
            global.addEventListener('resize', syncSize);
        }

        return Object.freeze({ syncSize, initialize });
    }

    global.BC90ECanvasControlsLayout = Object.freeze({ createCanvasControlsLayout });
})(window);
