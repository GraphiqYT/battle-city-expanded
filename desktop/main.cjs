'use strict';

const { app, BrowserWindow, dialog, protocol, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'bce',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true
        }
    }
]);

const contentTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.gif', 'image/gif'],
    ['.html', 'text/html; charset=utf-8'],
    ['.jpeg', 'image/jpeg'],
    ['.jpg', 'image/jpeg'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.mp3', 'audio/mpeg'],
    ['.ogg', 'audio/ogg'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.ttf', 'font/ttf'],
    ['.txt', 'text/plain; charset=utf-8'],
    ['.wav', 'audio/wav'],
    ['.webp', 'image/webp'],
    ['.woff', 'font/woff'],
    ['.woff2', 'font/woff2']
]);

function getGameRoot() {
    return app.isPackaged
        ? path.join(process.resourcesPath, 'game')
        : path.resolve(__dirname, '..');
}

async function serveGameFile(request) {
    const gameRoot = getGameRoot();
    let requestedPath;

    try {
        requestedPath = decodeURIComponent(new URL(request.url).pathname);
    } catch (error) {
        console.error('Invalid game resource URL.', error);
        return new Response('Invalid resource URL.', { status: 400 });
    }

    const filePath = path.resolve(gameRoot, `.${requestedPath}`);
    const relativePath = path.relative(gameRoot, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return new Response('Resource path is outside the game folder.', { status: 403 });
    }

    try {
        const content = await fs.readFile(filePath);
        const contentType = contentTypes.get(path.extname(filePath).toLowerCase())
            ?? 'application/octet-stream';
        return new Response(request.method === 'HEAD' ? null : content, {
            headers: { 'content-type': contentType }
        });
    } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') {
            return new Response('Game resource not found.', { status: 404 });
        }
        console.error(`Could not load game resource: ${filePath}`, error);
        return new Response('Could not load game resource.', { status: 500 });
    }
}

function createWindow() {
    const window = new BrowserWindow({
        width: 1280,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        autoHideMenuBar: true,
        backgroundColor: '#000000',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    window.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            void shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    window.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith('bce://app/')) {
            event.preventDefault();
        }
    });

    void window.loadURL('bce://app/index.html').catch((error) => {
        console.error('Could not load Battle City Expanded.', error);
        dialog.showErrorBox(
            'Battle City Expanded could not start',
            'The game files could not be loaded. Reinstall or rebuild the app, then try again.'
        );
        if (!window.isDestroyed()) {
            window.destroy();
        }
    });
}

app.whenReady().then(() => {
    protocol.handle('bce', serveGameFile);
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}).catch((error) => {
    console.error('Could not start Battle City Expanded.', error);
    app.quit();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
