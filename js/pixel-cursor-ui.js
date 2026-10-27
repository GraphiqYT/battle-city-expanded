(function (global) {
    'use strict';

    function createPixelCursorUi({
        image,
        sizeInput,
        canvas,
        uiTextureDirectory,
        getCanvasCursorState,
        isSimulationActive,
        isMovingElement,
        settings
    }) {
        const texturePaths = {
            normal: `${uiTextureDirectory}Mouse-00.png`,
            selectable: `${uiTextureDirectory}Mouse-01.png`,
            pressed: `${uiTextureDirectory}Mouse-02.png`,
            draw: `${uiTextureDirectory}Mouse-03.png`,
            erase: `${uiTextureDirectory}Mouse-04.png`,
            move: `${uiTextureDirectory}Mouse-01.png`,
            objectMove: `${uiTextureDirectory}Mouse-02.png`
        };
        const unavailableStates = new Set();
        const savedCursor = settings.readPreference('pixelCursor', {});
        const savedCursorSettings = savedCursor && typeof savedCursor === 'object'
            ? savedCursor
            : {};
        let enabled = savedCursorSettings.enabled === true;
        let pressed = false;
        let state = 'normal';
        let size = Number.isFinite(savedCursorSettings.size)
            ? Math.min(96, Math.max(8, savedCursorSettings.size))
            : 24;

        function setState(requestedState) {
            if (!enabled) {
                return;
            }

            const nextState = unavailableStates.has(requestedState)
                ? 'normal'
                : requestedState;
            if (state === nextState) {
                return;
            }

            state = nextState;
            image.src = texturePaths[nextState];
        }

        function setSize(requestedSize) {
            size = Math.min(96, Math.max(8, requestedSize));
            image.style.width = `${size}px`;
            image.style.height = `${size}px`;
            sizeInput.value = String(size);
            settings.writePreference('pixelCursor', { enabled, size });
        }

        function isSelectableTarget(target) {
            return target instanceof global.Element && Boolean(
                target.closest('button, a, input, select, textarea, [role="button"]')
            );
        }

        function getPointerState(target) {
            if (target === canvas) {
                return getCanvasCursorState();
            }
            return isSelectableTarget(target) ? 'selectable' : 'normal';
        }

        image.addEventListener('error', () => {
            unavailableStates.add(state);
            state = 'normal';
            image.src = texturePaths.normal;
        });

        document.addEventListener('mousemove', (event) => {
            image.style.left = `${event.clientX}px`;
            image.style.top = `${event.clientY}px`;
            if (!pressed) {
                setState(getPointerState(event.target));
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (event.button !== 0 && event.button !== 2) {
                return;
            }

            pressed = true;
            if (event.target === canvas && !isSimulationActive()) {
                setState(event.button === 2
                    ? 'erase'
                    : isMovingElement() ? 'objectMove' : 'draw');
            } else {
                setState('pressed');
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (event.button !== 0 && event.button !== 2) {
                return;
            }

            pressed = false;
            setState(getPointerState(event.target));
        });

        sizeInput.addEventListener('change', () => {
            const requestedSize = Number.parseInt(sizeInput.value, 10);
            setSize(Number.isFinite(requestedSize) ? requestedSize : 24);
        });

        function setEnabled(value) {
            enabled = Boolean(value);
            settings.writePreference('pixelCursor', { enabled, size });
        }

        function getTexturePath() {
            return texturePaths[state] ?? texturePaths.normal;
        }

        function setSource(source) {
            image.src = source;
        }

        return Object.freeze({
            setEnabled,
            isEnabled: () => enabled,
            setState,
            setSize,
            getTexturePath,
            setSource
        });
    }

    global.BC90EPixelCursorUi = Object.freeze({ createPixelCursorUi });
})(window);
