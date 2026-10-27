(function (global) {
    'use strict';

    function createTouchControlsUi(context) {
        const {
            mobileGameControls,
            touchControlsPreview,
            touchControlsConfigurator,
            touchControlSizeInput,
            touchControlSizeValue,
            touchControlSelectionInput,
            resetTouchControlsButton,
            touchControlsSettingsStatus,
            getSettings,
            setSettings,
            saveSettings,
            getDefaultSettings,
            isSimulationActive,
            areTouchControlsEnabled
        } = context;
        const controlIds = ['UP', 'LEFT', 'RIGHT', 'DOWN', 'FIRE'];
        const controls = new Map(controlIds.map((id) => [
            id,
            {
                game: mobileGameControls.querySelector(
                    id === 'FIRE' ? '[data-game-fire]' : `[data-game-direction="${id}"]`
                ),
                preview: touchControlsPreview.querySelector(`[data-touch-preview="${id}"]`)
            }
        ]));
        let selectedControl = touchControlSelectionInput.value;

        function viewportSize() {
            return {
                width: global.visualViewport?.width || global.innerWidth,
                height: global.visualViewport?.height || global.innerHeight
            };
        }

        function setPosition(element, position, width, height, size) {
            const minX = Math.min(50, size / Math.max(1, width) * 50);
            const minY = Math.min(50, size / Math.max(1, height) * 50);
            const x = Math.min(100 - minX, Math.max(minX, position.x));
            const y = Math.min(100 - minY, Math.max(minY, position.y));
            element.style.left = `${x}%`;
            element.style.top = `${y}%`;
            element.style.transform = 'translate(-50%, -50%)';
        }

        function updateSelectedSize() {
            const control = getSettings().controls[selectedControl];
            touchControlSizeInput.value = String(control.size);
            touchControlSizeValue.textContent = `${control.size} px`;
            controls.forEach(({ preview }, id) => {
                preview.classList.toggle('is-selected', id === selectedControl);
            });
        }

        function setArrow(control, direction) {
            if (direction === 'FIRE') {
                return;
            }
            let arrow = control.querySelector('.touch-control-arrow');
            if (!arrow) {
                arrow = document.createElement('span');
                arrow.className = 'touch-control-arrow';
                arrow.setAttribute('aria-hidden', 'true');
                control.append(arrow);
            }
            const rotation = { UP: 0, RIGHT: 90, DOWN: 180, LEFT: -90 }[direction];
            arrow.style.transform =
                `translate(-50%, -50%) rotate(${rotation}deg)`;
        }

        function applySettings() {
            const settings = getSettings();
            const viewport = viewportSize();
            const pageScale = Number.parseFloat(
                getComputedStyle(document.documentElement)
                    .getPropertyValue('--touch-control-page-scale')
            ) || 1;
            const aspectRatio = viewport.width / Math.max(1, viewport.height);
            const previewMaxHeight = Math.min(280, Math.max(120, viewport.height * 0.45));
            const targetPreviewWidth = Math.min(
                touchControlsConfigurator.clientWidth,
                previewMaxHeight * aspectRatio
            );

            touchControlsPreview.style.setProperty(
                '--touch-screen-aspect-ratio',
                String(aspectRatio)
            );
            touchControlsPreview.style.width = `${targetPreviewWidth}px`;
            touchControlsPreview.style.height =
                `${targetPreviewWidth / Math.max(0.1, aspectRatio)}px`;

            const previewBounds = touchControlsPreview.getBoundingClientRect();
            const previewScale = previewBounds.width / Math.max(1, viewport.width);
            const gameplayWidth = Math.min(
                previewBounds.width,
                previewBounds.height * 4 / 3
            );
            touchControlsPreview.style.setProperty(
                '--gameplay-screen-width',
                `${gameplayWidth}px`
            );
            touchControlsPreview.style.setProperty(
                '--gameplay-screen-height',
                `${gameplayWidth * 3 / 4}px`
            );
            controls.forEach(({ game, preview }, id) => {
                const control = settings.controls[id];
                const actualSize = control.size * pageScale;
                const previewSize = Math.max(1, actualSize * previewScale);
                game.style.width = `${actualSize}px`;
                game.style.height = `${actualSize}px`;
                game.style.fontSize = `${actualSize}px`;
                preview.style.width = `${previewSize}px`;
                preview.style.height = `${previewSize}px`;
                preview.style.fontSize = `${previewSize}px`;
                if (id === 'FIRE') {
                    game.querySelector('span').style.fontSize =
                        `${actualSize * 0.34}px`;
                    preview.querySelector('span').style.fontSize =
                        `${previewSize * 0.34}px`;
                }
                setArrow(game, id);
                setArrow(preview, id);
                setPosition(game, control, viewport.width, viewport.height, actualSize);
                setPosition(
                    preview,
                    control,
                    previewBounds.width,
                    previewBounds.height,
                    previewSize
                );
            });
            updateSelectedSize();
        }

        function updateVisibility(forceHidden = false) {
            const running = isSimulationActive();
            const controlsEnabled = areTouchControlsEnabled();
            mobileGameControls.hidden = forceHidden || !running || !controlsEnabled;
            touchControlsConfigurator.classList.toggle(
                'is-disabled',
                !controlsEnabled
            );
            touchControlsConfigurator.setAttribute(
                'aria-disabled',
                String(!controlsEnabled)
            );
            touchControlsConfigurator
                .querySelectorAll('button, input, select')
                .forEach((element) => {
                    element.disabled = !controlsEnabled;
                });
            document.body.classList.toggle(
                'touch-controls-running',
                running && controlsEnabled
            );
        }

        function bindDragging(id, element) {
            let dragPointerId = null;
            let dragOrigin = null;
            element.addEventListener('pointerdown', (event) => {
                if (!areTouchControlsEnabled() || event.button !== 0) {
                    return;
                }
                event.preventDefault();
                selectedControl = id;
                touchControlSelectionInput.value = id;
                updateSelectedSize();
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
                if (
                    !areTouchControlsEnabled() ||
                    dragPointerId !== event.pointerId ||
                    !dragOrigin
                ) {
                    return;
                }
                const bounds = touchControlsPreview.getBoundingClientRect();
                const previewSize = element.getBoundingClientRect().width;
                const halfSize = Math.min(bounds.width / 2, previewSize / 2);
                const centerX = Math.min(bounds.width - halfSize, Math.max(halfSize,
                    dragOrigin.centerX + event.clientX - dragOrigin.pointerX
                ));
                const centerY = Math.min(bounds.height - halfSize, Math.max(halfSize,
                    dragOrigin.centerY + event.clientY - dragOrigin.pointerY
                ));
                const control = getSettings().controls[id];
                control.x = Math.round(centerX / Math.max(1, bounds.width) * 100);
                control.y = Math.round(centerY / Math.max(1, bounds.height) * 100);
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

        controls.forEach(({ preview }, id) => bindDragging(id, preview));
        touchControlSelectionInput.addEventListener('change', () => {
            if (!areTouchControlsEnabled()) {
                return;
            }
            selectedControl = touchControlSelectionInput.value;
            updateSelectedSize();
        });
        touchControlSizeInput.addEventListener('input', () => {
            if (!areTouchControlsEnabled()) {
                return;
            }
            getSettings().controls[selectedControl].size =
                Number(touchControlSizeInput.value);
            applySettings();
            saveSettings();
        });
        const previewSettings = touchControlsPreview.closest('details');
        previewSettings.addEventListener('toggle', () => {
            if (previewSettings.open) {
                applySettings();
            }
        });
        global.addEventListener('resize', applySettings);
        global.visualViewport?.addEventListener('resize', applySettings);
        resetTouchControlsButton.addEventListener('click', () => {
            if (!areTouchControlsEnabled()) {
                return;
            }
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
