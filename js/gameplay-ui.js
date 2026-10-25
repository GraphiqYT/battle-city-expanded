(function (global) {
    'use strict';

    function initGameplayUi() {
        const gamePlayScreen = document.getElementById('gamePlayScreen');
        const gamePlayCanvasHost = document.getElementById('gamePlayCanvasHost');
        const gamePlayHud = document.getElementById('gamePlayHud');
        const gamePauseMessage = document.getElementById('gamePauseMessage');
        const levelScoreScreen = document.getElementById('levelScoreScreen');
        const levelScoreRanks = document.getElementById('levelScoreRanks');
        const levelScoreTotal = document.getElementById('levelScoreTotal');
        const levelIntroCurtain = document.getElementById('levelIntroCurtain');
        const levelIntroTitle = document.getElementById('levelIntroTitle');
        const audioLoadingDialog = document.getElementById('audioLoadingDialog');

        function hideGameplayUi() {
            if (gamePlayScreen) {
                gamePlayScreen.hidden = true;
            }
            if (levelScoreScreen) {
                levelScoreScreen.hidden = true;
            }
            if (levelIntroCurtain) {
                levelIntroCurtain.hidden = true;
                levelIntroCurtain.classList.remove('opening', 'title-hidden');
            }
            if (gamePauseMessage) {
                gamePauseMessage.classList.remove('visible');
            }
        }

        function showGameplayUi() {
            if (gamePlayScreen) {
                gamePlayScreen.hidden = false;
            }
            if (levelScoreScreen) {
                levelScoreScreen.hidden = true;
            }
            if (levelIntroCurtain) {
                levelIntroCurtain.hidden = true;
                levelIntroCurtain.classList.remove('opening', 'title-hidden');
            }
        }

        function setupLevelIntro(title, onComplete) {
            if (!levelIntroCurtain || !levelIntroTitle) {
                return;
            }

            levelIntroTitle.textContent = title || '';
            levelIntroCurtain.classList.remove('opening', 'title-hidden');
            levelIntroCurtain.hidden = false;
            void levelIntroCurtain.offsetWidth;
            levelIntroCurtain.classList.add('title-hidden');
            window.setTimeout(() => {
                levelIntroCurtain.classList.add('opening');
                window.setTimeout(() => {
                    levelIntroCurtain.hidden = true;
                    levelIntroCurtain.classList.remove('opening', 'title-hidden');
                    if (typeof onComplete === 'function') {
                        onComplete();
                    }
                }, 700);
            }, 250);
        }

        function setPauseVisible(isPaused) {
            if (gamePauseMessage) {
                gamePauseMessage.classList.toggle('visible', !!isPaused);
            }
        }

        function setLevelScoreVisible(isVisible) {
            if (levelScoreScreen) {
                levelScoreScreen.hidden = !isVisible;
            }
        }

        function setLevelScoreSummary(rankMarkup, totalText) {
            if (levelScoreRanks) {
                levelScoreRanks.innerHTML = rankMarkup || '';
            }
            if (levelScoreTotal) {
                levelScoreTotal.hidden = !totalText;
                levelScoreTotal.textContent = totalText || '';
            }
        }

        function setAudioLoadingVisible(isVisible, message = '') {
            if (!audioLoadingDialog) {
                return;
            }
            audioLoadingDialog.classList.toggle('visible', !!isVisible);
            const audioLoadingText = document.getElementById('audioLoadingText');
            if (audioLoadingText && message) {
                audioLoadingText.textContent = message;
            }
        }

        global.BC90EGameplayUi = {
            hide: hideGameplayUi,
            show: showGameplayUi,
            setupLevelIntro,
            setPauseVisible,
            setLevelScoreVisible,
            setLevelScoreSummary,
            setAudioLoadingVisible,
            elements: {
                gamePlayScreen,
                gamePlayCanvasHost,
                gamePlayHud,
                levelScoreScreen,
                levelIntroCurtain,
                gamePauseMessage,
                audioLoadingDialog
            }
        };
    }

    initGameplayUi();
})(window);
