(function (global) {
    'use strict';

    const TILE_CLICK_SELECTOR = [
        '.tile-button',
        '.enemy-order-tnt-button',
        '.enemy-powerup-toggle'
    ].join(', ');
    const INTERACTIVE_SELECTOR = `button:not(:disabled), ${TILE_CLICK_SELECTOR}`;
    const clickAnimationTimeouts = new WeakMap();
    const forwardedPowerUpLabels = new WeakSet();

    const audioSystem = global.BC90EAudioSystem;
    if (!audioSystem) {
        throw new Error('The audio system must load before UI interaction sounds.');
    }

    function getInteractiveControl(target) {
        if (!(target instanceof global.Element)) {
            return null;
        }
        return target.closest(INTERACTIVE_SELECTOR);
    }

    function playClickAnimation(control) {
        const previousTimeout = clickAnimationTimeouts.get(control);
        if (previousTimeout !== undefined) {
            global.clearTimeout(previousTimeout);
            control.classList.remove('ui-interaction-click');
            void control.offsetWidth;
        }

        control.classList.add('ui-interaction-click');
        const timeout = global.setTimeout(() => {
            control.classList.remove('ui-interaction-click');
            clickAnimationTimeouts.delete(control);
        }, 180);
        clickAnimationTimeouts.set(control, timeout);
    }

    global.document.addEventListener('pointerover', (event) => {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
            return;
        }

        const control = getInteractiveControl(event.target);
        if (!control || control.contains(event.relatedTarget)) {
            return;
        }
        audioSystem.playSoundEffect('uiAllButtonHover');
    });

    global.document.addEventListener('click', (event) => {
        const control = getInteractiveControl(event.target);
        if (!control) {
            return;
        }

        const powerUpLabel = event.target.closest('.enemy-powerup-toggle');
        const isPowerUpInput = event.target.matches(
            '.enemy-powerup-toggle input'
        );
        if (isPowerUpInput && forwardedPowerUpLabels.has(powerUpLabel)) {
            forwardedPowerUpLabels.delete(powerUpLabel);
            return;
        }
        if (powerUpLabel && !isPowerUpInput) {
            forwardedPowerUpLabels.add(powerUpLabel);
            global.queueMicrotask(() => {
                forwardedPowerUpLabels.delete(powerUpLabel);
            });
        }

        const sound = control.matches(TILE_CLICK_SELECTOR)
            ? 'uiTileClick'
            : 'uiButtonClick';
        audioSystem.playSoundEffect(sound);
        playClickAnimation(control);
    });
})(window);
