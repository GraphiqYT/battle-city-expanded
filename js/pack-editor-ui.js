(function (global) {
    'use strict';

    function initPackEditorUi() {
        const packEditorScreen = document.getElementById('packEditorScreen');
        const packEditorTitle = document.getElementById('packEditorTitle');
        const packEditorDescription = document.getElementById('packEditorDescription');
        const packEditorStatus = document.getElementById('packEditorStatus');
        const packEditorGrid = document.getElementById('packEditorGrid');
        const packEditorBreadcrumb = document.getElementById('packEditorBreadcrumb');
        const packsDirectoryButton = document.getElementById('packsDirectoryButton');
        const importPackButton = document.getElementById('importPackButton');
        const backToWorldsButton = document.getElementById('backToWorldsButton');
        const importStageButton = document.getElementById('importStageButton');
        const newPackButton = document.getElementById('newPackButton');
        const newWorldButton = document.getElementById('newWorldButton');
        const saveStageToPackButton = document.getElementById('saveStageToPackButton');
        const exportPackButton = document.getElementById('exportPackButton');
        const newPackDialog = document.getElementById('newPackDialog');
        const newWorldDialog = document.getElementById('newWorldDialog');
        const renamePackItemDialog = document.getElementById('renamePackItemDialog');

        function setPackEditorState(state) {
            if (!packEditorScreen) {
                return;
            }
            packEditorScreen.hidden = !state;
        }

        function updatePackEditorMeta(title, description) {
            if (packEditorTitle) {
                packEditorTitle.textContent = title || 'Pack Editor';
            }
            if (packEditorDescription) {
                packEditorDescription.textContent = description || 'Browse and organize packs, worlds, and stages';
            }
        }

        function updatePackEditorStatus(message, isError = false) {
            if (!packEditorStatus) {
                return;
            }
            packEditorStatus.textContent = message || '';
            packEditorStatus.dataset.error = isError ? 'true' : 'false';
        }

        function updatePackEditorGrid(content) {
            if (!packEditorGrid) {
                return;
            }
            packEditorGrid.replaceChildren();
            if (typeof content === 'string') {
                packEditorGrid.textContent = content;
                return;
            }
            if (Array.isArray(content)) {
                content.forEach((item) => packEditorGrid.append(item));
            }
        }

        function updateBreadcrumb(text) {
            if (packEditorBreadcrumb) {
                packEditorBreadcrumb.textContent = text || '';
            }
        }

        function hideActions() {
            [
                packsDirectoryButton,
                importPackButton,
                backToWorldsButton,
                importStageButton,
                newPackButton,
                newWorldButton,
                saveStageToPackButton,
                exportPackButton,
            ].forEach((button) => {
                if (button) {
                    button.hidden = true;
                }
            });
        }

        global.BC90EPackEditorUi = {
            setPackEditorState,
            updatePackEditorMeta,
            updatePackEditorStatus,
            updatePackEditorGrid,
            updateBreadcrumb,
            hideActions,
            elements: {
                packEditorScreen,
                packEditorTitle,
                packEditorDescription,
                packEditorStatus,
                packEditorGrid,
                packEditorBreadcrumb,
                packsDirectoryButton,
                importPackButton,
                backToWorldsButton,
                importStageButton,
                newPackButton,
                newWorldButton,
                saveStageToPackButton,
                exportPackButton,
                newPackDialog,
                newWorldDialog,
                renamePackItemDialog
            }
        };
    }

    initPackEditorUi();
})(window);
