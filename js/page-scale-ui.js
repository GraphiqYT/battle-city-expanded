(function (global) {
    'use strict';

    function createPageScaleUi({
        enabledInput,
        scaleInput,
        scaleValue,
        appShell,
        applyTouchControlSettings,
        getMapBaseWidth,
        resizeCanvas,
        settings
    }) {
        const savedPageScale = settings.readPreference('pageScale', {});
        if (savedPageScale && typeof savedPageScale === 'object') {
            enabledInput.checked = savedPageScale.enabled === true;
            const scale = Number(savedPageScale.scale);
            if (Number.isFinite(scale)) {
                scaleInput.value = String(Math.min(100, Math.max(60, scale)));
            }
        }

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
            settings.writePreference('pageScale', { enabled: isEnabled, scale });
            applyTouchControlSettings();
            if (getMapBaseWidth() > 0) {
                resizeCanvas();
            }
        }

        return Object.freeze({ update });
    }

    global.BC90EPageScaleUi = Object.freeze({ createPageScaleUi });
})(window);
