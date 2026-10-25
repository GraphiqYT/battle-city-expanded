(function (global) {
    'use strict';

    function createMessageDialog() {
        const dialog = document.getElementById('messageDialog');
        const text = document.getElementById('messageText');
        const dontShowAgain = document.getElementById('dontShowMessageAgain');
        const closeButton = document.getElementById('closeMessageButton');
        const confirmActions = document.getElementById('messageConfirmActions');
        const cancelButton = document.getElementById('cancelMessageConfirmationButton');
        const acceptButton = document.getElementById('acceptMessageConfirmationButton');
        const elements = [
            dialog,
            text,
            dontShowAgain,
            closeButton,
            confirmActions,
            cancelButton,
            acceptButton
        ];

        if (elements.some((element) => !element)) {
            throw new Error('The message dialog elements are missing.');
        }

        let confirmationResolve = null;

        function getPreferenceKey(message) {
            if (/^Tile limit exceeded for ID \d+\.$/.test(message)) {
                return 'bc90e-hide-message-tile-limit';
            }

            return `bc90e-hide-message-${message}`;
        }

        function show(message, preferenceKeyOverride = null) {
            const preferenceKey = preferenceKeyOverride ?? getPreferenceKey(message);
            if (localStorage.getItem(preferenceKey) === 'true') {
                return;
            }

            confirmActions.hidden = true;
            dontShowAgain.closest('label').hidden = false;
            closeButton.hidden = false;
            text.textContent = message;
            dontShowAgain.checked = false;
            dialog.dataset.preferenceKey = preferenceKey;
            dialog.classList.add('visible');
        }

        function finishConfirmation(confirmed) {
            const resolve = confirmationResolve;
            confirmationResolve = null;
            dialog.classList.remove('visible');
            confirmActions.hidden = true;
            dontShowAgain.closest('label').hidden = false;
            closeButton.hidden = false;
            resolve?.(confirmed);
        }

        function showConfirmation(message) {
            text.textContent = message;
            dontShowAgain.checked = false;
            dontShowAgain.closest('label').hidden = true;
            closeButton.hidden = true;
            confirmActions.hidden = false;
            dialog.classList.add('visible');
            acceptButton.focus();
            return new Promise((resolve) => {
                confirmationResolve = resolve;
            });
        }

        function close() {
            if (confirmationResolve) {
                finishConfirmation(false);
                return;
            }
            if (dontShowAgain.checked) {
                localStorage.setItem(dialog.dataset.preferenceKey, 'true');
            }

            dialog.classList.remove('visible');
        }

        function resetPreferences() {
            const keysToRemove = [];
            for (let index = 0; index < localStorage.length; index += 1) {
                const key = localStorage.key(index);
                if (key?.startsWith('bc90e-hide-message-')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));
        }

        closeButton.addEventListener('click', close);
        cancelButton.addEventListener('click', () => finishConfirmation(false));
        acceptButton.addEventListener('click', () => finishConfirmation(true));
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) {
                close();
            }
        });
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && confirmationResolve) {
                event.preventDefault();
                finishConfirmation(false);
            }
        });

        return Object.freeze({ show, showConfirmation, resetPreferences });
    }

    global.BC90EMessageDialog = Object.freeze({ createMessageDialog });
})(window);
