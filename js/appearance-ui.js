(function (global) {
    'use strict';

    function createAppearanceUi({
        themeToggleButton,
        roundedUiButton,
        pixelatedUiButton,
        pixelatedUiFontSizeInput,
        setToggleButtonState,
        settings
    }) {
        const savedAppearanceValue = settings.readPreference('appearance', {});
        const savedAppearance = savedAppearanceValue &&
            typeof savedAppearanceValue === 'object'
            ? savedAppearanceValue
            : {};
        let isRounded = Boolean(savedAppearance.rounded);
        let isPixelated = savedAppearance.pixelated !== false;
        let isLightTheme = settings.readThemePreference() === 'light';
        let pixelatedFontSize = Number.isFinite(savedAppearance.fontSize)
            ? Math.min(24, Math.max(4, savedAppearance.fontSize))
            : 8;

        function persistAppearance() {
            settings.writePreference('appearance', {
                rounded: isRounded,
                pixelated: isPixelated,
                fontSize: pixelatedFontSize
            });
        }

        function updateTheme() {
            document.body.classList.toggle('light-theme', isLightTheme);
            themeToggleButton.textContent = `Theme: ${isLightTheme ? 'Light' : 'Dark'}`;
            themeToggleButton.setAttribute('aria-pressed', String(isLightTheme));
            setToggleButtonState(themeToggleButton, isLightTheme);
            settings.persistTheme(isLightTheme);
        }

        function setPixelatedFontSize(value) {
            const requestedSize = Number.parseInt(value, 10);
            pixelatedFontSize = Math.min(
                24,
                Math.max(4, Number.isFinite(requestedSize) ? requestedSize : 10)
            );
            pixelatedUiFontSizeInput.value = String(pixelatedFontSize);
            document.body.style.setProperty(
                '--pixelated-ui-font-size',
                `${pixelatedFontSize}px`
            );
            persistAppearance();
        }

        function initialize() {
            setToggleButtonState(roundedUiButton, isRounded);
            setToggleButtonState(pixelatedUiButton, isPixelated);
            document.body.classList.toggle('rounded-ui', isRounded);
            updateTheme();
            pixelatedUiButton.textContent = `Pixelated UI: ${isPixelated ? 'ON' : 'OFF'}`;
            pixelatedUiButton.setAttribute('aria-pressed', String(isPixelated));
            document.body.classList.toggle('pixelated-ui', isPixelated);
            pixelatedUiFontSizeInput.value = String(pixelatedFontSize);
            setPixelatedFontSize(pixelatedFontSize);
            persistAppearance();
        }

        themeToggleButton.addEventListener('click', () => {
            isLightTheme = !isLightTheme;
            updateTheme();
        });

        roundedUiButton.addEventListener('click', () => {
            isRounded = !isRounded;
            document.body.classList.toggle('rounded-ui', isRounded);
            roundedUiButton.textContent = `Rounded UI: ${isRounded ? 'ON' : 'OFF'}`;
            setToggleButtonState(roundedUiButton, isRounded);
            persistAppearance();
        });

        pixelatedUiButton.addEventListener('click', () => {
            isPixelated = !isPixelated;
            document.body.classList.toggle('pixelated-ui', isPixelated);
            pixelatedUiButton.textContent = `Pixelated UI: ${isPixelated ? 'ON' : 'OFF'}`;
            pixelatedUiButton.setAttribute('aria-pressed', String(isPixelated));
            setToggleButtonState(pixelatedUiButton, isPixelated);
            persistAppearance();
        });

        pixelatedUiFontSizeInput.addEventListener('change', () => {
            setPixelatedFontSize(pixelatedUiFontSizeInput.value);
        });

        return Object.freeze({ initialize });
    }

    global.BC90EAppearanceUi = Object.freeze({ createAppearanceUi });
})(window);
