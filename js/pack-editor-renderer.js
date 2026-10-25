(function (global) {
    'use strict';

    function createPackEditorRenderer(context) {
        const {
            elements,
            updatePackDirectoryLocation,
            getSelectedPack,
            getSelectedWorld,
            getSavedPacks,
            getIsPackPlayMode,
            getIsPacksDirectoryReady,
            setSelectedPackId,
            setSelectedWorldId,
            persistPackSelection,
            requestPackConfirmation,
            askPackItemName,
            persistPacks,
            openWorldProperties,
            playPackStage,
            editPackStage,
            initializeStageCardReordering
        } = context;
        const {
            packEditorTitle,
            packEditorDescription,
            packEditorBreadcrumb,
            packEditorGrid,
            newPackButton,
            importPackButton,
            packsDirectoryButton,
            newWorldButton,
            importStageButton,
            saveStageToPackButton,
            exportPackButton,
            backToWorldsButton
        } = elements;

        function makePackCard({ kind, item, title, subtitle, icon, image, open, actions }) {
            const card = document.createElement('article');
            card.className = 'pack-editor-card';
            card.classList.toggle('has-actions', actions.length > 0);
            card.dataset.kind = kind;
            card.dataset.itemId = item.id;

            const openButton = document.createElement('button');
            openButton.type = 'button';
            openButton.className = 'pack-editor-card-open';
            openButton.setAttribute('aria-label', `Open ${kind} ${title}`);
            openButton.title = title;

            const thumbnail = document.createElement('div');
            thumbnail.className = 'pack-editor-card-thumbnail';
            if (image) {
                const imageElement = document.createElement('img');
                imageElement.src = image;
                imageElement.alt = '';
                imageElement.loading = 'lazy';
                thumbnail.append(imageElement);
            } else {
                thumbnail.textContent = icon;
            }
            openButton.append(thumbnail);

            const titleBlock = document.createElement('span');
            titleBlock.className = 'pack-editor-card-title';
            titleBlock.textContent = title;
            titleBlock.title = title;
            openButton.append(titleBlock);
            openButton.addEventListener('click', (event) => {
                if (openButton.dataset.suppressOpenClick === 'true') {
                    event.preventDefault();
                    delete openButton.dataset.suppressOpenClick;
                    return;
                }
                open();
            });

            if (kind === 'stage' && !getIsPackPlayMode()) {
                openButton.draggable = false;
                openButton.addEventListener('dragstart', (event) => event.preventDefault());
                initializeStageCardReordering();
            }
            card.append(openButton);

            if (actions.length > 0) {
                const actionArea = document.createElement('div');
                actionArea.className = 'pack-editor-card-actions';
                actions.forEach(({ label, onClick, primary = false }) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.textContent = label;
                    button.classList.toggle('pack-editor-primary', primary);
                    button.addEventListener('click', (event) => {
                        event.stopPropagation();
                        onClick();
                    });
                    actionArea.append(button);
                });
                card.append(actionArea);
            }
            packEditorGrid.append(card);
        }

        function makeEditActions(kind, item, parentItems) {
            return [
                {
                    label: 'Delete',
                    onClick: async () => {
                        if (!await requestPackConfirmation(
                            `Delete "${item.name}"? This cannot be undone.`
                        )) {
                            return;
                        }
                        parentItems.splice(parentItems.indexOf(item), 1);
                        persistPacks();
                        render();
                    }
                },
                {
                    label: 'Rename',
                    onClick: () => askPackItemName(
                        `Rename ${kind}`,
                        item.name,
                        (name) => {
                            if (!name) {
                                return;
                            }
                            item.name = name;
                            persistPacks();
                            render();
                        }
                    )
                },
                {
                    label: 'Duplicate',
                    onClick: async () => {
                        if (!await requestPackConfirmation(`Duplicate "${item.name}"?`)) {
                            return;
                        }
                        const duplicate = JSON.parse(JSON.stringify(item));
                        duplicate.id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                        duplicate.name = `${item.name} Copy`;
                        parentItems.splice(parentItems.indexOf(item) + 1, 0, duplicate);
                        persistPacks();
                        render();
                    }
                }
            ];
        }

        function makeEmptyState(titleText, descriptionText) {
            const emptyState = document.createElement('div');
            emptyState.className = 'pack-editor-empty-state';
            const title = document.createElement('h2');
            const description = document.createElement('p');
            title.textContent = titleText;
            description.textContent = descriptionText;
            emptyState.append(title, description);
            return emptyState;
        }

        function render() {
            updatePackDirectoryLocation();
            packEditorGrid.replaceChildren();
            const isPackPlayMode = getIsPackPlayMode();
            const isPacksDirectoryReady = getIsPacksDirectoryReady();
            const savedPacks = getSavedPacks();
            const pack = getSelectedPack();
            const world = getSelectedWorld(pack);

            packEditorTitle.textContent = isPackPlayMode ? 'Choose a Pack' : 'Pack Editor';
            packEditorDescription.textContent = isPackPlayMode
                ? 'Choose a pack, world, and stage to play'
                : 'Browse and organize packs, worlds, and stages';

            if (!world) {
                setSelectedWorldId(null);
            }
            packEditorBreadcrumb.replaceChildren();
            const addBreadcrumb = (label, onClick, isCurrent = false) => {
                const item = document.createElement(isCurrent ? 'span' : 'button');
                item.textContent = label;
                if (!isCurrent) {
                    item.type = 'button';
                    item.addEventListener('click', onClick);
                }
                packEditorBreadcrumb.append(item);
            };
            addBreadcrumb('Packs', () => {
                setSelectedPackId(null);
                setSelectedWorldId(null);
                if (!isPackPlayMode) {
                    persistPackSelection();
                }
                render();
            }, !pack);
            if (pack) {
                addBreadcrumb('›', null, true);
                addBreadcrumb(pack.name, () => {
                    setSelectedWorldId(null);
                    if (!isPackPlayMode) {
                        persistPackSelection();
                    }
                    render();
                }, !world);
            }
            if (world) {
                addBreadcrumb('›', null, true);
                addBreadcrumb(world.name, null, true);
            }

            newPackButton.hidden = Boolean(pack);
            importPackButton.hidden = Boolean(pack);
            newPackButton.disabled = !isPacksDirectoryReady;
            importPackButton.disabled = !isPacksDirectoryReady;
            packsDirectoryButton.hidden = isPackPlayMode && isPacksDirectoryReady;
            newWorldButton.hidden = !pack || Boolean(world);
            importStageButton.hidden = !world;
            saveStageToPackButton.hidden = !world;
            exportPackButton.hidden = !pack;
            backToWorldsButton.hidden = !world;

            if (!isPacksDirectoryReady && !isPackPlayMode) {
                packEditorGrid.append(makeEmptyState(
                    'Choose the Packs folder',
                    'The Pack Editor reads and saves packs directly in the selected folder.'
                ));
            } else if (!pack) {
                savedPacks.forEach((entry) => makePackCard({
                    kind: 'pack',
                    item: entry,
                    title: entry.name,
                    subtitle: `${entry.worlds.length} worlds`,
                    icon: '📦',
                    image: entry.thumbnail,
                    open: () => {
                        setSelectedPackId(entry.id);
                        setSelectedWorldId(null);
                        if (!isPackPlayMode) {
                            persistPackSelection();
                        }
                        render();
                    },
                    actions: isPackPlayMode ? [] : makeEditActions('pack', entry, savedPacks)
                }));
            } else if (!world) {
                pack.worlds.forEach((entry) => makePackCard({
                    kind: 'world',
                    item: entry,
                    title: entry.name,
                    subtitle: `${entry.stages.length} stages`,
                    icon: '📁',
                    image: entry.thumbnail,
                    open: () => {
                        setSelectedWorldId(entry.id);
                        if (!isPackPlayMode) {
                            persistPackSelection();
                        }
                        render();
                    },
                    actions: isPackPlayMode ? [] : [
                        ...makeEditActions('world', entry, pack.worlds),
                        {
                            label: 'Properties',
                            onClick: () => openWorldProperties(entry)
                        }
                    ]
                }));
            } else {
                world.stages.forEach((entry, index) => makePackCard({
                    kind: 'stage',
                    item: entry,
                    title: `${index + 1}. ${entry.name}`,
                    subtitle: 'Stage',
                    icon: '🗺',
                    image: entry.thumbnail,
                    open: () => {
                        if (isPackPlayMode) {
                            playPackStage(pack, world, entry);
                        } else {
                            editPackStage(pack, world, entry);
                        }
                    },
                    actions: isPackPlayMode ? [] : [
                        ...makeEditActions('stage', entry, world.stages),
                        {
                            label: 'Edit Stage',
                            onClick: () => editPackStage(pack, world, entry),
                            primary: true
                        }
                    ]
                }));
            }

            if (isPacksDirectoryReady && !packEditorGrid.children.length) {
                if (!pack) {
                    packEditorGrid.append(makeEmptyState(
                        isPackPlayMode ? 'No packs available' : 'No packs yet',
                        isPackPlayMode
                            ? 'Choose a Packs folder in Pack Editor to load packs for playing.'
                            : 'Create a new pack to organize your worlds and stages.'
                    ));
                } else if (!world) {
                    packEditorGrid.append(makeEmptyState(
                        'No worlds yet',
                        'Create a world to organize stages in this pack.'
                    ));
                } else {
                    packEditorGrid.append(makeEmptyState(
                        'No stages yet',
                        'Import a level from the clipboard or save the current stage.'
                    ));
                }
            }
        }

        return Object.freeze({ render });
    }

    global.BC90EPackEditorRenderer = Object.freeze({ createPackEditorRenderer });
})(window);
