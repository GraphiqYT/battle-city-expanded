(function (global) {
    'use strict';

    function createPageScaleUi({
        enabledInput,
        scaleInput,
        scaleValue,
        appShell,
        applyTouchControlSettings,
        getMapBaseWidth,
        resizeCanvas
    }) {
        function update() {
            const isEnabled = enabledInput.checked;
            const scale = Number(scaleInput.value);
            scaleInput.disabled = !isEnabled;
            scaleValue.textContent = `${scale}%`;
            global.document.documentElement.style.setProperty(
                '--touch-control-page-scale',
                isEnabled ? String(scale / 100) : '1'
            );
            appShell.style.zoom = isEnabled ? `${scale}%` : '';
            applyTouchControlSettings();
            if (getMapBaseWidth() > 0) {
                resizeCanvas();
            }
        }

        return Object.freeze({ update });
    }

    global.BC90EPageScaleUi = Object.freeze({ createPageScaleUi });
})(window);
