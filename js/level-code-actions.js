(function (global) {
    'use strict';

    function createLevelCodeActions({
        levelCode,
        levelName,
        exportButton,
        copyButton,
        pasteButton,
        shareButton,
        compileLevelData,
        importLevel,
        showMessage,
        showActionSuccess
    }) {
        function exportLevel() {
            const code = compileLevelData();
            if (code === null) {
                return;
            }

            levelCode.value = code;
            showActionSuccess(exportButton);
        }

        async function copyLevelData() {
            const code = compileLevelData();
            if (code === null) {
                return;
            }

            levelCode.value = code;

            try {
                if (global.navigator.clipboard?.writeText) {
                    await global.navigator.clipboard.writeText(code);
                    showActionSuccess(copyButton);
                    return;
                }

                levelCode.focus();
                levelCode.select();
                if (!document.execCommand('copy')) {
                    throw new Error('The browser did not allow copying to the clipboard.');
                }
                showActionSuccess(copyButton);
            } catch (error) {
                console.error('Unable to copy level data.', error);
                showMessage(
                    'Could not copy level data. Select the text and copy it manually.'
                );
            }
        }

        async function shareLevelData() {
            const code = compileLevelData();
            if (code === null) {
                return;
            }
            levelCode.value = code;

            try {
                if (typeof global.navigator.share === 'function') {
                    await global.navigator.share({
                        title: `${levelName.value.trim() || 'Battle City'} level`,
                        text: code
                    });
                    showActionSuccess(shareButton);
                    return;
                }

                if (global.navigator.clipboard?.writeText) {
                    await global.navigator.clipboard.writeText(code);
                } else {
                    levelCode.focus();
                    levelCode.select();
                    if (!document.execCommand('copy')) {
                        throw new Error('The browser did not allow copying to the clipboard.');
                    }
                }
                showActionSuccess(shareButton);
                showMessage(
                    'This browser does not support sharing text. The level code was copied to the clipboard.'
                );
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }

                console.error('Unable to share level data.', error);
                try {
                    if (global.navigator.clipboard?.writeText) {
                        await global.navigator.clipboard.writeText(code);
                    } else {
                        levelCode.focus();
                        levelCode.select();
                        if (!document.execCommand('copy')) {
                            throw new Error('The browser did not allow copying to the clipboard.');
                        }
                    }
                    showActionSuccess(shareButton);
                    showMessage(
                        `Sharing failed (${error.message}). The level code was copied to the clipboard instead.`
                    );
                } catch (clipboardError) {
                    console.error(
                        'Unable to copy level data after sharing failed.',
                        clipboardError
                    );
                    showMessage(
                        `Could not share or copy level data: ${clipboardError.message}. Select the level text and copy it manually.`
                    );
                }
            }
        }

        async function pasteLevelData() {
            if (!global.navigator.clipboard?.readText) {
                showMessage(
                    'Clipboard access is unavailable. Paste the level string into the Level Data box, then choose Import Level.'
                );
                return;
            }

            try {
                const code = await global.navigator.clipboard.readText();
                if (!code.trim()) {
                    showMessage('The clipboard does not contain level data.');
                    return;
                }

                levelCode.value = code;
                if (importLevel()) {
                    showActionSuccess(pasteButton);
                }
            } catch (error) {
                console.error('Unable to paste level data.', error);
                showMessage(
                    'Could not read the clipboard. Paste the level string into the Level Data box, then choose Import Level.'
                );
            }
        }

        exportButton.addEventListener('click', exportLevel);
        copyButton.addEventListener('click', copyLevelData);
        pasteButton.addEventListener('click', pasteLevelData);
        shareButton.addEventListener('click', shareLevelData);
    }

    global.BC90ELevelCodeActions = Object.freeze({ createLevelCodeActions });
})(window);
