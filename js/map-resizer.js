(function (global) {
    'use strict';

    function createMapResizer({
        widthInput,
        heightInput,
        maxDimension,
        airTileId,
        getMapState,
        createMap,
        validateFootprints,
        isSimulationActive,
        stopSimulation,
        showMessage,
        replaceMap,
        resetZoom,
        resizeCanvas
    }) {
        function resizeMap() {
            const nextWidth = Number(widthInput.value);
            const nextHeight = Number(heightInput.value);

            if (!Number.isInteger(nextWidth) || !Number.isInteger(nextHeight)) {
                showMessage(
                    'Width and height must be whole numbers.',
                    'bc90e-hide-message-canvas-integer'
                );
                return;
            }

            if (nextWidth < 4 || nextHeight < 4) {
                showMessage(
                    'The canvas minimum size is 4x4.',
                    'bc90e-hide-message-canvas-minimum'
                );
                return;
            }

            if (nextWidth > maxDimension || nextHeight > maxDimension) {
                showMessage(
                    `The canvas maximum size is ${maxDimension}x${maxDimension}.`,
                    'bc90e-hide-message-canvas-maximum'
                );
                return;
            }

            if (nextWidth > 32 || nextHeight > 32) {
                showMessage(
                    'Maps larger than 32x32 may run slower.',
                    'bc90e-hide-message-canvas-large'
                );
            }

            const { width, height, grid } = getMapState();
            const nextGrid = createMap(nextWidth, nextHeight, airTileId);

            for (let row = 0; row < Math.min(height, nextHeight); row += 1) {
                for (let column = 0; column < Math.min(width, nextWidth); column += 1) {
                    nextGrid[row][column] = grid[row][column];
                }
            }

            if (!validateFootprints(nextGrid, nextWidth, nextHeight)) {
                showMessage('The new dimensions would cut or overlap a 2x2 element.');
                return;
            }

            if (isSimulationActive()) {
                stopSimulation();
            }

            replaceMap(nextWidth, nextHeight, nextGrid);
            resetZoom();
            resizeCanvas();
        }

        return Object.freeze({ resizeMap });
    }

    global.BC90EMapResizer = Object.freeze({ createMapResizer });
})(window);
