const path = require("path");
const fs = require("fs");

const getStyledMessage = require('../../../utils/getStyledMessage');

const {
    preloadResources,
    removeStyleTags,
    removeScriptTags,
    removeBlobs,
    asyncScriptTags,
    fixInsertRule,
    fixFormFields,
    saveHtml,
    normalizePath
} = require('./processingHandlers');

const getPuppeteerOptions = ({ sourceDir, destinationDir, options, server }) => {
    const basePath = `http://localhost:${options.port}`;
    const publicPath = options.publicPath;
    const ajaxCache = {};
    const { http2PushManifest } = options;
    const http2PushManifestItems = {};

    return {
        options,
        basePath,
        publicPath,
        sourceDir,
        beforeFetch: async ({ page, route }) => {
            const {
                preloadImages,
                cacheAjaxRequests,
                preconnectThirdParty
            } = options;

            if (preloadImages || cacheAjaxRequests || preconnectThirdParty || http2PushManifest) {
                const { ajaxCache: ac, http2PushManifestItems: hpm } = preloadResources({
                    page,
                    basePath,
                    preloadImages,
                    cacheAjaxRequests,
                    preconnectThirdParty,
                    http2PushManifest,
                    ignoreForPreload: options.ignoreForPreload
                });

                ajaxCache[route] = ac;
                http2PushManifestItems[route] = hpm;
            }
        },
        afterFetch: async ({ page, route, browser, addToQueue }) => {
            if (options.removeStyleTags) {
                await removeStyleTags({
                    page
                });
            }

            if (options.removeScriptTags) {
                await removeScriptTags({
                    page
                });
            }

            if (options.removeBlobs) {
                await removeBlobs({
                    page
                });
            }

            if (options.asyncScriptTags) {
                await asyncScriptTags({
                    page
                });
            }

            await page.evaluate((ajaxCache) => {
                const snapEscape = (() => {
                    const UNSAFE_CHARS_REGEXP = /[<>\/\u2028\u2029]/g;

                    // Mapping of unsafe HTML and invalid JavaScript line terminator chars to their
                    // Unicode char counterparts which are safe to use in JavaScript strings.
                    const ESCAPED_CHARS = {
                        '<': '\\u003C',
                        '>': '\\u003E',
                        '/': '\\u002F',
                        '\u2028': '\\u2028',
                        '\u2029': '\\u2029'
                    };

                    const escapeUnsafeChars = (unsafeChar) => ESCAPED_CHARS[unsafeChar];

                    return (str) => str.replace(UNSAFE_CHARS_REGEXP, escapeUnsafeChars);
                })();

                // TODO: as of now it only prevents XSS attack,
                // but can stringify only basic data types
                // e.g. Date, Set, Map, NaN won't be handled right
                const snapStringify = (obj) => snapEscape(JSON.stringify(obj));

                let scriptTagText = '';

                if (ajaxCache && Object.keys(ajaxCache).length > 0) {
                    scriptTagText += `window.snapStore=${snapEscape(JSON.stringify(ajaxCache))};`;
                }

                let state;

                if (window.snapSaveState && (state = window.snapSaveState()) && Object.keys(state).length !== 0) {
                    scriptTagText += Object.keys(state).map(key => `window['${key}']=${snapStringify(state[key])};`).join('');
                }

                if (scriptTagText !== '') {
                    const scriptTag = document.createElement('script');

                    scriptTag.type = 'text/javascript';
                    scriptTag.text = scriptTagText;

                    const firstScript = Array.from(document.scripts)[0];

                    firstScript.parentNode.insertBefore(scriptTag, firstScript);
                }
            }, ajaxCache[route]);

            delete ajaxCache[route];

            if (options.fixInsertRule) {
                await fixInsertRule({
                    page
                });
            }

            await fixFormFields({
                page
            });

            let routePath = route.replace(publicPath, '');
            let filePath = path.join(destinationDir, routePath);

            await saveHtml({
                page,
                filePath,
                options,
                route,
                fs
            });

            let newRoute = await page.evaluate(() => location.toString());

            newPath = normalizePath(newRoute.replace(publicPath, '').replace(basePath, ''));

            routePath = normalizePath(routePath);

            if (routePath !== newPath) {
                console.log(getStyledMessage.warning(`in browser redirect (${newPath})`));

                addToQueue(newRoute);
            }
        },
        onEnd: () => {
            if (server) {
                server.close();
            }
        }
    };
};

module.exports = {
    getPuppeteerOptions
};
