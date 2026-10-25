(function (global) {
    'use strict';

    function createLevelIntro({
        curtain,
        title,
        transitionBlack,
        setGamePaused,
        clearPressedKeys,
        clearTouchDirections,
        clearRequestedDirection,
        clearPlayerSliding,
        updateTouchControlsVisibility,
        setGameSoundsMuted,
        playSoundEffect,
        releaseInitialSpawns
    }) {
        let generation = 0;
        let isAnimating = false;

        async function play(stageName, startMuted = false) {
            const currentGeneration = ++generation;
            isAnimating = true;
            setGamePaused(true);
            clearPressedKeys();
            clearTouchDirections();
            clearRequestedDirection();
            clearPlayerSliding();
            updateTouchControlsVisibility(true);
            title.textContent = stageName;
            curtain.classList.remove('opening', 'title-hidden');
            curtain.hidden = false;
            void curtain.offsetWidth;
            transitionBlack.hidden = true;
            setGameSoundsMuted(startMuted);
            if (!startMuted) {
                playSoundEffect('levelStart');
            }

            await new Promise((resolve) => global.setTimeout(resolve, 1000));
            if (currentGeneration !== generation) {
                return false;
            }
            curtain.classList.add('title-hidden');
            await new Promise((resolve) => global.setTimeout(resolve, 160));
            if (currentGeneration !== generation) {
                return false;
            }
            const halves = [...curtain.querySelectorAll('.level-intro-half')];
            const openingAnimations = halves.map((half) => new Promise((resolve) => {
                let timeoutId;
                const finish = () => {
                    global.clearTimeout(timeoutId);
                    half.removeEventListener('animationend', onAnimationEnd);
                    resolve();
                };
                const onAnimationEnd = (event) => {
                    if (event.target === half) {
                        finish();
                    }
                };
                half.addEventListener('animationend', onAnimationEnd);
                timeoutId = global.setTimeout(finish, 1200);
            }));
            void curtain.offsetWidth;
            curtain.classList.add('opening');
            await Promise.all(openingAnimations);
            if (currentGeneration !== generation) {
                return false;
            }

            curtain.hidden = true;
            curtain.classList.remove('opening', 'title-hidden');
            isAnimating = false;
            releaseInitialSpawns();
            setGamePaused(false);
            return true;
        }

        function cancel() {
            generation += 1;
            isAnimating = false;
        }

        return Object.freeze({
            play,
            cancel,
            isAnimating: () => isAnimating
        });
    }

    global.BC90ELevelIntro = Object.freeze({ createLevelIntro });
})(window);
