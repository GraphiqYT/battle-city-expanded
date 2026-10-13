'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const gameStage = path.join(__dirname, 'staging', 'game');
const filesToCopy = ['index.html', 'levels.txt'];
const directoriesToCopy = ['assets', 'packs'];

async function prepareGameFiles() {
    await fs.rm(gameStage, { recursive: true, force: true });
    await fs.mkdir(gameStage, { recursive: true });

    for (const file of filesToCopy) {
        await fs.copyFile(
            path.join(projectRoot, file),
            path.join(gameStage, file)
        );
    }

    for (const directory of directoriesToCopy) {
        await fs.cp(
            path.join(projectRoot, directory),
            path.join(gameStage, directory),
            { recursive: true, force: true }
        );
    }

    console.log(`Game files staged in ${gameStage}`);
}

prepareGameFiles().catch((error) => {
    console.error('Could not prepare the game files for packaging.', error);
    process.exitCode = 1;
});
