(function (global) {
    'use strict';

    function createGameplayLifecycle({
        shouldPause,
        isSimulationActive,
        isGameOver,
        isResumePending,
        setResumePending,
        setGamePaused,
        isPackGameActive,
        setEditorInactivePauseVisible,
        setGamePauseVisible,
        clearGameInputState,
        clearPlayerSliding,
        stopPlayerMovement,
        stopMovementAudio,
        resetFrameTime
    }) {
        function pauseForBackground() {
            if (!shouldPause()) {
                return;
            }

            setResumePending(true);
            setGamePaused(true);
            if (!isPackGameActive()) {
                setEditorInactivePauseVisible(true);
            }
            clearGameInputState();
            clearPlayerSliding();
            stopPlayerMovement();
            stopMovementAudio();
        }

        function resumeFromBackground() {
            if (!isResumePending()) {
                return;
            }
            setResumePending(false);

            if (!isSimulationActive() || isGameOver()) {
                return;
            }

            setGamePaused(false);
            setEditorInactivePauseVisible(false);
            setGamePauseVisible(false);
            resetFrameTime();
        }

        global.addEventListener('blur', () => {
            clearGameInputState();
            pauseForBackground();
        });
        global.addEventListener('focus', () => {
            if (!document.hidden) {
                resumeFromBackground();
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearGameInputState();
                pauseForBackground();
            } else {
                resumeFromBackground();
            }
        });
        global.addEventListener('pagehide', () => {
            clearGameInputState();
            pauseForBackground();
        });
        global.addEventListener('pageshow', () => {
            if (!document.hidden) {
                resumeFromBackground();
            }
        });

        return Object.freeze({ pauseForBackground, resumeFromBackground });
    }

    global.BC90EGameplayLifecycle = Object.freeze({ createGameplayLifecycle });
})(window);
