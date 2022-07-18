const path = require('path');
const mkdirp = require('mkdirp');
const url = require('url');
const { minify } = require('html-minifier');

const normalizePath = (path) => (path === '/' ? '/' : path.replace(/\/$/, ''));

/**
 *
 * @param {{page: Page, basePath: string}} opt
 */
const preloadResources = (opt) => {
    const {
        page,
        basePath,
        preloadImages,
        cacheAjaxRequests,
        preconnectThirdParty,
        http2PushManifest,
        ignoreForPreload
    } = opt;

    const ajaxCache = {};
    const http2PushManifestItems = [];
    const uniqueResources = new Set();

    page.on('response', async (response) => {
        const responseUrl = response.url();

        if (/^data:|blob:/i.test(responseUrl)) {
            return;
        }

        const ct = response.headers()['content-type'] || '';
        const route = responseUrl.replace(basePath, '');

        if (/^http:\/\/localhost/i.test(responseUrl)) {
            if (uniqueResources.has(responseUrl)) {
                return;
            }

            if (preloadImages && /\.(png|jpg|jpeg|webp|gif|svg)$/.test(responseUrl)) {
                if (http2PushManifest) {
                    http2PushManifestItems.push({
                        link: route,
                        as: 'image'
                    });
                } else {
                    await page.evaluate(route => {
                        const linkTag = document.createElement('link');

                        linkTag.setAttribute('rel', 'preload');
                        linkTag.setAttribute('as', 'image');
                        linkTag.setAttribute('href', route);

                        document.body.appendChild(linkTag);
                    }, route);
                }
            } else if (cacheAjaxRequests && ct.includes('json')) {
                const json = await response.json();
                ajaxCache[route] = json;
            } else if (http2PushManifest && /\.(js)$/.test(responseUrl)) {
                const fileName = url.parse(responseUrl).pathname.split('/').pop();

                if (!ignoreForPreload.includes(fileName)) {
                    http2PushManifestItems.push({
                        link: route,
                        as: 'script'
                    });
                }
            } else if (http2PushManifest && /\.(css)$/.test(responseUrl)) {
                const fileName = url.parse(responseUrl).pathname.split('/').pop();

                if (!ignoreForPreload.includes(fileName)) {
                    http2PushManifestItems.push({
                        link: route,
                        as: 'style'
                    });
                }
            }

            uniqueResources.add(responseUrl);
        } else if (preconnectThirdParty) {
            const urlObj = url.parse(responseUrl);
            const domain = `${urlObj.protocol}//${urlObj.host}`;

            if (uniqueResources.has(domain)) return;
            uniqueResources.add(domain);

            await page.evaluate(route => {
                const linkTag = document.createElement('link');

                linkTag.setAttribute('rel', 'preconnect');
                linkTag.setAttribute('href', route);

                document.head.appendChild(linkTag);
            }, domain);
        }
    });

    return { ajaxCache, http2PushManifestItems };
};

const removeStyleTags = ({ page }) =>
    page.evaluate(() => {
        Array.from(document.querySelectorAll('style')).forEach(ell => {
            ell.parentElement && ell.parentElement.removeChild(ell);
        });
    });

const removeScriptTags = ({ page }) =>
    page.evaluate(() => {
        Array.from(document.querySelectorAll('script')).forEach((ell) => {
            ell.parentElement && ell.parentElement.removeChild(ell);
        });
    });

/**
 *
 * @param {{page: Page}} opt
 * @return Promise
 */
const removeBlobs = async (opt) => {
    const { page } = opt;

    return page.evaluate(() => {
        const stylesheets = Array.from(document.querySelectorAll('link[rel=stylesheet]'));

        stylesheets.forEach(link => {
            if (link.href && link.href.startsWith('blob:')) {
                link.parentNode && link.parentNode.removeChild(link);
            }
        });
    });
};

const asyncScriptTags = ({ page }) => {
    return page.evaluate(() => {
        Array.from(document.querySelectorAll('script[src]')).forEach((x) => {
            x.setAttribute('async', 'true');
        });
    });
};

const fixInsertRule = ({ page }) => {
    return page.evaluate(() => {
        Array.from(document.querySelectorAll('style')).forEach((style) => {
            if (style.innerHTML === '') {
                style.innerHTML = Array.from(style.sheet.rules).map((rule) => rule.cssText).join('');
            }
        });
    });
};

const fixFormFields = ({ page }) => {
    return page.evaluate(() => {
        Array.from(document.querySelectorAll('[type=radio]')).forEach(element => {
            if (element.checked) {
                element.setAttribute('checked', 'checked');
            } else {
                element.removeAttribute('checked');
            }
        });

        Array.from(document.querySelectorAll('[type=checkbox]')).forEach(
            element => {
                if (element.checked) {
                    element.setAttribute('checked', 'checked');
                } else {
                    element.removeAttribute('checked');
                }
            }
        );

        Array.from(document.querySelectorAll('option')).forEach(element => {
            if (element.selected) {
                element.setAttribute('selected', 'selected');
            } else {
                element.removeAttribute('selected');
            }
        });
    });
};

const saveHtml = async ({ page, filePath, options, route, fs }) => {
    let content = await page.content();

    const minifiedContent = options.minifyHtml ? minify(content, options.minifyHtml) : content;

    filePath = filePath.replace(/\//g, path.sep);

    if (route.endsWith('.html')) {
        mkdirp.sync(path.dirname(filePath));

        fs.writeFileSync(filePath, minifiedContent);
    } else {
        mkdirp.sync(filePath);

        fs.writeFileSync(path.join(filePath, 'index.html'), minifiedContent);
    }
};

module.exports = {
    normalizePath,
    preloadResources,
    removeStyleTags,
    removeScriptTags,
    removeBlobs,
    asyncScriptTags,
    fixInsertRule,
    fixFormFields,
    saveHtml
};
