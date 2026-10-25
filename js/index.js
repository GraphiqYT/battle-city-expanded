(function (global) {
    'use strict';

    function initIndexShell() {
        const appShell = document.querySelector('.app-shell');
        const startMenu = document.getElementById('startMenu');
        const packEditorScreen = document.getElementById('packEditorScreen');

        if (appShell) {
            appShell.dataset.shell = 'editor';
        }
        if (startMenu) {
            startMenu.hidden = false;
        }
        if (packEditorScreen) {
            packEditorScreen.hidden = true;
        }

        if (global.BC90EAppBootstrap && typeof global.BC90EAppBootstrap.ensureAppReady === 'function') {
            global.BC90EAppBootstrap.ensureAppReady();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIndexShell, { once: true });
    } else {
        initIndexShell();
    }

    global.BC90EIndexShell = Object.freeze({ initIndexShell });
})(window);
