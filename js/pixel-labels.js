(function (global) {
    'use strict';

    const LETTER_GLYPHS = {
        A: ['010', '101', '111', '101', '101'],
        B: ['110', '101', '110', '101', '110'],
        C: ['011', '100', '100', '100', '011'],
        E: ['111', '100', '110', '100', '111'],
        R: ['110', '101', '110', '101', '101'],
        S: ['011', '100', '010', '001', '110'],
        '1': ['010', '110', '010', '010', '111'],
        '2': ['110', '001', '010', '100', '111'],
        '3': ['110', '001', '010', '001', '110'],
        '4': ['101', '101', '111', '001', '001'],
        '5': ['111', '100', '110', '001', '110'],
        '6': ['011', '100', '110', '101', '010'],
        '7': ['111', '001', '010', '010', '010'],
        '8': ['010', '101', '010', '101', '010']
    };

    function createPixelLabels() {
        const canvases = new Map();

        function getCanvas(label) {
            if (!label) {
                return null;
            }

            let canvas = canvases.get(label);
            if (canvas) {
                return canvas;
            }

            canvas = document.createElement('canvas');
            canvas.width = 8;
            canvas.height = 8;
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('Could not create a pixel label canvas context.');
            }
            const glyphs = Array.from(
                label,
                (letter) => LETTER_GLYPHS[letter] ?? LETTER_GLYPHS['1']
            );
            const glyphWidth = 3;
            const glyphGap = 1;
            const labelWidth = label.length * glyphWidth + (label.length - 1) * glyphGap;
            const offsetX = Math.floor((8 - labelWidth) / 2);

            context.fillStyle = '#ffffff';
            glyphs.forEach((glyph, glyphIndex) => {
                for (let row = 0; row < glyph.length; row += 1) {
                    for (let column = 0; column < glyphWidth; column += 1) {
                        if (glyph[row][column] === '1') {
                            context.fillRect(
                                offsetX + glyphIndex * (glyphWidth + glyphGap) + column,
                                row + 1,
                                1,
                                1
                            );
                        }
                    }
                }
            });

            canvases.set(label, canvas);
            return canvas;
        }

        function draw(label, tileX, tileY, tileWidth, tileHeight, targetContext) {
            const canvas = getCanvas(label);
            if (!canvas) {
                return;
            }

            targetContext.save();
            targetContext.imageSmoothingEnabled = false;
            targetContext.drawImage(canvas, tileX, tileY, tileWidth, tileHeight);
            targetContext.restore();
        }

        return Object.freeze({ getCanvas, draw });
    }

    global.BC90EPixelLabels = Object.freeze({ createPixelLabels });
})(window);
