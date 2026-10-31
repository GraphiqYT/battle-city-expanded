(function (global) {
    'use strict';

    function createEnemySpawnOrderUi(context) {
        const {
            editor,
            horizontalScrollbar,
            horizontalScrollbarTrack,
            sizeInput,
            addButton,
            getSpawnOrder,
            getPowerUpTextures,
            getEnemyTextures,
            getPlayerMoveFrameDuration,
            getPowerUpPreviewBlinkDuration,
            getMapTextureDirectory,
            getUiTextureDirectory,
            getAllSpawnIds,
            getActiveSpawnIds,
            getSpawnTexture,
            drawSpawnMarker,
            getEnemyTankType,
            getEnemyTankTextureType,
            loadEnemyTextureSet,
            loadEnemyTextureDefinition,
            updateEnemyLivesDisplay,
            encodeSpawnOrder,
            decodeSpawnOrder
        } = context;

        function createDefaultEnemySpawnOrder() {
            return Array.from({ length: 8 }, () => ({
                type: getEnemyTankType(),
                textureType: getEnemyTankTextureType(),
                powerUps: [],
                isTnt: false,
                spawnIds: getAllSpawnIds()
            }));
        }

        let renderedActiveSpawnIds = '';
        let lastPreviewUpdateTime = Number.NEGATIVE_INFINITY;
        const previewUpdateInterval = 1000 / 12;
        const spawnMarkerCanvases = new Map();
        const composedSpawnPreviews = new WeakMap();
        let enemyPreviewElements = [];
        let spawnPreviewElements = [];

        function getSpawnMarkerCanvas(spawnId, width, height) {
            const markerKey = `${spawnId}:${width}x${height}`;
            let markerCanvas = spawnMarkerCanvases.get(markerKey);
            if (!markerCanvas) {
                markerCanvas = document.createElement('canvas');
                markerCanvas.width = width;
                markerCanvas.height = height;
                const markerContext = markerCanvas.getContext('2d');
                markerContext.imageSmoothingEnabled = false;
                drawSpawnMarker(markerContext, spawnId, width, height);
                spawnMarkerCanvases.set(markerKey, markerCanvas);
            }
            return markerCanvas;
        }

        function getComposedSpawnPreview(spawnId, texture, isSelected, width, height) {
            const markerCanvas = getSpawnMarkerCanvas(spawnId, width, height);
            if (!texture) {
                return markerCanvas;
            }

            let previewsByState = composedSpawnPreviews.get(texture);
            if (!previewsByState) {
                previewsByState = new Map();
                composedSpawnPreviews.set(texture, previewsByState);
            }
            const previewKey = `${spawnId}:${width}x${height}:${isSelected}`;
            let composedPreview = previewsByState.get(previewKey);
            if (!composedPreview) {
                composedPreview = document.createElement('canvas');
                composedPreview.width = width;
                composedPreview.height = height;
                const previewContext = composedPreview.getContext('2d');
                previewContext.imageSmoothingEnabled = false;
                previewContext.globalAlpha = isSelected ? 1 : 0.4;
                previewContext.drawImage(texture, 0, 0, width, height);
                previewContext.globalAlpha = 1;
                previewContext.drawImage(markerCanvas, 0, 0);
                previewsByState.set(previewKey, composedPreview);
            }
            return composedPreview;
        }

        function getRowContentPosition(row, editorRect) {
            const rowRect = row.getBoundingClientRect();
            return {
                left: rowRect.left - editorRect.left + editor.scrollLeft,
                top: rowRect.top - editorRect.top + editor.scrollTop
            };
        }

        function getRowPositions() {
            const positions = new Map();
            const editorRect = editor.getBoundingClientRect();
            editor.querySelectorAll('.enemy-order-row').forEach((row) => {
                const entry = getSpawnOrder()[Number(row.dataset.enemyOrderIndex)];
                if (entry) {
                    positions.set(entry, getRowContentPosition(row, editorRect));
                }
            });
            return positions;
        }

        function animateChanges(previousPositions, removedRow = null, addedEntry = null) {
            const duration = 130;
            const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
            const editorRect = editor.getBoundingClientRect();
            editor.querySelectorAll('.enemy-order-row').forEach((row) => {
                const entry = getSpawnOrder()[Number(row.dataset.enemyOrderIndex)];
                const previousRect = previousPositions.get(entry);
                if (!previousRect || reduceMotion) {
                    return;
                }

                const nextPosition = getRowContentPosition(row, editorRect);
                const offsetX = previousRect.left - nextPosition.left;
                const offsetY = previousRect.top - nextPosition.top;
                if (offsetX || offsetY) {
                    row.animate(
                        [
                            { transform: `translate3d(${offsetX}px, ${offsetY}px, 0)` },
                            { transform: 'translate3d(0, 0, 0)' }
                        ],
                        { duration, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
                    );
                }
            });

            if (removedRow) {
                const animation = removedRow.animate(
                    [
                        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
                        { opacity: 0, transform: 'translate3d(-8px, 0, 0)' }
                    ],
                    {
                        duration,
                        easing: 'ease-out',
                        fill: 'forwards'
                    }
                );
                animation.finished.then(
                    () => removedRow.remove(),
                    () => removedRow.remove()
                );
            }

            if (addedEntry && !reduceMotion) {
                const addedIndex = getSpawnOrder().indexOf(addedEntry);
                const addedRow = editor.querySelector(
                    `.enemy-order-row[data-enemy-order-index="${addedIndex}"]`
                );
                addedRow?.animate(
                    [
                        { opacity: 0, transform: 'translate3d(0, -4px, 0)' },
                        { opacity: 1, transform: 'translate3d(0, 0, 0)' }
                    ],
                    { duration, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
                );
            }
        }

        function render(previousPositions = null, removedRow = null, addedEntry = null) {
            const spawnOrder = getSpawnOrder();
            const activeSpawnIds = getActiveSpawnIds();
            const previousScrollLeft = editor.scrollLeft;
            renderedActiveSpawnIds = activeSpawnIds.join(',');
            if (activeSpawnIds.length > 0) {
                spawnOrder.forEach((entry) => {
                    entry.spawnIds ??= getAllSpawnIds();
                    if (!activeSpawnIds.some((spawnId) => entry.spawnIds.includes(spawnId))) {
                        entry.spawnIds = [...activeSpawnIds];
                    }
                });
            }
            editor.querySelectorAll('.enemy-order-row').forEach((row) => {
                row.getAnimations().forEach((animation) => animation.cancel());
            });
            editor.replaceChildren();
            enemyPreviewElements = [];
            spawnPreviewElements = [];

            spawnOrder.forEach((entry, index) => {
                const row = document.createElement('div');
                row.className = 'enemy-order-row';
                row.dataset.enemyOrderIndex = String(index);
                row.style.zoom = `${sizeInput.value}%`;

                const orderLabel = document.createElement('span');
                orderLabel.className = 'enemy-order-index';
                orderLabel.textContent = `${index + 1}.`;

                const preview = document.createElement('canvas');
                preview.className = 'enemy-order-preview';
                preview.width = 32;
                preview.height = 32;
                preview.getContext('2d').imageSmoothingEnabled = false;
                preview.dataset.enemyOrderIndex = String(index);
                enemyPreviewElements.push(preview);

                const typeSelect = document.createElement('select');
                if (entry.type === 0) {
                    const legacyOption = document.createElement('option');
                    legacyOption.value = '0';
                    legacyOption.textContent = 'Rank 0 (legacy)';
                    legacyOption.selected = true;
                    legacyOption.disabled = true;
                    typeSelect.append(legacyOption);
                }
                for (let type = 1; type <= 10; type += 1) {
                    const option = document.createElement('option');
                    option.value = String(type);
                    option.textContent = `Rank ${type}`;
                    option.selected = entry.type === type;
                    typeSelect.append(option);
                }
                typeSelect.addEventListener('change', () => {
                    entry.type = Number(typeSelect.value);
                    loadEnemyTextureSet(entry.textureType, entry.type);
                });

                const textureSelect = document.createElement('select');
                if (['a', 'd'].includes(entry.textureType)) {
                    const legacyOption = document.createElement('option');
                    legacyOption.value = entry.textureType;
                    legacyOption.textContent = `Type ${entry.textureType} (legacy)`;
                    legacyOption.selected = true;
                    legacyOption.disabled = true;
                    textureSelect.append(legacyOption);
                }
                'bcefgh'.split('').forEach((textureType) => {
                    const option = document.createElement('option');
                    option.value = textureType;
                    option.textContent = `Type ${textureType}`;
                    option.selected = entry.textureType === textureType;
                    textureSelect.append(option);
                });
                textureSelect.addEventListener('change', () => {
                    entry.textureType = textureSelect.value;
                    loadEnemyTextureSet(entry.textureType, entry.type);
                });

                const powerUpList = document.createElement('div');
                powerUpList.className = 'enemy-powerup-list';
                powerUpList.setAttribute('role', 'group');
                powerUpList.setAttribute('aria-label', `Power-ups for enemy ${index + 1}`);
                entry.powerUps ??= [];
                const powerUpTextures = getPowerUpTextures();
                for (let powerUpId = 0; powerUpId < powerUpTextures.length; powerUpId += 1) {
                    const toggleLabel = document.createElement('label');
                    toggleLabel.className = 'enemy-powerup-toggle';
                    toggleLabel.title = `Power-up ${powerUpId + 1}`;

                    const toggle = document.createElement('input');
                    toggle.type = 'checkbox';
                    toggle.checked = entry.powerUps.includes(powerUpId);
                    toggleLabel.classList.toggle('is-selected', toggle.checked);
                    toggle.setAttribute('aria-label', `Power-up ${powerUpId + 1}`);
                    toggle.addEventListener('change', () => {
                        toggleLabel.classList.toggle('is-selected', toggle.checked);
                        delete preview.dataset.renderedEnemyTexture;
                        if (toggle.checked) {
                            if (!entry.powerUps.includes(powerUpId)) {
                                entry.powerUps.push(powerUpId);
                                entry.powerUps.sort((first, second) => first - second);
                            }
                            return;
                        }
                        entry.powerUps = entry.powerUps.filter(
                            (selectedPowerUp) => selectedPowerUp !== powerUpId
                        );
                    });

                    const powerUpIcon = document.createElement('img');
                    powerUpIcon.src =
                        `${getMapTextureDirectory()}Powerup-${String(powerUpId).padStart(2, '0')}.png`;
                    powerUpIcon.alt = '';
                    toggleLabel.append(toggle, powerUpIcon);
                    powerUpList.append(toggleLabel);
                }

                const actions = document.createElement('div');
                actions.className = 'enemy-order-actions';
                const tntButton = document.createElement('button');
                tntButton.type = 'button';
                tntButton.className = 'enemy-order-action-button enemy-order-tnt-button';
                tntButton.textContent = 'TNT';
                tntButton.setAttribute('aria-label', `TNT for enemy ${index + 1}`);
                tntButton.title = 'Explosive tank (TNT)';
                tntButton.setAttribute('aria-pressed', String(entry.isTnt === true));
                tntButton.addEventListener('click', () => {
                    entry.isTnt = !entry.isTnt;
                    tntButton.setAttribute('aria-pressed', String(entry.isTnt));
                    tntButton.title = `Explosive tank (TNT): ${entry.isTnt ? 'ON' : 'OFF'}`;
                    delete preview.dataset.renderedEnemyTexture;
                });
                actions.append(tntButton);

                const spawnList = document.createElement('div');
                spawnList.className = 'enemy-spawn-choice-list';
                spawnList.setAttribute('role', 'group');
                spawnList.setAttribute('aria-label', `Enemy spawns for enemy ${index + 1}`);
                entry.spawnIds ??= getAllSpawnIds();
                const selectedSpawnIds = new Set(entry.spawnIds);
                activeSpawnIds.forEach((spawnId) => {
                    const spawnLabel = getAllSpawnIds().indexOf(spawnId) + 1;
                    const toggleLabel = document.createElement('label');
                    toggleLabel.className = 'enemy-spawn-choice';
                    toggleLabel.title = `Enemy spawn ${spawnLabel}`;

                    const toggle = document.createElement('input');
                    toggle.type = 'checkbox';
                    toggle.checked = selectedSpawnIds.has(spawnId);
                    toggle.setAttribute('aria-label', `Enemy spawn ${spawnLabel}`);
                    toggleLabel.classList.toggle('is-selected', toggle.checked);
                    const spawnPreview = document.createElement('canvas');
                    spawnPreview.className = 'enemy-spawn-choice-preview';
                    spawnPreview.width = 24;
                    spawnPreview.height = 24;
                    spawnPreview.dataset.spawnId = String(spawnId);
                    spawnPreview.dataset.isSelected = String(toggle.checked);
                    spawnPreview.getContext('2d').imageSmoothingEnabled = false;
                    spawnPreviewElements.push(spawnPreview);
                    toggle.addEventListener('change', () => {
                        const selectedActiveSpawnCount = activeSpawnIds.filter(
                            (id) => selectedSpawnIds.has(id)
                        ).length;
                        if (!toggle.checked && selectedActiveSpawnCount === 1) {
                            toggle.checked = true;
                            return;
                        }
                        toggleLabel.classList.toggle('is-selected', toggle.checked);
                        spawnPreview.dataset.isSelected = String(toggle.checked);
                        if (toggle.checked) {
                            selectedSpawnIds.add(spawnId);
                        } else {
                            selectedSpawnIds.delete(spawnId);
                        }
                        entry.spawnIds = getAllSpawnIds().filter(
                            (id) => selectedSpawnIds.has(id)
                        );
                        delete spawnPreview.dataset.renderedSelection;
                    });

                    toggleLabel.append(toggle, spawnPreview);
                    spawnList.append(toggleLabel);
                });
                actions.append(spawnList);

                const moveButton = (label, delta, disabled) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'enemy-order-action-button';
                    button.textContent = label;
                    button.setAttribute('aria-label', label);
                    button.title = label;
                    const icon = document.createElement('img');
                    icon.className = 'enemy-order-action-icon';
                    icon.src = `${getUiTextureDirectory()}${label.toLowerCase()}.png`;
                    icon.alt = '';
                    button.prepend(icon);
                    button.disabled = disabled;
                    button.addEventListener('click', () => {
                        const previousRowPositions = getRowPositions();
                        const targetIndex = index + delta;
                        [spawnOrder[index], spawnOrder[targetIndex]] = [
                            spawnOrder[targetIndex],
                            spawnOrder[index]
                        ];
                        render(previousRowPositions);
                    });
                    actions.append(button);
                };
                moveButton('Up', -1, index === 0);
                moveButton('Down', 1, index === spawnOrder.length - 1);

                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'enemy-order-action-button';
                removeButton.textContent = 'Remove';
                removeButton.setAttribute('aria-label', 'Remove');
                removeButton.title = 'Remove';
                const removeIcon = document.createElement('img');
                removeIcon.className = 'enemy-order-action-icon';
                removeIcon.src = `${getUiTextureDirectory()}delete.png`;
                removeIcon.alt = '';
                removeButton.prepend(removeIcon);
                removeButton.addEventListener('click', () => {
                    const previousRowPositions = getRowPositions();
                    const removedRowRect = row.getBoundingClientRect();
                    let removedRow = null;
                    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        row.getAnimations().forEach((animation) => animation.cancel());
                        const zoom = Math.max(
                            0.01,
                            Number.parseFloat(row.style.zoom) / 100 || 1
                        );
                        row.setAttribute('aria-hidden', 'true');
                        row.inert = true;
                        row.querySelectorAll('button, input, select, textarea').forEach(
                            (control) => {
                                control.disabled = true;
                            }
                        );
                        row.style.position = 'fixed';
                        row.style.zIndex = '1';
                        row.style.pointerEvents = 'none';
                        row.style.left = `${removedRowRect.left}px`;
                        row.style.top = `${removedRowRect.top}px`;
                        row.style.width = `${removedRowRect.width / zoom}px`;
                        row.style.margin = '0';
                        document.body.append(row);
                        removedRow = row;
                    }
                    spawnOrder.splice(index, 1);
                    updateEnemyLivesDisplay();
                    render(previousRowPositions, removedRow);
                });
                actions.append(removeButton);

                row.append(orderLabel, preview, typeSelect, textureSelect, powerUpList, actions);
                editor.append(row);
            });

            syncHorizontalScrollbar();
            editor.scrollLeft = addedEntry
                ? Math.max(0, editor.scrollWidth - editor.clientWidth)
                : Math.min(
                    previousScrollLeft,
                    Math.max(0, editor.scrollWidth - editor.clientWidth)
                );
            horizontalScrollbar.scrollLeft = editor.scrollLeft;
            if (previousPositions || removedRow) {
                global.requestAnimationFrame(() => {
                    animateChanges(previousPositions ?? new Map(), removedRow, addedEntry);
                });
            }
        }

        function addEnemy() {
            const spawnOrder = getSpawnOrder();
            const previousPositions = getRowPositions();
            const entry = {
                type: getEnemyTankType(),
                textureType: getEnemyTankTextureType(),
                powerUps: [],
                isTnt: false,
                spawnIds: getAllSpawnIds()
            };
            spawnOrder.push(entry);
            updateEnemyLivesDisplay();
            render(previousPositions, null, entry);
        }

        function syncHorizontalScrollbar() {
            const contentWidth = Math.max(editor.clientWidth, editor.scrollWidth);
            horizontalScrollbarTrack.style.width = `${contentWidth}px`;
            const hasHorizontalOverflow = editor.scrollWidth > editor.clientWidth;
            horizontalScrollbar.hidden = !hasHorizontalOverflow;
            if (!hasHorizontalOverflow) {
                editor.scrollLeft = 0;
                horizontalScrollbar.scrollLeft = 0;
            }
        }

        editor.addEventListener('scroll', () => {
            horizontalScrollbar.scrollLeft = editor.scrollLeft;
        }, { passive: true });
        horizontalScrollbar.addEventListener('scroll', () => {
            editor.scrollLeft = horizontalScrollbar.scrollLeft;
        }, { passive: true });
        global.addEventListener('resize', syncHorizontalScrollbar);
        new ResizeObserver(syncHorizontalScrollbar).observe(editor);

        function updateSize() {
            const requestedSize = Number.parseInt(sizeInput.value, 10);
            const normalizedSize = Math.min(
                150,
                Math.max(50, Number.isFinite(requestedSize) ? requestedSize : 100)
            );
            sizeInput.value = String(normalizedSize);
            editor.querySelectorAll('.enemy-order-row').forEach((row) => {
                row.style.zoom = `${normalizedSize}%`;
            });
            syncHorizontalScrollbar();
        }

        function getVisualTextureType(textureType, hasPowerUp, isTnt, timestamp) {
            const blinkDuration = getPowerUpPreviewBlinkDuration();
            if (isTnt && hasPowerUp) {
                const phase = Math.floor(timestamp / blinkDuration) % 4;
                return phase === 1 || phase === 3
                    ? 'd'
                    : phase === 2 ? 'i' : textureType;
            }
            if (isTnt) {
                return Math.floor(timestamp / (blinkDuration * 2)) % 2 === 1
                    ? 'i'
                    : textureType;
            }
            return hasPowerUp && Math.floor(timestamp / blinkDuration) % 2 === 1
                ? 'd'
                : textureType;
        }

        function updatePreviews(timestamp) {
            if (
                timestamp >= lastPreviewUpdateTime &&
                timestamp - lastPreviewUpdateTime < previewUpdateInterval
            ) {
                return;
            }
            lastPreviewUpdateTime = timestamp;

            const activeSpawnIds = getActiveSpawnIds();
            if (activeSpawnIds.join(',') !== renderedActiveSpawnIds) {
                render();
            }

            const frame = Math.floor(timestamp / getPlayerMoveFrameDuration()) % 2;
            const spawnOrder = getSpawnOrder();
            const enemyTextures = getEnemyTextures();
            enemyPreviewElements.forEach((preview) => {
                const entry = spawnOrder[Number(preview.dataset.enemyOrderIndex)];
                if (!entry) {
                    return;
                }
                const previewTextureType = getVisualTextureType(
                    entry.textureType,
                    (entry.powerUps?.length ?? 0) > 0,
                    entry.isTnt === true,
                    timestamp
                );
                const frameKey = `${previewTextureType}-${entry.type}-left`;
                const visualFrameKey = `${frameKey}-${frame}`;
                if (preview.dataset.renderedEnemyTexture === visualFrameKey) {
                    return;
                }

                loadEnemyTextureDefinition(previewTextureType, entry.type, 'left');
                const frames = enemyTextures.get(frameKey);

                const previewContext = preview.getContext('2d');
                previewContext.clearRect(0, 0, preview.width, preview.height);
                if (frames?.[frame]) {
                    previewContext.drawImage(
                        frames[frame],
                        0,
                        0,
                        preview.width,
                        preview.height
                    );
                }
                preview.dataset.renderedEnemyTexture = visualFrameKey;
            });

            const spawnTextures = new Map();
            spawnPreviewElements.forEach((preview) => {
                const spawnId = Number(preview.dataset.spawnId);
                if (!spawnTextures.has(spawnId)) {
                    spawnTextures.set(spawnId, getSpawnTexture(spawnId, timestamp));
                }
                const texture = spawnTextures.get(spawnId);
                const isSelected = preview.dataset.isSelected === 'true';
                const renderedSelection = String(isSelected);
                const composedPreview = getComposedSpawnPreview(
                    spawnId,
                    texture,
                    isSelected,
                    preview.width,
                    preview.height
                );
                if (
                    preview.renderedSpawnTexture === composedPreview &&
                    preview.dataset.renderedSelection === renderedSelection
                ) {
                    return;
                }

                const previewContext = preview.getContext('2d');
                previewContext.clearRect(0, 0, preview.width, preview.height);
                previewContext.drawImage(composedPreview, 0, 0);
                preview.renderedSpawnTexture = composedPreview;
                preview.dataset.renderedSelection = renderedSelection;
            });
        }

        sizeInput.addEventListener('input', updateSize);
        sizeInput.addEventListener('change', updateSize);
        addButton.addEventListener('click', addEnemy);

        return Object.freeze({
            createDefaultEnemySpawnOrder,
            getRowPositions,
            render,
            syncHorizontalScrollbar,
            updateSize,
            updatePreviews,
            getVisualTextureType,
            encodeSpawnOrder,
            decodeSpawnOrder
        });
    }

    global.BC90EEnemySpawnOrderUi = Object.freeze({ createEnemySpawnOrderUi });
})(window);
