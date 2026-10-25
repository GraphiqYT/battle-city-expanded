(function (global) {
    'use strict';

    function initEditorUi() {
        const tileSelector = document.getElementById('tileSelector');
        const canvasModeControls = document.getElementById('canvasModeControls');
        const mapZoomControls = document.getElementById('mapZoomControls');
        const pngExportDialog = document.getElementById('pngExportDialog');
        const settingsDialog = document.getElementById('settingsDialog');
        const messageDialog = document.getElementById('messageDialog');
        const packEditorScreen = document.getElementById('packEditorScreen');
        const startMenu = document.getElementById('startMenu');
        const appShell = document.querySelector('.app-shell');
        function syncCanvasModeControlSize() {
            if (!canvasModeControls) {
                return;
            }
            const root = document.documentElement;
            const toolSize = root.style.getPropertyValue('--canvas-tool-size');
            const buttonSize = root.style.getPropertyValue('--map-zoom-button-size');
            if (!toolSize && !buttonSize) {
                canvasModeControls.style.setProperty('--canvas-tool-size', '34px');
            }
        }

        function hideEditorPanels() {
            if (canvasModeControls) {
                canvasModeControls.hidden = true;
            }
            if (mapZoomControls) {
                mapZoomControls.hidden = true;
            }
            if (tileSelector) {
                tileSelector.hidden = true;
            }
        }

        function showEditorPanels() {
            if (canvasModeControls) {
                canvasModeControls.hidden = false;
            }
            if (mapZoomControls) {
                mapZoomControls.hidden = false;
            }
            if (tileSelector) {
                tileSelector.hidden = false;
            }
        }

        function openPngExport() {
            if (pngExportDialog) {
                pngExportDialog.showModal();
                if (typeof window.updatePngExportPreview === 'function') {
                    window.updatePngExportPreview();
                }
            }
        }

        function closePngExport() {
            if (pngExportDialog && pngExportDialog.open) {
                pngExportDialog.close();
            }
        }

        function showMessageDialog(messageText, options = {}) {
            const dialog = messageDialog;
            if (!dialog) {
                return;
            }

            const messageTextNode = document.getElementById('messageText');
            if (messageTextNode) {
                messageTextNode.textContent = messageText;
            }

            if (options.isConfirm) {
                const confirmActions = document.getElementById('messageConfirmActions');
                if (confirmActions) {
                    confirmActions.hidden = false;
                }
            }

            dialog.classList.add('visible');
            dialog.setAttribute('aria-hidden', 'false');
        }

        function closeMessageDialog() {
            if (messageDialog) {
                messageDialog.classList.remove('visible');
                messageDialog.setAttribute('aria-hidden', 'true');
            }
        }

        function openSettingsDialog() {
            if (settingsDialog) {
                settingsDialog.classList.add('menu-settings');
                settingsDialog.showModal();
            }
        }

        function closeSettingsDialog() {
            if (settingsDialog && settingsDialog.open) {
                settingsDialog.close();
            }
        }

        function prepareEditorShell() {
            hideEditorPanels();

            if (packEditorScreen) {
                packEditorScreen.hidden = true;
            }
            if (startMenu) {
                startMenu.hidden = false;
            }
            if (appShell) {
                appShell.hidden = true;
            }

            if (typeof window.addEventListener === 'function') {
                window.addEventListener('resize', syncCanvasModeControlSize);
            }
        }

        prepareEditorShell();

        global.BC90EEditorUi = {
            syncCanvasModeControlSize,
            hideEditorPanels,
            showEditorPanels,
            openPngExport,
            closePngExport,
            showMessageDialog,
            closeMessageDialog,
            openSettingsDialog,
            closeSettingsDialog,
            prepareEditorShell,
            elements: {
                tileSelector,
                canvasModeControls,
                mapZoomControls,
                pngExportDialog,
                settingsDialog,
                messageDialog,
                packEditorScreen
            }
        };
    }

    initEditorUi();
})(window);
