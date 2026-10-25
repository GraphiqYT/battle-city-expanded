(function (global) {
    'use strict';

    function openWorldProperties(world, options) {
        const {
            dialog,
            worldForceLivesInput,
            worldInitialLivesInput,
            worldAutoAdvanceInput,
            onOpen
        } = options || {};

        if (!dialog || !worldForceLivesInput || !worldInitialLivesInput || !worldAutoAdvanceInput) {
            return;
        }

        if (typeof onOpen === 'function') {
            onOpen(world);
        }

        const properties = world?.properties ?? {};
        worldForceLivesInput.checked = Boolean(properties.forceInitialLives);
        worldInitialLivesInput.value = String(properties.initialLives ?? 3);
        worldAutoAdvanceInput.checked = Boolean(properties.autoAdvance);
        if (typeof dialog.showModal === 'function' && !dialog.open) {
            dialog.showModal();
        }
    }

    function bindPackEditorDialogs(options) {
        const {
            newPackDialog,
            newPackForm,
            newPackNameInput,
            cancelNewPackButton,
            newWorldDialog,
            newWorldForm,
            newWorldNameInput,
            cancelNewWorldButton,
            worldPropertiesDialog,
            worldPropertiesForm,
            worldForceLivesInput,
            worldInitialLivesInput,
            worldAutoAdvanceInput,
            cancelWorldPropertiesButton,
            onCreatePack,
            onCreateWorld,
            onSaveWorldProperties,
            onWorldPropertiesOpen
        } = options || {};

        if (newPackDialog && newPackForm && newPackNameInput) {
            if (!newPackForm.dataset.bc90eBound) {
                newPackForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    const name = String(newPackNameInput.value || '').trim();
                    if (!name) {
                        newPackNameInput.focus();
                        return;
                    }
                    if (typeof onCreatePack === 'function') {
                        onCreatePack(name);
                    }
                });
                newPackForm.dataset.bc90eBound = 'true';
            }
            if (cancelNewPackButton) {
                cancelNewPackButton.onclick = () => newPackDialog.close();
            }
            if (!newPackDialog.dataset.bc90eResetBound) {
                newPackDialog.addEventListener('close', () => {
                    newPackNameInput.value = '';
                });
                newPackDialog.dataset.bc90eResetBound = 'true';
            }
        }

        if (newWorldDialog && newWorldForm && newWorldNameInput) {
            if (!newWorldForm.dataset.bc90eBound) {
                newWorldForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    const name = String(newWorldNameInput.value || '').trim();
                    if (!name) {
                        newWorldNameInput.focus();
                        return;
                    }
                    if (typeof onCreateWorld === 'function') {
                        onCreateWorld(name);
                    }
                });
                newWorldForm.dataset.bc90eBound = 'true';
            }
            if (cancelNewWorldButton) {
                cancelNewWorldButton.onclick = () => newWorldDialog.close();
            }
            if (!newWorldDialog.dataset.bc90eResetBound) {
                newWorldDialog.addEventListener('close', () => {
                    newWorldNameInput.value = '';
                });
                newWorldDialog.dataset.bc90eResetBound = 'true';
            }
        }

        if (
            worldPropertiesDialog &&
            worldPropertiesForm &&
            worldForceLivesInput &&
            worldInitialLivesInput &&
            worldAutoAdvanceInput
        ) {
            if (!worldPropertiesForm.dataset.bc90eBound) {
                worldPropertiesForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    if (typeof onSaveWorldProperties === 'function') {
                        onSaveWorldProperties({
                            forceInitialLives: worldForceLivesInput.checked,
                            initialLives: Math.min(999, Math.max(0, Number(worldInitialLivesInput.value) || 0)),
                            autoAdvance: worldAutoAdvanceInput.checked
                        });
                    }
                });
                worldPropertiesForm.dataset.bc90eBound = 'true';
            }
            if (cancelWorldPropertiesButton) {
                cancelWorldPropertiesButton.onclick = () => {
                    worldPropertiesDialog.close();
                };
            }
        }

        return {
            openWorldProperties: (world) => openWorldProperties(world, {
                dialog: worldPropertiesDialog,
                worldForceLivesInput,
                worldInitialLivesInput,
                worldAutoAdvanceInput,
                onOpen: onWorldPropertiesOpen
            }),
            openNewPackDialog: () => {
                if (newPackDialog && typeof newPackDialog.showModal === 'function') {
                    newPackDialog.showModal();
                }
            },
            openNewWorldDialog: () => {
                if (newWorldDialog && typeof newWorldDialog.showModal === 'function') {
                    newWorldDialog.showModal();
                }
            }
        };
    }

    global.BC90EPackEditorDialogs = Object.freeze({
        bindPackEditorDialogs,
        openWorldProperties
    });
})(window);
