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
        let isRounded = false;
        let isPixelated = true;
        let isLightTheme = settings.readThemePreference() === 'light';
        let pixelatedFontSize = 8;

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
        }

        function initialize() {
            setToggleButtonState(roundedUiButton, isRounded);
            setToggleButtonState(pixelatedUiButton, isPixelated);
            updateTheme();
            pixelatedUiButton.textContent = `Pixelated UI: ${isPixelated ? 'ON' : 'OFF'}`;
            pixelatedUiButton.setAttribute('aria-pressed', String(isPixelated));
            document.body.classList.toggle('pixelated-ui', isPixelated);
            setPixelatedFontSize(pixelatedUiFontSizeInput.value);
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
        });

        pixelatedUiButton.addEventListener('click', () => {
            isPixelated = !isPixelated;
            document.body.classList.toggle('pixelated-ui', isPixelated);
            pixelatedUiButton.textContent = `Pixelated UI: ${isPixelated ? 'ON' : 'OFF'}`;
            pixelatedUiButton.setAttribute('aria-pressed', String(isPixelated));
            setToggleButtonState(pixelatedUiButton, isPixelated);
        });

        pixelatedUiFontSizeInput.addEventListener('change', () => {
            setPixelatedFontSize(pixelatedUiFontSizeInput.value);
        });

        return Object.freeze({ initialize });
    }

    global.BC90EAppearanceUi = Object.freeze({ createAppearanceUi });
})(window);
