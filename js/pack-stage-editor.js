(function (global) {
    'use strict';

    function createPackStageEditorApi(context) {
        const {
            appShell,
            startMenu,
            packEditorScreen,
            menuButton,
            backToPackEditorButton,
            savePackStageButton,
            levelCode,
            importLevel,
            applyWorldProperties,
            renderPackEditor,
            makeStageThumbnail,
            persistPacks,
            savedPacks,
            showMessage,
            packEditorStatus,
            requestPackConfirmation,
            findSelectedPack,
            findSelectedWorld,
            compileLevelData,
            hasUnsavedLevelChanges,
            setHasUnsavedLevelChanges,
            windowRef = global
        } = context || {};

        function editPackStage(pack, world, stage) {
            if (!levelCode || typeof importLevel !== 'function') {
                return;
            }
            levelCode.value = stage.code;
            if (!importLevel()) {
                return;
            }
            if (typeof setHasUnsavedLevelChanges === 'function') {
                setHasUnsavedLevelChanges(false);
            } else {
                hasUnsavedLevelChanges = false;
            }
            if (typeof applyWorldProperties === 'function') {
                applyWorldProperties(world);
            }
            if (packEditorScreen) {
                packEditorScreen.hidden = true;
            }
            if (document.body) {
                document.body.classList.remove('pack-editor-open');
            }
            if (appShell) {
                appShell.hidden = false;
            }
            if (startMenu) {
                startMenu.hidden = true;
            }
            if (menuButton) {
                menuButton.hidden = true;
            }
            if (backToPackEditorButton) {
                backToPackEditorButton.hidden = false;
            }
            if (savePackStageButton) {
                savePackStageButton.hidden = false;
            }
            if (typeof windowRef.requestAnimationFrame === 'function') {
                windowRef.requestAnimationFrame(context.resizeCanvas);
            }
        }

        function finishPackStageEdit() {
            if (context && typeof context.clearPackWorldAutoAdvance === 'function') {
                context.clearPackWorldAutoAdvance();
            }
            if (typeof setHasUnsavedLevelChanges === 'function') {
                setHasUnsavedLevelChanges(false);
            } else {
                hasUnsavedLevelChanges = false;
            }
            if (backToPackEditorButton) {
                backToPackEditorButton.hidden = true;
            }
            if (savePackStageButton) {
                savePackStageButton.hidden = true;
            }
            if (menuButton) {
                menuButton.hidden = false;
            }
            if (packEditorScreen) {
                packEditorScreen.hidden = false;
            }
            if (appShell) {
                appShell.hidden = true;
            }
            if (document.body) {
                document.body.classList.add('pack-editor-open');
            }
            if (startMenu) {
                startMenu.hidden = true;
            }
            if (typeof renderPackEditor === 'function') {
                renderPackEditor();
            }
        }

        async function saveCurrentPackStage() {
            const editingPackStage = typeof context.getEditingPackStage === 'function'
                ? context.getEditingPackStage()
                : context.editingPackStage;
            if (!editingPackStage || typeof requestPackConfirmation !== 'function') {
                return false;
            }
            if (!await requestPackConfirmation(
                'Save these changes to this stage and return to Pack Editor?'
            )) {
                return false;
            }

            const pack = savedPacks?.find((entry) => entry.id === editingPackStage.packId);
            const world = pack?.worlds.find((entry) => entry.id === editingPackStage.worldId);
            const stage = world?.stages.find((entry) => entry.id === editingPackStage.stageId);
            if (!stage) {
                if (typeof showMessage === 'function') {
                    showMessage('The edited stage no longer exists in this pack.');
                }
                return false;
            }
            const code = typeof compileLevelData === 'function'
                ? compileLevelData(context.levelName?.value ?? '', false)
                : null;
            if (code === null) {
                return false;
            }

            try {
                const levelNameValue = context.levelName?.value ?? '';
                stage.name = levelNameValue.trim() || stage.name;
                stage.code = code;
                stage.thumbnail = typeof makeStageThumbnail === 'function'
                    ? makeStageThumbnail()
                    : stage.thumbnail;
                if (!persistPacks()) {
                    return false;
                }
                finishPackStageEdit();
                return true;
            } catch (error) {
                if (packEditorStatus) {
                    packEditorStatus.textContent = `Could not save the stage thumbnail: ${error.message}`;
                    packEditorStatus.dataset.error = 'true';
                }
                if (packEditorScreen) {
                    packEditorScreen.hidden = false;
                }
                if (document.body) {
                    document.body.classList.add('pack-editor-open');
                }
                return false;
            }
        }

        return {
            editPackStage,
            finishPackStageEdit,
            saveCurrentPackStage,
            applyWorldProperties: (world) => {
                if (typeof context.applyWorldProperties === 'function') {
                    return context.applyWorldProperties(world);
                }
            }
        };
    }

    global.BC90EPackStageEditor = Object.freeze({
        createPackStageEditorApi
    });
})(window);
