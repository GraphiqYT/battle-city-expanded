(function (global) {
    'use strict';

    function safeInitStartMenu() {
        const startMenuContent = document.querySelector('.start-menu-content');
        const startMenuStage = document.querySelector('.start-menu-stage');
        const initialAssetLoading = document.getElementById('initialAssetLoading');
        const initialAssetReport = document.getElementById('initialAssetReport');
        const retryInitialAssetsButton = document.getElementById('retryInitialAssetsButton');

        if (!startMenuContent || !startMenuStage) {
            return;
        }

        const startMenuCornerLabels = startMenuStage.querySelectorAll('.start-menu-corner-label');
        let hasPlayedIntro = false;
        let isInitialized = false;

        function playStartMenuIntro() {
            if (!startMenuContent || !startMenuStage) {
                return;
            }

            if (initialAssetLoading) {
                initialAssetLoading.hidden = true;
                initialAssetLoading.classList.remove('has-error');
            }
            if (initialAssetReport) {
                initialAssetReport.hidden = true;
            }
            if (retryInitialAssetsButton) {
                retryInitialAssetsButton.hidden = true;
            }

            if (hasPlayedIntro) {
                startMenuContent.classList.add('start-menu-intro-complete');
                startMenuCornerLabels.forEach((label) => {
                    label.classList.add('start-menu-corner-complete');
                });
                return;
            }

            hasPlayedIntro = true;
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    const stageHeight = startMenuStage.getBoundingClientRect().height;
                    const contentHeight = startMenuContent.getBoundingClientRect().height;
                    const riseDistance = (stageHeight + contentHeight) / 2;
                    startMenuContent.style.setProperty(
                        '--start-menu-rise-distance',
                        `${riseDistance}px`
                    );
                    startMenuCornerLabels.forEach((label) => {
                        label.style.setProperty(
                            '--start-menu-rise-distance',
                            `${riseDistance}px`
                        );
                        label.classList.add('start-menu-corner-intro');
                    });
                    startMenuContent.classList.add('start-menu-intro');
                    startMenuContent.addEventListener('animationend', (event) => {
                        if (event.animationName !== 'start-menu-rise') {
                            return;
                        }
                        startMenuContent.classList.remove('start-menu-intro');
                        startMenuContent.classList.add('start-menu-intro-complete');
                        startMenuCornerLabels.forEach((label) => {
                            label.classList.remove('start-menu-corner-intro');
                            label.classList.add('start-menu-corner-complete');
                        });
                    }, { once: true });
                });
            });
        }

        function initStartMenuUI() {
            if (isInitialized) {
                return;
            }
            isInitialized = true;

            startMenuContent.classList.remove('start-menu-intro');
            startMenuContent.classList.remove('start-menu-intro-complete');
            startMenuContent.style.removeProperty('--start-menu-rise-distance');

        }

        return {
            playStartMenuIntro,
            initStartMenuUI
        };
    }

    const controller = safeInitStartMenu();
    if (controller) {
        controller.initStartMenuUI();
    }

    global.BC90EStartMenu = Object.freeze({
        init: () => controller?.initStartMenuUI(),
        playStartMenuIntro: () => controller?.playStartMenuIntro()
    });
})(window);
