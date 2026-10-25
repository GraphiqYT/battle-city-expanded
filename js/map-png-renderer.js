(function (global) {
    'use strict';

    function createMapPngRenderer({
        getMapState,
        tileIds,
        backgroundColor,
        brickTileIds,
        roadTileIds,
        tileColors,
        solidBlockId,
        getExportTileTexture,
        createAirFloorPattern,
        isMultiCellElement,
        getElementFootprint,
        getElementFootprintSize,
        drawRouteTexture
    }) {
        function renderMap(tileSize) {
            const { mapGrid, mapWidth, mapHeight } = getMapState();
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = mapWidth * tileSize;
            outputCanvas.height = mapHeight * tileSize;
            const outputContext = outputCanvas.getContext('2d');
            if (!outputContext) {
                throw new Error('The browser could not create an image canvas.');
            }
            outputContext.imageSmoothingEnabled = false;
            outputContext.fillStyle = backgroundColor;
            outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

            const airPattern = createAirFloorPattern(
                outputContext,
                getExportTileTexture(tileIds.AIR),
                tileSize,
                tileSize
            );
            if (airPattern) {
                outputContext.fillStyle = airPattern;
                outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
            }

            const coveredCells = new Set();
            for (let row = 0; row < mapHeight; row += 1) {
                for (let column = 0; column < mapWidth; column += 1) {
                    const tileId = mapGrid[row][column];
                    if (!isMultiCellElement(tileId)) {
                        continue;
                    }
                    for (const cell of getElementFootprint(row, column, tileId)) {
                        if (cell.row !== row || cell.column !== column) {
                            coveredCells.add(`${cell.row},${cell.column}`);
                        }
                    }
                }
            }

            const tileTexturesForExport = new Map();
            for (let row = 0; row < mapHeight; row += 1) {
                for (let column = 0; column < mapWidth; column += 1) {
                    const tileId = mapGrid[row][column];
                    if (
                        tileId === tileIds.AIR ||
                        coveredCells.has(`${row},${column}`)
                    ) {
                        continue;
                    }

                    const x = column * tileSize;
                    const y = row * tileSize;
                    const { width: footprintWidth, height: footprintHeight } =
                        getElementFootprintSize(tileId);
                    const width = footprintWidth * tileSize;
                    const height = footprintHeight * tileSize;

                    if (tileId === tileIds.SOLID_EMPTY) {
                        outputContext.fillStyle = backgroundColor;
                        outputContext.fillRect(x, y, width, height);
                        continue;
                    }

                    let texture;
                    if (!tileTexturesForExport.has(tileId)) {
                        texture = getExportTileTexture(tileId);
                        tileTexturesForExport.set(tileId, texture);
                    } else {
                        texture = tileTexturesForExport.get(tileId);
                    }

                    if (brickTileIds.has(tileId)) {
                        if (texture) {
                            outputContext.drawImage(texture, x, y, width, height);
                        } else {
                            outputContext.fillStyle =
                                tileColors[tileId] ?? tileColors[solidBlockId];
                            outputContext.fillRect(x, y, width, height);
                        }
                    } else if (texture && roadTileIds.has(tileId)) {
                        drawRouteTexture(
                            outputContext,
                            texture,
                            tileId,
                            x,
                            y,
                            width,
                            height
                        );
                    } else if (texture) {
                        outputContext.drawImage(texture, x, y, width, height);
                    } else {
                        outputContext.fillStyle =
                            tileColors[tileId] ?? tileColors[tileIds.AIR];
                        outputContext.fillRect(x, y, width, height);
                    }
                }
            }

            return outputCanvas;
        }

        return Object.freeze({ renderMap });
    }

    global.BC90EMapPngRenderer = Object.freeze({ createMapPngRenderer });
})(window);
