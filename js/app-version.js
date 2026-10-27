(function (global) {
    'use strict';

    const version = '1.3';
    const assetCacheVersion = '1.3';
    const label = `v${version}`;

    document.querySelectorAll('[data-app-version]').forEach((element) => {
        element.textContent = label;
    });

    global.BC90EAppVersion = Object.freeze({ version, assetCacheVersion, label });
})(window);
