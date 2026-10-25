(function (global) {
    'use strict';

    function requestPackConfirmation(dialog, textElement, acceptButton, message) {
        if (!dialog || !textElement || !acceptButton) {
            return Promise.resolve(false);
        }

        textElement.textContent = message || 'Confirm this action?';
        return new Promise((resolve) => {
            const finish = (result) => {
                dialog.removeEventListener('close', onClose);
                resolve(result);
            };
            const onClose = () => {
                finish(dialog.returnValue === 'confirm');
            };
            dialog.addEventListener('close', onClose, { once: true });
            acceptButton.value = 'confirm';
            dialog.showModal();
        });
    }

    function askPackItemName(dialog, titleLabel, input, form, title, currentValue, onSave) {
        if (!dialog || !titleLabel || !input || !form) {
            return;
        }

        titleLabel.textContent = title || 'Rename';
        input.value = currentValue || '';
        input.focus();
        input.select?.();

        const submit = (event) => {
            event.preventDefault();
            const nextName = String(input.value || '').trim();
            form.removeEventListener('submit', submit);
            dialog.close('confirm');
            if (typeof onSave === 'function' && nextName) {
                onSave(nextName);
            }
        };

        form.addEventListener('submit', submit, { once: true });
        if (typeof dialog.showModal === 'function' && !dialog.open) {
            dialog.showModal();
        }
    }

    function makePackThumbnail(icon, imageSource = '') {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'pack-editor-card-thumbnail';
        if (imageSource) {
            const image = document.createElement('img');
            image.src = imageSource;
            image.alt = '';
            thumbnail.append(image);
        } else {
            thumbnail.textContent = icon || '📦';
        }
        return thumbnail;
    }

    function bindPackEditorDialogs({
        confirmDialog,
        confirmText,
        confirmAcceptButton,
        renameDialog,
        renameTitle,
        renameInput,
        renameForm,
        cancelRenameButton,
        onRenameSubmit
    }) {
        if (confirmDialog && confirmText && confirmAcceptButton) {
            confirmAcceptButton.addEventListener('click', () => {
                confirmDialog.close('confirm');
            });
            confirmText.textContent = confirmText.textContent || 'Confirm this action?';
        }

        if (renameDialog && renameForm && renameTitle && renameInput) {
            if (!renameForm.dataset.bc90eRenameBound) {
                renameForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    const nextValue = String(renameInput.value || '').trim();
                    renameDialog.close('confirm');
                    if (typeof onRenameSubmit === 'function' && nextValue) {
                        onRenameSubmit(nextValue);
                    }
                });
                renameForm.dataset.bc90eRenameBound = 'true';
            }
            if (cancelRenameButton) {
                cancelRenameButton.addEventListener('click', () => {
                    renameDialog.close('cancel');
                });
            }
        }
    }

    function makePackCard({ kind, item, title, subtitle, icon, image, open, actions }) {
        const card = document.createElement('article');
        card.className = 'pack-editor-card';
        card.dataset.kind = kind;
        if (typeof open === 'function') {
            card.addEventListener('click', (event) => {
                if (event.target.closest('button')) {
                    return;
                }
                open();
            });
        }

        const preview = document.createElement('div');
        preview.className = 'pack-editor-card-preview';

        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.alt = title || 'Pack item';
            img.loading = 'lazy';
            preview.append(img);
        } else {
            const glyph = document.createElement('span');
            glyph.textContent = icon || '📦';
            glyph.className = 'pack-editor-card-glyph';
            preview.append(glyph);
        }

        const content = document.createElement('div');
        content.className = 'pack-editor-card-content';

        const heading = document.createElement('h3');
        heading.textContent = title || 'Untitled';
        const meta = document.createElement('p');
        meta.textContent = subtitle || 'Item';

        content.append(heading, meta);

        const cardActions = document.createElement('div');
        cardActions.className = 'pack-editor-card-actions';
        if (Array.isArray(actions)) {
            actions.forEach((action) => {
                const actionButton = document.createElement('button');
                actionButton.type = 'button';
                actionButton.textContent = action.label || 'Action';
                if (action.primary) {
                    actionButton.classList.add('pack-editor-primary');
                }
                actionButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (typeof action.onClick === 'function') {
                        action.onClick();
                    }
                });
                cardActions.append(actionButton);
            });
        }

        card.append(preview, content, cardActions);
        return card;
    }

    global.BC90EPackEditorActions = Object.freeze({
        requestPackConfirmation,
        askPackItemName,
        makePackThumbnail,
        bindPackEditorDialogs,
        makePackCard
    });
})(window);
