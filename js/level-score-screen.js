(function (global) {
    'use strict';

    function createLevelScoreScreen({
        screen,
        ranks,
        total,
        enemyTextures,
        moveFrameDuration,
        pointsPerRank,
        playSoundEffect
    }) {
        let animationInterval = 0;
        let continueResolver = null;

        function renderEnemyPreviews(timestamp, rows) {
            const frame = Math.floor(timestamp / moveFrameDuration) % 2;
            rows.forEach(({ rank, enemyPreview }) => {
                const frames = enemyTextures.get(`b-${rank}-up`);
                const context = enemyPreview.getContext('2d');
                if (!context) {
                    throw new Error('Could not render a stage score enemy.');
                }
                context.imageSmoothingEnabled = false;
                context.clearRect(0, 0, enemyPreview.width, enemyPreview.height);
                if (frames?.[frame]) {
                    context.drawImage(
                        frames[frame],
                        0,
                        0,
                        enemyPreview.width,
                        enemyPreview.height
                    );
                }
            });
        }

        function stop() {
            if (animationInterval) {
                global.clearInterval(animationInterval);
                animationInterval = 0;
            }
            const resolveContinue = continueResolver;
            continueResolver = null;
            resolveContinue?.(false);
        }

        function show(defeatedEnemiesByRank) {
            stop();
            ranks.replaceChildren();
            const rows = [];
            for (let rank = 1; rank <= 10; rank += 1) {
                const defeatedCount = defeatedEnemiesByRank[rank];
                const row = global.document.createElement('div');
                row.className = 'level-score-row';
                const enemyPreview = global.document.createElement('canvas');
                enemyPreview.className = 'level-score-enemy';
                enemyPreview.width = 32;
                enemyPreview.height = 32;
                enemyPreview.setAttribute('role', 'img');
                enemyPreview.setAttribute('aria-label', `Enemy type b, rank ${rank}`);
                const countLabel = global.document.createElement('span');
                countLabel.textContent = '00';
                const scoreLabel = global.document.createElement('span');
                scoreLabel.textContent = '0000';
                row.append(enemyPreview, countLabel, scoreLabel);
                ranks.append(row);
                rows.push({
                    rank,
                    defeatedCount,
                    pointsPerEnemy: pointsPerRank[rank],
                    countLabel,
                    scoreLabel,
                    enemyPreview
                });
            }
            total.textContent = 'TOTAL  0000';
            total.hidden = true;
            screen.hidden = false;
            renderEnemyPreviews(global.performance.now(), rows);
            animationInterval = global.setInterval(() => {
                renderEnemyPreviews(global.performance.now(), rows);
            }, moveFrameDuration);
            return rows;
        }

        function continueFromScore() {
            if (screen.hidden || total.hidden) {
                return;
            }

            const resolveContinue = continueResolver;
            continueResolver = null;
            resolveContinue?.(true);
        }

        async function animate({ isCurrent, defeatedEnemiesByRank }) {
            const wait = (duration) =>
                new Promise((resolve) => global.setTimeout(resolve, duration));

            try {
                await wait(2000);
                if (!isCurrent()) {
                    return false;
                }
                const rows = show(defeatedEnemiesByRank);
                await wait(1000);
                if (!isCurrent()) {
                    return false;
                }

                const scoredRows = rows.filter(({ defeatedCount }) => defeatedCount > 0);
                let totalScore = 0;
                for (let rowIndex = 0; rowIndex < scoredRows.length; rowIndex += 1) {
                    const row = scoredRows[rowIndex];
                    for (let defeated = 1; defeated <= row.defeatedCount; defeated += 1) {
                        row.countLabel.textContent = String(defeated).padStart(2, '0');
                        row.scoreLabel.textContent = String(
                            defeated * row.pointsPerEnemy
                        ).padStart(4, '0');
                        totalScore += row.pointsPerEnemy;
                        playSoundEffect('scoreCount');
                        if (defeated < row.defeatedCount) {
                            await wait(80);
                            if (!isCurrent()) {
                                return false;
                            }
                        }
                    }
                    if (rowIndex < scoredRows.length - 1) {
                        await wait(1000);
                        if (!isCurrent()) {
                            return false;
                        }
                    }
                }

                await wait(1000);
                if (!isCurrent()) {
                    return false;
                }
                total.textContent = `TOTAL  ${String(totalScore).padStart(4, '0')}`;
                total.hidden = false;
                const continuePressed = await new Promise((resolve) => {
                    continueResolver = resolve;
                });
                if (!continuePressed) {
                    return false;
                }
                return isCurrent();
            } finally {
                stop();
            }
        }

        return Object.freeze({ animate, continue: continueFromScore, stop });
    }

    global.BC90ELevelScoreScreen = Object.freeze({ createLevelScoreScreen });
})(window);
