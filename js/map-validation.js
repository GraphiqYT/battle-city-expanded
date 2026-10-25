(function (global) {
    'use strict';

    function createMapValidation({
        restrictedTileIds,
        airTileId,
        isMultiCellElement,
        getElementFootprintSize,
        getElementFootprint
    }) {
        function createTileCounters() {
            return Object.fromEntries(
                restrictedTileIds.map((tileId) => [tileId, 0])
            );
        }

        function countRestrictedTiles(grid) {
            const counters = createTileCounters();
            grid.forEach((row) => {
                row.forEach((tileId) => {
                    if (Object.hasOwn(counters, tileId)) {
                        counters[tileId] += 1;
                    }
                });
            });
            return counters;
        }

        function validateLargeTileFootprints(grid, width, height) {
            for (let row = 0; row < height; row += 1) {
                for (let column = 0; column < width; column += 1) {
                    const tileId = grid[row][column];
                    if (!isMultiCellElement(tileId)) {
                        continue;
                    }

                    const { width: footprintWidth, height: footprintHeight } =
                        getElementFootprintSize(tileId);
                    if (
                        row + footprintHeight > height ||
                        column + footprintWidth > width
                    ) {
                        return false;
                    }

                    for (const cell of getElementFootprint(row, column, tileId)) {
                        if (
                            (cell.row !== row || cell.column !== column) &&
                            grid[cell.row][cell.column] !== airTileId
                        ) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        return Object.freeze({
            createTileCounters,
            countRestrictedTiles,
            validateLargeTileFootprints
        });
    }

    global.BC90EMapValidation = Object.freeze({ createMapValidation });
})(window);
