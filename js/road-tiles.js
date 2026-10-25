(function (global) {
    'use strict';

    const ROAD_STRAIGHT_DASHED_ID = 18;
    const ROAD_TILE_DEFINITIONS = [
        { id: ROAD_STRAIGHT_DASHED_ID, name: 'Dashed', file: 'road_straight_dashed.png', category: 'straight', width: 2, height: 1 },
        { id: 19, name: 'Mixed left', file: 'road_straight_mixed_left.png', category: 'straight', width: 2, height: 1 },
        { id: 20, name: 'Mixed right', file: 'road_straight_mixed_right.png', category: 'straight', width: 2, height: 1 },
        { id: 21, name: 'Double', file: 'road_straight_double.png', category: 'straight', width: 2, height: 1 },
        { id: 22, name: 'Plain', file: 'road_straight_plain.png', category: 'straight', width: 2, height: 1 },
        { id: 23, name: 'Curve double', file: 'road_l_curve_double.png', category: 'l', width: 2, height: 2 },
        { id: 24, name: 'Curve plain', file: 'road_l_curve_plain.png', category: 'l', width: 2, height: 2 },
        { id: 25, name: 'Straight double', file: 'road_l_straight_double.png', category: 'l', width: 2, height: 2 },
        { id: 26, name: 'Straight plain', file: 'road_l_straight_plain.png', category: 'l', width: 2, height: 2 },
        { id: 27, name: 'Curve double', file: 'road_t_curve_double.png', category: 't', width: 2, height: 2 },
        { id: 28, name: 'Curve plain', file: 'road_t_curve_plain.png', category: 't', width: 2, height: 2 },
        { id: 29, name: 'Straight double', file: 'road_t_straight_double.png', category: 't', width: 2, height: 2 },
        { id: 30, name: 'Straight plain', file: 'road_t_straight_plain.png', category: 't', width: 2, height: 2 },
        { id: 31, name: 'Curve double', file: 'road_x_curve_double.png', category: 'x', width: 2, height: 2 },
        { id: 32, name: 'Curve plain', file: 'road_x_curve_plain.png', category: 'x', width: 2, height: 2 },
        { id: 33, name: 'Straight double', file: 'road_x_straight_double.png', category: 'x', width: 2, height: 2 },
        { id: 34, name: 'Straight plain', file: 'road_x_straight_plain.png', category: 'x', width: 2, height: 2 },
        { id: 74, name: 'Crosswalk', file: 'road_straight_crosswalk.png', category: 'straight', width: 2, height: 1 }
    ];
    const ROAD_TILE_STATE_BY_ID = new Map();
    const ROAD_TILE_ID_BY_STATE = new Map();
    let nextRoadTileId = 35;

    ROAD_TILE_DEFINITIONS.forEach((definition) => {
        ROAD_TILE_STATE_BY_ID.set(definition.id, { definition, rotation: 0 });
        ROAD_TILE_ID_BY_STATE.set(`${definition.id}:0`, definition.id);
        if (definition.category === 'x') {
            return;
        }

        for (let rotation = 1; rotation < 4; rotation += 1) {
            while (
                ROAD_TILE_STATE_BY_ID.has(nextRoadTileId) ||
                ROAD_TILE_DEFINITIONS.some(({ id }) => id === nextRoadTileId)
            ) {
                nextRoadTileId += 1;
            }
            const tileId = nextRoadTileId++;
            ROAD_TILE_STATE_BY_ID.set(tileId, { definition, rotation });
            ROAD_TILE_ID_BY_STATE.set(`${definition.id}:${rotation}`, tileId);
        }
    });

    const ROAD_TILE_IDS = new Set(ROAD_TILE_STATE_BY_ID.keys());
    const ROAD_TILE_FOOTPRINTS = new Map(
        Array.from(ROAD_TILE_STATE_BY_ID, ([id, { definition, rotation }]) => [
            id,
            rotation % 2 === 0
                ? { width: definition.width, height: definition.height }
                : { width: definition.height, height: definition.width }
        ])
    );

    global.BC90ERoadTiles = Object.freeze({
        ROAD_STRAIGHT_DASHED_ID,
        ROAD_TILE_DEFINITIONS,
        ROAD_TILE_STATE_BY_ID,
        ROAD_TILE_ID_BY_STATE,
        ROAD_TILE_IDS,
        ROAD_TILE_FOOTPRINTS
    });
})(window);
