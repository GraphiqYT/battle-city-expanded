(function (global) {
    'use strict';

    function initAppBootstrap() {
        const appShell = document.querySelector('.app-shell');
        let hasStartedRuntime = false;

        function startAppRuntime() {
            if (hasStartedRuntime) {
                return;
            }
            hasStartedRuntime = true;

            if (typeof window.resizeCanvas === 'function') {
                window.resizeCanvas();
            }
            if (typeof window.renderFrame === 'function') {
                window.requestAnimationFrame(window.renderFrame);
            }
            if (typeof window.prepareStartupAssets === 'function') {
                void window.prepareStartupAssets();
            }
        }

        function ensureAppReady() {
            if (appShell) {
                appShell.hidden = false;
            }
            startAppRuntime();
        }

        return {
            ensureAppReady,
            startAppRuntime
        };
    }

    global.BC90EAppBootstrap = initAppBootstrap();
    global.BC90EAppBootstrap.ensureAppReady();
})(window);
