(function (global) {
    'use strict';

    const settingsDialog = document.getElementById('settingsDialog');
    if (settingsDialog && settingsDialog.parentElement !== document.body) {
        document.body.append(settingsDialog);
    }

    function ensureElements() {
        return {
            startMenu: document.getElementById('startMenu'),
            appShell: document.querySelector('.app-shell'),
            gamePlayScreen: document.getElementById('gamePlayScreen'),
            packEditorScreen: document.getElementById('packEditorScreen'),
            settingsDialog: document.getElementById('settingsDialog'),
            settingsButton: document.getElementById('settingsButton'),
            menuButton: document.getElementById('menuButton'),
            returnFromPackEditorButton: document.getElementById('returnFromPackEditorButton'),
            openMenuSettingsButton: document.getElementById('openMenuSettingsButton'),
            openEditorButton: document.getElementById('openEditorButton'),
            openPackEditorButton: document.getElementById('openPackEditorButton'),
            playFromMenuButton: document.getElementById('playFromMenuButton'),
            gamePlayReturnButton: document.getElementById('gamePlayReturnButton')
        };
    }

    function showScreen(state) {
        const elements = ensureElements();
        const startMenuVisible = state === 'startMenu';
        const appShellVisible = state === 'editor';
        const gameplayVisible = state === 'gameplay';
        const packEditorVisible = state === 'packEditor';

        if (elements.startMenu) {
            elements.startMenu.hidden = !startMenuVisible;
        }
        if (elements.appShell) {
            elements.appShell.hidden = !appShellVisible;
        }
        if (elements.gamePlayScreen) {
            elements.gamePlayScreen.hidden = !gameplayVisible;
        }
        if (elements.packEditorScreen) {
            elements.packEditorScreen.hidden = !packEditorVisible;
        }

        if (elements.menuButton) {
            elements.menuButton.hidden = !appShellVisible && !gameplayVisible;
        }
    }

    function openEditor() {
        const { appShell, startMenu, packEditorScreen } = ensureElements();
        if (startMenu) {
            startMenu.hidden = true;
        }
        if (packEditorScreen) {
            packEditorScreen.hidden = true;
        }
        if (appShell) {
            appShell.hidden = false;
        }
        if (typeof global.resizeCanvas === 'function') {
            global.requestAnimationFrame(global.resizeCanvas);
        }
        return true;
    }

    function openPackEditor() {
        const { startMenu, appShell, gamePlayScreen, packEditorScreen } = ensureElements();
        if (startMenu) {
            startMenu.hidden = true;
        }
        if (appShell) {
            appShell.hidden = true;
        }
        if (gamePlayScreen) {
            gamePlayScreen.hidden = true;
        }
        if (packEditorScreen) {
            packEditorScreen.hidden = false;
        }
        document.body.classList.add('pack-editor-open');
        return true;
    }

    function returnToMenu() {
        const { startMenu, appShell, gamePlayScreen, packEditorScreen } = ensureElements();
        if (packEditorScreen) {
            packEditorScreen.hidden = true;
        }
        document.body.classList.remove('pack-editor-open');
        if (gamePlayScreen) {
            gamePlayScreen.hidden = true;
        }
        if (appShell) {
            appShell.hidden = true;
        }
        if (startMenu) {
            startMenu.hidden = false;
        }
        return true;
    }

    function openSettingsDialog() {
        const dialog = settingsDialog;
        if (!dialog) {
            return false;
        }
        dialog.classList.add('menu-settings');
        if (dialog.hasAttribute('open')) {
            return true;
        }
        if (typeof dialog.showModal === 'function') {
            try {
                dialog.showModal();
                return true;
            } catch (error) {
                console.warn('Could not open the native settings dialog; using fallback.', error);
            }
        }
        dialog.setAttribute('open', '');
        document.body.classList.add('settings-dialog-fallback-open');
        return true;
    }

    function closeSettingsDialog() {
        const dialog = settingsDialog;
        if (!dialog) {
            return false;
        }
        dialog.classList.remove('menu-settings');
        if (typeof dialog.close === 'function' && dialog.open) {
            dialog.close();
            return true;
        }
        dialog.removeAttribute('open');
        document.body.classList.remove('settings-dialog-fallback-open');
        return true;
    }

    function bindReturnControls(handlers) {
        const { menuButton, returnFromPackEditorButton, gamePlayReturnButton } =
            ensureElements();
        const bindings = [
            [menuButton, handlers.onMenuReturn],
            [returnFromPackEditorButton, handlers.onPackEditorReturn],
            [gamePlayReturnButton, handlers.onGameplayReturn]
        ];

        bindings.forEach(([button, handler]) => {
            if (button && typeof handler === 'function') {
                button.addEventListener('click', handler);
            }
        });
    }

    global.BC90EAppNavigation = Object.freeze({
        showScreen,
        openEditor,
        openPackEditor,
        returnToMenu,
        openSettingsDialog,
        closeSettingsDialog,
        bindReturnControls,
        ensureElements
    });

    global.returnToMenu = returnToMenu;
    global.openSettingsDialog = openSettingsDialog;
    global.closeSettingsDialog = closeSettingsDialog;
    global.openPackEditor = openPackEditor;
    global.openEditor = openEditor;
})(window);
