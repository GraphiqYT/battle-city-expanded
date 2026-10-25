(function (global) {
    'use strict';

    function createTouchControlsUi(context) {
        const {
            mobileGameControls,
            touchControlsPreview,
            touchControlsConfigurator,
            touchPreviewPad,
            touchPreviewFire,
            touchPadSizeInput,
            touchFireSizeInput,
            touchPadSizeValue,
            touchFireSizeValue,
            resetTouchControlsButton,
            touchControlsSettingsStatus,
            getSettings,
            setSettings,
            saveSettings,
            getDefaultSettings,
            isSimulationActive,
            areTouchControlsEnabled
        } = context;

        function applySettings() {
            const settings = getSettings();
            const pad = mobileGameControls.querySelector('.mobile-touch-pad');
            const fire = mobileGameControls.querySelector('[data-game-fire]');
            const pageScale = Number.parseFloat(
                getComputedStyle(document.documentElement)
                    .getPropertyValue('--touch-control-page-scale')
            ) || 1;
            const padSize = settings.padSize * pageScale;
            const fireSize = settings.fireSize * pageScale;
            const padGap = 4 * pageScale;
            const setPosition = (element, position, boundaryWidth, boundaryHeight,
                elementWidth, elementHeight) => {
                const minX = boundaryWidth
                    ? Math.min(50, elementWidth / boundaryWidth * 50)
                    : 0;
                const minY = boundaryHeight
                    ? Math.min(50, elementHeight / boundaryHeight * 50)
                    : 0;
                const x = Math.min(100 - minX, Math.max(minX, position.x));
                const y = Math.min(100 - minY, Math.max(minY, position.y));
                element.style.left = `${x}%`;
                element.style.top = `${y}%`;
                element.style.transform = 'translate(-50%, -50%)';
            };

            mobileGameControls.style.setProperty('--touch-pad-size', `${padSize}px`);
            mobileGameControls.style.setProperty('--touch-pad-gap', `${padGap}px`);
            mobileGameControls.style.setProperty('--touch-fire-size', `${fireSize}px`);

            const viewportWidth = global.visualViewport?.width || global.innerWidth;
            const viewportHeight = global.visualViewport?.height || global.innerHeight;
            const aspectRatio = viewportWidth / Math.max(1, viewportHeight);
            touchControlsPreview.style.setProperty(
                '--touch-screen-aspect-ratio',
                String(aspectRatio)
            );
            const previewMaxHeight = Math.min(280, Math.max(120, viewportHeight * 0.45));
            const targetPreviewWidth = Math.min(
                touchControlsConfigurator.clientWidth,
                previewMaxHeight * aspectRatio
            );
            touchControlsPreview.style.width = `${targetPreviewWidth}px`;
            touchControlsPreview.style.height =
                `${targetPreviewWidth / Math.max(0.1, aspectRatio)}px`;

            const previewWidth = touchControlsPreview.clientWidth;
            const previewHeight = touchControlsPreview.clientHeight;
            const previewScale = previewWidth / Math.max(1, viewportWidth);
            touchControlsPreview.style.setProperty(
                '--touch-preview-pad-size',
                `${Math.max(1, padSize * previewScale)}px`
            );
            touchControlsPreview.style.setProperty(
                '--touch-preview-pad-gap',
                `${Math.max(1, padGap * previewScale)}px`
            );
            touchControlsPreview.style.setProperty(
                '--touch-preview-fire-size',
                `${Math.max(1, fireSize * previewScale)}px`
            );

            const actualPadSize = padSize * 3 + padGap * 2;
            const previewPadSize = Math.max(1, padSize * previewScale);
            const previewPadGap = Math.max(1, padGap * previewScale);
            setPosition(
                pad,
                settings.pad,
                viewportWidth,
                viewportHeight,
                actualPadSize,
                actualPadSize
            );
            setPosition(
                fire,
                settings.fire,
                viewportWidth,
                viewportHeight,
                fireSize,
                fireSize
            );
            setPosition(
                touchPreviewPad,
                settings.pad,
                previewWidth,
                previewHeight,
                previewPadSize * 3 + previewPadGap * 2,
                previewPadSize * 3 + previewPadGap * 2
            );
            setPosition(
                touchPreviewFire,
                settings.fire,
                previewWidth,
                previewHeight,
                Math.max(1, fireSize * previewScale),
                Math.max(1, fireSize * previewScale)
            );
            touchPadSizeInput.value = String(settings.padSize);
            touchFireSizeInput.value = String(settings.fireSize);
            touchPadSizeValue.textContent = `${settings.padSize} px`;
            touchFireSizeValue.textContent = `${settings.fireSize} px`;
        }

        function updateVisibility(forceHidden = false) {
            const running = isSimulationActive();
            const controlsEnabled = areTouchControlsEnabled();
            mobileGameControls.hidden = forceHidden || !running || !controlsEnabled;
            document.body.classList.toggle(
                'touch-controls-running',
                running && controlsEnabled
            );
        }

        function bindDragging(element, settingName) {
            let dragPointerId = null;
            let dragOrigin = null;
            element.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                dragPointerId = event.pointerId;
                const bounds = element.getBoundingClientRect();
                const previewBounds = touchControlsPreview.getBoundingClientRect();
                dragOrigin = {
                    pointerX: event.clientX,
                    pointerY: event.clientY,
                    centerX: bounds.left + bounds.width / 2 - previewBounds.left,
                    centerY: bounds.top + bounds.height / 2 - previewBounds.top
                };
                element.setPointerCapture(event.pointerId);
            });
            element.addEventListener('pointermove', (event) => {
                if (dragPointerId !== event.pointerId || !dragOrigin) {
                    return;
                }
                const bounds = touchControlsPreview.getBoundingClientRect();
                const elementBounds = element.getBoundingClientRect();
                const halfWidth = Math.min(bounds.width / 2, elementBounds.width / 2);
                const halfHeight = Math.min(bounds.height / 2, elementBounds.height / 2);
                const centerX = Math.min(bounds.width - halfWidth, Math.max(halfWidth,
                    dragOrigin.centerX + event.clientX - dragOrigin.pointerX
                ));
                const centerY = Math.min(bounds.height - halfHeight, Math.max(halfHeight,
                    dragOrigin.centerY + event.clientY - dragOrigin.pointerY
                ));
                const settings = getSettings();
                settings[settingName] = {
                    x: Math.round(bounds.width ? centerX / bounds.width * 100 : 0),
                    y: Math.round(bounds.height ? centerY / bounds.height * 100 : 0)
                };
                applySettings();
            });
            const stopDragging = (event) => {
                if (dragPointerId !== event.pointerId) {
                    return;
                }
                dragPointerId = null;
                dragOrigin = null;
                saveSettings();
            };
            element.addEventListener('pointerup', stopDragging);
            element.addEventListener('pointercancel', stopDragging);
        }

        bindDragging(touchPreviewPad, 'pad');
        bindDragging(touchPreviewFire, 'fire');
        const previewSettings = touchControlsPreview.closest('details');
        previewSettings.addEventListener('toggle', () => {
            if (previewSettings.open) {
                applySettings();
            }
        });
        touchPadSizeInput.addEventListener('input', () => {
            getSettings().padSize = Number(touchPadSizeInput.value);
            applySettings();
            saveSettings();
        });
        touchFireSizeInput.addEventListener('input', () => {
            getSettings().fireSize = Number(touchFireSizeInput.value);
            applySettings();
            saveSettings();
        });
        global.addEventListener('resize', applySettings);
        global.visualViewport?.addEventListener('resize', applySettings);
        resetTouchControlsButton.addEventListener('click', () => {
            setSettings(getDefaultSettings());
            applySettings();
            saveSettings();
            touchControlsSettingsStatus.textContent =
                'Default positions and sizes restored.';
        });
        applySettings();

        return Object.freeze({ applySettings, updateVisibility });
    }

    global.BC90ETouchControlsUi = Object.freeze({ createTouchControlsUi });
})(window);
