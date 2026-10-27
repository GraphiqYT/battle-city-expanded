(function (global) {
    'use strict';

    const STORAGE_KEYS = Object.freeze({
        MENU_FRAME: 'bc90e-menu-frame-v1',
        PACKS: 'bc90e-packs-v1',
        PACK_SELECTION: 'bc90e-selected-pack-v1',
        WORLD_SELECTION: 'bc90e-selected-world-v1',
        TOUCH_CONTROLS: 'bc90e-touch-controls-v1',
        PREFERENCES: 'bc90e-preferences-v1',
        THEME: 'bc90e-theme-v1',
        TILE_NAMES: 'bc90e-tile-names-v1'
    });

    const TOUCH_CONTROL_IDS = Object.freeze(['UP', 'LEFT', 'RIGHT', 'DOWN', 'FIRE']);
    const DEFAULT_TOUCH_PAD_SIZE = 52;
    const DEFAULT_TOUCH_FIRE_SIZE = 74;

    function createDefaultTouchControls() {
        const width = global.visualViewport?.width || global.innerWidth || 1;
        const height = global.visualViewport?.height || global.innerHeight || 1;
        const offsetX = (DEFAULT_TOUCH_PAD_SIZE + 4) / width * 100;
        const offsetY = (DEFAULT_TOUCH_PAD_SIZE + 4) / height * 100;
        return {
            controls: {
                UP: { x: 74, y: 78 - offsetY, size: DEFAULT_TOUCH_PAD_SIZE },
                LEFT: { x: 74 - offsetX, y: 78, size: DEFAULT_TOUCH_PAD_SIZE },
                RIGHT: { x: 74 + offsetX, y: 78, size: DEFAULT_TOUCH_PAD_SIZE },
                DOWN: { x: 74, y: 78 + offsetY, size: DEFAULT_TOUCH_PAD_SIZE },
                FIRE: { x: 15, y: 80, size: DEFAULT_TOUCH_FIRE_SIZE }
            }
        };
    }

    const DEFAULT_TOUCH_CONTROLS = createDefaultTouchControls();

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

    function readPreference(name, fallback) {
        try {
            const stored = global.localStorage?.getItem(STORAGE_KEYS.PREFERENCES);
            if (!stored) {
                return fallback;
            }
            const preferences = JSON.parse(stored);
            return Object.hasOwn(preferences, name) ? preferences[name] : fallback;
        } catch (error) {
            console.warn(`Unable to restore preference "${name}".`, error);
            return fallback;
        }
    }

    function writePreference(name, value) {
        try {
            const stored = global.localStorage?.getItem(STORAGE_KEYS.PREFERENCES);
            const preferences = stored ? JSON.parse(stored) : {};
            preferences[name] = value;
            global.localStorage?.setItem(
                STORAGE_KEYS.PREFERENCES,
                JSON.stringify(preferences)
            );
            return true;
        } catch (error) {
            console.warn(`Unable to persist preference "${name}".`, error);
            return false;
        }
    }

    function sanitizeTouchControls(raw = {}) {
        if (!raw || typeof raw !== 'object') {
            raw = {};
        }

        let controls = raw.controls;
        if (!controls || typeof controls !== 'object') {
            const legacyPad = raw.pad ?? { x: 74, y: 78 };
            const legacyFire = raw.fire ?? { x: 15, y: 80 };
            const width = global.visualViewport?.width || global.innerWidth || 1;
            const height = global.visualViewport?.height || global.innerHeight || 1;
            const padSize = Number.isFinite(raw.padSize)
                ? Math.min(200, Math.max(30, raw.padSize))
                : DEFAULT_TOUCH_PAD_SIZE;
            const fireSize = Number.isFinite(raw.fireSize)
                ? Math.min(200, Math.max(30, raw.fireSize))
                : DEFAULT_TOUCH_FIRE_SIZE;
            const offsetX = (padSize + 4) / width * 100;
            const offsetY = (padSize + 4) / height * 100;
            controls = {
                UP: { x: legacyPad.x, y: legacyPad.y - offsetY, size: padSize },
                LEFT: { x: legacyPad.x - offsetX, y: legacyPad.y, size: padSize },
                RIGHT: { x: legacyPad.x + offsetX, y: legacyPad.y, size: padSize },
                DOWN: { x: legacyPad.x, y: legacyPad.y + offsetY, size: padSize },
                FIRE: { ...legacyFire, size: fireSize }
            };
        }

        const normalizedControls = {};
        TOUCH_CONTROL_IDS.forEach((id) => {
            const control = controls[id];
            const fallback = DEFAULT_TOUCH_CONTROLS.controls[id];
            normalizedControls[id] = {
                x: Number.isFinite(control?.x)
                    ? Math.min(100, Math.max(0, control.x))
                    : fallback.x,
                y: Number.isFinite(control?.y)
                    ? Math.min(100, Math.max(0, control.y))
                    : fallback.y,
                size: Number.isFinite(control?.size)
                    ? Math.min(200, Math.max(30, control.size))
                    : fallback.size
            };
        });

        return { controls: normalizedControls };
    }

    function loadTouchControls() {
        try {
            const stored = global.localStorage?.getItem(STORAGE_KEYS.TOUCH_CONTROLS);
            const saved = stored ? JSON.parse(stored) : DEFAULT_TOUCH_CONTROLS;
            const normalized = sanitizeTouchControls(saved);
            if (stored && JSON.stringify(saved) !== JSON.stringify(normalized)) {
                persistNormalizedTouchControls(normalized);
            }
            return normalized;
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
        createDefaultTouchControls,
        readBooleanPreference,
        writeBooleanPreference,
        readPreference,
        writePreference,
        TOUCH_CONTROL_IDS,
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
