(function (global) {
    'use strict';

    function createMapCamera({
        canvas,
        context,
        viewport,
        canvasPanel,
        playerLivesPanel,
        zoomInput,
        zoomInButton,
        zoomOutButton,
        edgeIndicators,
        supportsTouchControls,
        getCanvasDimensions,
        getMapDimensions,
        isPanModeEnabled,
        syncCanvasModeControlSize,
        onBackingSizeChanged,
        settings
    }) {
        const savedZoomPercent = Number(settings.readPreference('mapZoomPercent', 100));
        let zoomPercent = Number.isFinite(savedZoomPercent)
            ? Math.round(Math.min(1600, Math.max(100, savedZoomPercent)))
            : 100;
        zoomInput.value = String(zoomPercent);
        let baseWidth = 0;
        let baseHeight = 0;
        let left = 0;
        let top = 0;
        let pendingLeft = 0;
        let pendingTop = 0;
        let panFrame = 0;
        let pan = null;

        function applyTransform() {
            canvas.style.transform =
                `translate3d(${left}px, ${top}px, 0) scale(${zoomPercent / 100})`;
            updateEdgeIndicators();
        }

        function clampPosition() {
            const scale = zoomPercent / 100;
            const viewportWidth = viewport.clientWidth;
            const viewportHeight = viewport.clientHeight;
            const scaledWidth = baseWidth * scale;
            const scaledHeight = baseHeight * scale;
            const minimumLeft = Math.min(0, viewportWidth - scaledWidth);
            const minimumTop = Math.min(0, viewportHeight - scaledHeight);
            const maximumLeft = Math.max(0, (viewportWidth - scaledWidth) / 2);
            const maximumTop = Math.max(0, (viewportHeight - scaledHeight) / 2);
            left = Math.max(minimumLeft, Math.min(maximumLeft, left));
            top = Math.max(minimumTop, Math.min(maximumTop, top));
            applyTransform();
        }

        function setBaseSize(width, height) {
            baseWidth = width;
            baseHeight = height;
            canvas.style.width = `${baseWidth}px`;
            canvas.style.height = `${baseHeight}px`;
        }

        function resizeCanvas() {
            syncCanvasModeControlSize();
            const panelStyles = global.getComputedStyle(canvasPanel);
            const panelPadding = (
                Number.parseFloat(panelStyles.paddingLeft) || 0
            ) + (Number.parseFloat(panelStyles.paddingRight) || 0);
            const panelBorder = canvasPanel.offsetWidth - canvasPanel.clientWidth;
            const { width: mapWidth, height: mapHeight } = getMapDimensions();
            const mapAspectRatio = mapWidth / mapHeight;
            viewport.style.aspectRatio = '1 / 1';
            let maximumCanvasSize = 0;
            let canvasSizeLimit = Infinity;
            for (let iteration = 0; iteration < 6; iteration += 1) {
                maximumCanvasSize = Math.max(
                    1,
                    Math.min(canvasSizeLimit, Math.floor(
                        canvasPanel.getBoundingClientRect().width -
                        panelPadding -
                        panelBorder
                    ))
                );
                viewport.style.width = `${maximumCanvasSize}px`;
                viewport.style.height = `${maximumCanvasSize}px`;
                const width = mapAspectRatio >= 1
                    ? maximumCanvasSize
                    : maximumCanvasSize * mapAspectRatio;
                const height = mapAspectRatio >= 1
                    ? maximumCanvasSize / mapAspectRatio
                    : maximumCanvasSize;
                setBaseSize(width, height);
                syncCanvasModeControlSize();
                const nextCanvasSize = Math.max(
                    1,
                    Math.floor(
                        canvasPanel.getBoundingClientRect().width -
                        panelPadding -
                        panelBorder
                    )
                );
                if (nextCanvasSize >= maximumCanvasSize) {
                    break;
                }
                canvasSizeLimit = nextCanvasSize;
            }
            updateBackingSize();
            playerLivesPanel.style.setProperty(
                '--editor-map-width',
                `${viewport.clientWidth}px`
            );
            setZoom(zoomPercent, false);
        }

        function getZoom() {
            return zoomPercent;
        }

        function updateBackingSize() {
            const devicePixelRatio = global.devicePixelRatio || 1;
            const preferredPixelRatio = supportsTouchControls
                ? Math.min(devicePixelRatio, 2)
                : devicePixelRatio;
            const worldDimensions = getCanvasDimensions();
            const pixelRatio = Math.max(1, Math.floor(Math.min(
                preferredPixelRatio,
                4096 / worldDimensions.width,
                4096 / worldDimensions.height
            )));

            canvas.width = worldDimensions.width * pixelRatio;
            canvas.height = worldDimensions.height * pixelRatio;
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            context.imageSmoothingEnabled = false;
            onBackingSizeChanged();
        }

        function updateEdgeIndicators() {
            if (!isPanModeEnabled() || zoomPercent <= 100) {
                edgeIndicators.forEach((indicator) => {
                    indicator.classList.remove('is-visible');
                    indicator.classList.remove('is-hiding');
                });
                return;
            }

            const scale = zoomPercent / 100;
            const viewportWidth = viewport.getBoundingClientRect().width;
            const viewportHeight = viewport.getBoundingClientRect().height;
            const scaledWidth = baseWidth * scale;
            const scaledHeight = baseHeight * scale;
            const overflowTolerance = 0.5;
            const visibleEdges = {
                up: scaledHeight > viewportHeight + overflowTolerance &&
                    top < -overflowTolerance,
                right: scaledWidth > viewportWidth + overflowTolerance &&
                    left + scaledWidth > viewportWidth + overflowTolerance,
                down: scaledHeight > viewportHeight + overflowTolerance &&
                    top + scaledHeight > viewportHeight + overflowTolerance,
                left: scaledWidth > viewportWidth + overflowTolerance &&
                    left < -overflowTolerance
            };

            Object.entries(visibleEdges).forEach(([direction, isBeyondEdge]) => {
                const indicator = edgeIndicators.get(direction);
                if (isBeyondEdge) {
                    indicator.classList.remove('is-hiding');
                    indicator.classList.add('is-visible');
                } else if (indicator.classList.contains('is-visible')) {
                    indicator.classList.remove('is-visible');
                    indicator.classList.add('is-hiding');
                }
            });
        }

        edgeIndicators.forEach((indicator) => {
            indicator.addEventListener('transitionend', (event) => {
                if (
                    event.propertyName === 'opacity' &&
                    indicator.classList.contains('is-hiding')
                ) {
                    indicator.classList.remove('is-hiding');
                }
            });
        });

        function setZoom(requestedPercent, preserveCenter = true) {
            const parsedPercent = Number(requestedPercent);
            if (!Number.isFinite(parsedPercent)) {
                zoomInput.value = String(zoomPercent);
                return;
            }

            const nextPercent = Math.round(Math.min(1600, Math.max(100, parsedPercent)));
            const oldWidth = baseWidth * zoomPercent / 100;
            const oldHeight = baseHeight * zoomPercent / 100;
            const centerX = preserveCenter && oldWidth > 0
                ? (viewport.clientWidth / 2 - left) / oldWidth
                : 0.5;
            const centerY = preserveCenter && oldHeight > 0
                ? (viewport.clientHeight / 2 - top) / oldHeight
                : 0.5;

            zoomPercent = nextPercent;
            zoomInput.value = String(zoomPercent);
            left = viewport.clientWidth / 2 -
                centerX * baseWidth * zoomPercent / 100;
            top = viewport.clientHeight / 2 -
                centerY * baseHeight * zoomPercent / 100;
            clampPosition();
            zoomOutButton.disabled = zoomPercent <= 100;
            zoomInButton.disabled = zoomPercent >= 1600;
            pendingLeft = left;
            pendingTop = top;
            settings.writePreference('mapZoomPercent', zoomPercent);
        }

        function bindContinuousZoom(button, zoomDelta) {
            let repeatDelayId = 0;
            let repeatIntervalId = 0;

            const stopRepeating = () => {
                global.clearTimeout(repeatDelayId);
                global.clearInterval(repeatIntervalId);
                repeatDelayId = 0;
                repeatIntervalId = 0;
            };

            const zoom = () => {
                if (button.disabled) {
                    stopRepeating();
                    return;
                }
                setZoom(zoomPercent + zoomDelta);
            };

            button.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                stopRepeating();
                zoom();
                repeatDelayId = global.setTimeout(() => {
                    repeatIntervalId = global.setInterval(zoom, 100);
                }, 400);
            });
            button.addEventListener('click', (event) => {
                if (event.detail === 0) {
                    zoom();
                }
            });
            global.addEventListener('pointerup', stopRepeating);
            global.addEventListener('pointercancel', stopRepeating);
            global.addEventListener('blur', stopRepeating);
        }

        function bindZoomControls(fitButton) {
            bindContinuousZoom(zoomInButton, 25);
            bindContinuousZoom(zoomOutButton, -25);
            fitButton.addEventListener('click', () => {
                setZoom(100, false);
            });
            zoomInput.addEventListener('change', () => {
                setZoom(zoomInput.value);
            });
        }

        function beginPan(event) {
            pan = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startLeft: left,
                startTop: top
            };
            pendingLeft = left;
            pendingTop = top;
            canvas.classList.add('camera-panning');
        }

        function hasActivePan(pointerId) {
            return pan?.pointerId === pointerId;
        }

        function movePan(event) {
            if (!hasActivePan(event.pointerId)) {
                return;
            }
            pendingLeft = pan.startLeft + event.clientX - pan.startX;
            pendingTop = pan.startTop + event.clientY - pan.startY;
            if (!panFrame) {
                panFrame = global.requestAnimationFrame(() => {
                    panFrame = 0;
                    left = pendingLeft;
                    top = pendingTop;
                    clampPosition();
                });
            }
        }

        function stopPan() {
            if (panFrame) {
                global.cancelAnimationFrame(panFrame);
                panFrame = 0;
                left = pendingLeft;
                top = pendingTop;
                clampPosition();
            }
            pan = null;
            canvas.classList.remove('camera-panning');
        }

        return Object.freeze({
            setBaseSize,
            resizeCanvas,
            updateBackingSize,
            setZoom,
            bindZoomControls,
            getZoom,
            getBaseWidth: () => baseWidth,
            updateEdgeIndicators,
            beginPan,
            hasActivePan,
            movePan,
            stopPan
        });
    }

    global.BC90EMapCamera = Object.freeze({ createMapCamera });
})(window);
