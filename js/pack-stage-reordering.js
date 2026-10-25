(function (global) {
    'use strict';

    function createPackStageReordering({
        grid,
        screen,
        isPlayMode,
        getSelectedWorld,
        persistPacks,
        renderPackEditor
    }) {
        let stageCardDrag = null;
        let isInitialized = false;

        function initialize() {
            if (isInitialized) {
                return;
            }
            isInitialized = true;

            grid.addEventListener('pointerdown', (event) => {
                if (
                    isPlayMode() ||
                    screen.hidden ||
                    !global.document.body.classList.contains('pack-editor-open')
                ) {
                    return;
                }
                const openButton = event.target instanceof global.Element
                    ? event.target.closest('.pack-editor-card-open')
                    : null;
                const card = openButton?.closest('.pack-editor-card[data-kind="stage"]');
                if (!card || event.button !== 0 || event.isPrimary === false) {
                    return;
                }
                stageCardDrag = {
                    card,
                    openButton,
                    startX: event.clientX,
                    startY: event.clientY,
                    didMove: false
                };
            });

            global.addEventListener('pointermove', (event) => {
                if (!stageCardDrag || (event.buttons & 1) !== 1) {
                    return;
                }
                const deltaX = event.clientX - stageCardDrag.startX;
                const deltaY = event.clientY - stageCardDrag.startY;
                if (!stageCardDrag.didMove && Math.hypot(deltaX, deltaY) < 8) {
                    return;
                }
                stageCardDrag.didMove = true;
                stageCardDrag.card.classList.add('is-dragging');
                const targetAtPoint = global.document.elementFromPoint(
                    event.clientX,
                    event.clientY
                );
                const target = targetAtPoint instanceof global.Element
                    ? targetAtPoint.closest('.pack-editor-card[data-kind="stage"]')
                    : null;
                if (!target || target === stageCardDrag.card ||
                    target.parentElement !== grid) {
                    return;
                }
                const bounds = target.getBoundingClientRect();
                const isAfterTarget = event.clientY > bounds.top + bounds.height / 2 ||
                    (
                        Math.abs(event.clientY - (bounds.top + bounds.height / 2)) <
                            bounds.height / 4 &&
                        event.clientX > bounds.left + bounds.width / 2
                    );
                grid.insertBefore(
                    stageCardDrag.card,
                    isAfterTarget ? target.nextSibling : target
                );
            });

            const finishDrag = () => {
                if (!stageCardDrag) {
                    return;
                }
                const { card, openButton, didMove } = stageCardDrag;
                stageCardDrag = null;
                card.classList.remove('is-dragging');
                if (!didMove) {
                    return;
                }
                openButton.dataset.suppressOpenClick = 'true';
                global.setTimeout(() => {
                    delete openButton.dataset.suppressOpenClick;
                }, 0);
                const orderedIds = Array.from(
                    grid.querySelectorAll('.pack-editor-card[data-kind="stage"]')
                ).map((stageCard) => stageCard.dataset.itemId);
                const world = getSelectedWorld();
                if (!world || orderedIds.length !== world.stages.length) {
                    renderPackEditor();
                    return;
                }
                const previousOrder = world.stages.map((stage) => stage.id);
                const stagesById = new Map(world.stages.map((stage) => [stage.id, stage]));
                const reorderedStages = orderedIds.map((id) => stagesById.get(id));
                if (reorderedStages.some((stage) => !stage)) {
                    renderPackEditor();
                    return;
                }
                if (!orderedIds.some((id, index) => id !== previousOrder[index])) {
                    return;
                }
                world.stages = reorderedStages;
                persistPacks();
                renderPackEditor();
            };
            global.addEventListener('pointerup', finishDrag);
            global.addEventListener('pointercancel', finishDrag);
        }

        return Object.freeze({ initialize });
    }

    global.BC90EPackStageReordering = Object.freeze({
        createPackStageReordering
    });
})(window);
