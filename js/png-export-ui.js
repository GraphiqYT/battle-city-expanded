(function (global) {
    'use strict';

    function createPngExportUi({
        dialog,
        form,
        tileSizeInput,
        status,
        preview,
        cancelButton,
        shareButton,
        downloadLink,
        renderMap,
        getMapDimensions,
        getFileName
    }) {
        let objectUrl = null;
        let exportBlob = null;
        let previewRequest = 0;

        function replaceOutputUrl(blob) {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            objectUrl = URL.createObjectURL(blob);
            preview.src = objectUrl;
            downloadLink.href = objectUrl;
            shareButton.hidden = false;
        }

        function showOutput(blob, fileName, statusText) {
            exportBlob = blob;
            replaceOutputUrl(blob);
            downloadLink.download = `${fileName}.png`;
            downloadLink.hidden = false;
            status.textContent = statusText ??
                'Preview ready. Save the image with Export PNG, or download/share it here.';
        }

        function createPngBlob(tileSize) {
            const outputCanvas = renderMap(tileSize);
            return new Promise((resolve, reject) => {
                outputCanvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('The browser could not encode the map as PNG.'));
                    }
                }, 'image/png');
            });
        }

        async function updatePreview() {
            const requestId = ++previewRequest;
            const tileSize = Number(tileSizeInput.value);
            const { width, height } = getMapDimensions();
            const previewTileSize = Math.min(
                tileSize,
                Math.max(8, Math.floor(1024 / Math.max(width, height)))
            );
            status.textContent = 'Preparing preview...';
            downloadLink.hidden = true;
            shareButton.hidden = false;
            try {
                const previewBlob = await createPngBlob(previewTileSize);
                if (requestId !== previewRequest) {
                    return;
                }
                replaceOutputUrl(previewBlob);
                exportBlob = null;
                downloadLink.download = `${getFileName()}.png`;
                status.textContent =
                    `Preview ready (${width} × ${height} tiles). Export uses the selected ${tileSize}px tile size.`;
            } catch (error) {
                if (requestId === previewRequest) {
                    status.textContent = `Could not prepare preview: ${error.message}`;
                }
            }
        }

        async function exportMap(tileSize, fileName, saveFileHandlePromise) {
            try {
                const pngBlob = await createPngBlob(tileSize);

                if (saveFileHandlePromise) {
                    const pickerResult = await saveFileHandlePromise;
                    if (pickerResult.error?.name === 'AbortError') {
                        return;
                    }
                    if (pickerResult.error) {
                        showOutput(
                            pngBlob,
                            fileName,
                            `The save dialog could not open (${pickerResult.error.message}). Download or share the PNG below.`
                        );
                        return;
                    }

                    try {
                        const writable = await pickerResult.fileHandle.createWritable();
                        await writable.write(pngBlob);
                        await writable.close();
                        showOutput(
                            pngBlob,
                            fileName,
                            'PNG saved successfully. You can also download or share it below.'
                        );
                    } catch (error) {
                        showOutput(
                            pngBlob,
                            fileName,
                            `Could not save the selected file (${error.message}). Download or share the PNG below.`
                        );
                    }
                    return;
                }

                showOutput(
                    pngBlob,
                    fileName,
                    'PNG ready. Download or share the image below.'
                );
            } catch (error) {
                status.textContent = `Could not export PNG: ${error.message}`;
            }
        }

        function open() {
            dialog.showModal();
            void updatePreview();
            tileSizeInput.focus();
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const tileSize = Number(tileSizeInput.value);
            const fileName = getFileName();
            let saveFileHandlePromise = null;
            if (typeof global.showSaveFilePicker === 'function') {
                const pickerOptions = {
                    suggestedName: `${fileName}.png`,
                    types: [{
                        description: 'PNG image',
                        accept: { 'image/png': ['.png'] }
                    }]
                };
                try {
                    saveFileHandlePromise = global.showSaveFilePicker(pickerOptions).then(
                        (fileHandle) => ({ fileHandle }),
                        (error) => ({ error })
                    );
                } catch (error) {
                    saveFileHandlePromise = Promise.resolve({ error });
                }
            }
            void exportMap(tileSize, fileName, saveFileHandlePromise);
        });

        tileSizeInput.addEventListener('change', () => {
            void updatePreview();
        });

        cancelButton.addEventListener('click', () => {
            dialog.close();
        });

        shareButton.addEventListener('click', async () => {
            try {
                const fileName = downloadLink.download || `${getFileName()}.png`;
                const pngBlob = exportBlob ??
                    await createPngBlob(Number(tileSizeInput.value));
                const pngFile = new File([pngBlob], fileName, { type: 'image/png' });
                if (
                    typeof navigator.share === 'function' &&
                    typeof navigator.canShare === 'function' &&
                    navigator.canShare({ files: [pngFile] })
                ) {
                    await navigator.share({ files: [pngFile] });
                    return;
                }

                showOutput(
                    pngBlob,
                    fileName.replace(/\.png$/i, ''),
                    'File sharing is not supported here, so the PNG is being downloaded instead.'
                );
                downloadLink.click();
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Unable to share PNG.', error);
                    if (objectUrl) {
                        status.textContent =
                            `Sharing failed (${error.message}); downloading the PNG instead.`;
                        downloadLink.click();
                    } else {
                        status.textContent = `Could not share PNG: ${error.message}`;
                    }
                }
            }
        });

        dialog.addEventListener('close', () => {
            previewRequest += 1;
            preview.removeAttribute('src');
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
            exportBlob = null;
            downloadLink.hidden = true;
            shareButton.hidden = false;
        });

        return Object.freeze({ open, updatePreview });
    }

    global.BC90EPngExportUi = Object.freeze({ createPngExportUi });
})(window);
