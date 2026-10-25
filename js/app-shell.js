(function (global) {
    'use strict';

    const MENU_FRAME_STORAGE_KEY = 'bc90e-menu-frame-v1';

    function readMenuFramePreference() {
        try {
            return global.localStorage?.getItem(MENU_FRAME_STORAGE_KEY) === 'true';
        } catch (error) {
            console.error('Could not restore the menu frame setting.', error);
            return false;
        }
    }

    function applyMenuFrameState(isEnabled) {
        const input = document.getElementById('menuFrameToggleInput');
        const shouldShow = Boolean(isEnabled);
        if (input) {
            input.checked = shouldShow;
        }
        document.body.classList.toggle('show-menu-frame', shouldShow);
    }

    function setMenuFramePreference(isEnabled) {
        try {
            global.localStorage?.setItem(MENU_FRAME_STORAGE_KEY, String(Boolean(isEnabled)));
        } catch (error) {
            console.error('Could not save the menu frame setting.', error);
        }
    }

    global.BC90EAppShell = Object.freeze({
        MENU_FRAME_STORAGE_KEY,
        readMenuFramePreference,
        applyMenuFrameState,
        setMenuFramePreference
    });

    if (document.readyState !== 'loading') {
        applyMenuFrameState(readMenuFramePreference());
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            applyMenuFrameState(readMenuFramePreference());
        }, { once: true });
    }
})(window);
