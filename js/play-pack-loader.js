(function (global) {
    'use strict';

    function createPlayPackLoader({ normalizePackDocument, makeDirectoryPackId }) {
        async function requestJson(url, label) {
            let response;
            try {
                response = await global.fetch(url);
            } catch (error) {
                throw new Error(`Could not load ${label}: ${error.message}`);
            }
            if (!response.ok) {
                throw new Error(`Could not load ${label}: HTTP ${response.status}.`);
            }
            try {
                return await response.json();
            } catch (error) {
                throw new Error(`Could not parse ${label}: ${error.message}`);
            }
        }

        async function load() {
            const manifest = await requestJson(
                'packs/manifest.json',
                'the packs manifest'
            );
            if (
                manifest?.format !== 'BC90E-PACK-LIST' ||
                manifest.version !== 1 ||
                !Array.isArray(manifest.packs) ||
                manifest.packs.some((fileName) =>
                    typeof fileName !== 'string' ||
                    !/^[^/\\]+\.bcepack\.json$/i.test(fileName) ||
                    fileName === '.' ||
                    fileName === '..'
                )
            ) {
                throw new Error('The packs manifest has an invalid format or file name.');
            }

            const fileNames = [...new Set(manifest.packs)];
            return Promise.all(fileNames.map(async (fileName) => {
                const encodedFileName = encodeURIComponent(fileName);
                const packDocument = await requestJson(
                    `packs/${encodedFileName}`,
                    `pack "${fileName}"`
                );
                try {
                    return normalizePackDocument(
                        packDocument,
                        makeDirectoryPackId(fileName)
                    );
                } catch (error) {
                    throw new Error(`Pack "${fileName}" is invalid: ${error.message}`);
                }
            }));
        }

        return Object.freeze({ load });
    }

    global.BC90EPlayPackLoader = Object.freeze({ createPlayPackLoader });
})(window);
