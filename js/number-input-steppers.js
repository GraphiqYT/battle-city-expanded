(function (global) {
    'use strict';

    function initialize() {
        document.querySelectorAll('input[type="number"]').forEach((input) => {
            if (input.closest('.number-input-stepper')) {
                return;
            }

            const wrapper = document.createElement('span');
            wrapper.className = 'number-input-stepper';
            input.before(wrapper);
            wrapper.append(input);

            const label = input.labels?.[0]?.textContent.trim() ||
                input.getAttribute('aria-label') ||
                'value';
            const buttons = document.createElement('span');
            buttons.className = 'number-input-stepper-buttons';

            [
                { text: '▲', label: `Increase ${label}`, step: 1 },
                { text: '▼', label: `Decrease ${label}`, step: -1 }
            ].forEach(({ text, label: buttonLabel, step }) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = text;
                button.setAttribute('aria-label', buttonLabel);
                button.addEventListener('click', () => {
                    if (step > 0) {
                        input.stepUp();
                    } else {
                        input.stepDown();
                    }
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
                buttons.append(button);
            });

            wrapper.append(buttons);
        });
    }

    global.BC90ENumberInputSteppers = Object.freeze({ initialize });
})(window);
