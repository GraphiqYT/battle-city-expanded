(function (global) {
    'use strict';

    function createEnemySpawnOrderUi(context) {
        const {
            editor,
            horizontalScrollbar,
            horizontalScrollbarTrack,
            sizeInput,
            getSpawnOrder,
            getPowerUpTextures,
            getEnemyTextures,
            getPlayerMoveFrameDuration,
            getPowerUpPreviewBlinkDuration,
            getMapTextureDirectory,
            getUiTextureDirectory,
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
                isTnt: false
            }));
        }

        function getRowPositions() {
            const positions = new Map();
            editor.querySelectorAll('.enemy-order-row').forEach((row) => {
                const entry = getSpawnOrder()[Number(row.dataset.enemyOrderIndex)];
                if (entry) {
                    positions.set(entry, row.getBoundingClientRect());
                }
            });
            return positions;
        }

        function animateChanges(previousPositions, removedRow = null) {
            const duration = 200;
            editor.querySelectorAll('.enemy-order-row').forEach((row) => {
                const entry = getSpawnOrder()[Number(row.dataset.enemyOrderIndex)];
                const previousRect = previousPositions.get(entry);
                if (!previousRect) {
                    return;
                }

                const nextRect = row.getBoundingClientRect();
                const offsetX = previousRect.left - nextRect.left;
                const offsetY = previousRect.top - nextRect.top;
                if (offsetX || offsetY) {
                    row.animate(
                        [
                            { transform: `translate(${offsetX}px, ${offsetY}px)` },
                            { transform: 'translate(0, 0)' }
                        ],
                        { duration, easing: 'ease-out' }
                    );
                }
            });

            if (removedRow) {
                const listRect = editor.getBoundingClientRect();
                const rowRect = removedRow.rect;
                const ghost = removedRow.element;
                ghost.setAttribute('aria-hidden', 'true');
                ghost.style.position = 'absolute';
                ghost.style.zIndex = '1';
                ghost.style.pointerEvents = 'none';
                ghost.style.left = `${rowRect.left - listRect.left}px`;
                ghost.style.top = `${rowRect.top - listRect.top}px`;
                ghost.style.width = `${rowRect.width}px`;
                ghost.style.height = `${rowRect.height}px`;
                ghost.style.margin = '0';
                editor.append(ghost);
                ghost.animate(
                    [
                        { opacity: 1, transform: 'scaleY(1)' },
                        { opacity: 0, transform: 'scaleY(0)' }
                    ],
                    { duration, easing: 'ease-in', fill: 'forwards' }
                ).onfinish = () => ghost.remove();
            }
        }

        function render(previousPositions = null, removedRow = null) {
            const spawnOrder = getSpawnOrder();
            editor.replaceChildren();

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
                    const removedRowElement = row.cloneNode(true);
                    const removedRowRect = row.getBoundingClientRect();
                    spawnOrder.splice(index, 1);
                    updateEnemyLivesDisplay();
                    render(previousRowPositions, {
                        element: removedRowElement,
                        rect: removedRowRect
                    });
                });
                actions.append(removeButton);

                row.append(orderLabel, preview, typeSelect, textureSelect, powerUpList, actions);
                editor.append(row);
            });

            syncHorizontalScrollbar();
            if (previousPositions || removedRow) {
                global.requestAnimationFrame(() => {
                    animateChanges(previousPositions ?? new Map(), removedRow);
                });
            }
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
            const frame = Math.floor(timestamp / getPlayerMoveFrameDuration()) % 2;
            editor.querySelectorAll('.enemy-order-preview').forEach((preview) => {
                const entry = getSpawnOrder()[Number(preview.dataset.enemyOrderIndex)];
                if (!entry) {
                    return;
                }
                const previewTextureType = getVisualTextureType(
                    entry.textureType,
                    (entry.powerUps?.length ?? 0) > 0,
                    entry.isTnt === true,
                    timestamp
                );
                loadEnemyTextureDefinition(previewTextureType, entry.type, 'left');
                const frames = getEnemyTextures()
                    .get(`${previewTextureType}-${entry.type}-left`);
                const frameKey = `${previewTextureType}-${entry.type}-${frame}`;
                if (preview.dataset.renderedEnemyTexture === frameKey) {
                    return;
                }

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
                preview.dataset.renderedEnemyTexture = frameKey;
            });
        }

        sizeInput.addEventListener('input', updateSize);
        sizeInput.addEventListener('change', updateSize);

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
