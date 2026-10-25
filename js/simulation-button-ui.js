(function (global) {
    'use strict';

    function initializeSimulationButton(button) {
        function fitText() {
            const styles = global.getComputedStyle(button);
            const canvas = document.createElement('canvas');
            const textContext = canvas.getContext('2d');
            if (!textContext) {
                return;
            }
            const baseFontSize = 15;
            textContext.font =
                `${styles.fontWeight} ${baseFontSize}px ${styles.fontFamily}`;
            const text = button.textContent.trim();
            const letterSpacing = Number.parseFloat(styles.letterSpacing) || 0;
            const textWidth = textContext.measureText(text).width +
                Math.max(0, text.length - 1) * letterSpacing;
            const availableWidth = button.clientWidth -
                Number.parseFloat(styles.paddingLeft) -
                Number.parseFloat(styles.paddingRight) -
                Number.parseFloat(styles.borderLeftWidth) -
                Number.parseFloat(styles.borderRightWidth);
            if (availableWidth <= 0 || textWidth <= 0) {
                return;
            }
            button.style.fontSize =
                `${Math.min(baseFontSize, Math.max(8, baseFontSize * availableWidth / textWidth))}px`;
        }

        const resizeObserver = new ResizeObserver(fitText);
        resizeObserver.observe(button);
        fitText();
        document.fonts?.ready.then(fitText);
        return fitText;
    }

    global.BC90ESimulationButtonUi = Object.freeze({ initializeSimulationButton });
})(window);
