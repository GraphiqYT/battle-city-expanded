(function (global) {
    'use strict';

    const STORAGE_KEYS = Object.freeze({
        MENU_FRAME: 'bc90e-menu-frame-v1',
        PACKS: 'bc90e-packs-v1',
        PACK_SELECTION: 'bc90e-selected-pack-v1',
        WORLD_SELECTION: 'bc90e-selected-world-v1',
        TOUCH_CONTROLS: 'bc90e-touch-controls-v1',
        THEME: 'bc90e-theme-v1',
        TILE_NAMES: 'bc90e-tile-names-v1'
    });

    const DEFAULT_TOUCH_CONTROLS = Object.freeze({
        pad: Object.freeze({ x: 74, y: 78 }),
        fire: Object.freeze({ x: 15, y: 80 }),
        padSize: 52,
        fireSize: 74
    });

    function safeParse(value, fallback) {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function readBooleanPreference(key, fallback) {
        const stored = global.localStorage?.getItem(key);
        if (stored === null || stored === undefined) {
            return fallback;
        }
        return stored === 'true';
    }

    function writeBooleanPreference(key, value) {
        try {
            global.localStorage?.setItem(key, String(Boolean(value)));
        } catch (error) {
            console.warn(`Unable to persist boolean preference ${key}.`, error);
        }
    }

    function sanitizeTouchControls(raw = {}) {
        if (!raw || typeof raw !== 'object') {
            raw = {};
        }

        const fallback = {
            pad: { ...DEFAULT_TOUCH_CONTROLS.pad },
            fire: { ...DEFAULT_TOUCH_CONTROLS.fire },
            padSize: DEFAULT_TOUCH_CONTROLS.padSize,
            fireSize: DEFAULT_TOUCH_CONTROLS.fireSize
        };

        const clampPosition = (position, fallbackPosition) => ({
            x: Number.isFinite(position?.x)
                ? Math.min(100, Math.max(0, position.x))
                : fallbackPosition.x,
            y: Number.isFinite(position?.y)
                ? Math.min(100, Math.max(0, position.y))
                : fallbackPosition.y
        });

        return {
            pad: clampPosition(raw.pad, fallback.pad),
            fire: clampPosition(raw.fire, fallback.fire),
            padSize: Number.isFinite(raw.padSize)
                ? Math.min(100, Math.max(40, raw.padSize))
                : fallback.padSize,
            fireSize: Number.isFinite(raw.fireSize)
                ? Math.min(120, Math.max(48, raw.fireSize))
                : fallback.fireSize
        };
    }

    function loadTouchControls() {
        try {
            const stored = global.localStorage?.getItem(STORAGE_KEYS.TOUCH_CONTROLS);
            const saved = stored ? JSON.parse(stored) : DEFAULT_TOUCH_CONTROLS;
            return sanitizeTouchControls(saved);
        } catch (error) {
            console.error('Could not restore touch control settings.', error);
            return sanitizeTouchControls(DEFAULT_TOUCH_CONTROLS);
        }
    }

    function persistTouchControls(settings) {
        const normalized = sanitizeTouchControls(settings || DEFAULT_TOUCH_CONTROLS);
        return persistNormalizedTouchControls(normalized);
    }

    function persistNormalizedTouchControls(settings) {
        try {
            global.localStorage?.setItem(
                STORAGE_KEYS.TOUCH_CONTROLS,
                JSON.stringify(settings)
            );
            return true;
        } catch (error) {
            console.error('Could not save touch control settings.', error);
            return false;
        }
    }

    function saveTouchControls(settings) {
        const normalized = sanitizeTouchControls(settings || DEFAULT_TOUCH_CONTROLS);
        persistNormalizedTouchControls(normalized);
        return normalized;
    }

    function persistMenuFrame(enabled) {
        writeBooleanPreference(STORAGE_KEYS.MENU_FRAME, enabled);
    }

    function isMenuFrameEnabled() {
        return readBooleanPreference(STORAGE_KEYS.MENU_FRAME, false);
    }

    function persistTheme(isLightTheme) {
        try {
            global.localStorage?.setItem(STORAGE_KEYS.THEME, isLightTheme ? 'light' : 'dark');
        } catch (error) {
            console.error('Could not save theme preference.', error);
        }
    }

    function readThemePreference() {
        try {
            const raw = global.localStorage?.getItem(STORAGE_KEYS.THEME);
            return raw === 'light' ? 'light' : 'dark';
        } catch (error) {
            return 'dark';
        }
    }

    function persistTileNamesVisible(isVisible) {
        writeBooleanPreference(STORAGE_KEYS.TILE_NAMES, isVisible);
    }

    function readTileNamesVisible() {
        return readBooleanPreference(STORAGE_KEYS.TILE_NAMES, false);
    }

    global.BC90ESettings = {
        STORAGE_KEYS,
        DEFAULT_TOUCH_CONTROLS,
        readBooleanPreference,
        writeBooleanPreference,
        loadTouchControls,
        persistTouchControls,
        saveTouchControls,
        persistMenuFrame,
        isMenuFrameEnabled,
        persistTheme,
        readThemePreference,
        persistTileNamesVisible,
        readTileNamesVisible,
        safeParse
    };

    global.BC90EStorage = global.BC90EStorage || {
        getBoolean: readBooleanPreference,
        setBoolean: writeBooleanPreference,
        getTheme: readThemePreference,
        setTheme: persistTheme,
        getTouchControls: loadTouchControls,
        setTouchControls: saveTouchControls,
        getTileNamesVisible: readTileNamesVisible,
        setTileNamesVisible: persistTileNamesVisible
    };
})(window);
