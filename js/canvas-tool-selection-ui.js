(function (global) {
    'use strict';

    function createCanvasToolSelectionUi({
        canvasModeControls,
        tileSelector,
        tileSelectorButtons,
        roadTileIds,
        getSelectionState,
        updateRouteVariantSelection
    }) {
        function update() {
            const {
                isPanModeEnabled,
                selectedTileId,
                isEraserMode,
                isSelectionMode,
                isSquareMode,
                isFillMode
            } = getSelectionState();

            canvasModeControls
                .querySelector('[data-mouse-mode]')
                ?.classList.toggle(
                    'selected',
                    !isPanModeEnabled && selectedTileId === null &&
                        !isEraserMode && !isSelectionMode && !isSquareMode && !isFillMode
                );
            canvasModeControls
                .querySelector('[data-selection-mode]')
                ?.classList.toggle('selected', isSelectionMode);
            canvasModeControls
                .querySelector('[data-eraser-mode]')
                ?.classList.toggle('selected', isEraserMode);
            canvasModeControls
                .querySelector('[data-square-mode]')
                ?.classList.toggle('selected', isSquareMode);
            canvasModeControls
                .querySelector('[data-fill-mode]')
                ?.classList.toggle('selected', isFillMode);

            tileSelectorButtons.forEach((button, tileId) => {
                button.classList.toggle('selected', selectedTileId === tileId);
            });
            const routeFamilyButton = tileSelector.querySelector('.route-family-button');
            routeFamilyButton?.setAttribute(
                'aria-pressed',
                String(roadTileIds.has(selectedTileId))
            );
            updateRouteVariantSelection();
        }

        return Object.freeze({ update });
    }

    global.BC90ECanvasToolSelectionUi = Object.freeze({
        createCanvasToolSelectionUi
    });
})(window);
